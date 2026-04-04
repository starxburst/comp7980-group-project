import { defineStore } from 'pinia'
import { ref } from 'vue'
import { postService } from '../services/postService.js'

export const useFeedStore = defineStore('feed', () => {
  const posts       = ref([])
  const loading     = ref(false)
  const loadingMore = ref(false)
  const error       = ref(null)
  const page        = ref(1)
  const hasMore     = ref(true)
  const pageSize    = 10

  async function fetchFeed({ reset = true } = {}) {
    if (loading.value || loadingMore.value) return

    const nextPage = reset ? 1 : page.value + 1

    if (reset) {
      loading.value = true
    } else {
      if (!hasMore.value) return
      loadingMore.value = true
    }

    error.value   = null
    try {
      const { data } = await postService.feed({ page: nextPage, limit: pageSize })
      posts.value = reset ? data.items : [...posts.value, ...data.items]
      page.value = data.page
      hasMore.value = data.hasMore
    } catch (err) {
      error.value = err.response?.data?.message || err.message
    } finally {
      if (reset) {
        loading.value = false
      } else {
        loadingMore.value = false
      }
    }
  }

  async function fetchExplore(type = 'pawpost') {
    loading.value = true
    error.value   = null
    try {
      const { data } = await postService.explore(type)
      posts.value = data
    } catch (err) {
      error.value = err.response?.data?.message || err.message
    } finally {
      loading.value = false
    }
  }

  async function likePost(postId) {
    const { data } = await postService.like(postId)
    const post = posts.value.find(p => p._id === postId)
    if (post) {
      post.likeCount = data.likeCount
      post.isLiked = data.isLiked
    }
  }

  function resetFeed() {
    posts.value = []
    page.value = 1
    hasMore.value = true
    error.value = null
  }

  return {
    posts,
    loading,
    loadingMore,
    error,
    page,
    hasMore,
    fetchFeed,
    fetchExplore,
    likePost,
    resetFeed,
  }
})
