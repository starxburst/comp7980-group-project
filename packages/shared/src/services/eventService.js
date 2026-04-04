import api from '../api.js'

export const eventService = {
  list:             ()             => api.get('/events'),
  get:              (id)           => api.get(`/events/${id}`),
  create:           (formData)     => api.post('/events', formData),
  update:           (id, fd)       => api.put(`/events/${id}`, fd),
  remove:           (id)           => api.delete(`/events/${id}`),
  rsvp:             (id, data)     => api.post(`/events/${id}/rsvp`, data),
  cancelRsvp:       (id)           => api.delete(`/events/${id}/rsvp`),
  removeAttendee:   (id, userId)   => api.delete(`/events/${id}/attendees/${userId}`),
}
