<template>
  <div class="min-vh-100 d-flex align-items-center justify-content-center bg-light">
    <div class="card shadow-sm p-4" style="width:100%;max-width:420px">
      <h4 class="text-center fw-bold text-primary mb-4">
        <i class="bi bi-paw-fill"></i> Create Account
      </h4>
      <form @submit.prevent="submit">
        <div class="mb-3">
          <label class="form-label">Name</label>
          <input v-model="form.name" class="form-control" required />
        </div>
        <div class="mb-3">
          <label class="form-label">Email</label>
          <input v-model="form.email" type="email" class="form-control" required />
        </div>
        <div class="mb-3">
          <label class="form-label">Password</label>
          <input v-model="form.password" type="password" class="form-control" required minlength="6" />
        </div>
        <div class="mb-3">
          <label class="form-label">Account type</label>
          <select v-model="form.role" class="form-select">
            <option value="owner">Pet Owner</option>
            <option value="shelter_staff">Shelter Staff</option>
          </select>
        </div>
        <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>
        <button type="submit" class="btn btn-primary w-100" :disabled="loading">
          <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
          Register
        </button>
      </form>
      <p class="text-center mt-3 small">
        Already have an account? <router-link to="/login">Log in</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@shared/stores/auth.js'
import { authService }  from '@shared/services/authService.js'

const router  = useRouter()
const auth    = useAuthStore()
const form    = ref({ name: '', email: '', password: '', role: 'owner' })
const error   = ref('')
const loading = ref(false)

async function submit() {
  error.value   = ''
  loading.value = true
  try {
    const { data } = await authService.register(form.value)
    await auth.setAuth(data.token, data.user)
    router.push('/feed')
  } catch (e) {
    error.value = e.response?.data?.message || 'Registration failed'
  } finally {
    loading.value = false
  }
}
</script>
