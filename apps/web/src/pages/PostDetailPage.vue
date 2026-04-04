<template>
  <div class="container py-4 post-detail-page">
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary"></div>
    </div>
    <div v-else-if="post">
      <button class="post-detail-page__back btn btn-link ps-0 mb-3" @click="router.back()">
        <i class="bi bi-arrow-left me-1"></i>Back
      </button>

      <PostCard
        :post="post"
        :interactive="false"
        :show-open-action="false"
        @like="toggleLike"
      />

      <div class="card post-detail-page__comments">
        <div class="card-body p-4">
          <h6 class="fw-semibold mb-3">Comments</h6>
          <div class="d-flex gap-2 mb-4">
            <input
              v-model="commentText"
              class="form-control post-detail-page__input"
              placeholder="Leave a comment..."
              @keyup.enter="submitComment"
            />
            <button class="btn btn-primary" :disabled="submittingComment || !commentText.trim()" @click="submitComment">
              Post
            </button>
          </div>

          <div v-if="!post.comments?.length" class="text-muted small">No comments yet.</div>
          <div v-for="comment in post.comments" :key="comment._id" class="post-detail-page__comment">
            <div class="d-flex align-items-center gap-2 mb-2">
              <img :src="fileUrl(comment.author?.avatar, 'avatar')"
                   @error="event => onImageError(event, 'avatar')"
                   class="avatar-sm" />
              <strong class="small">{{ comment.author?.name }}</strong>
              <span class="text-muted small">{{ formatDateTime(comment.createdAt) }}</span>
            </div>
            <p class="mb-0">{{ comment.content }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { postService } from '@shared/services/postService.js'
import { fileUrl, formatDateTime, onImageError } from '@shared/utils/formatters.js'
import PostCard from '../components/PostCard.vue'

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

async function toggleLike(postId) {
  const { data } = await postService.like(postId)
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
