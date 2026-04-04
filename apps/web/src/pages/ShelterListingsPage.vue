<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="fw-bold mb-0">My Adoption Listings</h4>
        <p class="text-muted small mb-0">Pets you've marked open for adoption</p>
      </div>
      <router-link to="/my-pets" class="btn btn-outline-primary btn-sm">
        <i class="bi bi-paw me-1"></i>Manage My Pets
      </router-link>
    </div>

    <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
    <div v-else>
      <div v-if="!pets.length" class="text-center text-muted py-5">
        <i class="bi bi-heart fs-1 d-block mb-2"></i>
        No adoption listings yet.<br>
        <span class="small">
          Go to <router-link to="/my-pets">My Pets</router-link>
          and click "Open for Adoption" on any pet.
        </span>
      </div>

      <div v-else class="row g-3">
        <div v-for="pet in pets" :key="pet._id" class="col-md-6 col-lg-4">
          <div class="card h-100">
            <div class="position-relative">
              <img :src="fileUrl(pet.photos?.[0], 'pet')"
                   @error="e => onImageError(e, 'pet')"
                   class="card-img-top" style="height:180px;object-fit:cover" />
              <span class="position-absolute top-0 end-0 m-2 badge"
                    :class="statusBadgeClass(pet.adoptionStatus)">
                {{ pet.adoptionStatus }}
              </span>
            </div>
            <div class="card-body">
              <h6 class="fw-bold mb-1">{{ pet.name }}</h6>
              <p class="text-muted small mb-2">{{ pet.species }} · {{ pet.breed || 'Mixed' }}</p>

              <div v-if="pet.adoptedBy" class="alert alert-success py-1 small mb-2">
                <i class="bi bi-heart-fill me-1 text-danger"></i>
                Adopted by <strong>{{ pet.adoptedBy.name }}</strong>
              </div>

              <!-- Status controls -->
              <div class="d-flex flex-wrap gap-1 mb-2">
                <button v-for="s in ADOPTION_STATUSES" :key="s.value"
                        class="btn btn-sm py-0 px-2"
                        :class="pet.adoptionStatus === s.value ? s.activeClass : 'btn-outline-secondary'"
                        :disabled="pet.adoptionStatus === s.value"
                        @click="setStatus(pet, s.value)">
                  {{ s.label }}
                </button>
                <button class="btn btn-sm py-0 px-2 btn-outline-danger"
                        @click="setStatus(pet, 'none')"
                        title="Remove from adoption listing">
                  <i class="bi bi-x"></i> Remove
                </button>
              </div>

              <router-link to="/shelter/applications"
                           class="btn btn-outline-primary btn-sm w-100">
                <i class="bi bi-file-text me-1"></i>View Applications
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted }        from 'vue'
import { adoptService }          from '@shared/services/adoptService.js'
import { petService }            from '@shared/services/petService.js'
import { fileUrl, onImageError } from '@shared/utils/formatters.js'

const pets    = ref([])
const loading = ref(true)

const ADOPTION_STATUSES = [
  { value: 'available', label: 'Available', activeClass: 'btn-success' },
  { value: 'pending',   label: 'Pending',   activeClass: 'btn-warning text-dark' },
  { value: 'adopted',   label: 'Adopted',   activeClass: 'btn-secondary' },
]

function statusBadgeClass(s) {
  return { available: 'bg-success', pending: 'bg-warning text-dark', adopted: 'bg-secondary' }[s] || 'bg-light'
}

onMounted(async () => {
  try {
    const { data } = await adoptService.myListings()
    pets.value = data
  } finally { loading.value = false }
})

async function setStatus(pet, status) {
  const { data } = await petService.setAdoption(pet._id, { adoptionStatus: status })
  const idx = pets.value.findIndex(p => p._id === pet._id)
  if (status === 'none') {
    pets.value.splice(idx, 1)
  } else {
    pets.value[idx] = { ...pets.value[idx], adoptionStatus: data.adoptionStatus, adoptedBy: data.adoptedBy }
  }
}
</script>
