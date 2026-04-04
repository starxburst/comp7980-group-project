export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-HK', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-HK', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export function formatWeight(kg) {
  return `${Number(kg).toFixed(1)} kg`
}

const publicMinioBaseUrl = import.meta.env.VITE_MINIO_URL || 'http://localhost:9000'
const placeholderSvg = (label, accent, background) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
      <rect width="160" height="160" rx="28" fill="${background}"/>
      <circle cx="80" cy="62" r="26" fill="${accent}" opacity="0.92"/>
      <path d="M42 126c8-20 26-32 38-32s30 12 38 32" fill="${accent}" opacity="0.78"/>
      <text x="80" y="145" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#ffffff">${label}</text>
    </svg>
  `
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`
}

const PLACEHOLDER_IMAGES = {
  avatar: placeholderSvg('USER', '#f59e0b', '#1f2937'),
  pet: placeholderSvg('PET', '#fb923c', '#111827'),
  post: placeholderSvg('POST', '#38bdf8', '#0f172a'),
}

export function placeholderImage(type = 'pet') {
  return PLACEHOLDER_IMAGES[type] || PLACEHOLDER_IMAGES.pet
}

export function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7)   return `${days}d ago`
  return formatDate(dateStr)
}

export function fileUrl(url, type = 'post') {
  if (!url) return placeholderImage(type)

  if (url.startsWith('http://minio:9000/')) {
    return url.replace('http://minio:9000', publicMinioBaseUrl)
  }

  if (url.startsWith('https://minio:9000/')) {
    return url.replace('https://minio:9000', publicMinioBaseUrl)
  }

  return url || placeholderImage(type)
}

export function onImageError(event, type = 'pet') {
  const fallback = placeholderImage(type)
  if (event?.target && event.target.src !== fallback) {
    event.target.src = fallback
  }
}
