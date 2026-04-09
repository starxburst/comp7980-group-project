import { ref } from 'vue'
import { detectBreed } from '../utils/breedDetector.js'

const IMAGE_LOAD_TIMEOUT_MS = 15000
const DETECTION_TIMEOUT_MS = 30000

function withTimeout(promise, ms, message) {
  let timeoutId
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), ms)
  })

  return Promise.race([
    promise.finally(() => window.clearTimeout(timeoutId)),
    timeoutPromise,
  ])
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No image file selected'))
      return
    }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Unable to read the selected image'))
    reader.onload = () => {
      const image = new Image()
      image.decoding = 'async'
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('Unable to load the selected image'))
      image.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

export function useBreedDetect() {
  const detecting = ref(false)
  const detectionError = ref('')
  const detectionResult = ref(null)

  async function detectFromFile(file) {
    detecting.value = true
    detectionError.value = ''

    try {
      const image = await withTimeout(
        loadImageFromFile(file),
        IMAGE_LOAD_TIMEOUT_MS,
        'Selected image took too long to load in the browser. Please try another photo.'
      )
      const result = await withTimeout(
        detectBreed(image),
        DETECTION_TIMEOUT_MS,
        'Breed detection timed out in the browser. Please retry or use a smaller image.'
      )
      detectionResult.value = result
      return result
    } catch (error) {
      detectionResult.value = null
      detectionError.value = error.message || 'Breed detection failed'
      return null
    } finally {
      detecting.value = false
    }
  }

  function clearDetection() {
    detectionError.value = ''
    detectionResult.value = null
  }

  return {
    detecting,
    error: detectionError,
    result: detectionResult,
    detectionError,
    detectionResult,
    detectFromFile,
    clearDetection,
  }
}
