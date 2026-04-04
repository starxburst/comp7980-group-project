<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div style="max-width:400px;margin:auto;padding-top:64px">
        <h2 class="ion-text-center" style="color:var(--ion-color-primary)">
          Petstagram
        </h2>
        <ion-card>
          <ion-card-content>
            <ion-item>
              <ion-label position="stacked">Email</ion-label>
              <ion-input v-model="form.email" type="email" />
            </ion-item>
            <ion-item class="ion-margin-bottom">
              <ion-label position="stacked">Password</ion-label>
              <ion-input v-model="form.password" type="password" />
            </ion-item>
            <ion-text v-if="error" color="danger"><p class="ion-margin-start">{{ error }}</p></ion-text>
            <ion-button expand="block" @click="submit" :disabled="loading">
              <ion-spinner v-if="loading" name="crescent" slot="start" />
              Log In
            </ion-button>
            <ion-button expand="block" fill="clear" router-link="/register">
              Create Account
            </ion-button>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage, IonContent, IonCard, IonCardContent,
  IonItem, IonLabel, IonInput, IonButton, IonSpinner, IonText,
} from '@ionic/vue'
import { useAuthStore }  from '@shared/stores/auth.js'
import { authService }   from '@shared/services/authService.js'

const router  = useRouter()
const auth    = useAuthStore()
const form    = ref({ email: '', password: '' })
const error   = ref('')
const loading = ref(false)

async function submit() {
  error.value   = ''
  loading.value = true
  try {
    const { data } = await authService.login(form.value)
    await auth.setAuth(data.token, data.user)
    router.replace('/tabs/feed')
  } catch (e) {
    error.value = e.response?.data?.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>
