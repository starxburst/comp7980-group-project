<template>
  <div class="container py-4">
    <h4 class="fw-bold mb-4">Manage Users</h4>
    <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
    <div v-else class="table-responsive">
      <table class="table table-hover align-middle">
        <thead class="table-light">
          <tr><th>User</th><th>Email</th><th>Role</th><th>Action</th></tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user._id">
            <td class="d-flex align-items-center gap-2">
              <img :src="fileUrl(user.avatar) || '/avatar-placeholder.png'" width="36" height="36" class="rounded-circle" />
              {{ user.name }}
            </td>
            <td>{{ user.email }}</td>
            <td>
              <select v-model="user.role" class="form-select form-select-sm" style="max-width:160px"
                      @change="changeRole(user._id, user.role)">
                <option value="owner">owner</option>
                <option value="shelter_staff">shelter_staff</option>
                <option value="admin">admin</option>
              </select>
            </td>
            <td>
              <button class="btn btn-outline-danger btn-sm" @click="deleteUser(user._id)">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@shared/api.js'
import { fileUrl } from '@shared/utils/formatters.js'

const users   = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const { data } = await api.get('/admin/users')
    users.value = data
  } finally { loading.value = false }
})

async function changeRole(id, role) {
  await api.put(`/admin/users/${id}`, { role })
}

async function deleteUser(id) {
  if (!confirm('Delete this user?')) return
  await api.delete(`/admin/users/${id}`)
  users.value = users.value.filter(u => u._id !== id)
}
</script>
