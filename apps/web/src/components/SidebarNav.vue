<template>
  <ul class="nav flex-column gap-1">
    <li v-for="item in navItems" :key="item.to" class="nav-item">
      <router-link :to="item.to" class="nav-link d-flex align-items-center gap-2 rounded px-3 py-2"
                   active-class="bg-primary bg-opacity-10 text-primary fw-semibold">
        <i :class="`bi ${item.icon} fs-5`"></i>
        <span>{{ item.label }}</span>
      </router-link>
    </li>
    <li v-if="auth.isStaff || auth.isAdmin" class="nav-item mt-2">
      <div class="small text-muted px-3 mb-1">Shelter</div>
      <router-link to="/shelter/listings"     class="nav-link d-flex align-items-center gap-2 rounded px-3 py-2" active-class="bg-primary bg-opacity-10 text-primary fw-semibold">
        <i class="bi bi-house-heart fs-5"></i><span>Listings</span>
      </router-link>
      <router-link to="/shelter/applications" class="nav-link d-flex align-items-center gap-2 rounded px-3 py-2" active-class="bg-primary bg-opacity-10 text-primary fw-semibold">
        <i class="bi bi-clipboard2-check fs-5"></i><span>Applications</span>
      </router-link>
    </li>
    <li v-if="auth.isAdmin" class="nav-item mt-2">
      <div class="small text-muted px-3 mb-1">Admin</div>
      <router-link to="/admin/dashboard" class="nav-link d-flex align-items-center gap-2 rounded px-3 py-2" active-class="bg-primary bg-opacity-10 text-primary fw-semibold">
        <i class="bi bi-speedometer2 fs-5"></i><span>Dashboard</span>
      </router-link>
      <router-link to="/admin/users" class="nav-link d-flex align-items-center gap-2 rounded px-3 py-2" active-class="bg-primary bg-opacity-10 text-primary fw-semibold">
        <i class="bi bi-people fs-5"></i><span>Users</span>
      </router-link>
    </li>
    <li class="nav-item mt-auto">
      <button class="nav-link d-flex align-items-center gap-2 rounded px-3 py-2 w-100 border-0 bg-transparent text-danger"
              @click="doLogout">
        <i class="bi bi-box-arrow-left fs-5"></i><span>Log out</span>
      </button>
    </li>
  </ul>
</template>

<script setup>
import { useAuthStore } from '@shared/stores/auth.js'
import { useRouter }    from 'vue-router'
import { computed }     from 'vue'

const auth   = useAuthStore()
const router = useRouter()

const navItems = computed(() => [
  { to: '/feed',            icon: 'bi-house',          label: 'Home'         },
  { to: '/explore',         icon: 'bi-search',         label: 'Explore'      },
  { to: '/post/create',     icon: 'bi-plus-circle',    label: 'New Post'     },
  { to: '/adopt/browse',    icon: 'bi-heart',          label: 'Adopt'        },
  { to: '/events',          icon: 'bi-calendar-event', label: 'Events'       },
  { to: '/my-pets',         icon: 'bi-emoji-smile',    label: 'My Pets'      },
  { to: '/my-applications', icon: 'bi-file-earmark-text', label: 'My Applications' },
  { to: '/profile',         icon: 'bi-person-circle',  label: 'Profile'      },
])

async function doLogout() {
  await auth.logout()
  router.push('/login')
}
</script>
