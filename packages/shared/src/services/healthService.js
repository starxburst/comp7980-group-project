import api from '../api.js'

export const healthService = {
  getLogs:    (petId)         => api.get(`/health/${petId}/logs`),
  addLog:     (petId, data)   => api.post(`/health/${petId}/logs`, data),
  deleteLog:  (id)            => api.delete(`/health/logs/${id}`),
  getVaccines: (petId)        => api.get(`/vaccinations/${petId}`),
  addVaccine:  (petId, data)  => api.post(`/vaccinations/${petId}`, data),
  updateVaccine: (id, data)   => api.put(`/vaccinations/${id}`, data),
  removeVaccine: (id)         => api.delete(`/vaccinations/${id}`),
}
