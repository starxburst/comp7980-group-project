<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@shared/stores/auth.js'

const auth = useAuthStore()

onMounted(() => auth.init())
</script>
