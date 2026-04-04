<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/adopt" />
        </ion-buttons>
        <ion-title slot="start">{{ pet?.name || 'Pet Detail' }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div v-if="loading" class="ion-text-center ion-padding"><ion-spinner name="crescent" /></div>
      <div v-else-if="pet">

        <!-- Photo -->
        <img v-if="pet.photos?.[0]" :src="fileUrl(pet.photos[0])"
             style="width:100%;max-height:320px;object-fit:cover" />

        <!-- Main info card -->
        <ion-card>
          <ion-card-header>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <ion-card-title>{{ pet.name }}</ion-card-title>
              <ion-badge :color="pet.adoptionStatus === 'available' ? 'success'
                                : pet.adoptionStatus === 'pending'   ? 'warning'
                                : 'medium'">
                {{ pet.adoptionStatus }}
              </ion-badge>
            </div>
            <ion-card-subtitle>{{ pet.species }} · {{ pet.breed || 'Mixed' }}</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>

            <!-- Adopted by banner -->
            <div v-if="pet.adoptionStatus === 'adopted' && pet.adoptedBy"
                 style="background:var(--ion-color-success-tint);border-radius:8px;padding:10px 12px;margin-bottom:12px;display:flex;align-items:center;gap:8px">
              <ion-icon :icon="heartCircle" color="danger" />
              <span style="font-size:.85rem">
                Adopted by <strong>{{ pet.adoptedBy.name }}</strong>
              </span>
            </div>

            <!-- Shelter / owner info -->
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
              <ion-avatar style="width:28px;height:28px">
                <img :src="fileUrl(pet.ownerId?.avatar, 'avatar') || '/avatar-placeholder.png'" />
              </ion-avatar>
              <span style="font-size:.82rem;color:var(--ion-color-medium)">{{ pet.ownerId?.name }}</span>
              <span v-if="pet.adoptionContactEmail"
                    style="font-size:.78rem;color:var(--ion-color-medium)">
                · {{ pet.adoptionContactEmail }}
              </span>
            </div>

            <!-- Details grid -->
            <ion-grid class="ion-no-padding ion-margin-bottom">
              <ion-row>
                <ion-col size="6" v-for="d in petDetails" :key="d.label">
                  <div class="detail-cell">
                    <div class="detail-label">{{ d.label }}</div>
                    <div class="detail-value">{{ d.value }}</div>
                  </div>
                </ion-col>
              </ion-row>
            </ion-grid>

            <!-- Personality tags -->
            <div v-if="pet.personality?.length"
                 style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">
              <ion-chip v-for="t in pet.personality" :key="t" outline color="primary">{{ t }}</ion-chip>
            </div>

            <!-- Description -->
            <p style="color:var(--ion-color-medium);white-space:pre-wrap;margin-bottom:0">
              {{ pet.description || 'No description provided.' }}
            </p>
          </ion-card-content>
        </ion-card>

        <!-- CTA -->
        <div class="ion-padding-horizontal ion-padding-bottom">
          <div v-if="pet.adoptionStatus === 'available' && !applied && !isOwnAdoptionListing">
            <ion-button expand="block" @click="showForm = true">
              <ion-icon :icon="heart" slot="start" />
              Apply to Adopt {{ pet.name }}
            </ion-button>
          </div>
          <div v-else-if="pet.adoptionStatus === 'available' && isOwnAdoptionListing">
            <ion-note color="primary" style="display:block;text-align:center;padding:12px">
              This is your own adoption listing.
            </ion-note>
          </div>
          <div v-else-if="pet.adoptionStatus === 'pending'">
            <ion-note color="warning" style="display:block;text-align:center;padding:12px">
              Applications are under review. Check back soon.
            </ion-note>
          </div>
          <div v-else-if="pet.adoptionStatus === 'adopted'">
            <ion-note color="medium" style="display:block;text-align:center;padding:12px">
              This pet has already found a home.
            </ion-note>
          </div>
          <div v-else-if="applied">
            <ion-note color="success" style="display:block;text-align:center;padding:12px">
              ✓ Application submitted!
            </ion-note>
          </div>
        </div>

        <!-- Application form -->
        <ion-card v-if="showForm">
          <ion-card-header><ion-card-title>Adoption Application</ion-card-title></ion-card-header>
          <ion-card-content>
            <ion-item>
              <ion-label position="stacked">Your contact email *</ion-label>
              <ion-input v-model="appForm.contactEmail" type="email"
                         placeholder="The shelter will reach out here" />
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Home Type</ion-label>
              <ion-input v-model="appForm.homeType"
                         placeholder="e.g. apartment, house with yard, condo…" />
            </ion-item>
            <ion-item>
              <ion-label>I currently have other pets</ion-label>
              <ion-checkbox v-model="appForm.hasOtherPets" slot="end" />
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Why do you want to adopt {{ pet.name }}?</ion-label>
              <ion-textarea v-model="appForm.reason" rows="4"
                            placeholder="Tell us a bit about yourself…" />
            </ion-item>
            <ion-text v-if="appError" color="danger"><p>{{ appError }}</p></ion-text>
            <div style="display:flex;gap:8px;margin-top:12px">
              <ion-button fill="outline" @click="showForm = false">Cancel</ion-button>
              <ion-button @click="submitApp" :disabled="submitting">
                <ion-spinner v-if="submitting" name="crescent" slot="start" />Submit
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>

      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter }       from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons,
  IonBackButton, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle,
  IonCardContent, IonChip, IonBadge, IonButton, IonItem, IonLabel,
  IonInput, IonCheckbox, IonTextarea, IonSpinner, IonText, IonNote,
  IonGrid, IonRow, IonCol, IonIcon, IonAvatar,
} from '@ionic/vue'
import { heart, heartCircle } from 'ionicons/icons'
import { adoptService } from '@shared/services/adoptService.js'
import { useAuthStore } from '@shared/stores/auth.js'
import { fileUrl } from '@shared/utils/formatters.js'

const route      = useRoute()
const router     = useRouter()
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
    { label: 'Sex',     value: p.sex ? p.sex.charAt(0).toUpperCase() + p.sex.slice(1) : 'Unknown' },
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
  if (!appForm.value.contactEmail) {
    appError.value = 'Contact email is required.'
    return
  }
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

<style scoped>
.detail-cell {
  background: var(--ion-color-light);
  border-radius: 8px;
  padding: 8px;
  margin: 4px;
}
.detail-label { font-size: .72rem; color: var(--ion-color-medium); }
.detail-value { font-size: .9rem; font-weight: 600; }
</style>
