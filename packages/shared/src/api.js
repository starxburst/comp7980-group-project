import axios from 'axios'

const isMobile = typeof window !== 'undefined' &&
  window.Capacitor?.isNativePlatform?.()

async function getStoredToken() {
  if (typeof window === 'undefined') return null

  if (isMobile) {
    const { Preferences } = await import('@capacitor/preferences')
    const { value } = await Preferences.get({ key: 'token' })
    return value
  }

  return window.localStorage.getItem('token')
}

async function clearStoredAuth() {
  if (typeof window === 'undefined') return

  if (isMobile) {
    const { Preferences } = await import('@capacitor/preferences')
    await Preferences.remove({ key: 'token' })
    await Preferences.remove({ key: 'user' })
    return
  }

  window.localStorage.removeItem('token')
  window.localStorage.removeItem('user')
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'
})

api.interceptors.request.use(async config => {
  const token = await getStoredToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) {
      await clearStoredAuth()

      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api
