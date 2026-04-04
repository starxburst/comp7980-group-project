import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../api.js'

export const usePetsStore = defineStore('pets', () => {
  const myPets  = ref([])
  const loading = ref(false)
  const error   = ref(null)

  async function fetchMyPets() {
    loading.value = true
    error.value   = null
    try {
      const { data } = await api.get('/my-pets')
      myPets.value = data
    } catch (err) {
      error.value = err.response?.data?.message || err.message
    } finally {
      loading.value = false
    }
  }

  async function createPet(formData) {
    const { data } = await api.post('/my-pets', formData)
    myPets.value.unshift(data)
    return data
  }

  async function updatePet(id, formData) {
    const { data } = await api.put(`/my-pets/${id}`, formData)
    const idx = myPets.value.findIndex(p => p._id === id)
    if (idx !== -1) myPets.value[idx] = data
    return data
  }

  async function deletePet(id) {
    await api.delete(`/my-pets/${id}`)
    myPets.value = myPets.value.filter(p => p._id !== id)
  }

  return { myPets, loading, error, fetchMyPets, createPet, updatePet, deletePet }
})
