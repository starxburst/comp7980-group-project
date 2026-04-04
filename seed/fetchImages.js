/**
 * seed/fetchImages.js
 *
 * Downloads real images from public APIs and uploads them to MinIO.
 * Saves all resulting URLs to seed/images.json which seed.js reads.
 *
 * Run once before seeding:  npm run fetch-images
 *
 * Image sources:
 *   avatars  → randomuser.me  (real human portrait photos)
 *   dogs     → dog.ceo API    (real dog breed photos)
 *   cats     → thecatapi.com  (real cat photos)
 *   events   → picsum.photos  (reliable stock photography)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') })

const { S3Client, HeadBucketCommand, CreateBucketCommand, PutBucketPolicyCommand } = require('@aws-sdk/client-s3')
const { Upload } = require('@aws-sdk/lib-storage')
const crypto = require('crypto')
const path   = require('path')
const fs     = require('fs')

// ─── MinIO client ─────────────────────────────────────────────────────────────
const ENDPOINT = process.env.MINIO_ENDPOINT || 'http://localhost:9000'

const s3 = new S3Client({
  endpoint: ENDPOINT,
  region: 'us-east-1',
  credentials: {
    accessKeyId:     process.env.MINIO_ACCESS_KEY || 'petstagram',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'petstagram123',
  },
  forcePathStyle: true,
})

const BUCKETS = ['avatars', 'posts', 'pets', 'events']

// ─── Ensure buckets exist and are public ─────────────────────────────────────
async function ensureBuckets() {
  for (const bucket of BUCKETS) {
    try {
      await s3.send(new HeadBucketCommand({ Bucket: bucket }))
    } catch {
      console.log(`  Creating bucket: ${bucket}`)
      await s3.send(new CreateBucketCommand({ Bucket: bucket }))
    }
    const policy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [{
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action:    ['s3:GetObject'],
        Resource:  [`arn:aws:s3:::${bucket}/*`],
      }],
    })
    await s3.send(new PutBucketPolicyCommand({ Bucket: bucket, Policy: policy }))
  }
  console.log('  ✓ Buckets ready')
}

// ─── Download with timeout + retry ───────────────────────────────────────────
async function downloadBuffer(url, attempt = 1) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15_000)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return Buffer.from(await res.arrayBuffer())
  } catch (err) {
    if (attempt < 3) {
      console.warn(`    ↩ retry ${attempt} for ${url}`)
      await new Promise(r => setTimeout(r, 1000 * attempt))
      return downloadBuffer(url, attempt + 1)
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

// ─── Upload buffer to MinIO ───────────────────────────────────────────────────
async function uploadBuffer(buffer, bucket, contentType = 'image/jpeg') {
  const ext = contentType === 'image/png' ? '.png' : '.jpg'
  const key = `seed-${crypto.randomUUID()}${ext}`
  await new Upload({
    client: s3,
    params: { Bucket: bucket, Key: key, Body: buffer, ContentType: contentType },
  }).done()
  return `${ENDPOINT}/${bucket}/${key}`
}

// ─── Fetch a URL, upload to MinIO, return final URL ──────────────────────────
async function fetchAndUpload(url, bucket, label) {
  process.stdout.write(`    ${label} … `)
  try {
    const buf = await downloadBuffer(url)
    const minioUrl = await uploadBuffer(buf, bucket)
    console.log('✓')
    return minioUrl
  } catch (err) {
    console.log(`✗ (${err.message})`)
    return null
  }
}

// ─── Image sources ────────────────────────────────────────────────────────────

// 25 user avatar URLs — randomuser.me serves actual face photos, very reliable
function avatarUrls() {
  const urls = []
  for (let i = 1; i <= 13; i++) urls.push(`https://randomuser.me/api/portraits/men/${i}.jpg`)
  for (let i = 1; i <= 12; i++) urls.push(`https://randomuser.me/api/portraits/women/${i}.jpg`)
  return urls
}

// 25 dog photos from the Dog CEO API (returns real breed photos)
async function fetchDogUrls(count = 25) {
  const res  = await fetch(`https://dog.ceo/api/breeds/image/random/${count}`)
  const json = await res.json()
  return json.message   // array of direct image URLs
}

// 20 cat photos from TheCatAPI (no key needed for basic use)
async function fetchCatUrls(count = 20) {
  const res  = await fetch(`https://api.thecatapi.com/v1/images/search?limit=${count}&size=med`)
  const json = await res.json()
  return json.map(img => img.url)
}

// 10 event cover images — picsum.photos by known IDs (always returns 200)
function eventUrls() {
  const ids = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
  return ids.map(id => `https://picsum.photos/id/${id}/800/400`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🖼️  Petstagram image fetcher\n')

  console.log('Checking MinIO buckets…')
  await ensureBuckets()

  // Gather source URLs
  console.log('\nFetching image lists from APIs…')
  const [dogUrls, catUrls] = await Promise.all([
    fetchDogUrls(25).catch(() => {
      console.warn('  dog.ceo failed, falling back to picsum')
      return Array.from({ length: 25 }, (_, i) => `https://picsum.photos/id/${200 + i}/500/500`)
    }),
    fetchCatUrls(20).catch(() => {
      console.warn('  thecatapi failed, falling back to picsum')
      return Array.from({ length: 20 }, (_, i) => `https://picsum.photos/id/${300 + i}/500/500`)
    }),
  ])
  console.log(`  ✓ ${dogUrls.length} dog URLs, ${catUrls.length} cat URLs`)

  const results = { avatars: [], dogs: [], cats: [], events: [] }

  // ── Avatars ────────────────────────────────────────────────────────────────
  console.log('\nUploading avatars…')
  for (const [i, url] of avatarUrls().entries()) {
    const minioUrl = await fetchAndUpload(url, 'avatars', `avatar ${i + 1}`)
    if (minioUrl) results.avatars.push(minioUrl)
  }

  // ── Dog photos ────────────────────────────────────────────────────────────
  console.log('\nUploading dog photos…')
  for (const [i, url] of dogUrls.entries()) {
    const ext = url.endsWith('.png') ? 'image/png' : 'image/jpeg'
    process.stdout.write(`    dog ${i + 1} … `)
    try {
      const buf = await downloadBuffer(url)
      const minioUrl = await uploadBuffer(buf, 'pets', ext)
      results.dogs.push(minioUrl)
      console.log('✓')
    } catch (err) {
      console.log(`✗ (${err.message})`)
    }
  }

  // ── Cat photos ────────────────────────────────────────────────────────────
  console.log('\nUploading cat photos…')
  for (const [i, url] of catUrls.entries()) {
    const ext = url.endsWith('.png') ? 'image/png' : 'image/jpeg'
    process.stdout.write(`    cat ${i + 1} … `)
    try {
      const buf = await downloadBuffer(url)
      const minioUrl = await uploadBuffer(buf, 'pets', ext)
      results.cats.push(minioUrl)
      console.log('✓')
    } catch (err) {
      console.log(`✗ (${err.message})`)
    }
  }

  // ── Event covers ──────────────────────────────────────────────────────────
  console.log('\nUploading event covers…')
  for (const [i, url] of eventUrls().entries()) {
    const minioUrl = await fetchAndUpload(url, 'events', `event ${i + 1}`)
    if (minioUrl) results.events.push(minioUrl)
  }

  // ── Save results ──────────────────────────────────────────────────────────
  const outPath = path.join(__dirname, 'images.json')
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2))

  console.log('\n✅ Done!')
  console.log(`   avatars : ${results.avatars.length}`)
  console.log(`   dogs    : ${results.dogs.length}`)
  console.log(`   cats    : ${results.cats.length}`)
  console.log(`   events  : ${results.events.length}`)
  console.log(`   saved   : seed/images.json`)
}

main().catch(err => {
  console.error('\nFetch failed:', err.message)
  process.exit(1)
})
