<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useGalleryService } from '../composables/useGalleryService'

const router = useRouter()
const { authState, logout } = useAuth()
const { getGalleries, createGallery, deleteGallery } = useGalleryService()

const galleries = ref([])
const loading = ref(true)
const showModal = ref(false)
const newGallery = ref({ name: '', description: '' })
const submitting = ref(false)

const loadGalleries = async () => {
  if (!authState.user) return
  try {
    const data = await getGalleries(authState.user.id)
    galleries.value = data
  } catch (error) {
    console.error('Error loading galleries:', error)
  } finally {
    loading.value = false
  }
}

const handleCreateGallery = async () => {
  if (!newGallery.value.name.trim()) return
  
  submitting.value = true
  try {
    const gallery = await createGallery(authState.user.id, newGallery.value.name, newGallery.value.description)
    galleries.value.unshift(gallery)
    showModal.value = false
    newGallery.value = { name: '', description: '' }
    router.push(`/gallery/${gallery.id}`)
  } catch (error) {
    console.error('Error creating gallery:', error)
  } finally {
    submitting.value = false
  }
}

const handleDeleteGallery = async (e, galleryId) => {
  e.stopPropagation()
  if (!confirm('Tem certeza que deseja excluir esta galeria?')) return
  
  try {
    await deleteGallery(galleryId)
    galleries.value = galleries.value.filter(g => g.id !== galleryId)
  } catch (error) {
    console.error('Error deleting gallery:', error)
  }
}

const handleLogout = async () => {
  await logout()
  router.push('/')
}

const formatDate = (date) => {
  if (!date) return ''
  if (typeof date === 'string') return new Date(date).toLocaleDateString('pt-BR')
  return new Date(date).toLocaleDateString('pt-BR')
}

onMounted(() => {
  loadGalleries()
})
</script>

<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <div class="header-left">
        <button class="home-btn" @click="router.push('/')">🏠</button>
        <h1>Minhas Galerias</h1>
        <span v-if="authState.isDemoMode" class="demo-badge">DEMO</span>
        <span class="user-email">{{ authState.user?.email }}</span>
      </div>
      <div class="header-right">
        <button class="btn-primary" @click="showModal = true">
          + Nova Galeria
        </button>
        <button class="btn-secondary" @click="handleLogout">
          Sair
        </button>
      </div>
    </header>

    <main class="dashboard-content">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Carregando galerias...</p>
      </div>

      <div v-else-if="galleries.length === 0" class="empty-state">
        <div class="empty-icon">📁</div>
        <h2>Nenhuma galeria ainda</h2>
        <p>Crie sua primeira galeria para organizar seus modelos 3D</p>
        <button class="btn-primary" @click="showModal = true">
          Criar Galeria
        </button>
      </div>

      <div v-else class="gallery-grid">
        <div 
          v-for="gallery in galleries" 
          :key="gallery.id" 
          class="gallery-card"
          @click="router.push(`/gallery/${gallery.id}`)"
        >
          <div class="gallery-icon">🗂️</div>
          <div class="gallery-info">
            <h3>{{ gallery.name }}</h3>
            <p v-if="gallery.description">{{ gallery.description }}</p>
            <span class="gallery-date">
              Atualizado em {{ formatDate(gallery.updated_at) }}
            </span>
          </div>
          <button class="gallery-delete" @click="(e) => handleDeleteGallery(e, gallery.id)">
            🗑️
          </button>
        </div>
      </div>
    </main>

    <div v-if="showModal" class="modal-overlay" @click="showModal = false">
      <div class="modal" @click.stop>
        <h2>Nova Galeria</h2>
        <form @submit.prevent="handleCreateGallery">
          <div class="form-group">
            <label>Nome</label>
            <input
              type="text"
              v-model="newGallery.name"
              placeholder="Minha Galeria"
              required
              autofocus
            />
          </div>
          <div class="form-group">
            <label>Descrição (opcional)</label>
            <textarea
              v-model="newGallery.description"
              placeholder="Descrição da galeria..."
              rows="3"
            ></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="showModal = false">
              Cancelar
            </button>
            <button type="submit" class="btn-primary" :disabled="submitting">
              {{ submitting ? 'Criando...' : 'Criar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: var(--cyber-black);
}

.loading {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--cyber-border);
  border-top-color: var(--cyber-purple);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px;
  background: linear-gradient(180deg, var(--cyber-dark) 0%, var(--cyber-black) 100%);
  border-bottom: 2px solid var(--cyber-purple);
  box-shadow: 0 2px 20px rgba(157, 0, 255, 0.2);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.home-btn {
  background: transparent !important;
  border: 2px solid var(--cyber-green) !important;
  color: var(--cyber-green) !important;
  font-size: 18px;
  padding: 8px 12px;
}

.header-left h1 {
  color: #fff;
  margin: 0;
  font-size: 24px;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.user-email {
  color: var(--cyber-green);
  font-size: 14px;
  font-family: monospace;
}

.demo-badge {
  background: var(--cyber-green);
  color: var(--cyber-black);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
}

.header-right {
  display: flex;
  gap: 12px;
}

.btn-primary {
  padding: 10px 20px;
  background: linear-gradient(135deg, var(--cyber-purple) 0%, #7b00c9 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  text-transform: uppercase;
}

.btn-secondary {
  padding: 10px 20px;
  background: transparent;
  color: var(--cyber-green);
  border: 2px solid var(--cyber-green);
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  text-transform: uppercase;
}

.dashboard-content {
  padding: 40px;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.empty-state h2 {
  color: #fff;
  margin-bottom: 10px;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.gallery-card {
  background: linear-gradient(135deg, var(--cyber-card) 0%, var(--cyber-dark) 100%);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  cursor: pointer;
  position: relative;
  border: 1px solid var(--cyber-border);
}

.gallery-card:hover {
  border-color: var(--cyber-purple);
  box-shadow: 0 8px 32px rgba(157, 0, 255, 0.3);
}

.gallery-icon {
  font-size: 40px;
}

.gallery-info {
  flex: 1;
}

.gallery-info h3 {
  color: #fff;
  margin: 0 0 8px;
}

.gallery-info p {
  color: #888;
  margin: 0 0 8px;
  font-size: 14px;
}

.gallery-date {
  color: var(--cyber-green);
  font-size: 12px;
}

.gallery-delete {
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
  opacity: 0.5;
}

.gallery-delete:hover {
  opacity: 1;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 10, 15, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: linear-gradient(135deg, var(--cyber-card) 0%, var(--cyber-dark) 100%);
  padding: 32px;
  border-radius: 16px;
  border: 2px solid var(--cyber-purple);
  box-shadow: 0 0 40px rgba(157, 0, 255, 0.3);
}

.modal h2 {
  color: #fff;
  margin: 0 0 24px;
  text-transform: uppercase;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  color: var(--cyber-green);
  margin-bottom: 8px;
  font-size: 14px;
  text-transform: uppercase;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--cyber-border);
  border-radius: 8px;
  background: var(--cyber-black);
  color: #fff;
  font-size: 16px;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--cyber-purple);
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}
</style>
