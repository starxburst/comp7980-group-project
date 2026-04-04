<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup>
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import { useAuthStore } from '@shared/stores/auth.js'
import { onMounted }    from 'vue'

const auth = useAuthStore()
onMounted(() => auth.init())
</script>
