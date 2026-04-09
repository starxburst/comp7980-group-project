import * as mobilenet from '@tensorflow-models/mobilenet'
import * as tf from '@tensorflow/tfjs'

const BREED_TYPE_MAP = {
  'chow':       'Dog', 'samoyed': 'Dog', 'husky':    'Dog', 'elkhound':  'Dog',
  'malamute':   'Dog', 'retriever':'Dog','labrador': 'Dog', 'poodle':    'Dog',
  'beagle':     'Dog', 'shepherd': 'Dog','collie':   'Dog', 'terrier':   'Dog',
  'hound':      'Dog', 'spaniel':  'Dog','akita':    'Dog', 'pomeranian':'Dog',
  'doberman':   'Dog', 'rottweiler':'Dog','schnauzer':'Dog','dachshund': 'Dog',
  'boxer':      'Dog', 'chihuahua':'Dog','corgi':    'Dog', 'whippet':   'Dog',
  'tabby':      'Cat', 'siamese':  'Cat','persian':  'Cat', 'ragdoll':   'Cat',
  'burmese':    'Cat', 'bengal':   'Cat','sphynx':   'Cat', 'abyssinian':'Cat',
  'manx':       'Cat', 'birman':   'Cat',
}

let cachedModel = null
let cachedModelPromise = null

const MODEL_LOAD_TIMEOUT_MS = 20000

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

async function getModel() {
  if (cachedModel) return cachedModel

  if (!cachedModelPromise) {
    cachedModelPromise = (async () => {
      await tf.ready()
      const model = await withTimeout(
        mobilenet.load({ version: 2, alpha: 1.0 }),
        MODEL_LOAD_TIMEOUT_MS,
        'Breed model took too long to load. The current MobileNet setup is likely waiting on a blocked model download.'
      )
      cachedModel = model
      return model
    })().catch(error => {
      cachedModelPromise = null
      throw error
    })
  }

  return cachedModelPromise
}

export async function detectBreed(imgElement) {
  if (typeof window === 'undefined') {
    throw new Error('Breed detection only runs in the browser')
  }

  const model = await getModel()
  const predictions = await model.classify(imgElement, 3)
  let detectedType = ''
  for (const pred of predictions) {
    const lower = pred.className.toLowerCase()
    if (lower.includes('dog')) { detectedType = 'Dog'; break }
    if (lower.includes('cat')) { detectedType = 'Cat'; break }
    for (const [kw, type] of Object.entries(BREED_TYPE_MAP)) {
      if (lower.includes(kw)) { detectedType = type; break }
    }
    if (detectedType) break
  }
  return {
    breed:          predictions[0].className.split(',')[0],
    type:           detectedType || 'Unknown',
    confidence:     Math.round(predictions[0].probability * 100),
    topPredictions: predictions,
  }
}
