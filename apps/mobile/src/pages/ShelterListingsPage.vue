<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/profile" />
        </ion-buttons>
        <ion-title slot="start">Shelter Listings</ion-title>
        <ion-buttons slot="end">
          <ion-button color="light" aria-label="Applications" @click="router.push('/shelter/applications')">
            <ion-icon slot="icon-only" :icon="documentTextOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner name="crescent" />
      </div>

      <div v-else-if="!pets.length" class="ion-text-center ion-padding" style="color:var(--ion-color-medium)">
        No adoption listings yet.
      </div>

      <div v-else class="ion-padding">
        <ion-card v-for="pet in pets" :key="pet._id">
          <img
            :src="fileUrl(pet.photos?.[0], 'pet')"
            @error="event => onImageError(event, 'pet')"
            style="width:100%;height:200px;object-fit:cover"
          />
          <ion-card-header>
            <ion-card-title>{{ pet.name }}</ion-card-title>
            <ion-card-subtitle>{{ pet.species }} · {{ pet.breed || 'Mixed' }}</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <div class="d-flex align-items-center justify-content-between gap-2 mb-3" style="display:flex">
              <span class="badge" :class="statusBadgeClass(pet.adoptionStatus)">
                {{ pet.adoptionStatus }}
              </span>
              <small v-if="pet.adoptedBy" style="color:var(--ion-color-medium)">
                Adopted by {{ pet.adoptedBy.name }}
              </small>
            </div>

            <div class="shelter-listing-actions">
              <ion-button
                v-for="status in ADOPTION_STATUSES"
                :key="status.value"
                size="small"
                :color="buttonColor(status.value)"
                :fill="pet.adoptionStatus === status.value ? 'solid' : 'outline'"
                :disabled="pet.adoptionStatus === status.value || savingId === pet._id"
                @click="setStatus(pet, status.value)"
              >
                {{ status.label }}
              </ion-button>
              <ion-button
                size="small"
                color="danger"
                fill="outline"
                :disabled="savingId === pet._id"
                @click="setStatus(pet, 'none')"
              >
                Remove
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import {
  IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
  IonContent, IonSpinner, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle,
  IonCardContent, IonButton, IonIcon,
} from '@ionic/vue'
import { documentTextOutline } from 'ionicons/icons'
import { useRouter } from 'vue-router'
import { adoptService } from '@shared/services/adoptService.js'
import { petService } from '@shared/services/petService.js'
import { fileUrl, onImageError } from '@shared/utils/formatters.js'

const router = useRouter()
const pets = ref([])
const loading = ref(true)
const savingId = ref('')

const ADOPTION_STATUSES = [
  { value: 'available', label: 'Available' },
  { value: 'pending', label: 'Pending' },
  { value: 'adopted', label: 'Adopted' },
]

function statusBadgeClass(status) {
  return {
    available: 'bg-success',
    pending: 'bg-warning text-dark',
    adopted: 'bg-secondary',
  }[status] || 'bg-light text-dark'
}

function buttonColor(status) {
  return {
    available: 'success',
    pending: 'warning',
    adopted: 'medium',
  }[status] || 'primary'
}

onMounted(loadPets)

async function loadPets() {
  loading.value = true
  try {
    const { data } = await adoptService.myListings()
    pets.value = data
  } finally {
    loading.value = false
  }
}

async function setStatus(pet, status) {
  savingId.value = pet._id
  try {
    const { data } = await petService.setAdoption(pet._id, { adoptionStatus: status })
    const idx = pets.value.findIndex(item => item._id === pet._id)
    if (idx === -1) return
    if (status === 'none') {
      pets.value.splice(idx, 1)
      return
    }
    pets.value[idx] = {
      ...pets.value[idx],
      adoptionStatus: data.adoptionStatus,
      adoptedBy: data.adoptedBy,
    }
  } finally {
    savingId.value = ''
  }
}
</script>

<style scoped>
.shelter-listing-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
</style>
