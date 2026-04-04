<template>
  <div class="container py-4">
    <div class="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
      <div>
        <h4 class="fw-bold mb-1">Adoption Applications</h4>
        <div class="text-muted small">
          Showing {{ apps.length }} of {{ total }} applications
        </div>
      </div>
      <div class="d-flex flex-wrap gap-2 align-items-end">
        <div>
          <label class="form-label small mb-1">Status</label>
          <select v-model="filters.status" class="form-select form-select-sm">
            <option value="">All statuses</option>
            <option value="pending">pending</option>
            <option value="reviewing">reviewing</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
          </select>
        </div>
        <div>
          <label class="form-label small mb-1">Pet</label>
          <input
            v-model="filters.pet"
            class="form-control form-control-sm"
            type="text"
            placeholder="Search pet name"
          />
        </div>
        <button class="btn btn-primary btn-sm" @click="applyFilters" :disabled="loading">
          Filter
        </button>
        <button class="btn btn-outline-secondary btn-sm" @click="resetFilters" :disabled="loading">
          Reset
        </button>
      </div>
    </div>
    <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
    <div v-else-if="!apps.length" class="text-center text-muted py-5">No applications yet.</div>
    <div v-else class="d-none d-md-block table-responsive">
      <table class="table table-hover align-middle">
        <thead class="table-light">
          <tr>
            <th>Pet</th><th>Applicant</th><th>Contact</th>
            <th>Home</th><th>Reason</th><th>Status</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="app in apps" :key="app._id">
            <td>
              <div class="d-flex align-items-center gap-2">
                <img :src="fileUrl(app.pet?.photos?.[0], 'pet')"
                     width="40" height="40" class="rounded" style="object-fit:cover" />
                <div>
                  <div class="fw-semibold small">{{ app.pet?.name }}</div>
                  <span class="badge"
                        :class="statusBadgeClass(app.pet?.adoptionStatus)">
                    {{ app.pet?.adoptionStatus }}
                  </span>
                </div>
              </div>
            </td>
            <td>
              <div class="d-flex align-items-center gap-2">
                <img :src="fileUrl(app.applicant?.avatar, 'avatar')"
                     width="32" height="32" class="rounded-circle" style="object-fit:cover" />
                <span class="small">{{ app.applicant?.name }}</span>
              </div>
            </td>
            <td class="small">
              <a v-if="app.contactEmail" :href="`mailto:${app.contactEmail}`">
                {{ app.contactEmail }}
              </a>
              <span v-else class="text-muted">—</span>
            </td>
            <td class="small">{{ app.applicantInfo?.homeType || '—' }}</td>
            <td class="small">
              <div class="text-muted shelter-applications__reason" :title="app.applicantInfo?.reason || '—'">
                {{ app.applicantInfo?.reason || '—' }}
              </div>
            </td>
            <td>
              <span class="badge"
                    :class="{ 'bg-warning text-dark': app.status==='pending',
                               'bg-info text-dark':   app.status==='reviewing',
                               'bg-success':           app.status==='approved',
                               'bg-danger':            app.status==='rejected' }">
                {{ app.status }}
              </span>
            </td>
            <td>
              <div class="d-flex gap-1 flex-wrap">
                <button class="btn btn-outline-info btn-sm"
                        @click="updateStatus(app, 'reviewing')"
                        :disabled="app.status !== 'pending'">Review</button>
                <button class="btn btn-success btn-sm"
                        @click="updateStatus(app, 'approved')"
                        :disabled="app.status === 'approved' || app.status === 'rejected'">Approve</button>
                <button class="btn btn-danger btn-sm"
                        @click="updateStatus(app, 'rejected')"
                        :disabled="app.status === 'approved' || app.status === 'rejected'">Reject</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="!loading && apps.length" class="d-md-none shelter-applications-mobile">
      <article v-for="app in apps" :key="app._id" class="shelter-app-card">
        <div class="d-flex align-items-start justify-content-between gap-3 mb-3">
          <div class="d-flex align-items-center gap-3">
            <img
              :src="fileUrl(app.pet?.photos?.[0], 'pet')"
              width="52"
              height="52"
              class="rounded-3"
              style="object-fit:cover"
            />
            <div>
              <div class="fw-semibold">{{ app.pet?.name }}</div>
              <div class="small text-muted">{{ app.applicant?.name || 'Unknown applicant' }}</div>
            </div>
          </div>
          <span
            class="badge"
            :class="{ 'bg-warning text-dark': app.status==='pending',
                       'bg-info text-dark':   app.status==='reviewing',
                       'bg-success':           app.status==='approved',
                       'bg-danger':            app.status==='rejected' }"
          >
            {{ app.status }}
          </span>
        </div>

        <div class="shelter-app-card__meta">
          <div>
            <div class="shelter-app-card__label">Pet status</div>
            <span class="badge" :class="statusBadgeClass(app.pet?.adoptionStatus)">
              {{ app.pet?.adoptionStatus }}
            </span>
          </div>
          <div>
            <div class="shelter-app-card__label">Home</div>
            <div>{{ app.applicantInfo?.homeType || '—' }}</div>
          </div>
          <div>
            <div class="shelter-app-card__label">Contact</div>
            <a v-if="app.contactEmail" :href="`mailto:${app.contactEmail}`" class="small text-break">
              {{ app.contactEmail }}
            </a>
            <span v-else class="text-muted">—</span>
          </div>
        </div>

        <div class="mt-3">
          <div class="shelter-app-card__label mb-1">Reason</div>
          <div class="small text-muted">{{ app.applicantInfo?.reason || '—' }}</div>
        </div>

        <div class="d-flex gap-2 flex-wrap mt-3">
          <button class="btn btn-outline-info btn-sm"
                  @click="updateStatus(app, 'reviewing')"
                  :disabled="app.status !== 'pending'">Review</button>
          <button class="btn btn-success btn-sm"
                  @click="updateStatus(app, 'approved')"
                  :disabled="app.status === 'approved' || app.status === 'rejected'">Approve</button>
          <button class="btn btn-danger btn-sm"
                  @click="updateStatus(app, 'rejected')"
                  :disabled="app.status === 'approved' || app.status === 'rejected'">Reject</button>
        </div>
      </article>
    </div>

    <div v-if="totalPages > 1" class="d-flex justify-content-between align-items-center mt-3">
      <div class="small text-muted">
        Page {{ page }} of {{ totalPages }}
      </div>
      <div class="btn-group">
        <button class="btn btn-outline-secondary btn-sm" @click="goToPage(page - 1)" :disabled="page <= 1 || loading">
          Previous
        </button>
        <button class="btn btn-outline-secondary btn-sm" @click="goToPage(page + 1)" :disabled="page >= totalPages || loading">
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { adoptService }   from '@shared/services/adoptService.js'
import { fileUrl }        from '@shared/utils/formatters.js'

