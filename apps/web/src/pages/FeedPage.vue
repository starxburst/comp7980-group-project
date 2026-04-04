<template>
  <div class="feed-shell">
    <section class="feed-main">
      <div class="feed-pet-strip" v-if="petHighlights.length">
        <button
          v-for="pet in petHighlights"
          :key="pet.id"
          class="feed-pet-pill"
          @click="scrollToPost(pet.postId)"
        >
          <img :src="fileUrl(pet.photo, 'pet')" @error="event => onImageError(event, 'pet')" :alt="pet.name" />
          <span>{{ pet.name }}</span>
        </button>
      </div>

      <div v-if="feedStore.loading" class="text-center py-5">
          <div class="spinner-border text-primary"></div>
      </div>
      <div v-else-if="feedStore.error" class="alert alert-danger">
        {{ feedStore.error }}
      </div>
      <div v-else-if="!feedStore.posts.length" class="text-center py-5 text-muted">
        <i class="bi bi-camera fs-1 d-block mb-2"></i>
        No posts yet. Check back after more pets share updates.
      </div>
      <template v-else>
        <div
          v-for="post in feedStore.posts"
          :key="post._id"
          :ref="el => setPostRef(post._id, el)"
        >
          <PostCard
            :post="post"
            @like="feedStore.likePost"
            @open="openPost"
          />
        </div>
        <div ref="loadMoreSentinel" class="py-3 text-center text-muted small">
          <div v-if="feedStore.loadingMore" class="spinner-border spinner-border-sm text-primary"></div>
          <span v-else-if="feedStore.hasMore">Loading more posts…</span>
          <span v-else>No more posts for now.</span>
        </div>
      </template>
    </section>

    <aside class="feed-side" v-if="recommendations.length">
      <div class="feed-side__card">
        <div class="feed-side__title-row">
          <div>
            <h6>Suggested for you</h6>
            <p>Pets and owners you may want to follow</p>
          </div>
        </div>

        <div v-for="item in recommendations" :key="item.id" class="feed-side__item">
          <img :src="fileUrl(item.avatar, item.petName ? 'pet' : 'avatar')"
               @error="event => onImageError(event, item.petName ? 'pet' : 'avatar')"
               class="avatar-md" :alt="item.ownerName" />
          <div class="feed-side__meta">
            <strong>{{ item.ownerName }}</strong>
            <span>{{ item.petName ? `${item.petName} · ${item.species || 'Pet'}` : 'Pet lover' }}</span>
          </div>
          <button class="btn btn-sm btn-outline-primary" @click="router.push(`/profile/${item.authorId}`)">View</button>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter }      from 'vue-router'
import { useFeedStore }   from '@shared/stores/feed.js'
import { postService } from '@shared/services/postService.js'
import { fileUrl, onImageError } from '@shared/utils/formatters.js'
import PostCard   from '../components/PostCard.vue'

const router = useRouter()
const feedStore = useFeedStore()
const loadMoreSentinel = ref(null)
const recommendationPosts = ref([])
const postRefs = new Map()
let observer = null

const petHighlights = computed(() => {
  const seen = new Set()
  return feedStore.posts
    .filter(post => post.pet?._id && !seen.has(post.pet._id) && (seen.add(post.pet._id) || true))
    .slice(0, 8)
    .map(post => ({
      id: post.pet._id,
      name: post.pet.name,
      photo: post.pet.photos?.[0],
      postId: post._id,
    }))
})

const recommendations = computed(() => {
  const seen = new Set()
  return recommendationPosts.value
    .filter(post => !post.isFollowingAuthor && post.author?._id && !seen.has(post.author._id) && (seen.add(post.author._id) || true))
    .slice(0, 5)
    .map(post => ({
      id: `${post.author._id}-${post.pet?._id || 'user'}`,
      ownerName: post.author.name,
      avatar: post.author.avatar || post.pet?.photos?.[0],
      petName: post.pet?.name,
      species: post.pet?.species,
      postId: post._id,
      authorId: post.author._id,
    }))
})

onMounted(async () => {
  await Promise.all([
    feedStore.fetchFeed({ reset: true }),
    loadRecommendations(),
  ])
  await nextTick()
  observer = new IntersectionObserver(async entries => {
    const [entry] = entries
    if (!entry?.isIntersecting || feedStore.loadingMore || !feedStore.hasMore) return
    await feedStore.fetchFeed({ reset: false })
  }, { rootMargin: '300px 0px' })
  if (loadMoreSentinel.value) observer.observe(loadMoreSentinel.value)
})

onBeforeUnmount(() => observer?.disconnect())

async function loadRecommendations() {
  try {
    const { data } = await postService.recommendations({ limit: 5 })
    recommendationPosts.value = data
  } catch {
    recommendationPosts.value = []
  }
}

function openPost(postId) {
  router.push(`/posts/${postId}`)
}

function setPostRef(postId, el) {
  if (el) postRefs.set(postId, el)
  else postRefs.delete(postId)
}

function scrollToPost(postId) {
  postRefs.get(postId)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}
</script>
