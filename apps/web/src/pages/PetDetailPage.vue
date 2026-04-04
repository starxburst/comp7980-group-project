<template>
  <div class="container py-4" style="max-width:680px">
    <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
    <div v-else-if="pet">
      <img :src="fileUrl(pet.photos?.[0]) || '/pet-placeholder.png'"
           class="w-100 rounded mb-4" style="max-height:360px;object-fit:cover" />
      <h4 class="fw-bold">{{ pet.name }}</h4>
      <p class="text-muted">{{ pet.species }} · {{ pet.breed || 'Mixed' }} · {{ pet.sex }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute }       from 'vue-router'
import api                from '@shared/api.js'
import { fileUrl }        from '@shared/utils/formatters.js'

const route   = useRoute()
const pet     = ref(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const { data } = await api.get(`/my-pets/${route.params.id}`)
    pet.value = data
  } finally { loading.value = false }
})
</script>