const apps    = ref([])
const loading = ref(true)
const page = ref(1)
const limit = ref(6)
const total = ref(0)
const totalPages = ref(1)
const filters = ref({ status: '', pet: '' })

function statusBadgeClass(s) {
  return { available: 'bg-success', pending: 'bg-warning text-dark', adopted: 'bg-secondary' }[s] || 'bg-light text-dark'
}

onMounted(async () => {
  await loadApps()
})

async function loadApps() {
  loading.value = true
  try {
    const { data } = await adoptService.staffList({
      page: page.value,
      limit: limit.value,
      status: filters.value.status || undefined,
      pet: filters.value.pet || undefined,
    })
    apps.value = data.data
    total.value = data.meta.total
    totalPages.value = data.meta.totalPages
    page.value = data.meta.page
  } finally {
    loading.value = false
  }
}

async function applyFilters() {
  page.value = 1
  await loadApps()
}

async function resetFilters() {
  filters.value = { status: '', pet: '' }
  page.value = 1
  await loadApps()
}

async function goToPage(nextPage) {
  if (nextPage < 1 || nextPage > totalPages.value) return
  page.value = nextPage
  await loadApps()
}

async function updateStatus(app, status) {
  const { data } = await adoptService.updateStatus(app._id, { status })
  const idx = apps.value.findIndex(a => a._id === app._id)
  if (idx !== -1) {
    apps.value[idx] = { ...apps.value[idx], status: data.status }
    if (status === 'approved' && apps.value[idx].pet)
      apps.value[idx].pet.adoptionStatus = 'adopted'
  }
}
</script>

<style scoped>
.shelter-applications__reason {
  max-width: 260px;
  white-space: normal;
  word-break: break-word;
}

.shelter-applications-mobile {
  display: grid;
  gap: 1rem;
}

.shelter-app-card {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 22px;
  background: rgba(22, 26, 31, 0.88);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.28);
  padding: 1rem;
}

.shelter-app-card__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem 1rem;
}

.shelter-app-card__label {
  color: var(--ps-text-muted);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

@media (max-width: 575px) {
  .shelter-app-card__meta {
    grid-template-columns: 1fr;
  }
}
</style>
