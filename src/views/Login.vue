<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const isLogin = ref(true)
const email = ref('')
const password = ref('')
const displayName = ref('')
const error = ref('')
const loading = ref(false)
const successMessage = ref('')

const { login, signup } = useAuth()
const router = useRouter()
const route = useRoute()

const handleSubmit = async () => {
  error.value = ''
  successMessage.value = ''
  loading.value = true

  try {
    if (isLogin.value) {
      await login(email.value, password.value)
    } else {
      await signup(email.value, password.value, displayName.value)
      successMessage.value = 'Conta criada! Verifique seu email para confirmar o cadastro.'
      isLogin.value = true
    }
    router.push('/dashboard')
  } catch (err) {
    const message = err.message || ''
    if (message.includes('Email not confirmed')) {
      error.value = 'Email não confirmado. Verifique sua caixa de entrada.'
    } else if (message.includes('Invalid login')) {
      error.value = 'Email ou senha incorretos'
    } else if (message.includes('User already registered')) {
      error.value = 'Este email já está cadastrado'
    } else {
      error.value = 'Erro ao processar requisição'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1>{{ isLogin ? 'Login' : 'Criar Conta' }}</h1>
      
      <div v-if="error" class="auth-error">{{ error }}</div>
      <div v-if="successMessage" class="auth-success">{{ successMessage }}</div>
      
      <form @submit.prevent="handleSubmit">
        <div v-if="!isLogin" class="form-group">
          <label>Nome</label>
          <input
            type="text"
            v-model="displayName"
            placeholder="Seu nome"
            required
          />
        </div>
        
        <div class="form-group">
          <label>Email</label>
          <input
            type="email"
            v-model="email"
            placeholder="seu@email.com"
            required
          />
        </div>
        
        <div class="form-group">
          <label>Senha</label>
          <input
            type="password"
            v-model="password"
            placeholder="••••••••"
            required
            minlength="6"
          />
        </div>
        
        <button type="submit" :disabled="loading" class="auth-button">
          {{ loading ? 'Aguarde...' : isLogin ? 'Entrar' : 'Criar Conta' }}
        </button>
      </form>
      
      <p class="auth-switch">
        {{ isLogin ? 'Não tem conta? ' : 'Já tem conta? ' }}
        <button type="button" @click="isLogin = !isLogin; error = ''; successMessage = ''" class="auth-link">
          {{ isLogin ? 'Cadastre-se' : 'Entre' }}
        </button>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--cyber-black) 0%, var(--cyber-dark) 50%, var(--cyber-purple) 100%);
  padding: 20px;
}

.auth-card {
  background: linear-gradient(135deg, var(--cyber-card) 0%, var(--cyber-dark) 100%);
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 60px rgba(157, 0, 255, 0.2);
  width: 100%;
  max-width: 400px;
  border: 2px solid var(--cyber-purple);
}

.auth-card h1 {
  color: #fff;
  text-align: center;
  margin-bottom: 30px;
  font-size: 28px;
  text-transform: uppercase;
  letter-spacing: 3px;
  text-shadow: 0 0 20px rgba(157, 0, 255, 0.5);
}

.auth-error {
  background: rgba(255, 71, 87, 0.2);
  color: #ff6b6b;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
  font-size: 14px;
  border: 1px solid rgba(255, 71, 87, 0.3);
}

.auth-success {
  background: rgba(0, 255, 136, 0.15);
  color: #00ff88;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
  font-size: 14px;
  border: 1px solid rgba(0, 255, 136, 0.3);
  line-height: 1.5;
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
  letter-spacing: 1px;
}

.form-group input {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid var(--cyber-border);
  border-radius: 8px;
  background: var(--cyber-black);
  color: #fff;
  font-size: 16px;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: var(--cyber-purple);
  box-shadow: 0 0 15px rgba(157, 0, 255, 0.3);
}

.auth-button {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, var(--cyber-purple) 0%, #7b00c9 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  text-transform: uppercase;
  letter-spacing: 2px;
  box-shadow: 0 0 20px rgba(157, 0, 255, 0.4);
}

.auth-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 0 30px rgba(157, 0, 255, 0.6);
}

.auth-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-switch {
  text-align: center;
  margin-top: 24px;
  color: #888;
  font-size: 14px;
}

.auth-link {
  background: none;
  border: none;
  color: var(--cyber-green);
  cursor: pointer;
  font-size: 14px;
}

.auth-link:hover {
  color: #fff;
  text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
}
</style>
