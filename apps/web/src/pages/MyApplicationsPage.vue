<template>
  <div class="container py-4" style="max-width:720px">
    <h4 class="fw-bold mb-4">My Applications</h4>
    <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
    <div v-else-if="!apps.length" class="text-center text-muted py-5">
      No applications yet.
    </div>
    <div v-else class="list-group">
      <div v-for="app in apps" :key="app._id" class="list-group-item">
        <div class="d-flex align-items-center gap-3">
          <img :src="fileUrl(app.petId?.photos?.[0]) || '/pet-placeholder.png'"
               class="rounded" width="60" height="60" style="object-fit:cover" />
          <div class="flex-grow-1">
            <h6 class="mb-0">{{ app.petId?.name }}</h6>
            <small class="text-muted">{{ app.petId?.species }} · {{ app.petId?.breed }}</small>
          </div>
          <span class="badge"
                :class="{ 'bg-warning text-dark': app.status==='pending', 'bg-info': app.status==='reviewing', 'bg-success': app.status==='approved', 'bg-danger': app.status==='rejected' }">
            {{ app.status }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { adoptService }   from '@shared/services/adoptService.js'
import { fileUrl }        from '@shared/utils/formatters.js'

const apps    = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const { data } = await adoptService.myApplications()
    apps.value = data
  } finally {
    loading.value = false
  }
})
</script>
