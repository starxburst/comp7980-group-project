<template>
  <div class="container py-4">
    <h4 class="fw-bold mb-4">Admin Dashboard</h4>
    <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
    <div v-else>
      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3" v-for="stat in stats" :key="stat.label">
          <div class="card text-center h-100">
            <div class="card-body">
              <div class="fs-2 fw-bold text-primary">{{ stat.value }}</div>
              <div class="small text-muted">{{ stat.label }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Role breakdown chart -->
      <div class="card" style="max-width:360px">
        <div class="card-body">
          <h6 class="card-title">Users by Role</h6>
          <Doughnut v-if="chartData" :data="chartData" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import api from '@shared/api.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const summary = ref(null)
const loading = ref(true)

const stats = computed(() => summary.value ? [
  { label: 'Users',       value: summary.value.userCount },
  { label: 'Posts',       value: summary.value.postCount },
  { label: 'My Pets',     value: summary.value.petCount },
  { label: 'Shelter Pets',value: summary.value.shelterPetCount },
] : [])

const chartData = computed(() => {
  if (!summary.value?.roleBreakdown) return null
  const bd = summary.value.roleBreakdown
  return {
    labels: bd.map(r => r._id),
    datasets: [{
      data:            bd.map(r => r.count),
      backgroundColor: ['#f97316','#3b82f6','#10b981'],
    }]
  }
})

onMounted(async () => {
  try {
    const { data } = await api.get('/admin/dashboard')
    summary.value = data
  } finally { loading.value = false }
})
</script>
