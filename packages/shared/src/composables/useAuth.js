import { useAuthStore } from '../stores/auth.js'
import { authService   } from '../services/authService.js'
import { useRouter     } from 'vue-router'

export function useAuth() {
  const store  = useAuthStore()
  const router = useRouter()

  async function login(email, password) {
    const { data } = await authService.login({ email, password })
    await store.setAuth(data.token, data.user)
    return data
  }

  async function register(name, email, password, role) {
    const { data } = await authService.register({ name, email, password, role })
    await store.setAuth(data.token, data.user)
    return data
  }

  async function logout() {
    await store.logout()
    router.push('/login')
  }

  return { store, login, register, logout }
}
