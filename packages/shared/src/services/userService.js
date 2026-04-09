import api from '../api.js'

export const userService = {
  search: (params = {}) => api.get('/users/search', { params }),
  profile: (id) => api.get(`/users/${id}`),
}
