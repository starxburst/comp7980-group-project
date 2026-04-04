<template>
  <article
    class="post-card card mb-4"
    :class="{ 'post-card--interactive': interactive }"
    @click="interactive && $emit('open', post._id)"
  >
    <div class="post-card__header card-header border-0 d-flex align-items-center gap-3">
      <img :src="fileUrl(post.author?.avatar, 'avatar')"
           @error="event => onImageError(event, 'avatar')"
           class="avatar-sm" :alt="post.author?.name" />
      <div class="flex-grow-1">
        <div
          class="fw-semibold small text-white post-card__author-name"
          @click.stop="router.push(`/profile/${post.author?._id}`)"
        >{{ post.author?.name }}</div>
        <div class="text-secondary small d-flex align-items-center gap-2 flex-wrap">
          <span v-if="post.pet?.name" class="post-card__pet">
            <i class="bi bi-paw-fill"></i>
            {{ post.pet.name }}
          </span>
          <span>{{ timeAgo(post.createdAt) }}</span>
        </div>
      </div>
      <span v-if="post.adoptionBadge" class="post-card__badge badge">
        <i class="bi bi-heart-fill"></i> Adoptable
      </span>
    </div>

    <video v-if="post.mediaUrl?.endsWith('.mp4')" :src="fileUrl(post.mediaUrl, 'post')" controls class="post-card__media"></video>
    <img v-else :src="fileUrl(post.mediaUrl, 'post')" :alt="post.caption" loading="lazy" class="post-card__media" />

    <div class="card-body post-card__body">
      <div class="d-flex align-items-center gap-3 flex-wrap mb-3">
        <button class="post-card__action btn btn-sm btn-link p-0 d-flex align-items-center gap-2"
                @click.stop="$emit('like', post._id)">
          <i class="bi fs-5" :class="post.isLiked ? 'bi-heart-fill text-danger' : 'bi-heart text-secondary'"></i>
          <span>{{ post.likeCount }}</span>
        </button>
        <button
          v-if="showOpenAction"
          class="post-card__action btn btn-sm btn-link p-0 d-flex align-items-center gap-2"
          @click.stop="$emit('open', post._id)"
        >
          <i class="bi bi-box-arrow-up-right text-secondary"></i>
          <span>Open</span>
        </button>
        <button
          v-if="showCommentAction"
          class="post-card__action btn btn-sm btn-link p-0 d-flex align-items-center gap-2"
          @click.stop="$emit('open', post._id)"
        >
          <i class="bi bi-chat text-secondary"></i>
          <span>Comments</span>
        </button>
      </div>

      <p v-if="post.caption" class="post-card__caption mb-0">
        <strong
          class="post-card__author-name"
          @click.stop="router.push(`/profile/${post.author?._id}`)"
        >{{ post.author?.name }}</strong> {{ post.caption }}
      </p>
    </div>
  </article>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { fileUrl, onImageError, timeAgo } from '@shared/utils/formatters.js'

const router = useRouter()

defineProps({
  post: { type: Object, required: true },
  interactive: { type: Boolean, default: true },
  showOpenAction: { type: Boolean, default: true },
  showCommentAction: { type: Boolean, default: true },
})

defineEmits(['like', 'open'])
</script>
