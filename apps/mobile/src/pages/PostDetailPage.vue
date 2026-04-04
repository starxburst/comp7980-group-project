<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/feed" />
        </ion-buttons>
        <ion-title slot="start">Post</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner name="crescent" />
      </div>
      <template v-else-if="post">
        <ion-card class="ion-margin">
          <div class="ion-padding-horizontal ion-padding-top" style="display:flex;align-items:center;gap:8px">
            <ion-avatar style="width:36px;height:36px">
              <img :src="fileUrl(post.author?.avatar, 'avatar')" @error="event => onImageError(event, 'avatar')" />
            </ion-avatar>
            <div>
              <strong>{{ post.author?.name }}</strong><br />
              <small v-if="post.pet?.name" style="color:#f0b27a;display:block">{{ post.pet.name }}</small>
              <small style="color:gray">{{ formatDateTime(post.createdAt) }}</small>
            </div>
          </div>
          <img v-if="!post.mediaUrl?.endsWith('.mp4')" :src="fileUrl(post.mediaUrl, 'post')"
               style="width:100%;max-height:400px;object-fit:cover" />
          <ion-card-content>
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
              <ion-button fill="clear" size="small" @click="toggleLike">
                <ion-icon :icon="heart" slot="start" :color="post.isLiked ? 'danger' : 'medium'" />
                {{ post.likeCount }}
              </ion-button>
            </div>
            <p v-if="post.caption"><strong>{{ post.author?.name }}</strong> {{ post.caption }}</p>
          </ion-card-content>
        </ion-card>

        <ion-card class="ion-margin">
          <ion-card-header>
            <ion-card-title>Comments</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-item>
              <ion-input
                v-model="commentText"
                placeholder="Leave a comment..."
                @keyup.enter="submitComment"
              />
              <ion-button slot="end" :disabled="submittingComment || !commentText.trim()" @click="submitComment">
                Post
              </ion-button>
            </ion-item>

            <ion-item v-if="!post.comments?.length">
              <ion-label color="medium">No comments yet.</ion-label>
            </ion-item>

            <ion-item v-for="comment in post.comments" :key="comment._id">
              <ion-avatar slot="start">
                <img :src="fileUrl(comment.author?.avatar, 'avatar')" @error="event => onImageError(event, 'avatar')" />
              </ion-avatar>
              <ion-label>
                <h3>{{ comment.author?.name }}</h3>
                <p>{{ comment.content }}</p>
                <p>{{ formatDateTime(comment.createdAt) }}</p>
              </ion-label>
            </ion-item>
          </ion-card-content>
        </ion-card>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons,
  IonBackButton, IonContent, IonSpinner, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonAvatar, IonButton, IonIcon, IonItem, IonInput, IonLabel,
} from '@ionic/vue'
import { heart } from 'ionicons/icons'
import { postService } from '@shared/services/postService.js'
import { fileUrl, formatDateTime, onImageError } from '@shared/utils/formatters.js'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const submittingComment = ref(false)
const commentText = ref('')
const post = ref(null)

onMounted(loadPost)

async function loadPost() {
  loading.value = true
  try {
    const { data } = await postService.getOne(route.params.id)
    post.value = data
  } finally {
    loading.value = false
  }
}

async function toggleLike() {
  const { data } = await postService.like(post.value._id)
  post.value.likeCount = data.likeCount
  post.value.isLiked = data.isLiked
}

async function submitComment() {
  const content = commentText.value.trim()
  if (!content) return

  submittingComment.value = true
  try {
    const { data } = await postService.comment(post.value._id, { content })
    post.value.comments.push(data)
    commentText.value = ''
  } finally {
    submittingComment.value = false
  }
}

</script>
