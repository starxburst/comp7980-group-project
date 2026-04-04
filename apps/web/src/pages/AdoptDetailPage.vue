<template>
  <div class="container py-4" style="max-width:760px">
    <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
    <div v-else-if="pet">
      <div class="row g-4 mb-4">

        <!-- Photo carousel -->
        <div class="col-md-5">
          <div id="petCarousel" class="carousel slide rounded-3 overflow-hidden">
            <div class="carousel-inner">
              <div v-for="(photo, i) in pet.photos" :key="i"
                   class="carousel-item" :class="{ active: i === 0 }">
                <img :src="fileUrl(photo)" class="d-block w-100"
                     style="height:320px;object-fit:cover" />
              </div>
            </div>
            <button v-if="pet.photos?.length > 1" class="carousel-control-prev"
                    data-bs-target="#petCarousel" data-bs-slide="prev">
              <span class="carousel-control-prev-icon"></span>
            </button>
            <button v-if="pet.photos?.length > 1" class="carousel-control-next"
                    data-bs-target="#petCarousel" data-bs-slide="next">
              <span class="carousel-control-next-icon"></span>
            </button>
          </div>
        </div>

        <!-- Info -->
        <div class="col-md-7">
          <div class="d-flex align-items-center gap-2 mb-2">
            <h4 class="fw-bold mb-0">{{ pet.name }}</h4>
            <span class="badge"
                  :class="{ 'bg-success': pet.adoptionStatus==='available', 'bg-warning text-dark': pet.adoptionStatus==='pending', 'bg-secondary': pet.adoptionStatus==='adopted' }">
              {{ pet.adoptionStatus }}
            </span>
          </div>

          <!-- Adopted by -->
          <div v-if="pet.adoptionStatus === 'adopted' && pet.adoptedBy"
               class="alert alert-secondary py-2 mb-3 small">
            <i class="bi bi-heart-fill me-1 text-danger"></i>
            Adopted by <strong>{{ pet.adoptedBy.name }}</strong>
          </div>

          <!-- Shelter info -->
          <div class="d-flex align-items-center gap-2 mb-3 small text-muted">
            <img :src="fileUrl(pet.ownerId?.avatar, 'avatar')" class="rounded-circle"
                 width="24" height="24" style="object-fit:cover" />
            {{ pet.ownerId?.name }}
            <span v-if="pet.adoptionContactEmail">
              · <a :href="`mailto:${pet.adoptionContactEmail}`">{{ pet.adoptionContactEmail }}</a>
            </span>
          </div>

          <!-- Details grid -->
          <div class="row g-2 mb-3">
            <div class="col-6" v-for="d in petDetails" :key="d.label">
              <div class="bg-light rounded p-2 small">
                <div class="text-muted">{{ d.label }}</div>
                <div class="fw-semibold">{{ d.value }}</div>
              </div>
            </div>
          </div>

          <!-- Personality -->
          <div class="d-flex flex-wrap gap-1 mb-3" v-if="pet.personality?.length">
            <span v-for="t in pet.personality" :key="t"
                  class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25">
              {{ t }}
            </span>
          </div>

          <!-- Description -->
          <p class="text-secondary mb-3" style="white-space:pre-wrap">
            {{ pet.description || 'No description provided.' }}
          </p>

          <!-- CTA -->
          <div v-if="pet.adoptionStatus === 'available' && !applied && !isOwnAdoptionListing">
            <button class="btn btn-primary w-100" @click="showForm = true">
              <i class="bi bi-heart me-1"></i>Apply to Adopt
            </button>
          </div>
          <div v-else-if="pet.adoptionStatus === 'available' && isOwnAdoptionListing" class="alert alert-info py-2 small text-center mb-0">
            This is your own adoption listing.
          </div>
          <div v-else-if="pet.adoptionStatus === 'pending'" class="alert alert-warning py-2 small text-center mb-0">
            Applications are under review. Check back soon.
          </div>
          <div v-else-if="pet.adoptionStatus === 'adopted'" class="alert alert-secondary py-2 small text-center mb-0">
            This pet has found a home.
          </div>
          <div v-else-if="applied" class="alert alert-success py-2 text-center mb-0">
            <i class="bi bi-check-circle me-1"></i>Application submitted!
          </div>
        </div>
      </div>

      <!-- Application form -->
      <div v-if="showForm" class="card border-0 shadow-sm">
        <div class="card-body">
          <h5 class="fw-bold mb-3">Adoption Application</h5>
          <div class="mb-3">
            <label class="form-label">Your contact email *</label>
            <input v-model="appForm.contactEmail" type="email" class="form-control"
                   placeholder="The shelter will reach out here" />
          </div>
          <div class="mb-3">
            <label class="form-label">Home type</label>
            <input v-model="appForm.homeType" class="form-control"
                   placeholder="e.g. apartment, house with yard…" />
          </div>
          <div class="mb-3 form-check">
            <input v-model="appForm.hasOtherPets" type="checkbox"
                   class="form-check-input" id="otherPets" />
            <label class="form-check-label" for="otherPets">I currently have other pets</label>
          </div>
          <div class="mb-3">
            <label class="form-label">Why do you want to adopt {{ pet.name }}?</label>
            <textarea v-model="appForm.reason" class="form-control" rows="4"></textarea>
          </div>
          <div v-if="appError" class="alert alert-danger py-2 small">{{ appError }}</div>
          <div class="d-flex gap-2">
            <button class="btn btn-secondary" @click="showForm = false">Cancel</button>
            <button class="btn btn-primary" @click="submitApp" :disabled="submitting">
              <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>
              Submit Application
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute }       from 'vue-router'
import { adoptService }   from '@shared/services/adoptService.js'
import { useAuthStore }   from '@shared/stores/auth.js'
import { fileUrl }        from '@shared/utils/formatters.js'

const route      = useRoute()
const auth       = useAuthStore()
const pet        = ref(null)
const loading    = ref(true)
const showForm   = ref(false)
const applied    = ref(false)
const submitting = ref(false)
const appError   = ref('')
const appForm    = ref({ contactEmail: '', homeType: '', hasOtherPets: false, reason: '' })

const petDetails = computed(() => {
  if (!pet.value) return []
  const p = pet.value
  const ageYrs = p.dob
    ? Math.floor((Date.now() - new Date(p.dob)) / (365.25 * 86400000))
    : null
  return [
    { label: 'Species', value: p.species },
    { label: 'Breed',   value: p.breed || 'Mixed' },
    { label: 'Age',     value: ageYrs != null ? `${ageYrs} yr${ageYrs !== 1 ? 's' : ''}` : 'Unknown' },
    { label: 'Sex',     value: p.sex || 'Unknown' },
    p.weight ? { label: 'Weight', value: `${p.weight} kg` } : null,
    { label: 'Color',   value: p.color || 'Unknown' },
  ].filter(Boolean)
})

const isOwnAdoptionListing = computed(() =>
  String(pet.value?.ownerId?._id || pet.value?.ownerId || '') === String(auth.user?.id || '')
)

onMounted(async () => {
  try {
    const { data } = await adoptService.get(route.params.id)
    pet.value = data
  } finally { loading.value = false }
})

async function submitApp() {
  if (!appForm.value.contactEmail) { appError.value = 'Contact email is required.'; return }
  submitting.value = true
  appError.value   = ''
  try {
    await adoptService.apply({ petId: pet.value._id, ...appForm.value })
    applied.value  = true
    showForm.value = false
  } catch (e) {
    appError.value = e.response?.data?.message || 'Failed to submit. Please try again.'
  } finally { submitting.value = false }
}
</script>
