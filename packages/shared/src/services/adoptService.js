import api from '../api.js'

export const adoptService = {
  // Public adoption listing
  list:           (params)   => api.get('/adopt', { params }),
  get:            (id)       => api.get(`/adopt/${id}`),

  // Shelter staff — their own listings
  myListings:     ()         => api.get('/adopt/mine'),

  // Applications
  apply:          (data)     => api.post('/applications', data),
  myApplications: ()         => api.get('/applications/mine'),
  staffList:      (params)   => api.get('/applications/staff', { params }),
  updateStatus:   (id, data) => api.put(`/applications/${id}/status`, data),
}
