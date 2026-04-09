<template>
  <div class="container py-4">
    <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
      <h4 class="fw-bold mb-0">My Pets</h4>
      <button class="btn btn-primary btn-sm align-self-stretch align-self-sm-auto" @click="openAddModal">
        <i class="bi bi-plus-lg me-1"></i>Add Pet
      </button>
    </div>

    <div v-if="petsStore.loading" class="text-center py-5">
      <div class="spinner-border text-primary"></div>
    </div>
    <div v-else class="row g-3">
      <div class="col-6 col-md-4 col-lg-3" v-for="pet in petsStore.myPets" :key="pet._id">
        <div class="d-flex flex-column gap-2 h-100">
          <div class="position-relative">
            <PetCard :pet="pet" @click="goHealth(pet._id)" />
            <!-- Adoption status badge for staff -->
            <span v-if="auth.isStaff && pet.adoptionStatus && pet.adoptionStatus !== 'none'"
                  class="position-absolute top-0 start-0 m-2 badge"
                  :class="adoptBadgeClass(pet.adoptionStatus)">
              {{ pet.adoptionStatus }}
            </span>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-primary btn-sm flex-fill" @click="openEditModal(pet)">
              Edit
            </button>
            <button class="btn btn-outline-secondary btn-sm flex-fill" @click="goHealth(pet._id)">
              Health
            </button>
          </div>
          <!-- Adoption toggle for shelter staff -->
          <button v-if="auth.isStaff || auth.isAdmin"
                  class="btn btn-sm w-100"
                  :class="pet.adoptionStatus === 'none' || !pet.adoptionStatus
                    ? 'btn-outline-success' : 'btn-outline-warning'"
                  @click="openAdoptionModal(pet)">
            <i class="bi bi-heart me-1"></i>
            {{ pet.adoptionStatus && pet.adoptionStatus !== 'none'
              ? 'Manage Adoption' : 'Open for Adoption' }}
          </button>
        </div>
      </div>
      <div v-if="!petsStore.myPets.length" class="col-12 text-center text-muted py-5">
        <i class="bi bi-paw fs-1 d-block mb-2"></i>
        No pets yet. Add your first pet!
      </div>
    </div>

    <!-- Add / Edit pet modal -->
    <div v-if="showEditor" class="modal d-block" style="background:rgba(0,0,0,.5)">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingPetId ? 'Edit Pet' : 'Add Pet' }}</h5>
            <button class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Name *</label>
              <input v-model="form.name" class="form-control" required />
            </div>
            <div class="row g-2 mb-3">
              <div class="col">
                <label class="form-label">Species</label>
                <select v-model="form.species"
                        class="form-select"
                        :class="{ 'ai-filled-field': aiFieldEffect.species }">
                  <option v-for="s in SPECIES" :key="s" :value="s">{{ s }}</option>
                </select>
              </div>
              <div class="col">
                <label class="form-label">Breed</label>
                <input v-model="form.breed"
                       class="form-control"
                       :class="{ 'ai-filled-field': aiFieldEffect.breed }" />
                <div v-if="aiFillNotice" class="ai-fill-notice mt-2">
                  AI filled species and breed from the selected photo.
                </div>
                <div v-if="breedDetectionResult" class="form-text">
                  Suggested locally with MobileNet: {{ breedDetectionResult.breed }}
                  ({{ breedDetectionResult.confidence }}% confidence)
                </div>
              </div>
            </div>
            <div class="row g-2 mb-3">
              <div class="col">
                <label class="form-label">Color</label>
                <input v-model="form.color" class="form-control" />
              </div>
              <div class="col">
                <label class="form-label">Sex</label>
                <select v-model="form.sex" class="form-select">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
              <div class="col">
                <label class="form-label">Date of Birth</label>
                <input v-model="form.dob" type="date" class="form-control" />
              </div>
            </div>
            <div class="row g-2 mb-3">
              <div class="col">
                <label class="form-label">Weight (kg)</label>
                <input v-model="form.weight" type="number" step="0.1" class="form-control" />
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">Personality traits <small class="text-muted">(comma-separated)</small></label>
              <input v-model="form.personality" class="form-control" placeholder="friendly, playful, calm" />
            </div>
            <div class="mb-3">
              <label class="form-label">Description</label>
              <textarea v-model="form.description" class="form-control" rows="2"></textarea>
            </div>
            <div class="mb-3">
              <label class="form-label">Photos</label>
              <input
                ref="photoInput"
                type="file"
                class="d-none"
                multiple
                accept="image/*"
                @change="onPhotos"
              />
              <div class="pet-photo-picker">
                <button class="btn btn-outline-primary btn-sm" type="button" @click="openPhotoPicker">
                  Choose Files
                </button>
                <span class="pet-photo-picker__text">
                  {{ photoSelectionLabel }}
                </span>
              </div>
              <div class="d-flex align-items-center gap-2 mt-2">
                <button class="btn btn-outline-primary btn-sm"
                        type="button"
                        @click="runBreedDetection"
                        :disabled="breedDetecting">
                  <span v-if="breedDetecting" class="spinner-border spinner-border-sm me-1"></span>
                  Use AI to Fill Breed
                </button>
                <span class="text-muted small">Runs fully in your browser using the pretrained MobileNet model.</span>
              </div>
              <div v-if="!canRunBreedDetection" class="form-text">
                Select a photo first to run breed detection.
              </div>
              <div v-if="breedDetectionError" class="text-danger small mt-2">
                {{ breedDetectionError }}
              </div>
              <div v-if="editingPetId" class="form-text">Leave empty to keep current photos.</div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeModal">Cancel</button>
            <button class="btn btn-primary" @click="savePet" :disabled="saving || !form.name.trim()">
              <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
              {{ editingPetId ? 'Update Pet' : 'Save Pet' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Adoption modal (staff only) -->
    <div v-if="showAdoption" class="modal d-block" style="background:rgba(0,0,0,.5)">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Adoption Settings — {{ adoptingPet?.name }}</h5>
            <button class="btn-close" @click="showAdoption = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Adoption status</label>
              <select v-model="adoptForm.adoptionStatus" class="form-select">
                <option value="none">Not for adoption</option>
                <option value="available">Available</option>
                <option value="pending">Pending (under review)</option>
                <option value="adopted">Adopted</option>
              </select>
            </div>
            <div v-if="adoptForm.adoptionStatus !== 'none'" class="mb-3">
              <label class="form-label">Contact email for applicants</label>
              <input v-model="adoptForm.adoptionContactEmail" type="email" class="form-control"
                     placeholder="shelter@example.com" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showAdoption = false">Cancel</button>
            <button class="btn btn-primary" @click="saveAdoption" :disabled="savingAdoption">
              <span v-if="savingAdoption" class="spinner-border spinner-border-sm me-1"></span>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted }  from 'vue'
import { useRouter }       from 'vue-router'
import { usePetsStore }    from '@shared/stores/pets.js'
import { useAuthStore }    from '@shared/stores/auth.js'
import { petService }      from '@shared/services/petService.js'
import { useBreedDetect }  from '@shared/composables/useBreedDetect.js'
import { SPECIES }         from '@shared/utils/constants.js'
import PetCard             from '../components/PetCard.vue'

const petsStore = usePetsStore()
const auth      = useAuthStore()
const router    = useRouter()

const showEditor   = ref(false)
const editingPetId = ref('')
const saving       = ref(false)
const form         = ref(defaultForm())
const photoFiles   = ref([])
const photoInput   = ref(null)
const aiFieldEffect = ref({ species: false, breed: false })
const {
  detecting: breedDetecting,
  error: breedDetectionError,
  result: breedDetectionResult,
  detectFromFile,
  clearDetection,
} = useBreedDetect()
const canRunBreedDetection = computed(() => photoFiles.value.length > 0)
const aiFillNotice = computed(() => aiFieldEffect.value.species || aiFieldEffect.value.breed)
const photoSelectionLabel = computed(() => {
  if (!photoFiles.value.length) return 'No file chosen'
  if (photoFiles.value.length === 1) return photoFiles.value[0].name
  return `${photoFiles.value.length} files selected`
})

const showAdoption   = ref(false)
const adoptingPet    = ref(null)
const savingAdoption = ref(false)
const adoptForm      = ref({ adoptionStatus: 'none', adoptionContactEmail: '' })

onMounted(() => petsStore.fetchMyPets())

function onPhotos(e) {
  photoFiles.value = Array.from(e.target.files || [])
  clearDetection()
}
function openPhotoPicker() {
  photoInput.value?.click()
}
function goHealth(id) { router.push(`/my-pets/${id}/health`) }

function adoptBadgeClass(s) {
  return { available: 'bg-success', pending: 'bg-warning text-dark', adopted: 'bg-secondary' }[s] || ''
}

function defaultForm() {
  return { name: '', species: 'Dog', breed: '', color: '', sex: 'unknown',
           dob: '', weight: '', personality: '', description: '', aiBreedRaw: '' }
}

function resetAiFieldEffect() {
  aiFieldEffect.value = { species: false, breed: false }
}

function triggerAiFieldEffect() {
  aiFieldEffect.value = { species: true, breed: true }
  window.setTimeout(() => {
    resetAiFieldEffect()
  }, 2200)
}

function openAddModal() {
  editingPetId.value = ''
  form.value = defaultForm()
  photoFiles.value = []
  resetAiFieldEffect()
  clearDetection()
  showEditor.value = true
}

function openEditModal(pet) {
  editingPetId.value = pet._id
  form.value = {
    name:        pet.name || '',
    species:     pet.species || 'Dog',
    breed:       pet.breed || '',
    color:       pet.color || '',
    sex:         pet.sex || 'unknown',
    dob:         pet.dob ? String(pet.dob).slice(0, 10) : '',
    weight:      pet.weight ?? '',
    personality: Array.isArray(pet.personality) ? pet.personality.join(', ') : (pet.personality || ''),
    description: pet.description || '',
    aiBreedRaw:  pet.aiBreedRaw || '',
  }
  photoFiles.value = []
  resetAiFieldEffect()
  clearDetection()
  showEditor.value = true
}

function openAdoptionModal(pet) {
  adoptingPet.value = pet
  adoptForm.value = {
    adoptionStatus:       pet.adoptionStatus || 'none',
    adoptionContactEmail: pet.adoptionContactEmail || '',
  }
  showAdoption.value = true
}

function closeModal() {
  showEditor.value = false
  editingPetId.value = ''
  form.value = defaultForm()
  photoFiles.value = []
  resetAiFieldEffect()
  clearDetection()
}

async function runBreedDetection() {
  if (!canRunBreedDetection.value) {
    breedDetectionError.value = 'Please select a photo before running breed detection.'
    return
  }

  const result = await detectFromFile(photoFiles.value[0])
  if (!result) return
  form.value.breed = result.breed
  if (result.type && result.type !== 'Unknown') form.value.species = result.type
  form.value.aiBreedRaw = JSON.stringify(result)
  triggerAiFieldEffect()
}

async function savePet() {
  saving.value = true
  const fd = new FormData()
  Object.entries(form.value).forEach(([k, v]) => {
    if (v === '' || v === null || v === undefined) return
    fd.append(k, typeof v === 'boolean' ? String(v) : v)
  })
  photoFiles.value.forEach(f => fd.append('photos', f))
  try {
    if (editingPetId.value) await petsStore.updatePet(editingPetId.value, fd)
    else await petsStore.createPet(fd)
    closeModal()
  } finally { saving.value = false }
}

async function saveAdoption() {
  savingAdoption.value = true
  try {
    const { data } = await petService.setAdoption(adoptingPet.value._id, adoptForm.value)
    // Update the local store
    const idx = petsStore.myPets.findIndex(p => p._id === data._id)
    if (idx !== -1) Object.assign(petsStore.myPets[idx], data)
    showAdoption.value = false
  } finally { savingAdoption.value = false }
}
</script>

<style scoped>
.pet-photo-picker {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  min-height: 56px;
  padding: 0.7rem 0.8rem;
  border: 1px solid var(--ps-border);
  border-radius: 14px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01)),
    var(--ps-surface);
}

.pet-photo-picker__text {
  min-width: 0;
  color: var(--ps-text);
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

<style scoped>
.ai-filled-field {
  border-color: #4cc38a;
  box-shadow: 0 0 0 0.18rem rgba(76, 195, 138, 0.16);
  animation: aiFieldPulse 0.9s ease-in-out 2;
}

.ai-fill-notice {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  background: rgba(76, 195, 138, 0.1);
  border: 1px solid rgba(76, 195, 138, 0.18);
  color: #72d4a0;
  font-size: 0.82rem;
  font-weight: 600;
}

.ai-fill-notice::before {
  content: 'AI';
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  height: 1.5rem;
  border-radius: 999px;
  background: rgba(76, 195, 138, 0.22);
  color: #dff7ea;
  font-size: 0.7rem;
  letter-spacing: 0.04em;
}

@keyframes aiFieldPulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(76, 195, 138, 0.26);
  }

  50% {
    transform: scale(1.005);
    box-shadow: 0 0 0 0.28rem rgba(76, 195, 138, 0.1);
  }

  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0.18rem rgba(76, 195, 138, 0.16);
  }
}
</style>
