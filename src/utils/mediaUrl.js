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

export { PLACEHOLDER_IMAGE }
