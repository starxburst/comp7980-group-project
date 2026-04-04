import * as mobilenet from '@tensorflow-models/mobilenet'
import '@tensorflow/tfjs'

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

export async function detectBreed(imgElement) {
  if (!cachedModel) cachedModel = await mobilenet.load({ version: 2, alpha: 1.0 })
  const predictions = await cachedModel.classify(imgElement, 3)
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
