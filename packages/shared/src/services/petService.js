import api from '../api.js'

export const petService = {
  list:   ()            => api.get('/my-pets'),
  get:    (id)          => api.get(`/my-pets/${id}`),
  create: (formData)    => api.post('/my-pets', formData),
  update: (id, formData)=> api.put(`/my-pets/${id}`, formData),
  remove:      (id)       => api.delete(`/my-pets/${id}`),
  setAdoption: (id, data) => api.patch(`/my-pets/${id}/adoption`, data),
}
