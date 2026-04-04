import api from '../api.js'

export const postService = {
  feed:     (params = {}) => api.get('/posts/feed', { params }),
  recommendations: (params = {}) => api.get('/posts/recommendations', { params }),
  explore:  (type)        => api.get('/posts/explore', { params: { type } }),
  getOne:   (id)          => api.get(`/posts/${id}`),
  create:   (formData)    => api.post('/posts', formData),
  like:     (id)          => api.post(`/posts/${id}/like`),
  comment:  (id, payload) => api.post(`/posts/${id}/comments`, payload),
  remove:   (id)          => api.delete(`/posts/${id}`),
  byUser:   (userId)      => api.get(`/posts/user/${userId}`),
}
