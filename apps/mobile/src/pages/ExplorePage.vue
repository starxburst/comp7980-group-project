<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title slot="start">Explore</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-segment v-model="filter" @ionChange="load" class="ion-padding-horizontal ion-padding-top">
        <ion-segment-button value="pawpost"><ion-label>Posts</ion-label></ion-segment-button>
        <ion-segment-button value="story"><ion-label>Stories</ion-label></ion-segment-button>
      </ion-segment>
      <div v-if="loading" class="ion-text-center ion-padding"><ion-spinner name="crescent" /></div>
      <div v-else style="display:grid;grid-template-columns:repeat(3,1fr);gap:2px;padding:2px">
        <div v-for="post in posts" :key="post._id" style="aspect-ratio:1;overflow:hidden">
          <img :src="fileUrl(post.mediaUrl)" style="width:100%;height:100%;object-fit:cover" />
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonSegment, IonSegmentButton, IonLabel, IonSpinner,
} from '@ionic/vue'
import { postService } from '@shared/services/postService.js'
import { fileUrl } from '@shared/utils/formatters.js'

const filter  = ref('pawpost')
const posts   = ref([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const { data } = await postService.explore(filter.value)
    posts.value = data
  } finally { loading.value = false }
}

onMounted(load)
</script>
