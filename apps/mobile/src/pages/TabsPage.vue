<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="feed" href="/tabs/feed">
          <ion-icon :icon="home" />
          <ion-label>Home</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="create" href="/tabs/create">
          <ion-icon :icon="addCircle" />
          <ion-label>Post</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="adopt" href="/tabs/adopt">
          <ion-icon :icon="heart" />
          <ion-label>Adopt</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="events" href="/tabs/events">
          <ion-icon :icon="calendar" />
          <ion-label>Events</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="profile" href="/tabs/profile">
          <ion-icon :icon="person" />
          <ion-label>Profile</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup>
import {
  IonPage, IonTabs, IonTabBar, IonTabButton,
  IonRouterOutlet, IonIcon, IonLabel,
} from '@ionic/vue'
import { home, addCircle, heart, person, calendar } from 'ionicons/icons'
</script>
