<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="fw-bold mb-0">Events</h4>
      <button v-if="auth.isStaff || auth.isAdmin" class="btn btn-primary btn-sm" @click="showCreate = true">
        <i class="bi bi-plus-lg me-1"></i>Create Event
      </button>
    </div>
    <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
    <div v-else class="row g-3">
      <div class="col-md-6 col-lg-4" v-for="event in events" :key="event._id">
        <div class="card h-100 pet-card" style="cursor:pointer" @click="router.push(`/events/${event._id}`)">
          <img v-if="event.coverPhoto" :src="fileUrl(event.coverPhoto)" class="card-img-top" style="height:160px;object-fit:cover" />
          <div class="card-body">
            <h6 class="card-title fw-bold">{{ event.title }}</h6>
            <p class="card-text small text-muted mb-1">
              <i class="bi bi-calendar me-1"></i>{{ formatDate(event.date) }}
            </p>
            <p class="card-text small text-muted">
              <i class="bi bi-geo-alt me-1"></i>{{ event.location || 'TBD' }}
            </p>
            <p class="card-text small text-muted mb-2">
              <i class="bi bi-people me-1"></i>{{ event.attendees?.length || 0 }} attending
              <span v-if="event.maxAttendees"> / {{ event.maxAttendees }}</span>
            </p>
            <span class="badge bg-light text-dark border">{{ event.type }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Create event modal -->
    <div v-if="showCreate" class="modal d-block" style="background:rgba(0,0,0,.5)">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Create Event</h5>
            <button class="btn-close" @click="showCreate = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3"><label class="form-label">Title *</label>
              <input v-model="eForm.title" class="form-control" /></div>
            <div class="mb-3"><label class="form-label">Type</label>
              <select v-model="eForm.type" class="form-select">
                <option v-for="t in EVENT_TYPES" :key="t" :value="t">{{ t }}</option>
              </select></div>
            <div class="mb-3"><label class="form-label">Date *</label>
              <input v-model="eForm.date" type="datetime-local" class="form-control" /></div>
            <div class="mb-3"><label class="form-label">Location</label>
              <input v-model="eForm.location" class="form-control" /></div>
            <div class="mb-3"><label class="form-label">Attendee Limit</label>
              <input v-model="eForm.maxAttendees" type="number" min="1" class="form-control" placeholder="Leave empty for no limit" /></div>
            <div class="mb-3"><label class="form-label">Description</label>
              <textarea v-model="eForm.description" class="form-control" rows="3"
                        placeholder="What is this event about?"></textarea></div>
            <div class="mb-3"><label class="form-label">Cover Photo</label>
              <input type="file" class="form-control" accept="image/*" @change="onCover" /></div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showCreate = false">Cancel</button>
            <button class="btn btn-primary" @click="createEvent" :disabled="saving">
              <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>Create
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter }      from 'vue-router'
import { useAuthStore }   from '@shared/stores/auth.js'
import { eventService }   from '@shared/services/eventService.js'
import { EVENT_TYPES }    from '@shared/utils/constants.js'
import { fileUrl, formatDate } from '@shared/utils/formatters.js'

const router     = useRouter()
const auth       = useAuthStore()
const events     = ref([])
const loading    = ref(true)
const showCreate = ref(false)
const saving     = ref(false)
const eForm      = ref({ title: '', type: 'meetup', date: '', location: '', description: '', maxAttendees: '' })
let coverFile    = null

onMounted(async () => {
  try {
    const { data } = await eventService.list()
    events.value = data
  } finally { loading.value = false }
})

function onCover(e) { coverFile = e.target.files[0] }

async function createEvent() {
  saving.value = true
  const fd = new FormData()
  Object.entries(eForm.value).forEach(([k, v]) => v && fd.append(k, v))
  if (coverFile) fd.append('coverPhoto', coverFile)
  try {
    const { data } = await eventService.create(fd)
    events.value.unshift(data)
    showCreate.value = false
    eForm.value = { title: '', type: 'meetup', date: '', location: '', description: '', maxAttendees: '' }
    coverFile = null
  } finally { saving.value = false }
}
</script>
