<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useGalleryService } from '../composables/useGalleryService'

const route = useRoute()
const router = useRouter()
const { authState } = useAuth()
const { getGallery, getItems, createItem, deleteItem, updateItem, deleteGallery } = useGalleryService()

const gallery = ref(null)
const items = ref([])
const loading = ref(true)
const uploading = ref(false)
const selectedItem = ref(null)
const editingItem = ref(null)
const editName = ref('')
const isFullscreen = ref(false)
const screenshotLoading = ref(false)

const galleryId = route.params.id
const fileInputRef = ref(null)

const loadGallery = async () => {
  try {
    const data = await getGallery(galleryId)
    if (!data) {
      router.push('/dashboard')
      return
    }
    gallery.value = data
  } catch (error) {
    console.error('Error loading gallery:', error)
  }
}

const loadItems = async () => {
  try {
    const data = await getItems(galleryId)
    items.value = data
  } catch (error) {
    console.error('Error loading items:', error)
  } finally {
    loading.value = false
  }
}

const handleFileSelect = async (e) => {
  const files = Array.from(e.target.files)
  if (files.length === 0) return

  uploading.value = true
  try {
    for (const file of files) {
      if (!file.name.toLowerCase().endsWith('.glb')) {
        alert(`Arquivo "${file.name}" não é um arquivo GLB válido`)
        continue
      }
      
      const item = await createItem(galleryId, file, authState.user?.id)
      if (item) {
        items.value.unshift(item)
      }
    }
  } catch (error) {
    console.error('Error uploading files:', error)
    alert('Erro ao fazer upload dos arquivos')
  } finally {
    uploading.value = false
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  }
}

const handleDeleteItem = async (itemId) => {
  if (!confirm('Tem certeza que deseja excluir este item?')) return
  
  try {
    await deleteItem(itemId)
    items.value = items.value.filter(i => i.id !== itemId)
    if (selectedItem.value?.id === itemId) {
      selectedItem.value = null
    }
  } catch (error) {
    console.error('Error deleting item:', error)
  }
}

const handleRename = async (itemId) => {
  if (!editName.value.trim()) return
  
  try {
    await updateItem(itemId, { name: editName.value })
    items.value = items.value.map(i => i.id === itemId ? { ...i, name: editName.value } : i)
    if (selectedItem.value?.id === itemId) {
      selectedItem.value = { ...selectedItem.value, name: editName.value }
    }
    editingItem.value = null
    editName.value = ''
  } catch (error) {
    console.error('Error renaming item:', error)
  }
}

