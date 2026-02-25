import './assets/main.css'
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Landing from './views/Landing.vue'
import Dashboard from './views/Dashboard.vue'
import Gallery from './views/Gallery.vue'
import Login from './views/Login.vue'
import { authState } from './composables/useAuth'

const routes = [
  { path: '/', component: Landing },
  { path: '/login', component: Login },
  { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/gallery/:id', component: Gallery, meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory('/3d-show/'),
  routes,
})

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !authState.isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})

const app = createApp(App)
app.use(router)
app.mount('#app')
