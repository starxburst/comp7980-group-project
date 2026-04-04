<template>
  <div class="container py-4" style="max-width:760px">
    <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
    <div v-else-if="event">

      <!-- Cover photo -->
      <img v-if="event.coverPhoto" :src="fileUrl(event.coverPhoto)"
           class="w-100 rounded-3 mb-4" style="max-height:300px;object-fit:cover" />

      <!-- Title & meta -->
      <div class="d-flex justify-content-between align-items-start mb-2">
        <div>
          <h4 class="fw-bold mb-1">{{ event.title }}</h4>
          <p class="text-muted small mb-0">
            <i class="bi bi-calendar me-1"></i>{{ formatDateTime(event.date) }}
          </p>
          <p class="text-muted small mb-0">
            <i class="bi bi-geo-alt me-1"></i>{{ event.location }}
          </p>
          <p class="text-muted small mb-0">
            <i class="bi bi-people me-1"></i>{{ validAttendees.length }} attending
            <span v-if="event.maxAttendees"> / {{ event.maxAttendees }} spots</span>
          </p>
        </div>
        <span class="badge bg-light text-dark border text-capitalize">{{ event.type }}</span>
      </div>

      <!-- Description -->
      <div class="mb-3">
        <div v-if="!editingDesc" class="d-flex align-items-start gap-2">
          <p class="mb-0 text-secondary" style="white-space:pre-wrap">
            {{ event.description || 'No description yet.' }}
          </p>
          <button v-if="canEditEvent" class="btn btn-link btn-sm p-0 ms-1 text-muted"
                  @click="startEditDesc" title="Edit description">
            <i class="bi bi-pencil"></i>
          </button>
        </div>
        <div v-else>
          <textarea v-model="descDraft" class="form-control mb-2" rows="3"></textarea>
          <div class="d-flex gap-2">
            <button class="btn btn-primary btn-sm" @click="saveDesc" :disabled="savingDesc">
              <span v-if="savingDesc" class="spinner-border spinner-border-sm me-1"></span>Save
            </button>
            <button class="btn btn-secondary btn-sm" @click="editingDesc = false">Cancel</button>
          </div>
        </div>
      </div>

      <!-- Google Map -->
      <div v-if="event.location" class="mb-4 rounded-3 overflow-hidden" style="height:220px">
        <iframe
          :src="`https://maps.google.com/maps?q=${encodeURIComponent(event.location)}&output=embed`"
          width="100%" height="220" style="border:0" loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>

      <!-- RSVP button -->
      <div class="mb-4">
        <div v-if="!rsvpDone && myPets.length" class="mb-3">
          <label class="form-label small text-muted">Attending pet</label>
          <select v-model="selectedPetId" class="form-select">
            <option value="">No pet selected</option>
            <option v-for="pet in myPets" :key="pet._id" :value="pet._id">{{ pet.name }}</option>
          </select>
        </div>
        <div v-if="event.maxAttendees && !rsvpDone" class="small text-muted mb-2">
          {{ remainingSpots }} spot<span v-if="remainingSpots !== 1">s</span> left
        </div>
        <button v-if="!rsvpDone" class="btn btn-primary" @click="rsvp" :disabled="rsvpLoading">
          <span v-if="rsvpLoading" class="spinner-border spinner-border-sm me-1"></span>
          <i v-else class="bi bi-check-circle me-1"></i>RSVP
        </button>
        <button v-else class="btn btn-outline-secondary" @click="cancelRsvp" :disabled="rsvpLoading">
          <span v-if="rsvpLoading" class="spinner-border spinner-border-sm me-1"></span>
          <i v-else class="bi bi-x-circle me-1"></i>Cancel RSVP
        </button>
      </div>

      <!-- Attendees -->
      <h5 class="fw-semibold mb-3">
        Attendees ({{ validAttendees.length }})
      </h5>
      <div class="d-flex flex-wrap gap-3">
        <div v-for="a in validAttendees" :key="String(a.owner?._id)"
             class="d-flex flex-column align-items-center gap-1 position-relative"
             style="width:72px">

          <!-- Admin remove button -->
          <button v-if="auth.isAdmin"
                  class="btn btn-danger btn-sm position-absolute top-0 end-0 p-0 d-flex align-items-center justify-content-center"
                  style="width:18px;height:18px;border-radius:50%;font-size:.6rem;z-index:1"
                  @click="removeAttendee(a.owner?._id)"
                  title="Remove attendee">
            <i class="bi bi-x"></i>
          </button>

          <!-- Avatar → profile -->
          <img :src="fileUrl(a.owner?.avatar, 'avatar')"
               @error="e => onImageError(e, 'avatar')"
               class="avatar-md"
               style="cursor:pointer"
               @click="router.push(`/profile/${a.owner?._id}`)" />

          <!-- Name → profile -->
          <span class="small text-truncate w-100 text-center"
                style="font-size:.7rem;cursor:pointer"
                @click="router.push(`/profile/${a.owner?._id}`)">
            {{ a.owner?.name }}
          </span>

          <!-- Pet badge -->
          <img v-if="a.pet?.photos?.[0]"
               :src="fileUrl(a.pet.photos[0], 'pet')"
               class="rounded-circle"
               width="26" height="26"
               style="object-fit:cover;margin-top:-8px;border:2px solid var(--bs-body-bg)" />
        </div>
        <p v-if="!validAttendees.length" class="text-muted small">No attendees yet — be the first!</p>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter }      from 'vue-router'