const formatFileSize = (bytes) => {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const captureScreenshot = () => {
  screenshotLoading.value = true
  const viewerContent = document.getElementById('viewer-content')
  const modelViewer = viewerContent?.querySelector('model-viewer')
  
  if (modelViewer) {
    setTimeout(() => {
      const canvas = document.createElement('canvas')
      const modelViewerRect = modelViewer.getBoundingClientRect()
      canvas.width = modelViewerRect.width * 2
      canvas.height = modelViewerRect.height * 2
      
      const ctx = canvas.getContext('2d')
      if (modelViewer.shadowRoot) {
        const canvasEl = modelViewer.shadowRoot.querySelector('canvas')
        if (canvasEl) {
          ctx.drawImage(canvasEl, 0, 0, canvas.width, canvas.height)
          
          const link = document.createElement('a')
          link.download = `${selectedItem.value?.name || 'model'}-${Date.now()}.png`
          link.href = canvas.toDataURL('image/png')
          link.click()
        }
      }
      screenshotLoading.value = false
    }, 500)
  } else {
    alert('Visualizador não encontrado')
    screenshotLoading.value = false
  }
}

onMounted(() => {
  loadGallery()
  loadItems()
})
</script>

<template>
  <div class="gallery-page">
    <header class="gallery-header">
      <div class="header-left">
        <button class="home-btn" @click="router.push('/')">🏠</button>
        <button class="back-btn" @click="router.push('/dashboard')">← Voltar</button>
        <div class="gallery-title">
          <input
            type="text"
            v-model="gallery.name"
            @blur="updateItem(gallery.id, { name: gallery.name })"
            class="title-input"
          />
        </div>
      </div>
      <div class="header-right">
        <input
          type="file"
          ref="fileInputRef"
          @change="handleFileSelect"
          accept=".glb"
          multiple
          style="display: none"
        />
        <button class="btn-primary" @click="fileInputRef.click()" :disabled="uploading">
          {{ uploading ? 'Enviando...' : '+ Adicionar GLB' }}
        </button>
      </div>
    </header>

    <div class="gallery-content">
      <div class="items-grid">
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          <p>Carregando galeria...</p>
        </div>

        <div v-else-if="items.length === 0" class="empty-state">
          <div class="empty-icon">📦</div>
          <h3>Nenhum modelo ainda</h3>
          <p>Adicione seus arquivos GLB para começar</p>
          <button class="btn-primary" @click="fileInputRef.click()">
            Adicionar GLB
          </button>
        </div>

        <div 
          v-else
          v-for="item in items" 
          :key="item.id" 
          class="item-card"
          :class="{ selected: selectedItem?.id === item.id }"
          @click="selectedItem = item"
        >
          <div class="item-thumbnail">
            <div class="thumbnail-placeholder">GLB</div>
          </div>
          <div class="item-info">
            <template v-if="editingItem === item.id">
              <div class="edit-name">
                <input
                  type="text"
                  v-model="editName"
                  @keydown.enter="handleRename(item.id)"
                  autofocus
                />
                <button @click="handleRename(item.id)">✓</button>
                <button @click="editingItem = null">✕</button>
              </div>
            </template>
            <template v-else>
              <h4>{{ item.name }}</h4>
            </template>
            <span class="item-size">{{ formatFileSize(item.file_size) }}</span>
          </div>
          <div class="item-actions">
            <button 
              @click.stop="editingItem = item.id; editName = item.name"
              title="Renomear"
            >
              ✏️
            </button>
            <button 
              @click.stop="handleDeleteItem(item.id)"
              title="Excluir"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

      <div v-if="selectedItem" class="viewer-panel" :class="{ fullscreen: isFullscreen }">
        <div class="viewer-header">
          <h3>{{ selectedItem.name }}</h3>
          <div class="viewer-actions">
            <button @click="isFullscreen = !isFullscreen" title="Tela cheia">
              ⛶
            </button>
            <button @click="captureScreenshot" :disabled="screenshotLoading" title="Capturar">
              {{ screenshotLoading ? '⏳' : '📷' }}
            </button>
            <button @click="selectedItem = null">✕</button>
          </div>
        </div>
        <div class="viewer-content" id="viewer-content">
          <model-viewer
            :src="selectedItem.glb_url"
            ar
            camera-controls
            tone-mapping="neutral"
            shadow-intensity="1"
            auto-rotate
            style="width: 100%; height: 100%"
          ></model-viewer>
        </div>
        <div class="viewer-info">
          <p>Arquivo: {{ selectedItem.file_name }}</p>
          <p>Tamanho: {{ formatFileSize(selectedItem.file_size) }}</p>
          <a :href="selectedItem.glb_url" :download="selectedItem.file_name" class="download-btn">
            Download
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gallery-page {
  min-height: 100vh;
  background: var(--cyber-black);
}

.loading {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--cyber-border);
  border-top-color: var(--cyber-purple);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px;
  background: linear-gradient(180deg, var(--cyber-dark) 0%, var(--cyber-black) 100%);
  border-bottom: 2px solid var(--cyber-purple);
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

.back-btn {
  background: transparent;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 16px;
}

.title-input {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 24px;
  font-weight: 600;
  padding: 8px;
  border-radius: 4px;
  text-transform: uppercase;
}

.title-input:focus {
  outline: none;
  background: var(--cyber-card);
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

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.gallery-content {
  display: flex;
  min-height: calc(100vh - 73px);
}

.items-grid {
  flex: 1;
  padding: 32px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 24px;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 56px;
  margin-bottom: 16px;
}

.item-card {
  background: linear-gradient(135deg, var(--cyber-card) 0%, var(--cyber-dark) 100%);
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  position: relative;
  border: 1px solid var(--cyber-border);
}

.item-card:hover {
  border-color: var(--cyber-purple);
  box-shadow: 0 8px 24px rgba(157, 0, 255, 0.3);
}

.item-card.selected {
  outline: 2px solid var(--cyber-green);
}

.item-thumbnail {
  width: 100%;
  aspect-ratio: 1;
  background: var(--cyber-black);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumbnail-placeholder {
  color: var(--cyber-purple);
  font-size: 14px;
  font-weight: bold;
  text-transform: uppercase;
}

.item-info {
  padding: 12px 4px;
}

.item-info h4 {
  color: #fff;
  margin: 0 0 4px;
  font-size: 14px;
}

.edit-name {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

.edit-name input {
  flex: 1;
  background: var(--cyber-black);
  border: 1px solid var(--cyber-purple);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
}

.edit-name button {
  background: var(--cyber-purple);
  border: none;
  color: #fff;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
}

.item-size {
  color: var(--cyber-green);
  font-size: 12px;
}

.item-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
}

.item-card:hover .item-actions {
  opacity: 1;
}

.item-actions button {
  background: rgba(10, 10, 15, 0.9);
  border: 1px solid var(--cyber-border);
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
}

.viewer-panel {
  width: 400px;
  background: linear-gradient(180deg, var(--cyber-card) 0%, var(--cyber-dark) 100%);
  border-left: 2px solid var(--cyber-purple);
  display: flex;
  flex-direction: column;
}

.viewer-panel.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  border: none;
}

.viewer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--cyber-border);
}

.viewer-header h3 {
  color: var(--cyber-green);
  margin: 0;
  font-size: 16px;
  text-transform: uppercase;
}

.viewer-actions {
  display: flex;
  gap: 8px;
}

.viewer-actions button {
  background: transparent;
  border: 1px solid var(--cyber-purple) !important;
  color: var(--cyber-purple) !important;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.viewer-actions button:hover {
  background: var(--cyber-purple) !important;
  color: #fff !important;
}

.viewer-content {
  flex: 1;
  min-height: 300px;
  background: var(--cyber-black);
}

.viewer-info {
  padding: 16px;
  border-top: 1px solid var(--cyber-border);
}

.viewer-info p {
  color: #888;
  margin: 0 0 8px;
  font-size: 13px;
}

.download-btn {
  display: block;
  text-align: center;
  background: linear-gradient(135deg, var(--cyber-purple) 0%, #7b00c9 100%);
  color: #fff;
  text-decoration: none;
  padding: 12px;
  border-radius: 8px;
  margin-top: 16px;
  font-weight: 600;
}
</style>
