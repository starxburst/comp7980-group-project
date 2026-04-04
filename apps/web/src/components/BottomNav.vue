<template>
  <div class="d-flex w-100 justify-content-around align-items-center">
    <router-link v-for="item in items" :key="item.to" :to="item.to"
      class="d-flex flex-column align-items-center text-decoration-none text-muted small gap-1 p-1"
      active-class="text-primary">
      <i :class="`bi ${item.icon} fs-5`"></i>
      <span style="font-size:.65rem">{{ item.label }}</span>
    </router-link>
  </div>
</template>

<script setup>
const items = [
  { to: '/feed',         icon: 'bi-house',        label: 'Home'    },
  { to: '/post/create',  icon: 'bi-plus-circle',  label: 'Post'    },
  { to: '/adopt/browse', icon: 'bi-heart',        label: 'Adopt'   },
  { to: '/events',       icon: 'bi-calendar-event', label: 'Events' },
  { to: '/profile',      icon: 'bi-person-circle',label: 'Me'      },
]
</script>
