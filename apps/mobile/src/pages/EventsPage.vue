<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title slot="start">Events</ion-title>
        <ion-buttons slot="end">
          <ion-button v-if="auth.isStaff || auth.isAdmin" color="light" aria-label="New event" @click="showCreate = true">
            <ion-icon slot="icon-only" :icon="addCircle" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner name="crescent" />
      </div>
      <div v-else class="ion-padding">
        <ion-card v-for="event in events" :key="event._id" button @click="router.push(`/events/${event._id}`)">
          <img
            v-if="event.coverPhoto"
            :src="fileUrl(event.coverPhoto, 'post')"
            style="width:100%;height:180px;object-fit:cover"
          />
          <ion-card-header>
            <ion-card-title>{{ event.title }}</ion-card-title>
            <ion-card-subtitle>{{ formatDate(event.date) }}</ion-card-subtitle>
            <ion-card-subtitle>{{ event.location || 'TBD' }}</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <ion-badge color="light">{{ event.type }}</ion-badge>
              <small style="color:var(--ion-color-medium)">
                {{ event.attendees?.length || 0 }} attending
                <span v-if="event.maxAttendees"> of {{ event.maxAttendees }} max</span>
              </small>
            </div>
          </ion-card-content>
        </ion-card>
      </div>

      <ion-modal :is-open="showCreate" @didDismiss="closeCreate">
        <ion-header>
          <ion-toolbar color="primary">
            <ion-title slot="start">Create Event</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeCreate">Close</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-list inset>
            <ion-item>
              <ion-input v-model="form.title" label="Title" label-placement="stacked" placeholder="Event title" />
            </ion-item>
            <ion-item>
              <ion-select v-model="form.type" label="Type" label-placement="stacked">
                <ion-select-option v-for="type in EVENT_TYPES" :key="type" :value="type">{{ type }}</ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item>
              <ion-input v-model="form.date" type="datetime-local" label="Date" label-placement="stacked" />
            </ion-item>
            <ion-item>
              <ion-input v-model="form.location" label="Location" label-placement="stacked" placeholder="Where is it?" />
            </ion-item>
            <ion-item>
              <ion-input v-model="form.maxAttendees" type="number" min="1" label="Attendee Limit" label-placement="stacked" placeholder="Leave empty for no limit" />
            </ion-item>
            <ion-item>
              <ion-textarea v-model="form.description" rows="4" label="Description" label-placement="stacked" placeholder="What is this event about?" />
            </ion-item>
          </ion-list>
          <ion-button expand="block" class="ion-margin-top" :disabled="saving || !form.title.trim() || !form.date" @click="createEvent">
            <ion-spinner v-if="saving" name="crescent" slot="start" />
            Create Event
          </ion-button>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
  IonContent, IonSpinner, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle,
  IonCardContent, IonBadge, IonModal, IonList, IonItem, IonInput, IonSelect,
  IonSelectOption, IonTextarea,
} from '@ionic/vue'
import { addCircle } from 'ionicons/icons'
import { useAuthStore } from '@shared/stores/auth.js'
import { eventService } from '@shared/services/eventService.js'
import { EVENT_TYPES } from '@shared/utils/constants.js'
import { fileUrl, formatDate } from '@shared/utils/formatters.js'

const router = useRouter()
const auth = useAuthStore()
const events = ref([])
const loading = ref(true)
const showCreate = ref(false)
const saving = ref(false)
const form = ref({ title: '', type: 'meetup', date: '', location: '', description: '', maxAttendees: '' })

onMounted(loadEvents)

async function loadEvents() {
  loading.value = true
  try {
    const { data } = await eventService.list()
    events.value = data
  } finally {
    loading.value = false
  }
}

function closeCreate() {
  showCreate.value = false
  form.value = { title: '', type: 'meetup', date: '', location: '', description: '', maxAttendees: '' }
}

async function createEvent() {
  saving.value = true
  const fd = new FormData()
  Object.entries(form.value).forEach(([key, value]) => value && fd.append(key, value))
  try {
    const { data } = await eventService.create(fd)
    events.value.unshift(data)
    closeCreate()
  } finally {
    saving.value = false
  }
}

</script>
