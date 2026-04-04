<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/feed" />
        </ion-buttons>
        <ion-title slot="start">New Post</ion-title>
        <ion-buttons slot="end">
          <ion-button aria-label="Log out" @click="doLogout">
            <ion-icon :icon="logOutOutline" slot="start" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-item>
        <ion-label position="stacked">Pet (optional)</ion-label>
        <ion-select v-model="form.petId" placeholder="Select pet">
          <ion-select-option v-for="p in petsStore.myPets" :key="p._id" :value="p._id">
            {{ p.name }}
          </ion-select-option>
        </ion-select>
      </ion-item>
      <ion-item>
        <ion-label position="stacked">Caption</ion-label>
        <ion-textarea v-model="form.caption" rows="3" placeholder="Write a caption…" />
      </ion-item>

      <div class="ion-padding-vertical">
        <ion-button expand="block" fill="outline" @click="pickPhoto">
          <ion-icon :icon="camera" slot="start" />
          {{ preview ? 'Change Photo' : 'Select Photo' }}
        </ion-button>
        <img v-if="preview" :src="preview"
             style="width:100%;max-height:300px;object-fit:cover;border-radius:8px;margin-top:8px" />
      </div>

      <ion-text v-if="error" color="danger"><p>{{ error }}</p></ion-text>
      <ion-button expand="block" @click="submit" :disabled="loading || !mediaFile">
        <ion-spinner v-if="loading" name="crescent" slot="start" />
        Share
      </ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter }      from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons,
  IonItem, IonLabel, IonSelect, IonSelectOption, IonTextarea,
  IonBackButton, IonButton, IonIcon, IonSpinner, IonText,
} from '@ionic/vue'
import { camera, logOutOutline } from 'ionicons/icons'
import { useAuthStore } from '@shared/stores/auth.js'
import { usePetsStore } from '@shared/stores/pets.js'
import { postService }  from '@shared/services/postService.js'

const router    = useRouter()
const auth      = useAuthStore()
const petsStore = usePetsStore()
const form      = ref({ petId: '', caption: '', type: 'pawpost' })
const error     = ref('')
const loading   = ref(false)
const preview   = ref('')
let mediaFile   = null

onMounted(() => petsStore.fetchMyPets())

async function pickPhoto() {
  // Web fallback: file input
  const input = document.createElement('input')
  input.type  = 'file'
  input.accept= 'image/*'
  input.onchange = e => {
    mediaFile = e.target.files[0]
    if (mediaFile) preview.value = URL.createObjectURL(mediaFile)
  }
  input.click()
}

async function submit() {
  if (!mediaFile) return
  loading.value = true
  error.value   = ''
  const fd = new FormData()
  fd.append('media', mediaFile)
  Object.entries(form.value).forEach(([k, v]) => v && fd.append(k, v))
  try {
    await postService.create(fd)
    router.replace('/tabs/feed')
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed'
  } finally {
    loading.value = false
  }
}

async function doLogout() {
  await auth.logout()
  router.replace('/login')
}
</script>
