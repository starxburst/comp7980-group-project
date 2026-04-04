<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start" v-if="route.params.id">
          <ion-back-button default-href="/tabs/profile" />
        </ion-buttons>
        <ion-title slot="start">Profile</ion-title>
        <ion-buttons slot="end" v-if="isOwnProfile">
          <ion-button aria-label="Log out" @click="doLogout">
            <ion-icon :icon="logOut" slot="start" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div v-if="!user" class="ion-text-center ion-padding"><ion-spinner name="crescent" /></div>
      <div v-else>
        <div style="text-align:center;padding:24px 16px">
          <ion-avatar style="width:80px;height:80px;margin:auto">
            <img :src="fileUrl(user.avatar, 'avatar')" @error="event => onImageError(event, 'avatar')" />
          </ion-avatar>
          <h3 style="margin-top:8px;margin-bottom:4px">{{ user.name }}</h3>
          <p style="color:gray;margin:0">{{ user.bio || 'No bio yet' }}</p>
          <div style="display:flex;gap:24px;justify-content:center;margin-top:12px">
            <button class="profile-stat-button" @click="openConnections('followers')">
              <strong>{{ user.followersCount }}</strong><br /><small>Followers</small>
            </button>
            <button class="profile-stat-button" @click="openConnections('following')">
              <strong>{{ user.followingCount }}</strong><br /><small>Following</small>
            </button>
          </div>
        </div>
        <ion-list>
          <ion-list-header><ion-label>{{ isOwnProfile ? 'My Pets' : `${user.name}'s Pets` }}</ion-label></ion-list-header>
          <ion-item v-for="pet in displayPets" :key="pet._id">
            <ion-avatar slot="start">
              <img :src="fileUrl(pet.photos?.[0], 'pet')" @error="event => onImageError(event, 'pet')" />
            </ion-avatar>
            <ion-label :button="isOwnProfile" @click="isOwnProfile && goHealth(pet._id)">
              <h2>{{ pet.name }}</h2>
              <p>{{ pet.species }} · {{ pet.breed || 'Mixed' }}</p>
            </ion-label>
            <ion-button v-if="isOwnProfile" fill="clear" size="small" @click="openEditModal(pet)">Edit</ion-button>
          </ion-item>
          <ion-item v-if="!displayPets.length">
            <ion-label color="medium">{{ isOwnProfile ? 'No pets yet.' : 'No public pets yet.' }}</ion-label>
          </ion-item>
        </ion-list>

        <ion-list v-if="isOwnProfile && (auth.isStaff || auth.isAdmin)">
          <ion-list-header><ion-label>Shelter Tools</ion-label></ion-list-header>
          <ion-item button @click="router.push('/shelter/listings')">
            <ion-label>
              <h2>Adoption Listings</h2>
              <p>Manage your shelter pets and adoption status</p>
            </ion-label>
          </ion-item>
          <ion-item button @click="router.push('/shelter/applications')">
            <ion-label>
              <h2>Applications</h2>
              <p>Review and update incoming adoption requests</p>
            </ion-label>
          </ion-item>
        </ion-list>

        <ion-modal :is-open="showEditor" @didDismiss="closeModal">
          <ion-header>
            <ion-toolbar color="primary">
              <ion-title slot="start">{{ editingPetId ? 'Edit Pet' : 'Add Pet' }}</ion-title>
              <ion-buttons slot="end">
                <ion-button @click="closeModal">Close</ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding">
            <ion-list inset>
              <ion-item>
                <ion-input v-model="form.name" label="Name" label-placement="stacked" placeholder="Pet name" />
              </ion-item>
              <ion-item>
                <ion-select v-model="form.species" label="Species" label-placement="stacked">
                  <ion-select-option v-for="species in SPECIES" :key="species" :value="species">{{ species }}</ion-select-option>
                </ion-select>
              </ion-item>
              <ion-item>
                <ion-input v-model="form.breed" label="Breed" label-placement="stacked" placeholder="Breed" />
              </ion-item>
              <ion-item>
                <ion-input v-model="form.color" label="Color" label-placement="stacked" placeholder="Color" />
              </ion-item>
              <ion-item>
                <ion-select v-model="form.sex" label="Sex" label-placement="stacked">
                  <ion-select-option value="male">Male</ion-select-option>
                  <ion-select-option value="female">Female</ion-select-option>
                  <ion-select-option value="unknown">Unknown</ion-select-option>
                </ion-select>
              </ion-item>
              <ion-item>
                <ion-input v-model="form.dob" type="date" label="Date of Birth" label-placement="stacked" />
              </ion-item>
              <ion-item>
                <input type="file" accept="image/*" multiple @change="onPhotos" />
              </ion-item>
              <ion-item v-if="editingPetId">
                <ion-label color="medium">Leave photos empty to keep the current images.</ion-label>
              </ion-item>
            </ion-list>

            <ion-button expand="block" class="ion-margin-top" :disabled="saving || !form.name.trim()" @click="savePet">
              <ion-spinner v-if="saving" name="crescent" class="ion-margin-end" />
              {{ editingPetId ? 'Update Pet' : 'Save Pet' }}
            </ion-button>
          </ion-content>
        </ion-modal>

        <ion-modal :is-open="showConnections" @didDismiss="showConnections = false">
          <ion-header>
            <ion-toolbar color="primary">
              <ion-title slot="start">{{ connectionsTab === 'followers' ? 'Followers' : 'Following' }}</ion-title>
              <ion-buttons slot="end">
                <ion-button @click="showConnections = false">Close</ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding">
            <div style="display:flex;gap:8px;margin-bottom:16px">
              <ion-button size="small" :fill="connectionsTab === 'followers' ? 'solid' : 'outline'" @click="connectionsTab = 'followers'">
                Followers
              </ion-button>
              <ion-button size="small" :fill="connectionsTab === 'following' ? 'solid' : 'outline'" @click="connectionsTab = 'following'">
                Following
              </ion-button>
            </div>

            <div v-if="connectionsLoading" class="ion-text-center ion-padding">
              <ion-spinner name="crescent" />
            </div>
            <ion-list v-else-if="activeConnections.length">
              <ion-item v-for="person in activeConnections" :key="person._id" button @click="goToProfile(person._id)">
                <ion-avatar slot="start">
                  <img :src="fileUrl(person.avatar, 'avatar')" @error="event => onImageError(event, 'avatar')" />
                </ion-avatar>
                <ion-label>{{ person.name }}</ion-label>
              </ion-item>
            </ion-list>
            <div v-else class="ion-text-center ion-padding" style="color:gray">
              No {{ connectionsTab }} yet.
            </div>
          </ion-content>
        </ion-modal>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { useRoute, useRouter }      from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
  IonContent, IonAvatar, IonList, IonListHeader, IonItem, IonLabel, IonSpinner,
  IonModal, IonInput, IonSelect, IonSelectOption, IonBackButton,
} from '@ionic/vue'
import { logOut } from 'ionicons/icons'
import { useAuthStore } from '@shared/stores/auth.js'
import { usePetsStore } from '@shared/stores/pets.js'
import { authService }  from '@shared/services/authService.js'
import { postService }  from '@shared/services/postService.js'
import api from '@shared/api.js'
import { SPECIES } from '@shared/utils/constants.js'
import { fileUrl, onImageError } from '@shared/utils/formatters.js'

