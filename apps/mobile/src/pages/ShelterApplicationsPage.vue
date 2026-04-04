<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/profile" />
        </ion-buttons>
        <ion-title slot="start">Applications</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="ion-padding">
        <ion-item>
          <ion-select v-model="filters.status" label="Status" label-placement="stacked">
            <ion-select-option value="">All statuses</ion-select-option>
            <ion-select-option value="pending">pending</ion-select-option>
            <ion-select-option value="reviewing">reviewing</ion-select-option>
            <ion-select-option value="approved">approved</ion-select-option>
            <ion-select-option value="rejected">rejected</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item class="ion-margin-top">
          <ion-input v-model="filters.pet" label="Pet" label-placement="stacked" placeholder="Search pet name" />
        </ion-item>
        <div class="d-flex gap-2 ion-margin-top" style="display:flex">
          <ion-button @click="applyFilters" :disabled="loading">Filter</ion-button>
          <ion-button fill="outline" @click="resetFilters" :disabled="loading">Reset</ion-button>
        </div>
      </div>

      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner name="crescent" />
      </div>
      <div v-else-if="!apps.length" class="ion-text-center ion-padding" style="color:var(--ion-color-medium)">
        No applications yet.
      </div>
      <div v-else class="ion-padding pt-0">
        <ion-card v-for="app in apps" :key="app._id">
          <ion-card-content>
            <div class="d-flex align-items-start justify-content-between gap-3" style="display:flex">
              <div class="d-flex align-items-center gap-3" style="display:flex">
                <img
                  :src="fileUrl(app.pet?.photos?.[0], 'pet')"
                  width="52"
                  height="52"
                  class="rounded-3"
                  style="object-fit:cover"
                />
                <div>
                  <div class="fw-semibold">{{ app.pet?.name }}</div>
                  <div class="small text-muted">{{ app.applicant?.name || 'Unknown applicant' }}</div>
                </div>
              </div>
              <span class="badge" :class="applicationBadgeClass(app.status)">
                {{ app.status }}
              </span>
            </div>

            <div class="shelter-application-meta ion-margin-top">
              <div>
                <div class="shelter-application-label">Home</div>
                <div>{{ app.applicantInfo?.homeType || '—' }}</div>
              </div>
              <div>
                <div class="shelter-application-label">Pet status</div>
                <span class="badge" :class="petBadgeClass(app.pet?.adoptionStatus)">
                  {{ app.pet?.adoptionStatus }}
                </span>
              </div>
              <div>
                <div class="shelter-application-label">Contact</div>
                <a v-if="app.contactEmail" :href="`mailto:${app.contactEmail}`" class="small">
                  {{ app.contactEmail }}
                </a>
                <span v-else class="text-muted">—</span>
              </div>
            </div>

            <div class="ion-margin-top">
              <div class="shelter-application-label">Reason</div>
              <div class="small text-muted">{{ app.applicantInfo?.reason || '—' }}</div>
            </div>

            <div class="d-flex gap-2 flex-wrap ion-margin-top" style="display:flex">
              <ion-button
                size="small"
                fill="outline"
                color="tertiary"
                :disabled="app.status !== 'pending' || savingId === app._id"
                @click="updateStatus(app, 'reviewing')"
              >
                Review
              </ion-button>
              <ion-button
                size="small"
                color="success"
                :disabled="app.status === 'approved' || app.status === 'rejected' || savingId === app._id"
                @click="updateStatus(app, 'approved')"
              >
                Approve
              </ion-button>
              <ion-button
                size="small"
                color="danger"
                :disabled="app.status === 'approved' || app.status === 'rejected' || savingId === app._id"
                @click="updateStatus(app, 'rejected')"
              >
                Reject
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>

        <div v-if="totalPages > 1" class="d-flex justify-content-between align-items-center ion-margin-top" style="display:flex">
          <small style="color:var(--ion-color-medium)">Page {{ page }} of {{ totalPages }}</small>
          <div class="d-flex gap-2" style="display:flex">
            <ion-button size="small" fill="outline" :disabled="page <= 1 || loading" @click="goToPage(page - 1)">
              Previous
            </ion-button>
            <ion-button size="small" fill="outline" :disabled="page >= totalPages || loading" @click="goToPage(page + 1)">
              Next
            </ion-button>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import {
  IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
  IonContent, IonItem, IonSelect, IonSelectOption, IonInput, IonButton,
  IonSpinner, IonCard, IonCardContent,
} from '@ionic/vue'
import { adoptService } from '@shared/services/adoptService.js'
import { fileUrl } from '@shared/utils/formatters.js'

const apps = ref([])
const loading = ref(true)
const savingId = ref('')
const page = ref(1)
const limit = ref(6)
const totalPages = ref(1)
const filters = ref({ status: '', pet: '' })

function petBadgeClass(status) {
  return {
    available: 'bg-success',
    pending: 'bg-warning text-dark',
    adopted: 'bg-secondary',
  }[status] || 'bg-light text-dark'
}

function applicationBadgeClass(status) {
  return {
    pending: 'bg-warning text-dark',
    reviewing: 'bg-info text-dark',
    approved: 'bg-success',
    rejected: 'bg-danger',
  }[status] || 'bg-light text-dark'
}

onMounted(loadApps)

async function loadApps() {
  loading.value = true
  try {
    const { data } = await adoptService.staffList({
      page: page.value,
      limit: limit.value,
      status: filters.value.status || undefined,
      pet: filters.value.pet || undefined,
    })
    apps.value = data.data
    totalPages.value = data.meta.totalPages
    page.value = data.meta.page
  } finally {
    loading.value = false
  }
}

async function applyFilters() {
  page.value = 1
  await loadApps()
}

async function resetFilters() {
  filters.value = { status: '', pet: '' }
  page.value = 1
  await loadApps()
}

async function goToPage(nextPage) {
  if (nextPage < 1 || nextPage > totalPages.value) return
  page.value = nextPage
  await loadApps()
}

async function updateStatus(app, status) {
  savingId.value = app._id
  try {
    const { data } = await adoptService.updateStatus(app._id, { status })
    const idx = apps.value.findIndex(item => item._id === app._id)
    if (idx === -1) return
    apps.value[idx] = { ...apps.value[idx], status: data.status }
    if (status === 'approved' && apps.value[idx].pet)
      apps.value[idx].pet.adoptionStatus = 'adopted'
  } finally {
    savingId.value = ''
  }
}
</script>

<style scoped>
.shelter-application-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem 1rem;
}

.shelter-application-label {
  color: var(--ion-color-medium);
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 0.2rem;
}

@media (max-width: 420px) {
  .shelter-application-meta {
    grid-template-columns: 1fr;
  }
}
</style>
