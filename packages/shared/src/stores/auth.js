import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const isMobile = typeof window !== 'undefined' &&
  window.Capacitor?.isNativePlatform?.()

async function saveToken(token, user) {
  if (isMobile) {
    const { Preferences } = await import('@capacitor/preferences')
    await Preferences.set({ key: 'token', value: token })
    await Preferences.set({ key: 'user',  value: JSON.stringify(user) })
  } else {
    localStorage.setItem('token', token)
    localStorage.setItem('user',  JSON.stringify(user))
  }
}

async function loadToken() {
  if (isMobile) {
    const { Preferences } = await import('@capacitor/preferences')
    const { value: token } = await Preferences.get({ key: 'token' })
    const { value: user  } = await Preferences.get({ key: 'user'  })
    return { token, user: user ? JSON.parse(user) : null }
  }
  return {
    token: localStorage.getItem('token'),
    user:  JSON.parse(localStorage.getItem('user') || 'null'),
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(null)
  const user  = ref(null)

  const isLoggedIn     = computed(() => !!token.value)
  const role           = computed(() => user.value?.role)
  const isOwner        = computed(() => role.value === 'owner')
  const isStaff        = computed(() => role.value === 'shelter_staff')
  const isAdmin        = computed(() => role.value === 'admin')
  const canManageShelf = computed(() => ['shelter_staff', 'admin'].includes(role.value))

  async function init() {
    const data = await loadToken()
    token.value = data.token
    user.value  = data.user
  }

  async function setAuth(tokenStr, userData) {
    token.value = tokenStr
    user.value  = userData
    await saveToken(tokenStr, userData)
  }

  async function logout() {
    token.value = null
    user.value  = null
    if (isMobile) {
      const { Preferences } = await import('@capacitor/preferences')
      await Preferences.remove({ key: 'token' })
      await Preferences.remove({ key: 'user'  })
    } else {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }

  return { token, user, isLoggedIn, role, isOwner, isStaff, isAdmin,
           canManageShelf, init, setAuth, logout }
})
