const {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
} = require('@aws-sdk/client-s3')
const { Upload } = require('@aws-sdk/lib-storage')
const s3     = require('../config/minio')
const path   = require('path')
const crypto = require('crypto')

const MIME_MAP = {
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.webp': 'image/webp',
  '.mp4':  'video/mp4',
}

const ensuredBuckets = new Set()
const bucketSetupTasks = new Map()
const publicMinioBaseUrl =
  process.env.MINIO_PUBLIC_URL ||
  process.env.VITE_MINIO_URL ||
  process.env.MINIO_ENDPOINT

function buildPublicReadPolicy(bucket) {
  return JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'PublicReadGetObject',
        Effect: 'Allow',
        Principal: '*',
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucket}/*`],
      },
    ],
  })
}

async function ensureBucketExists(bucket) {
  if (ensuredBuckets.has(bucket)) return
  if (bucketSetupTasks.has(bucket)) return bucketSetupTasks.get(bucket)

  const task = (async () => {
    try {
      await s3.send(new HeadBucketCommand({ Bucket: bucket }))
    } catch (error) {
      const statusCode = error?.$metadata?.httpStatusCode
      const errorName = error?.name || error?.Code
      const missingBucket =
        statusCode === 404 ||
        errorName === 'NotFound' ||
        errorName === 'NoSuchBucket'

      if (!missingBucket) throw error

      await s3.send(new CreateBucketCommand({ Bucket: bucket }))
      await s3.send(new PutBucketPolicyCommand({
        Bucket: bucket,
        Policy: buildPublicReadPolicy(bucket),
      }))
    }

    ensuredBuckets.add(bucket)
  })()

  bucketSetupTasks.set(bucket, task)

  try {
    await task
  } finally {
    bucketSetupTasks.delete(bucket)
  }
}

async function uploadFile(buffer, originalName, bucket) {
  await ensureBucketExists(bucket)

  const ext = path.extname(originalName).toLowerCase()
  const key = `${crypto.randomUUID()}${ext}`
  await new Upload({
    client: s3,
    params: {
      Bucket:      bucket,
      Key:         key,
      Body:        buffer,
      ContentType: MIME_MAP[ext] || 'application/octet-stream',
    }
  }).done()
  return `${publicMinioBaseUrl}/${bucket}/${key}`
}

module.exports = { uploadFile, ensureBucketExists }
