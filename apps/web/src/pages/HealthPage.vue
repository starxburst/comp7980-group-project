<template>
  <div class="container py-4" style="max-width:720px">
    <div class="d-flex align-items-center gap-2 mb-4">
      <router-link to="/my-pets" class="btn btn-outline-secondary btn-sm">
        <i class="bi bi-arrow-left"></i>
      </router-link>
      <h4 class="fw-bold mb-0">Health Tracker</h4>
    </div>

    <!-- Weight chart -->
    <div class="card mb-4">
      <div class="card-body">
        <h6 class="card-title">Weight History</h6>
        <Line v-if="chartData" :data="chartData" :options="chartOptions" />
        <p v-else class="text-muted small">No weight logs yet.</p>
      </div>
    </div>

    <!-- Add log -->
    <div class="card mb-4">
      <div class="card-body">
        <h6 class="card-title">Log Weight</h6>
        <div class="d-flex gap-2">
          <input v-model="logForm.date"     type="date"   class="form-control" style="max-width:160px" />
          <input v-model="logForm.weightKg" type="number" class="form-control" style="max-width:120px" placeholder="kg" step="0.1" />
          <input v-model="logForm.notes"    class="form-control" placeholder="Notes (optional)" />
          <button class="btn btn-primary" @click="addLog">Add</button>
        </div>
      </div>
    </div>

    <!-- Log list -->
    <div class="card mb-4">
      <div class="card-body p-0">
        <table class="table table-sm mb-0">
          <thead><tr><th>Date</th><th>Weight</th><th>Notes</th><th></th></tr></thead>
          <tbody>
            <tr v-for="log in logs" :key="log._id">
              <td>{{ formatDate(log.date) }}</td>
              <td>{{ log.weightKg }} kg</td>
              <td>{{ log.notes }}</td>
              <td><button class="btn btn-link btn-sm text-danger p-0" @click="removeLog(log._id)">
                <i class="bi bi-trash"></i>
              </button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Vaccinations -->
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h6 class="mb-0">Vaccinations</h6>
        <button class="btn btn-sm btn-primary" @click="showVacc = true">+ Add</button>
      </div>
      <div class="card-body p-0">
        <table class="table table-sm mb-0">
          <thead><tr><th>Vaccine</th><th>Date Given</th><th>Next Due</th><th>Vet</th></tr></thead>
          <tbody>
            <tr v-for="v in vaccines" :key="v._id">
              <td>{{ v.vaccineName }}</td>
              <td>{{ formatDate(v.dateGiven) }}</td>
              <td>{{ formatDate(v.nextDueDate) }}</td>
              <td>{{ v.vetName }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add vaccination modal -->
    <div v-if="showVacc" class="modal d-block" style="background:rgba(0,0,0,.5)">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Add Vaccination</h5>
            <button class="btn-close" @click="showVacc = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Vaccine Name *</label>
              <input v-model="vaccForm.vaccineName" class="form-control" />
            </div>
            <div class="row g-2 mb-3">
              <div class="col">
                <label class="form-label">Date Given</label>
                <input v-model="vaccForm.dateGiven" type="date" class="form-control" />
              </div>
              <div class="col">
                <label class="form-label">Next Due</label>
                <input v-model="vaccForm.nextDueDate" type="date" class="form-control" />
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">Vet Name</label>
              <input v-model="vaccForm.vetName" class="form-control" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showVacc = false">Cancel</button>
            <button class="btn btn-primary" @click="addVacc">Save</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute }    from 'vue-router'
import { Line }        from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { healthService } from '@shared/services/healthService.js'
import { formatDate }    from '@shared/utils/formatters.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const route   = useRoute()
const petId   = route.params.id
const logs    = ref([])
const vaccines= ref([])
const showVacc= ref(false)

const logForm  = ref({ date: '', weightKg: '', notes: '' })
const vaccForm = ref({ vaccineName: '', dateGiven: '', nextDueDate: '', vetName: '' })

const chartData = computed(() => {
  if (!logs.value.length) return null
  const sorted = [...logs.value].sort((a, b) => new Date(a.date) - new Date(b.date))
  return {
    labels: sorted.map(l => formatDate(l.date)),
    datasets: [{
      label: 'Weight (kg)', data: sorted.map(l => l.weightKg),
      borderColor: '#f97316', tension: 0.3, fill: false,
    }]
  }
})

const chartOptions = {
  responsive: true,
  plugins: { legend: { display: false } },
}

onMounted(async () => {
  const [l, v] = await Promise.all([
    healthService.getLogs(petId),
    healthService.getVaccines(petId),
  ])
  logs.value    = l.data
  vaccines.value = v.data
})

async function addLog() {
  if (!logForm.value.date || !logForm.value.weightKg) return
  const { data } = await healthService.addLog(petId, logForm.value)
  logs.value.unshift(data)
  logForm.value = { date: '', weightKg: '', notes: '' }
}

async function removeLog(id) {
  await healthService.deleteLog(id)
  logs.value = logs.value.filter(l => l._id !== id)
}

async function addVacc() {
  const { data } = await healthService.addVaccine(petId, vaccForm.value)
  vaccines.value.unshift(data)
  showVacc.value = false
  vaccForm.value = { vaccineName: '', dateGiven: '', nextDueDate: '', vetName: '' }
}
</script>
