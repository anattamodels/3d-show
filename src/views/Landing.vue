<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { authState } = useAuth()

const containerRef = ref(null)
const modelUrl = ref(null)
const editColor = ref('#ffffff')
const wireframe = ref(false)
let scene, camera, renderer, controls, model
let animationId = null

const loadModel = (file) => {
  const url = URL.createObjectURL(file)
  modelUrl.value = url
  
  if (model) scene.remove(model)
  
  const loader = new GLTFLoader()
  loader.load(url, (gltf) => {
    model = gltf.scene
    
    model.traverse((child) => {
      if (child.isMesh) {
        if (editColor.value) {
          child.material.color.set(editColor.value)
        }
        child.material.wireframe = wireframe.value
      }
    })
    
    const box = new THREE.Box3().setFromObject(model)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const scale = 2 / maxDim
    model.scale.setScalar(scale)
    model.position.sub(center.multiplyScalar(scale))
    
    scene.add(model)
  })
}

const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    loadModel(file)
  }
}

const updateModel = () => {
  if (model) {
    model.traverse((child) => {
      if (child.isMesh) {
        child.material.color.set(editColor.value)
        child.material.wireframe = wireframe.value
      }
    })
  }
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    containerRef.value?.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

const captureScreenshot = () => {
  if (renderer) {
    renderer.render(scene, camera)
    const link = document.createElement('a')
    link.download = `screenshot-${Date.now()}.png`
    link.href = renderer.domElement.toDataURL('image/png')
    link.click()
  }
}

onMounted(() => {
  const container = containerRef.value
  const width = container.clientWidth
  const height = container.clientHeight - 52
  
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a0a0f)
  
  camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000)
  camera.position.set(0, 1, 4)
  
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  container.appendChild(renderer.domElement)
  
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5)
  directionalLight.position.set(5, 10, 5)
  scene.add(directionalLight)
  
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  
  const animate = () => {
    animationId = requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
  }
  animate()
  
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / (container.clientHeight - 52)
    camera.updateProjectionMatrix()
    renderer.setSize(container.clientWidth, container.clientHeight - 52)
  })
})

const logout = async () => {
  const { logout } = useAuth()
  await logout()
  router.push('/')
}
</script>

<template>
  <div ref="containerRef" class="container">
    <header class="header">
      <h3>🛠️ 3D Show</h3>
      <div class="header-buttons">
        <template v-if="authState.isAuthenticated">
          <button class="btn-secondary" @click="router.push('/dashboard')">Minhas Galerias</button>
          <button class="btn-logout" @click="logout">Sair</button>
        </template>
        <template v-else>
          <button class="btn-primary" @click="router.push('/login')">Entrar / Cadastrar</button>
        </template>
        <span v-if="authState.isDemoMode" class="demo-badge">DEMO</span>
      </div>
    </header>

    <aside class="sidebar">
      <div class="section">
        <label class="btn-add">
          ➕ Carregar GLB
          <input type="file" accept=".glb,.gltf" hidden @change="handleFileChange" />
        </label>
      </div>

      <template v-if="modelUrl">
        <div class="section">
          <label class="label">Cor/Tonalidade:</label>
          <input 
            type="color" 
            v-model="editColor" 
            @change="updateModel"
            class="color-picker" 
          />
        </div>

        <div class="section">
          <label class="label-checkbox">
            <input type="checkbox" v-model="wireframe" @change="updateModel" />
            Modo Wireframe
          </label>
        </div>

        <hr class="divider" />

        <div class="section">
          <button class="btn-action" @click="toggleFullscreen">⛶ Tela Cheia</button>
        </div>

        <div class="section">
          <button class="btn-action" @click="captureScreenshot">📷 Capturar</button>
        </div>
      </template>
    </aside>

    <div class="canvas-area" ref="canvasContainer">
      <div v-if="!modelUrl" class="placeholder">
        <h2>Selecione um arquivo GLB</h2>
        <p>Use o botão "Carregar GLB" para começar</p>
        <button v-if="!authState.isAuthenticated" class="btn-primary" @click="router.push('/login')" style="margin-top: 20px">
          Entrar para criar galerias
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  height: 100vh;
  width: 100vw;
  background: var(--cyber-black);
  color: white;
  font-family: sans-serif;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: linear-gradient(180deg, var(--cyber-dark) 0%, var(--cyber-black) 100%);
  border-bottom: 2px solid var(--cyber-purple);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  box-shadow: 0 2px 20px rgba(157, 0, 255, 0.2);
}

.header-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-primary {
  padding: 8px 16px;
  background: linear-gradient(135deg, var(--cyber-purple) 0%, #7b00c9 100%);
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 0 15px rgba(157, 0, 255, 0.4);
}

.btn-secondary {
  padding: 8px 16px;
  background: transparent;
  color: var(--cyber-green);
  border: 2px solid var(--cyber-green);
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.btn-logout {
  padding: 8px 16px;
  background: transparent;
  color: #ff4757;
  border: 2px solid #ff4757;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.demo-badge {
  background: var(--cyber-green);
  color: #000;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
}

.sidebar {
  position: fixed;
  top: 52px;
  left: 0;
  bottom: 0;
  width: 220px;
  background: linear-gradient(180deg, var(--cyber-card) 0%, var(--cyber-dark) 100%);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  border-right: 2px solid var(--cyber-purple);
  z-index: 10;
  overflow-y: auto;
  box-shadow: 5px 0 30px rgba(157, 0, 255, 0.1);
}

.section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  font-size: 0.9rem;
  color: var(--cyber-green);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.label-checkbox {
  font-size: 0.9rem;
  color: #ccc;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.btn-add {
  background: linear-gradient(135deg, var(--cyber-purple) 0%, #7b00c9 100%);
  padding: 12px;
  border-radius: 5px;
  cursor: pointer;
  text-align: center;
  font-weight: bold;
  color: white;
  display: block;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 0 15px rgba(157, 0, 255, 0.4);
}

.btn-action {
  background: transparent;
  border: 2px solid var(--cyber-green);
  color: var(--cyber-green);
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
  text-align: left;
  transition: 0.2s;
  font-size: 1rem;
  width: 100%;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.btn-action:hover {
  background: var(--cyber-green);
  color: var(--cyber-black);
}

.color-picker {
  width: 100%;
  height: 40px;
  border: none;
  cursor: pointer;
  background: none;
}

.divider {
  border: 1px solid #444;
  width: 100%;
}

.canvas-area {
  flex: 1;
  position: relative;
  height: calc(100vh - 52px);
  margin-top: 52px;
  margin-left: 220px;
}

.placeholder {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 2px;
}
</style>
