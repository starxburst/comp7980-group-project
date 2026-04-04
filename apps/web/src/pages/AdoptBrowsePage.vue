<template>
  <div class="container py-4">
    <h4 class="fw-bold mb-3">Adopt a Pet</h4>

    <!-- Filters -->
    <div class="d-flex gap-2 mb-4 flex-wrap">
      <button v-for="f in FILTERS" :key="f.value"
              class="btn btn-sm"
              :class="activeFilter === f.value ? 'btn-primary' : 'btn-outline-secondary'"
              @click="setFilter(f.value)">
        {{ f.label }}
      </button>
      <select v-model="speciesFilter" class="form-select form-select-sm w-auto ms-auto" @change="load">
        <option value="">All species</option>
        <option v-for="s in SPECIES" :key="s" :value="s">{{ s }}</option>
      </select>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary"></div>
    </div>
    <div v-else class="row g-3">
      <div v-for="pet in filteredPets" :key="pet._id"
           class="col-6 col-md-4 col-lg-3">
        <div class="adopt-card card h-100"
             :class="{ 'adopt-card--dimmed': pet.adoptionStatus !== 'available' }"
             @click="pet.adoptionStatus !== 'adopted' && router.push(`/adopt/${pet._id}`)">

          <!-- Photo -->
          <div class="position-relative">
            <img :src="fileUrl(pet.photos?.[0], 'pet')"
                 @error="e => onImageError(e, 'pet')"
                 class="card-img-top" style="height:180px;object-fit:cover" />
            <!-- Status overlay for non-available -->
            <div v-if="pet.adoptionStatus !== 'available'"
                 class="position-absolute inset-0 d-flex align-items-center justify-content-center"
                 style="background:rgba(0,0,0,.45);top:0;left:0;right:0;bottom:0">
              <div class="text-white text-center px-2">
                <div v-if="pet.adoptionStatus === 'adopted'" class="fw-bold small">
                  <i class="bi bi-heart-fill d-block fs-4 mb-1"></i>
                  Adopted by<br>{{ pet.adoptedBy?.name || 'someone' }}
                </div>
                <div v-else class="fw-bold small">
                  <i class="bi bi-clock d-block fs-4 mb-1"></i>
                  Under Review
                </div>
              </div>
            </div>
            <!-- Status badge -->
            <span class="position-absolute top-0 end-0 m-2 badge"
                  :class="statusBadgeClass(pet.adoptionStatus)">
              {{ pet.adoptionStatus }}
            </span>
          </div>

          <div class="card-body py-2">
            <div class="fw-semibold small">{{ pet.name }}</div>
            <div class="text-muted" style="font-size:.75rem">
              {{ pet.species }} · {{ pet.breed || 'Mixed' }}
            </div>
            <div class="text-muted" style="font-size:.72rem">
              <i class="bi bi-building me-1"></i>{{ pet.ownerId?.name }}
            </div>
          </div>
        </div>
      </div>
      <div v-if="!filteredPets.length" class="col-12 text-center text-muted py-5">
        No pets found for this filter.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter }    from 'vue-router'
import { adoptService } from '@shared/services/adoptService.js'
import { SPECIES }      from '@shared/utils/constants.js'
import { fileUrl, onImageError } from '@shared/utils/formatters.js'

const router        = useRouter()
const pets          = ref([])
const loading       = ref(false)
const activeFilter  = ref('open')   // default: available + pending only
const speciesFilter = ref('')

const FILTERS = [
  { label: 'Available & Pending', value: 'open' },
  { label: 'Available',           value: 'available' },
  { label: 'Pending',             value: 'pending' },
  { label: 'Adopted',             value: 'adopted' },
  { label: 'All',                 value: 'all' },
]

const filteredPets = computed(() => {
  let list = pets.value
  if (speciesFilter.value) list = list.filter(p => p.species === speciesFilter.value)
  if (activeFilter.value === 'open')
    return list.filter(p => p.adoptionStatus === 'available' || p.adoptionStatus === 'pending')
  if (activeFilter.value === 'all') return list
  return list.filter(p => p.adoptionStatus === activeFilter.value)
})

function statusBadgeClass(status) {
  return {
    available: 'bg-success',
    pending:   'bg-warning text-dark',
    adopted:   'bg-secondary',
  }[status] || 'bg-light text-dark'
}

async function load() {
  loading.value = true
  try {
    const { data } = await adoptService.list()   // fetch all, filter client-side
    pets.value = data
  } finally { loading.value = false }
}

function setFilter(v) { activeFilter.value = v }

onMounted(load)
</script>

<style scoped>
.adopt-card { cursor: pointer; transition: transform .15s, box-shadow .15s; }
.adopt-card:hover:not(.adopt-card--dimmed) { transform: translateY(-3px); box-shadow: 0 6px 18px rgba(0,0,0,.12); }
.adopt-card--dimmed { cursor: default; opacity: .85; }
</style>
