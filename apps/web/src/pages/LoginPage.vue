<template>
  <div class="min-vh-100 d-flex align-items-center justify-content-center bg-light">
    <div class="card shadow-sm p-4" style="width:100%;max-width:400px">
      <h4 class="text-center fw-bold text-primary mb-4">
        <i class="bi bi-paw-fill"></i> Petstagram
      </h4>
      <form @submit.prevent="submit">
        <div class="mb-3">
          <label class="form-label">Email</label>
          <input v-model="form.email" type="email" class="form-control" required />
        </div>
        <div class="mb-3">
          <label class="form-label">Password</label>
          <input v-model="form.password" type="password" class="form-control" required />
        </div>
        <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>
        <button type="submit" class="btn btn-primary w-100" :disabled="loading">
          <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
          Log in
        </button>
      </form>
      <p class="text-center mt-3 small">
        No account? <router-link to="/register">Register</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@shared/stores/auth.js'
import { authService }  from '@shared/services/authService.js'

const router = useRouter()
const auth   = useAuthStore()
const form   = ref({ email: '', password: '' })
const error  = ref('')
const loading = ref(false)

async function submit() {
  error.value   = ''
  loading.value = true
  try {
    const { data } = await authService.login(form.value)
    await auth.setAuth(data.token, data.user)
    router.push('/feed')
  } catch (e) {
    error.value = e.response?.data?.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>
