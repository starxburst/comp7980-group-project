<template>
  <div class="container py-4" style="max-width:560px">
    <h4 class="fw-bold mb-4">Create Story</h4>
    <p class="text-muted small">Stories expire after 24 hours.</p>
    <form @submit.prevent="submit">
      <div class="mb-3">
        <label class="form-label">Photo *</label>
        <input type="file" class="form-control" accept="image/*" @change="onMedia" required />
        <img v-if="preview" :src="preview" class="mt-2 rounded w-100" style="max-height:400px;object-fit:cover" />
      </div>
      <div class="mb-3">
        <label class="form-label">Caption</label>
        <input v-model="caption" class="form-control" placeholder="Add a caption…" />
      </div>
      <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>
      <button type="submit" class="btn btn-primary w-100" :disabled="loading">
        <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
        Share Story
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref }       from 'vue'
import { useRouter } from 'vue-router'
import { postService } from '@shared/services/postService.js'

const router  = useRouter()
const caption = ref('')
const preview = ref('')
const error   = ref('')
const loading = ref(false)
let mediaFile = null

function onMedia(e) {
  mediaFile = e.target.files[0]
  if (mediaFile) preview.value = URL.createObjectURL(mediaFile)
}

async function submit() {
  if (!mediaFile) { error.value = 'Please select an image'; return }
  loading.value = true
  error.value   = ''
  const fd = new FormData()
  fd.append('media', mediaFile)
  fd.append('type',  'story')
  fd.append('caption', caption.value)
  try {
    await postService.create(fd)
    router.push('/feed')
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed to create story'
  } finally {
    loading.value = false
  }
}
</script>
