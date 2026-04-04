<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title slot="start">Adopt</ion-title>
        <ion-buttons slot="end">
          <ion-button aria-label="Events" @click="router.push('/tabs/events')">
            <ion-icon :icon="calendarOutline" />
          </ion-button>
          <ion-button aria-label="Log out" @click="doLogout">
            <ion-icon :icon="logOutOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-searchbar v-model="search" placeholder="Search name or species…" />

      <!-- Filter chips -->
      <div class="filter-strip">
        <ion-chip
          v-for="f in FILTERS"
          :key="f.value"
          class="filter-chip"
          :color="activeFilter === f.value ? 'primary' : 'medium'"
          :outline="activeFilter !== f.value"
          @click="activeFilter = f.value"
        >
          {{ f.label }}
        </ion-chip>
      </div>

      <div v-if="loading" class="ion-text-center ion-padding"><ion-spinner name="crescent" /></div>
      <ion-list v-else>
        <ion-item v-for="pet in filtered" :key="pet._id"
                  :button="pet.adoptionStatus !== 'adopted'"
                  :router-link="pet.adoptionStatus !== 'adopted' ? `/adopt/${pet._id}` : undefined"
                  detail>
          <ion-avatar slot="start" style="width:56px;height:56px">
            <img :src="fileUrl(pet.photos?.[0], 'pet') || '/pet-placeholder.png'"
                 style="object-fit:cover" />
          </ion-avatar>
          <ion-label>
            <h2 :style="pet.adoptionStatus !== 'available' ? 'opacity:.55' : ''">
              {{ pet.name }}
            </h2>
            <p>{{ pet.species }} · {{ pet.breed || 'Mixed' }}</p>
            <p v-if="pet.adoptionStatus === 'adopted'" style="font-size:.75rem;color:var(--ion-color-medium)">
              <ion-icon :icon="heartCircle" style="font-size:12px" />
              Adopted by {{ pet.adoptedBy?.name || 'someone' }}
            </p>
            <p v-else-if="pet.adoptionStatus === 'pending'" style="font-size:.75rem;color:var(--ion-color-warning)">
              Under review
            </p>
          </ion-label>
          <ion-badge slot="end"
                     :color="pet.adoptionStatus === 'available' ? 'success' : pet.adoptionStatus === 'pending' ? 'warning' : 'medium'">
            {{ pet.adoptionStatus }}
          </ion-badge>
        </ion-item>
        <ion-item v-if="!filtered.length">
          <ion-label class="ion-text-center" color="medium">No pets found.</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton,
  IonSearchbar, IonList, IonItem, IonAvatar, IonLabel,
  IonBadge, IonSpinner, IonChip, IonIcon,
} from '@ionic/vue'
import { heartCircle, calendarOutline, logOutOutline } from 'ionicons/icons'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@shared/stores/auth.js'
import { adoptService } from '@shared/services/adoptService.js'
import { fileUrl } from '@shared/utils/formatters.js'

const router       = useRouter()
const auth         = useAuthStore()
const pets         = ref([])
const search       = ref('')
const loading      = ref(false)
const activeFilter = ref('open')

const FILTERS = [
  { label: 'Open',                value: 'open' },
  { label: 'Available',           value: 'available' },
  { label: 'Pending',             value: 'pending' },
  { label: 'Adopted',             value: 'adopted' },
  { label: 'All',                 value: 'all' },
]

const filtered = computed(() => {
  let list = pets.value
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(p => p.name?.toLowerCase().includes(q) || p.species?.toLowerCase().includes(q))
  }
  if (activeFilter.value === 'open')
    return list.filter(p => p.adoptionStatus === 'available' || p.adoptionStatus === 'pending')
  if (activeFilter.value === 'all') return list
  return list.filter(p => p.adoptionStatus === activeFilter.value)
})

async function load() {
  loading.value = true
  try {
    const { data } = await adoptService.list()
    pets.value = data
  } finally { loading.value = false }
}

onMounted(load)

async function doLogout() {
  await auth.logout()
  router.replace('/login')
}
</script>

<style scoped>
.filter-strip {
  display: flex;
  gap: 8px;
  padding: 8px 16px 12px;
  overflow-x: auto;
  overflow-y: hidden;
  flex-wrap: nowrap;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.filter-strip::-webkit-scrollbar {
  display: none;
}

.filter-chip {
  flex: 0 0 auto;
  white-space: nowrap;
  font-size: 0.9rem;
  --padding-start: 14px;
  --padding-end: 14px;
  min-height: 42px;
}
</style>
