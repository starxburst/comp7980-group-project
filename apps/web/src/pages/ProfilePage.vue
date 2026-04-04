<template>
  <div class="container py-4" style="max-width:880px">
    <div v-if="!user" class="text-center py-5">
      <div class="spinner-border text-primary"></div>
    </div>
    <div v-else>
      <!-- Header -->
      <div class="d-flex align-items-center gap-4 mb-4">
        <img :src="fileUrl(user.avatar, 'avatar')" @error="event => onImageError(event, 'avatar')" class="avatar-lg" />
        <div>
          <h5 class="fw-bold mb-0">{{ user.name }}</h5>
          <p class="text-muted small mb-1">{{ user.bio || 'No bio yet' }}</p>
          <div class="d-flex gap-3 small">
            <button class="btn btn-link btn-sm p-0 text-decoration-none" @click="openConnections('followers')">
              <strong>{{ user.followersCount }}</strong> followers
            </button>
            <button class="btn btn-link btn-sm p-0 text-decoration-none" @click="openConnections('following')">
              <strong>{{ user.followingCount }}</strong> following
            </button>
          </div>
        </div>
        <button v-if="isOwnProfile" class="btn btn-outline-primary btn-sm ms-auto" @click="showEdit = true">
          Edit Profile
        </button>
        <button
          v-else
          class="btn btn-sm ms-auto"
          :class="isFollowing ? 'btn-outline-secondary' : 'btn-primary'"
          :disabled="followLoading"
          @click="toggleFollow"
        >
          <span v-if="followLoading" class="spinner-border spinner-border-sm me-1"></span>
          {{ isFollowing ? 'Unfollow' : 'Follow' }}
        </button>
      </div>

      <div class="d-flex align-items-center gap-2 flex-wrap mb-4">
        <button
          class="btn btn-sm"
          :class="selectedPetId ? 'btn-outline-primary' : 'btn-primary'"
          @click="selectedPetId = ''"
        >
          All pets
        </button>
        <button
          v-for="pet in pets"
          :key="pet._id"
          class="btn btn-sm"
          :class="selectedPetId === pet._id ? 'btn-primary' : 'btn-outline-primary'"
          @click="selectedPetId = pet._id"
        >
          {{ pet.name }}
        </button>
      </div>

      <div v-if="isOwnProfile && (auth.isStaff || auth.isAdmin)" class="card border-0 mb-4 profile-tools-card">
        <div class="card-body">
          <div class="small text-uppercase profile-tools-card__eyebrow mb-2">Shelter Tools</div>
          <div class="d-flex flex-column flex-sm-row gap-2">
            <router-link to="/shelter/listings" class="btn btn-outline-primary btn-sm">
              <i class="bi bi-house-heart me-1"></i>Listings
            </router-link>
            <router-link to="/shelter/applications" class="btn btn-outline-primary btn-sm">
              <i class="bi bi-clipboard2-check me-1"></i>Applications
            </router-link>
          </div>
        </div>
      </div>

      <!-- Posts grid -->
      <div class="row g-3">
        <div class="col-6 col-md-4" v-for="post in filteredPosts" :key="post._id">
          <button
            class="position-relative rounded overflow-hidden border-0 p-0 w-100 bg-transparent"
            style="aspect-ratio:1;cursor:pointer"
            @click="openPost(post._id)"
          >
            <img :src="fileUrl(post.mediaUrl, 'post')" @error="event => onImageError(event, 'post')" class="w-100 h-100" style="object-fit:cover" />
            <div class="position-absolute bottom-0 start-0 end-0 px-2 py-2" style="background:linear-gradient(180deg, transparent, rgba(0,0,0,.75))">
              <div class="small text-white fw-semibold">{{ post.pet?.name || 'Pet post' }}</div>
            </div>
          </button>
        </div>
      </div>
      <div v-if="!filteredPosts.length" class="text-muted text-center py-4">
        No posts yet.
      </div>

      <div v-if="showConnections" class="modal d-block" style="background:rgba(0,0,0,.5)">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <div class="d-flex gap-2">
                <button
                  class="btn btn-sm"
                  :class="connectionsTab === 'followers' ? 'btn-primary' : 'btn-outline-primary'"
                  @click="connectionsTab = 'followers'"
                >
                  Followers
                </button>
                <button
                  class="btn btn-sm"
                  :class="connectionsTab === 'following' ? 'btn-primary' : 'btn-outline-primary'"
                  @click="connectionsTab = 'following'"
                >
                  Following
                </button>
              </div>
              <button class="btn-close" @click="showConnections = false"></button>
            </div>
            <div class="modal-body">
              <div v-if="connectionsLoading" class="text-center py-4">
                <div class="spinner-border spinner-border-sm text-primary"></div>
              </div>
              <div v-else-if="!activeConnections.length" class="text-muted small">
                No {{ connectionsTab }} yet.
              </div>
              <div v-else class="d-flex flex-column gap-2">
                <button
                  v-for="person in activeConnections"
                  :key="person._id"
                  class="btn btn-dark border d-flex align-items-center gap-3 text-start"
                  @click="goToProfile(person._id)"
                >
                  <img :src="fileUrl(person.avatar, 'avatar')" @error="event => onImageError(event, 'avatar')" class="avatar-sm" />
                  <span>{{ person.name }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Edit modal (own profile only) -->
      <div v-if="isOwnProfile && showEdit" class="modal d-block" style="background:rgba(0,0,0,.5)">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Edit Profile</h5>
              <button class="btn-close" @click="showEdit = false"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Name</label>
                <input v-model="editForm.name" class="form-control" />
              </div>
              <div class="mb-3">
                <label class="form-label">Bio</label>
                <textarea v-model="editForm.bio" class="form-control" rows="3"></textarea>
              </div>
              <div class="mb-3">
                <label class="form-label">Avatar</label>
                <input type="file" class="form-control" accept="image/*" @change="onAvatarPick" />
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="showEdit = false">Cancel</button>
              <button class="btn btn-primary" @click="saveProfile" :disabled="saving">
                <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { useRoute, useRouter }      from 'vue-router'
import { useAuthStore }  from '@shared/stores/auth.js'
import { usePetsStore }  from '@shared/stores/pets.js'
import { authService }   from '@shared/services/authService.js'
import { postService }   from '@shared/services/postService.js'
import api               from '@shared/api.js'
import { fileUrl, onImageError } from '@shared/utils/formatters.js'

const route    = useRoute()
const router   = useRouter()
const auth     = useAuthStore()
const petsStore = usePetsStore()
const user          = ref(null)
const posts         = ref([])
const selectedPetId = ref('')
const showEdit      = ref(false)
const saving        = ref(false)
const editForm      = ref({ name: '', bio: '' })
const isFollowing   = ref(false)
const followLoading = ref(false)
const followers = ref([])
const following = ref([])
const connectionsLoading = ref(false)
const showConnections = ref(false)
const connectionsTab = ref('followers')
let avatarFile = null

const isOwnProfile = computed(() =>
  !route.params.id || String(route.params.id) === String(auth.user?.id)
)
const profileUserId = computed(() => route.params.id || auth.user?.id)

const pets = computed(() => {
  if (isOwnProfile.value) return petsStore.myPets
  const seen = new Set()
  return posts.value
    .filter(p => p.pet?._id && !seen.has(p.pet._id) && seen.add(p.pet._id))
    .map(p => p.pet)
})

const filteredPosts = computed(() => {
  if (!selectedPetId.value) return posts.value
  return posts.value.filter(post => (post.pet?._id || post.petId) === selectedPetId.value)
})

const activeConnections = computed(() =>
  connectionsTab.value === 'followers' ? followers.value : following.value
)

onMounted(loadProfile)
watch(() => route.params.id, loadProfile)

async function loadProfile() {
  selectedPetId.value = ''
  if (isOwnProfile.value) {
    const { data } = await authService.me()
    user.value = data
    editForm.value = { name: data.name, bio: data.bio }
    await petsStore.fetchMyPets()
    const [postsRes, followersRes, followingRes] = await Promise.all([
      postService.byUser(data._id),
      api.get(`/follows/${data._id}/followers`),
      api.get(`/follows/${data._id}/following`),
    ])
    posts.value = postsRes.data
    followers.value = followersRes.data
    following.value = followingRes.data
    isFollowing.value = false
  } else {
    const [userRes, postsRes, followersRes, followingRes] = await Promise.all([
      api.get(`/users/${route.params.id}`),
      postService.byUser(route.params.id),
      api.get(`/follows/${route.params.id}/followers`),
      api.get(`/follows/${route.params.id}/following`),
    ])
    user.value = userRes.data
    posts.value = postsRes.data
    followers.value = followersRes.data
    following.value = followingRes.data
    isFollowing.value = followersRes.data.some(f => String(f._id) === String(auth.user?.id))
  }
}

async function toggleFollow() {
  followLoading.value = true
  try {
    if (isFollowing.value) {
      await api.delete(`/follows/${route.params.id}/unfollow`)
      isFollowing.value = false
      user.value.followersCount--
    } else {
      await api.post(`/follows/${route.params.id}/follow`)
      isFollowing.value = true
      user.value.followersCount++
    }
    await fetchConnections()
  } finally {
    followLoading.value = false
  }
}

async function fetchConnections() {
  if (!profileUserId.value) return
  connectionsLoading.value = true
  try {
    const [followersRes, followingRes] = await Promise.all([
      api.get(`/follows/${profileUserId.value}/followers`),
      api.get(`/follows/${profileUserId.value}/following`),
    ])
    followers.value = followersRes.data
    following.value = followingRes.data
  } finally {
    connectionsLoading.value = false
  }
}

async function openConnections(tab) {
  connectionsTab.value = tab
  showConnections.value = true
  if (!followers.value.length && !following.value.length) {
    await fetchConnections()
  }
}

function goToProfile(id) {
  showConnections.value = false
  if (String(id) === String(auth.user?.id)) router.push('/profile')
  else router.push(`/profile/${id}`)
}

function openPost(id) {
  router.push(`/posts/${id}`)
}

function onAvatarPick(e) { avatarFile = e.target.files[0] }

async function saveProfile() {
  saving.value = true
  const fd = new FormData()
  fd.append('name', editForm.value.name)
  fd.append('bio',  editForm.value.bio)
  if (avatarFile) fd.append('avatar', avatarFile)
  try {
    const { data } = await api.put('/users/me', fd)
    user.value = data
    await auth.setAuth(auth.token, data)
    showEdit.value = false
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.profile-tools-card {
  background: rgba(28, 32, 37, 0.9);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.22);
}

.profile-tools-card__eyebrow {
  color: var(--ps-text-muted);
  letter-spacing: 0.08em;
}
</style>
