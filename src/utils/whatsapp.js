import axios from 'axios'

export const DEFAULT_WHATSAPP_URL = 'https://wa.me/15167741808'
export const DEFAULT_WHATSAPP_MESSAGE = 'Hello, I need support with your products.'

/** wa.me/+15167741808 → https://wa.me/15167741808 */
export function normalizeWhatsAppUrl(url) {
  if (!url || typeof url !== 'string') return DEFAULT_WHATSAPP_URL

  const trimmed = url.trim()
  const waMatch = trimmed.match(/wa\.me\/\+?(\d+)/i)
  if (waMatch) {
    return `https://wa.me/${waMatch[1]}`
  }

  const digits = trimmed.replace(/\D/g, '')
  if (digits.length >= 10) {
    return `https://wa.me/${digits}`
  }

  return trimmed.startsWith('http') ? trimmed : DEFAULT_WHATSAPP_URL
}

export function buildWhatsAppLink(baseUrl, message) {
  const base = normalizeWhatsAppUrl(baseUrl)
  if (!message) return base
  const separator = base.includes('?') ? '&' : '?'
  return `${base}${separator}text=${encodeURIComponent(message)}`
}

let cachedWhatsAppUrl = null
let fetchPromise = null

export async function fetchWhatsAppUrl() {
  if (cachedWhatsAppUrl) return cachedWhatsAppUrl

  if (!fetchPromise) {
    fetchPromise = axios
      .get('/api/social-media.php')
      .then((response) => {
        const items = Array.isArray(response.data) ? response.data : []
        const whatsapp = items.find((item) => item.platform === 'whatsapp')
        cachedWhatsAppUrl = normalizeWhatsAppUrl(whatsapp?.url)
        return cachedWhatsAppUrl
      })
      .catch(() => {
        cachedWhatsAppUrl = DEFAULT_WHATSAPP_URL
        return cachedWhatsAppUrl
      })
  }

  return fetchPromise
}

export function openWhatsApp(url, message = DEFAULT_WHATSAPP_MESSAGE) {
  window.open(buildWhatsAppLink(url, message), '_blank', 'noopener,noreferrer')
}
