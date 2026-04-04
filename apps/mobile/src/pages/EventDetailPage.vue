<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/events" />
        </ion-buttons>
        <ion-title slot="start">{{ event?.title || 'Event' }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div v-if="loading" class="ion-text-center ion-padding"><ion-spinner name="crescent" /></div>
      <div v-else-if="event">

        <!-- Cover photo -->
        <img v-if="event.coverPhoto" :src="fileUrl(event.coverPhoto)"
             style="width:100%;max-height:240px;object-fit:cover" />

        <!-- Info card -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>{{ event.title }}</ion-card-title>
            <ion-card-subtitle>
              <i class="bi bi-calendar me-1"></i>{{ formatDateTime(event.date) }}
            </ion-card-subtitle>
            <ion-card-subtitle>
              <i class="bi bi-geo-alt me-1"></i>{{ event.location }}
            </ion-card-subtitle>
            <ion-card-subtitle>
              <i class="bi bi-people me-1"></i>{{ validAttendees.length }} attending
              <span v-if="event.maxAttendees"> of {{ event.maxAttendees }} max</span>
            </ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <ion-badge color="light">{{ event.type }}</ion-badge>

            <!-- Description -->
            <div class="ion-margin-top">
              <div v-if="!editingDesc">
                <p style="white-space:pre-wrap;color:var(--ion-color-medium)">
                  {{ event.description || 'No description yet.' }}
                </p>
                <ion-button v-if="canEditEvent" fill="clear" size="small" @click="startEditDesc">
                  <ion-icon :icon="pencil" slot="start" />Edit description
                </ion-button>
              </div>
              <div v-else>
                <ion-textarea v-model="descDraft" :rows="3" class="ion-margin-bottom" />
                <div style="display:flex;gap:8px">
                  <ion-button size="small" @click="saveDesc" :disabled="savingDesc">
                    <ion-spinner v-if="savingDesc" name="crescent" slot="start" />Save
                  </ion-button>
                  <ion-button size="small" fill="outline" @click="editingDesc = false">Cancel</ion-button>
                </div>
              </div>
            </div>

            <!-- RSVP -->
            <ion-item v-if="!rsvpDone && myPets.length" lines="full" class="ion-margin-top">
              <ion-select v-model="selectedPetId" label="Attending pet" label-placement="stacked" interface="popover">
                <ion-select-option value="">No pet selected</ion-select-option>
                <ion-select-option v-for="pet in myPets" :key="pet._id" :value="pet._id">
                  {{ pet.name }}
                </ion-select-option>
              </ion-select>
            </ion-item>
            <ion-note v-if="event.maxAttendees && !rsvpDone" color="medium" style="display:block;padding-top:12px">
              {{ remainingSpots }} spot<span v-if="remainingSpots !== 1">s</span> left
            </ion-note>
            <ion-button expand="block" class="ion-margin-top"
                        :color="rsvpDone ? 'medium' : 'primary'"
                        @click="rsvpDone ? cancelRsvp() : rsvp()"
                        :disabled="rsvpLoading">
              <ion-spinner v-if="rsvpLoading" name="crescent" slot="start" />
              {{ rsvpDone ? 'Cancel RSVP' : 'RSVP to this event' }}
            </ion-button>
          </ion-card-content>
        </ion-card>

        <!-- Google Map -->
        <div v-if="event.location" style="margin:0 16px 16px;border-radius:12px;overflow:hidden;height:200px">
          <iframe
            :src="`https://maps.google.com/maps?q=${encodeURIComponent(event.location)}&output=embed`"
            width="100%" height="200" style="border:0" loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>

        <!-- Attendees -->
        <ion-list>
          <ion-list-header>
            <ion-label>
              Attendees ({{ validAttendees.length }}<span v-if="event.maxAttendees"> / {{ event.maxAttendees }}</span>)
            </ion-label>
          </ion-list-header>
          <ion-item v-for="a in validAttendees" :key="String(a.owner?._id)"
                    button @click="router.push(`/profile/${a.owner?._id}`)">
            <ion-avatar slot="start">
              <img :src="fileUrl(a.owner?.avatar, 'avatar') || '/avatar-placeholder.png'" />
            </ion-avatar>
            <ion-label>
              <h3>{{ a.owner?.name }}</h3>
              <p v-if="a.pet">with {{ a.pet.name }}</p>
            </ion-label>
            <!-- Admin remove -->
            <ion-button v-if="auth.isAdmin" slot="end" fill="clear" color="danger"
                        @click.stop="removeAttendee(a.owner?._id)">
              <ion-icon :icon="closeCircle" />
            </ion-button>
          </ion-item>
          <ion-item v-if="!validAttendees.length">
            <ion-label color="medium">No attendees yet — be the first!</ion-label>
          </ion-item>
        </ion-list>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter }      from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons,
  IonBackButton, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle,
  IonCardContent, IonBadge, IonButton, IonIcon, IonList, IonListHeader,
  IonItem, IonAvatar, IonLabel, IonSpinner, IonTextarea, alertController,
  IonSelect, IonSelectOption, IonNote,
} from '@ionic/vue'
import { pencil, closeCircle } from 'ionicons/icons'
import { useAuthStore }   from '@shared/stores/auth.js'
import { usePetsStore }   from '@shared/stores/pets.js'
import { eventService }   from '@shared/services/eventService.js'
import { fileUrl, formatDateTime } from '@shared/utils/formatters.js'

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
  try { await eventService.rsvp(event.value._id, { petId: selectedPetId.value || undefined }); await loadEvent() }
  finally { rsvpLoading.value = false }
}

async function cancelRsvp() {
  rsvpLoading.value = true
  try { await eventService.cancelRsvp(event.value._id); await loadEvent() }
  finally { rsvpLoading.value = false }
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
  const alert = await alertController.create({
    header: 'Remove attendee?',
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      {
        text: 'Remove', role: 'destructive',
        handler: async () => {
          await eventService.removeAttendee(event.value._id, userId)
          await loadEvent()
        }
      }
    ]
  })
  await alert.present()
}

</script>
