<template>
  <div class="container py-4" style="max-width: 960px">
    <div class="d-flex flex-column flex-lg-row align-items-lg-end justify-content-between gap-3 mb-4">
      <div>
        <h4 class="fw-bold mb-1">Explore People</h4>
        <p class="text-muted mb-0">Search pet owners, shelter staff, and other community members.</p>
      </div>
      <form class="explore-search d-flex gap-2" @submit.prevent="runSearch">
        <input
          v-model.trim="query"
          type="search"
          class="form-control"
          placeholder="Search by name, email, or bio"
        />
        <button class="btn btn-primary" type="submit" :disabled="loading">
          Search
        </button>
      </form>
    </div>

    <div v-if="loading && !users.length" class="text-center py-5">
      <div class="spinner-border text-primary"></div>
    </div>

    <div v-else-if="!users.length" class="card border-0 shadow-sm explore-empty-state">
      <div class="card-body text-center py-5 text-muted">
        No users matched your search.
      </div>
    </div>

    <div v-else class="row g-3">
      <div v-for="person in users" :key="person._id" class="col-12 col-md-6">
        <button class="card border-0 shadow-sm text-start w-100 h-100 explore-user-card" @click="goToProfile(person._id)">
          <div class="card-body d-flex gap-3 align-items-start">
            <img
              :src="fileUrl(person.avatar, 'avatar')"
              @error="event => onImageError(event, 'avatar')"
              class="explore-user-card__avatar rounded-circle flex-shrink-0"
            />
            <div class="flex-grow-1 min-w-0">
              <div class="d-flex flex-wrap align-items-center gap-2 mb-1">
                <h5 class="mb-0 fw-semibold text-truncate">{{ person.name }}</h5>
                <span class="badge text-bg-light text-uppercase">{{ formatRole(person.role) }}</span>
              </div>
              <div class="small text-muted mb-2">{{ person.email }}</div>
              <p class="text-muted mb-3 explore-user-card__bio">
                {{ person.bio || 'No bio yet.' }}
              </p>
              <div class="d-flex gap-3 small">
                <span><strong>{{ person.followersCount || 0 }}</strong> followers</span>
                <span><strong>{{ person.followingCount || 0 }}</strong> following</span>
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>

    <div ref="sentinel" class="py-4 text-center">
      <div v-if="loadingMore" class="spinner-border spinner-border-sm text-primary"></div>
      <div v-else-if="users.length && !hasMore" class="small text-muted">
        You’ve reached the end of the results.
      </div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@shared/stores/auth.js'
import { userService } from '@shared/services/userService.js'
import { fileUrl, onImageError } from '@shared/utils/formatters.js'

const auth = useAuthStore()
const router = useRouter()
const query = ref('')
const users = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const hasMore = ref(true)
const page = ref(1)
const sentinel = ref(null)
let observer = null
let debounceTimer = null

onMounted(async () => {
  await fetchUsers({ reset: true })
  observer = new IntersectionObserver(handleIntersect, { rootMargin: '240px 0px' })
  if (sentinel.value) observer.observe(sentinel.value)
})

onBeforeUnmount(() => {
  if (observer) observer.disconnect()
  if (debounceTimer) window.clearTimeout(debounceTimer)
})

watch(query, () => {
  if (debounceTimer) window.clearTimeout(debounceTimer)
  debounceTimer = window.setTimeout(() => {
    fetchUsers({ reset: true })
  }, 300)
})

function formatRole(role) {
  return String(role || 'owner').replace('_', ' ')
}

async function runSearch() {
  await fetchUsers({ reset: true })
}

async function fetchUsers({ reset = false } = {}) {
  if (loading.value || loadingMore.value) return
  if (!reset && !hasMore.value) return

  const nextPage = reset ? 1 : page.value + 1

  if (reset) loading.value = true
  else loadingMore.value = true

  try {
    const { data } = await userService.search({
      q: query.value,
      page: nextPage,
      limit: 12,
    })

    const filteredItems = data.items.filter(person => String(person._id) !== String(auth.user?.id))
    users.value = reset ? filteredItems : [...users.value, ...filteredItems]
    page.value = data.page
    hasMore.value = data.hasMore
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function handleIntersect(entries) {
  if (entries.some(entry => entry.isIntersecting)) {
    fetchUsers()
  }
}

function goToProfile(id) {
  if (String(id) === String(auth.user?.id)) router.push('/profile')
  else router.push(`/profile/${id}`)
}
</script>

<style scoped>
.explore-search {
  width: min(100%, 420px);
}

.explore-empty-state,
.explore-user-card {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.015)),
    var(--ps-surface);
  border: 1px solid var(--ps-border);
  border-radius: 20px;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.explore-user-card h5,
.explore-user-card strong {
  color: var(--ps-text);
}

.explore-user-card .badge {
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.explore-user-card:hover {
  transform: translateY(-2px);
  border-color: rgba(245, 138, 61, 0.22);
  box-shadow: var(--ps-shadow);
}

.explore-user-card__avatar {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.08);
}

.explore-user-card__bio {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
