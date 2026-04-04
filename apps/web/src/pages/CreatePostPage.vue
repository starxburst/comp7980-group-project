<template>
  <div class="container py-4" style="max-width:560px">
    <h4 class="fw-bold mb-4">Create Post</h4>
    <form @submit.prevent="submit">
      <div class="mb-3">
        <label class="form-label">Type</label>
        <div class="d-flex gap-2">
          <button type="button" v-for="t in ['pawpost','story']" :key="t"
                  class="btn btn-sm" :class="form.type === t ? 'btn-primary' : 'btn-outline-secondary'"
                  @click="form.type = t">{{ t }}</button>
        </div>
      </div>
      <div class="mb-3">
        <label class="form-label">Pet (optional)</label>
        <select v-model="form.petId" class="form-select">
          <option value="">— No pet tag —</option>
          <option v-for="p in petsStore.myPets" :key="p._id" :value="p._id">{{ p.name }}</option>
        </select>
      </div>
      <div class="mb-3">
        <label class="form-label">Media *</label>
        <input type="file" class="form-control" accept="image/*,video/mp4" @change="onMedia" required />
        <img v-if="preview" :src="preview" class="mt-2 rounded w-100" style="max-height:300px;object-fit:cover" />
      </div>
      <div class="mb-3">
        <label class="form-label">Caption</label>
        <textarea v-model="form.caption" class="form-control" rows="3" placeholder="Write a caption…"></textarea>
      </div>
      <div class="mb-3 form-check">
        <input v-model="form.adoptionBadge" type="checkbox" class="form-check-input" id="adoptBadge" />
        <label class="form-check-label" for="adoptBadge">Tag as adoptable</label>
      </div>
      <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>
      <button type="submit" class="btn btn-primary w-100" :disabled="loading">
        <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
        Share
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter }      from 'vue-router'
import { usePetsStore }   from '@shared/stores/pets.js'
import { postService }    from '@shared/services/postService.js'

const router    = useRouter()
const petsStore = usePetsStore()
const form      = ref({ type: 'pawpost', petId: '', caption: '', adoptionBadge: false })
const error     = ref('')
const loading   = ref(false)
const preview   = ref('')
let mediaFile   = null

onMounted(() => petsStore.fetchMyPets())

function onMedia(e) {
  mediaFile = e.target.files[0]
  if (mediaFile) preview.value = URL.createObjectURL(mediaFile)
}

async function submit() {
  if (!mediaFile) { error.value = 'Please select a media file'; return }
  loading.value = true
  error.value   = ''
  const fd = new FormData()
  fd.append('media', mediaFile)
  Object.entries(form.value).forEach(([k, v]) => fd.append(k, v))
  try {
    await postService.create(fd)
    router.push('/feed')
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed to create post'
  } finally {
    loading.value = false
  }
}
</script>