import { useAuthStore }             from '@shared/stores/auth.js'
import { eventService }             from '@shared/services/eventService.js'
import { usePetsStore }             from '@shared/stores/pets.js'
import { fileUrl, onImageError, formatDateTime } from '@shared/utils/formatters.js'

const route   = useRoute()
const router  = useRouter()
const auth    = useAuthStore()
const petsStore = usePetsStore()

const event       = ref(null)
const loading     = ref(true)
const rsvpDone    = ref(false)
const rsvpLoading = ref(false)
const editingDesc = ref(false)
const descDraft   = ref('')
const savingDesc  = ref(false)
const selectedPetId = ref('')

const validAttendees = computed(() =>
  (event.value?.attendees || []).filter(a => a.owner?._id)
)
const myPets = computed(() => petsStore.myPets)
const remainingSpots = computed(() => {
  if (!event.value?.maxAttendees) return 0
  return Math.max(event.value.maxAttendees - validAttendees.value.length, 0)
})

const canEditEvent = computed(() =>
  auth.isAdmin || String(event.value?.hostId) === String(auth.user?.id)
)

async function loadEvent() {
  const { data } = await eventService.get(route.params.id)
  event.value = data
  // Check if current user already RSVPed
  rsvpDone.value = validAttendees.value.some(
    a => String(a.owner?._id) === String(auth.user?.id)
  )
}

onMounted(async () => {
  try {
    await Promise.all([
      loadEvent(),
      petsStore.fetchMyPets(),
    ])
  }
  finally { loading.value = false }
})

async function rsvp() {
  rsvpLoading.value = true
  try {
    await eventService.rsvp(event.value._id, { petId: selectedPetId.value || undefined })
    await loadEvent()
  } finally { rsvpLoading.value = false }
}

async function cancelRsvp() {
  rsvpLoading.value = true
  try {
    await eventService.cancelRsvp(event.value._id)
    await loadEvent()
  } finally { rsvpLoading.value = false }
}

function startEditDesc() {
  descDraft.value = event.value.description || ''
  editingDesc.value = true
}

async function saveDesc() {
  savingDesc.value = true
  try {
    const fd = new FormData()
    fd.append('description', descDraft.value)
    await eventService.update(event.value._id, fd)
    event.value.description = descDraft.value
    editingDesc.value = false
  } finally { savingDesc.value = false }
}

async function removeAttendee(userId) {
  if (!confirm('Remove this attendee?')) return
  await eventService.removeAttendee(event.value._id, userId)
  await loadEvent()
}
</script>
