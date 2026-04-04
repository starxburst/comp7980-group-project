import { usePetsStore } from '../stores/pets.js'

export function usePets() {
  const store = usePetsStore()
  return {
    myPets:     store.myPets,
    loading:    store.loading,
    fetchMyPets: store.fetchMyPets,
    createPet:  store.createPet,
    updatePet:  store.updatePet,
    deletePet:  store.deletePet,
  }
}
