<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div style="max-width:400px;margin:auto;padding-top:32px">
        <h3 class="ion-text-center">Create Account</h3>
        <ion-card>
          <ion-card-content>
            <ion-item>
              <ion-label position="stacked">Name</ion-label>
              <ion-input v-model="form.name" />
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Email</ion-label>
              <ion-input v-model="form.email" type="email" />
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Password</ion-label>
              <ion-input v-model="form.password" type="password" />
            </ion-item>
            <ion-item class="ion-margin-bottom">
              <ion-label position="stacked">Account Type</ion-label>
              <ion-select v-model="form.role">
                <ion-select-option value="owner">Pet Owner</ion-select-option>
                <ion-select-option value="shelter_staff">Shelter Staff</ion-select-option>
              </ion-select>
            </ion-item>
            <ion-text v-if="error" color="danger"><p class="ion-margin-start">{{ error }}</p></ion-text>
            <ion-button expand="block" @click="submit" :disabled="loading">
              <ion-spinner v-if="loading" name="crescent" slot="start" />
              Register
            </ion-button>
            <ion-button expand="block" fill="clear" router-link="/login">
              Already have an account?
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
  IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
  IonButton, IonSpinner, IonText,
} from '@ionic/vue'
import { useAuthStore } from '@shared/stores/auth.js'
import { authService }  from '@shared/services/authService.js'

const router  = useRouter()
const auth    = useAuthStore()
const form    = ref({ name: '', email: '', password: '', role: 'owner' })
const error   = ref('')
const loading = ref(false)

async function submit() {
  error.value   = ''
  loading.value = true
  try {
    const { data } = await authService.register(form.value)
    await auth.setAuth(data.token, data.user)
    router.replace('/tabs/feed')
  } catch (e) {
    error.value = e.response?.data?.message || 'Registration failed'
  } finally {
    loading.value = false
  }
}
</script>
