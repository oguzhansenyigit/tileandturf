const PLACEHOLDER_IMAGE = '/slider.webp'

/** Build absolute URL for product/media paths (works in normal and incognito). */
export function resolveMediaUrl(url) {
  if (url == null || url === '') return ''
  const trimmed = String(url).trim()
  if (!trimmed) return ''

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`
  }

  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${path}`
  }
  return path
}

export function productImageSrc(url) {
  const resolved = resolveMediaUrl(url)
  return resolved || PLACEHOLDER_IMAGE
}

/** Preload images in the background (faster color / gallery switches). */
export function preloadImages(urls) {
  const seen = new Set()
  for (const url of urls) {
    const src = resolveMediaUrl(url)
    if (!src || seen.has(src)) continue
    seen.add(src)
    const img = new Image()
    img.decoding = 'async'
    img.src = src
  }
}

export { PLACEHOLDER_IMAGE }
