<template>
  <div class="d-flex flex-column align-items-center gap-1" style="cursor:pointer" @click="$emit('click', story)">
    <div class="story-ring">
      <img :src="fileUrl(story.author?.avatar) || '/avatar-placeholder.png'"
           class="rounded-circle" width="56" height="56" style="object-fit:cover" />
    </div>
    <span class="small text-truncate" style="max-width:64px;font-size:.7rem">{{ story.author?.name }}</span>
  </div>
</template>

<script setup>
import { fileUrl } from '@shared/utils/formatters.js'

defineProps({ story: { type: Object, required: true } })
defineEmits(['click'])
</script>
