<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="feed" href="/tabs/feed" :class="{ 'tab-active': activeTab === 'feed' }">
          <ion-icon :icon="home" />
          <ion-label>Home</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="explore" href="/tabs/explore" :class="{ 'tab-active': activeTab === 'explore' }">
          <ion-icon :icon="search" />
          <ion-label>Explore</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="create" href="/tabs/create" :class="{ 'tab-active': activeTab === 'create' }">
          <ion-icon :icon="addCircle" />
          <ion-label>Post</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="adopt" href="/tabs/adopt" :class="{ 'tab-active': activeTab === 'adopt' }">
          <ion-icon :icon="heart" />
          <ion-label>Adopt</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="events" href="/tabs/events" :class="{ 'tab-active': activeTab === 'events' }">
          <ion-icon :icon="calendar" />
          <ion-label>Events</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="profile" href="/tabs/profile" :class="{ 'tab-active': activeTab === 'profile' }">
          <ion-icon :icon="person" />
          <ion-label>Profile</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  IonPage, IonTabs, IonTabBar, IonTabButton,
  IonRouterOutlet, IonIcon, IonLabel,
} from '@ionic/vue'
import { home, search, addCircle, heart, person, calendar } from 'ionicons/icons'

const route = useRoute()

const activeTab = computed(() => {
  const path = route.path
  if (path.startsWith('/tabs/explore')) return 'explore'
  if (path.startsWith('/tabs/create')) return 'create'
  if (path.startsWith('/tabs/adopt')) return 'adopt'
  if (path.startsWith('/tabs/events')) return 'events'
  if (path.startsWith('/tabs/profile')) return 'profile'
  return 'feed'
})
</script>

<style scoped>
.tab-active {
  color: var(--ion-color-primary);
}

.tab-active ion-icon,
.tab-active ion-label {
  color: var(--ion-color-primary);
}
</style>
