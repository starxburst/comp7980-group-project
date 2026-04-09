<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title slot="start">Petstagram</ion-title>
        <ion-buttons slot="end">
          <ion-button color="light" aria-label="Events" @click="router.push('/tabs/events')">
            <ion-icon slot="icon-only" :icon="calendarOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="refresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      <div v-if="feedStore.loading" class="ion-text-center ion-padding">
        <ion-spinner name="crescent" />
      </div>
      <ion-item v-else-if="feedStore.error">
        <ion-label color="danger">{{ feedStore.error }}</ion-label>
      </ion-item>
      <div v-else-if="!feedStore.posts.length" class="ion-text-center ion-padding">
        <ion-icon :icon="cameraOutline" size="large" color="medium" />
        <p>No posts yet. Check back after more pets share updates.</p>
      </div>
      <div v-else>
        <ion-card v-for="post in feedStore.posts" :key="post._id" class="ion-margin-bottom">
          <div class="ion-padding-horizontal ion-padding-top d-flex" style="display:flex;align-items:center;gap:8px">
            <ion-avatar style="width:36px;height:36px">
              <img :src="fileUrl(post.author?.avatar, 'avatar')" @error="event => onImageError(event, 'avatar')" />
            </ion-avatar>
            <div>
              <strong>{{ post.author?.name }}</strong><br />
              <small v-if="post.pet?.name" style="color:#f0b27a;display:block">{{ post.pet.name }}</small>
              <small style="color:gray">{{ timeAgo(post.createdAt) }}</small>
            </div>
          </div>
          <img v-if="!post.mediaUrl?.endsWith('.mp4')" :src="fileUrl(post.mediaUrl, 'post')"
               style="width:100%;max-height:400px;object-fit:cover" />
          <ion-card-content>
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
              <ion-button fill="clear" size="small" @click.stop="toggleLike(post)">
                <ion-icon :icon="heart" slot="start" :color="post.isLiked ? 'danger' : 'medium'" />
                {{ post.likeCount }}
              </ion-button>
              <ion-button fill="clear" size="small" @click.stop="openPost(post._id)">
                <ion-icon :icon="openOutline" slot="start" color="medium" />
                Open
              </ion-button>
              <ion-button fill="clear" size="small" @click.stop="openPost(post._id)">
                <ion-icon :icon="chatbubbleOutline" slot="start" color="medium" />
                Comments
              </ion-button>
            </div>
            <p v-if="post.caption"><strong>{{ post.author?.name }}</strong> {{ post.caption }}</p>
          </ion-card-content>
        </ion-card>
        <ion-infinite-scroll
          @ionInfinite="loadMore"
          :disabled="feedStore.loadingMore || !feedStore.hasMore"
        >
          <ion-infinite-scroll-content loading-spinner="crescent" loading-text="Loading more posts…" />
        </ion-infinite-scroll>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardContent, IonAvatar, IonButton, IonIcon, IonButtons,
  IonBadge, IonSpinner, IonRefresher, IonRefresherContent, IonLabel, IonItem,
  IonInfiniteScroll, IonInfiniteScrollContent,
} from '@ionic/vue'
import { heart, cameraOutline, chatbubbleOutline, openOutline, calendarOutline } from 'ionicons/icons'
import { useFeedStore } from '@shared/stores/feed.js'
import { fileUrl, onImageError, timeAgo } from '@shared/utils/formatters.js'

const router = useRouter()
const feedStore = useFeedStore()
onMounted(() => feedStore.fetchFeed({ reset: true }))

async function refresh(event) {
  await feedStore.fetchFeed({ reset: true })
  event.target.complete()
}

async function loadMore(event) {
  await feedStore.fetchFeed({ reset: false })
  event.target.complete()
}

function openPost(postId) {
  router.push(`/posts/${postId}`)
}

async function toggleLike(post) {
  await feedStore.likePost(post._id)
}

</script>
