<template>
  <div class="container py-4">
    <h4 class="fw-bold mb-3">Explore</h4>
    <div class="d-flex gap-2 mb-4 flex-wrap">
      <button v-for="t in types" :key="t"
              class="btn btn-sm" :class="filter === t ? 'btn-primary' : 'btn-outline-secondary'"
              @click="setFilter(t)">
        {{ t }}
      </button>
    </div>
    <div v-if="feedStore.loading" class="text-center py-5">
      <div class="spinner-border text-primary"></div>
    </div>
    <div v-else class="row g-3">
      <div class="col-6 col-md-4 col-lg-3" v-for="post in feedStore.posts" :key="post._id">
        <div class="position-relative rounded overflow-hidden" style="aspect-ratio:1;cursor:pointer">
          <img :src="fileUrl(post.mediaUrl)" class="w-100 h-100" style="object-fit:cover" />
          <div class="position-absolute bottom-0 start-0 end-0 p-2 bg-dark bg-opacity-50 text-white small">
            <i class="bi bi-heart-fill me-1 text-danger"></i>{{ post.likeCount }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useFeedStore }   from '@shared/stores/feed.js'
import { fileUrl }        from '@shared/utils/formatters.js'

const feedStore = useFeedStore()
const filter    = ref('pawpost')
const types     = ['pawpost', 'story']

async function setFilter(t) {
  filter.value = t
  await feedStore.fetchExplore(t)
}

onMounted(() => feedStore.fetchExplore('pawpost'))
</script>
