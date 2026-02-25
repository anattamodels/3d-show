<script setup>
import { onMounted } from 'vue'
import { useAuth } from './composables/useAuth'

const { initAuth } = useAuth()

onMounted(() => {
  initAuth()
})
</script>

<template>
  <RouterView />
</template>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --cyber-black: #0a0a0f;
  --cyber-purple: #9d00ff;
  --cyber-purple-light: #b366ff;
  --cyber-green: #00ff88;
  --cyber-green-dark: #00cc6a;
  --cyber-dark: #12121a;
  --cyber-card: #1a1a2e;
  --cyber-border: #2d2d44;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: var(--cyber-black);
  color: #fff;
  min-height: 100vh;
}

#app {
  min-height: 100vh;
}
</style>
