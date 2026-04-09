<template>
  <div class="d-flex w-100 justify-content-around align-items-center">
    <router-link v-for="item in items" :key="item.to" :to="item.to"
      class="ps-bottom-nav__item d-flex flex-column align-items-center text-decoration-none text-muted small gap-1 p-1"
      active-class="text-primary">
      <i :class="`bi ${item.icon} fs-5`"></i>
      <span class="ps-bottom-nav__label">{{ item.label }}</span>
    </router-link>
    <button
      type="button"
      class="ps-bottom-nav__item ps-bottom-nav__button d-flex flex-column align-items-center text-muted small gap-1 p-1 border-0 bg-transparent"
      @click="doLogout"
    >
      <i class="bi bi-box-arrow-left fs-5"></i>
      <span class="ps-bottom-nav__label">Logout</span>
    </button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@shared/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()

const items = [
  { to: '/feed',         icon: 'bi-house',        label: 'Home'    },
  { to: '/explore',      icon: 'bi-search',       label: 'Explore' },
  { to: '/post/create',  icon: 'bi-plus-circle',  label: 'Post'    },
  { to: '/my-pets',      icon: 'bi-emoji-smile',  label: 'Pets'    },
  { to: '/adopt/browse', icon: 'bi-heart',        label: 'Adopt'   },
  { to: '/events',       icon: 'bi-calendar-event', label: 'Events' },
  { to: '/profile',      icon: 'bi-person-circle',label: 'Me'      },
]

async function doLogout() {
  await auth.logout()
  router.push('/login')
}
</script>