const route     = useRoute()
const router    = useRouter()
const auth      = useAuthStore()
const petsStore = usePetsStore()
const user      = ref(null)
const profilePosts = ref([])
const showEditor = ref(false)
const editingPetId = ref('')
const saving = ref(false)
const showConnections = ref(false)
const connectionsTab = ref('followers')
const connectionsLoading = ref(false)
const followers = ref([])
const following = ref([])
const form = ref(defaultForm())
let photoFiles = []

const isOwnProfile = computed(() =>
  !route.params.id || String(route.params.id) === String(auth.user?.id)
)

const displayPets = computed(() => {
  if (isOwnProfile.value) return petsStore.myPets
  const seen = new Set()
  return profilePosts.value.filter(post => {
    const petId = post.pet?._id
    if (!petId || seen.has(petId)) return false
    seen.add(petId)
    return true
  }).map(post => post.pet)
})

onMounted(loadProfile)
watch(() => route.params.id, loadProfile)

async function doLogout() {
  await auth.logout()
  router.replace('/login')
}

function defaultForm() {
  return { name: '', species: 'Dog', breed: '', color: '', sex: 'unknown', dob: '' }
}

function goHealth(id) {
  router.push(`/my-pets/${id}/health`)
}

function onPhotos(event) {
  photoFiles = Array.from(event.target.files || [])
}

function openEditModal(pet) {
  editingPetId.value = pet._id
  form.value = {
    name: pet.name || '',
    species: pet.species || 'Dog',
    breed: pet.breed || '',
    color: pet.color || '',
    sex: pet.sex || 'unknown',
    dob: pet.dob ? String(pet.dob).slice(0, 10) : '',
  }
  photoFiles = []
  showEditor.value = true
}

function closeModal() {
  showEditor.value = false
  editingPetId.value = ''
  form.value = defaultForm()
  photoFiles = []
}

async function savePet() {
  saving.value = true
  const fd = new FormData()
  Object.entries(form.value).forEach(([key, value]) => {
    if (value === '' || value === null || value === undefined) return
    fd.append(key, typeof value === 'boolean' ? String(value) : value)
  })
  photoFiles.forEach(file => fd.append('photos', file))

  try {
    await petsStore.updatePet(editingPetId.value, fd)
    closeModal()
  } finally {
    saving.value = false
  }
}

const activeConnections = computed(() =>
  connectionsTab.value === 'followers' ? followers.value : following.value
)

async function loadProfile() {
  showConnections.value = false
  closeModal()
  profilePosts.value = []

  if (isOwnProfile.value) {
    const { data } = await authService.me()
    user.value = data
    await petsStore.fetchMyPets()
    await fetchConnections(data._id)
    return
  }

  const profileId = route.params.id
  const [userRes, postsRes] = await Promise.all([
    api.get(`/users/${profileId}`),
    postService.byUser(profileId),
  ])

  user.value = userRes.data
  profilePosts.value = postsRes.data
  await fetchConnections(profileId)
}

async function fetchConnections(userId) {
  connectionsLoading.value = true
  try {
    const [followersRes, followingRes] = await Promise.all([
      api.get(`/follows/${userId}/followers`),
      api.get(`/follows/${userId}/following`),
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
  if (user.value) await fetchConnections(user.value._id)
}

function goToProfile(id) {
  showConnections.value = false
  if (String(id) === String(auth.user?.id)) router.push('/tabs/profile')
  else router.push(`/profile/${id}`)
}
</script>

<style scoped>
.profile-stat-button {
  border: 0;
  background: transparent;
  color: inherit;
  text-align: center;
}
</style>
