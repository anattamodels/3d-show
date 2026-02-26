import { reactive } from 'vue'
import { supabase } from '../supabase/config'

export const authState = reactive({
  user: null,
  isAuthenticated: false,
  isDemoMode: !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === ''
})

const DEMO_USER = {
  id: 'demo-user-123',
  email: 'demo@demo.com',
  user_metadata: { display_name: 'Demo User' }
}

export function useAuth() {
  const login = async (email, password) => {
    if (authState.isDemoMode) {
      authState.user = { ...DEMO_USER, email }
      authState.isAuthenticated = true
      localStorage.setItem('demo_user', JSON.stringify(authState.user))
      return { user: authState.user }
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    authState.user = data.user
    authState.isAuthenticated = true
    return data
  }

  const signup = async (email, password, displayName) => {
    if (authState.isDemoMode) {
      authState.user = { ...DEMO_USER, email, user_metadata: { display_name: displayName } }
      authState.isAuthenticated = true
      localStorage.setItem('demo_user', JSON.stringify(authState.user))
      return { user: authState.user }
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } }
    })
    if (error) throw error
    return data
  }

  const logout = async () => {
    if (authState.isDemoMode) {
      authState.user = null
      authState.isAuthenticated = false
      localStorage.removeItem('demo_user')
      return
    }
    
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    authState.user = null
    authState.isAuthenticated = false
  }

  const initAuth = async () => {
    if (!authState.isDemoMode) {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        authState.user = session.user
        authState.isAuthenticated = true
      }
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        authState.user = session?.user || null
        authState.isAuthenticated = !!session?.user
      })
      return () => subscription.unsubscribe()
    } else {
      const stored = localStorage.getItem('demo_user')
      if (stored) {
        authState.user = JSON.parse(stored)
        authState.isAuthenticated = true
      }
    }
  }

  return {
    authState,
    login,
    signup,
    logout,
    initAuth
  }
}
