<template>
  <div class="pet-card card h-100" @click="$emit('click', pet._id)" style="cursor:pointer">
    <img :src="fileUrl(pet.photos?.[0], 'pet')"
         @error="event => onImageError(event, 'pet')"
         class="card-img-top" style="height:200px;object-fit:cover" :alt="pet.name" />
    <div class="card-body p-2">
      <h6 class="card-title mb-1">{{ pet.name }}</h6>
      <p class="card-text small text-muted mb-0">{{ pet.species }} · {{ pet.breed || 'Mixed' }}</p>
      <span v-if="pet.status" class="badge mt-1"
            :class="statusClass(pet.status)">{{ pet.status }}</span>
    </div>
  </div>
</template>

<script setup>
import { fileUrl, onImageError } from '@shared/utils/formatters.js'

defineProps({ pet: { type: Object, required: true } })
defineEmits(['click'])

function statusClass(s) {
  return { available: 'bg-success', pending: 'bg-warning text-dark', adopted: 'bg-secondary' }[s] || 'bg-light'
}
</script>
