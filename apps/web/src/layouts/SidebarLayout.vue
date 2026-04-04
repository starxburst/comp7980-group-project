<template>
  <div>
    <!-- Sidebar (xl+) -->
    <nav class="ps-sidebar d-none d-xl-flex flex-column gap-2">
      <div class="d-flex align-items-center gap-2 mb-4">
        <span class="text-primary fs-4" aria-hidden="true">
          <i class="bi bi-paw-fill"></i>
        </span>
        <span class="fw-bold fs-5 text-primary">Petstagram</span>
      </div>
      <SidebarNav />
    </nav>

    <!-- Main content -->
    <main class="ps-main-content">
      <router-view />
    </main>

    <!-- Bottom nav (mobile) -->
    <nav class="ps-bottom-nav d-xl-none">
      <BottomNav />
    </nav>
  </div>
</template>

<script setup>
import SidebarNav from '../components/SidebarNav.vue'
import BottomNav  from '../components/BottomNav.vue'
</script>
