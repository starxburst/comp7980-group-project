<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/profile" />
        </ion-buttons>
        <ion-title slot="start">Health Tracker</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <!-- Add weight log -->
      <ion-card>
        <ion-card-header><ion-card-title>Log Weight</ion-card-title></ion-card-header>
        <ion-card-content>
          <ion-item>
            <ion-label position="stacked">Date</ion-label>
            <ion-input v-model="logForm.date" type="date" />
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Weight (kg)</ion-label>
            <ion-input v-model="logForm.weightKg" type="number" step="0.1" />
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Notes</ion-label>
            <ion-input v-model="logForm.notes" />
          </ion-item>
          <ion-button expand="block" class="ion-margin-top" @click="addLog">Add Log</ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Log history -->
      <ion-card>
        <ion-card-header><ion-card-title>Weight History</ion-card-title></ion-card-header>
        <ion-list>
          <ion-item v-for="log in logs" :key="log._id">
            <ion-label>
              <h3>{{ formatDate(log.date) }}</h3>
              <p>{{ log.weightKg }} kg — {{ log.notes }}</p>
            </ion-label>
            <ion-button slot="end" fill="clear" color="danger" @click="removeLog(log._id)">
              <ion-icon :icon="trash" />
            </ion-button>
          </ion-item>
          <ion-item v-if="!logs.length">
            <ion-label color="medium">No logs yet.</ion-label>
          </ion-item>
        </ion-list>
      </ion-card>

      <!-- Vaccinations -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Vaccinations</ion-card-title>
        </ion-card-header>
        <ion-list>
          <ion-item v-for="v in vaccines" :key="v._id">
            <ion-label>
              <h3>{{ v.vaccineName }}</h3>
              <p>{{ formatDate(v.dateGiven) }} · Next: {{ formatDate(v.nextDueDate) }}</p>
            </ion-label>
          </ion-item>
          <ion-item v-if="!vaccines.length">
            <ion-label color="medium">No vaccinations recorded.</ion-label>
          </ion-item>
        </ion-list>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter }       from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons,
  IonBackButton, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonList, IonItem, IonLabel, IonInput, IonButton, IonIcon,
} from '@ionic/vue'
import { trash } from 'ionicons/icons'
import { healthService } from '@shared/services/healthService.js'
import { formatDate }    from '@shared/utils/formatters.js'

const route   = useRoute()
const router  = useRouter()
const petId   = route.params.id
const logs    = ref([])
const vaccines= ref([])
const logForm = ref({ date: '', weightKg: '', notes: '' })

onMounted(async () => {
  const [l, v] = await Promise.all([
    healthService.getLogs(petId),
    healthService.getVaccines(petId),
  ])
  logs.value    = l.data
  vaccines.value = v.data
})

async function addLog() {
  if (!logForm.value.date || !logForm.value.weightKg) return
  const { data } = await healthService.addLog(petId, logForm.value)
  logs.value.unshift(data)
  logForm.value = { date: '', weightKg: '', notes: '' }
}

async function removeLog(id) {
  await healthService.deleteLog(id)
  logs.value = logs.value.filter(l => l._id !== id)
}

</script>
