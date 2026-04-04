import { useFeedStore } from '../stores/feed.js'

export function useFeed() {
  const store = useFeedStore()
  return {
    posts:        store.posts,
    loading:      store.loading,
    loadingMore:  store.loadingMore,
    hasMore:      store.hasMore,
    fetchFeed:    store.fetchFeed,
    fetchExplore: store.fetchExplore,
    likePost:     store.likePost,
    resetFeed:    store.resetFeed,
  }
}
