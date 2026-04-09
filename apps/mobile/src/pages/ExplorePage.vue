<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title slot="start">Explore People</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar
          v-model="query"
          debounce="300"
          placeholder="Search by name, email, or bio"
          @ionInput="runSearch"
          @keyup.enter="runSearch"
        />
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div v-if="loading && !users.length" class="ion-text-center ion-padding">
        <ion-spinner name="crescent" />
      </div>

      <ion-list v-else-if="users.length">
        <ion-item v-for="person in users" :key="person._id" button detail @click="goToProfile(person._id)">
          <ion-avatar slot="start">
            <img :src="fileUrl(person.avatar, 'avatar')" @error="event => onImageError(event, 'avatar')" />
          </ion-avatar>
          <ion-label>
            <h2>{{ person.name }}</h2>
            <p>{{ formatRole(person.role) }} · {{ person.email }}</p>
            <p>{{ person.bio || 'No bio yet.' }}</p>
            <p>{{ person.followersCount || 0 }} followers · {{ person.followingCount || 0 }} following</p>
          </ion-label>
        </ion-item>
      </ion-list>

      <div v-else class="ion-text-center ion-padding" style="color: gray">
        No users matched your search.
      </div>

      <ion-infinite-scroll @ionInfinite="loadMore" :disabled="!hasMore || loading || loadingMore">
        <ion-infinite-scroll-content loading-spinner="crescent" loading-text="Loading more users..." />
      </ion-infinite-scroll>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonSearchbar,
  IonSpinner, IonList, IonItem, IonAvatar, IonLabel, IonInfiniteScroll,
  IonInfiniteScrollContent,
} from '@ionic/vue'
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

onMounted(() => {
  fetchUsers({ reset: true })
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

async function loadMore(event) {
  await fetchUsers()
  event.target.complete()
}

function goToProfile(id) {
  if (String(id) === String(auth.user?.id)) router.push('/tabs/profile')
  else router.push(`/profile/${id}`)
}
</script>
