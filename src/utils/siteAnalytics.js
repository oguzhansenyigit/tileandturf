/**
 * Site analytics: presence, page/product hits, funnel events.
 */
import axios from 'axios'

const SESSION_KEY = 'tt_analytics_sid'

let liveProductId = null
let lastPath = ''
let lastAt = 0
let lastProductId = null

export function getAnalyticsSessionId() {
  try {
    let id = localStorage.getItem(SESSION_KEY)
    if (!id) {
      id = `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
      localStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    return `v_${Date.now().toString(36)}`
  }
}

/** Keep current product id for heartbeats while on a product page. */
export function setLiveProductId(productId) {
  liveProductId = productId && Number(productId) > 0 ? Number(productId) : null
}

export function trackPageView({ path, productId = null } = {}) {
  const pathname = path || (typeof window !== 'undefined' ? window.location.pathname : '/')
  if (pathname.startsWith('/admin')) return

  const pid = productId && Number(productId) > 0 ? Number(productId) : null
  if (pathname.startsWith('/product/') && pid) {
    setLiveProductId(pid)
  } else if (!pathname.startsWith('/product/')) {
    setLiveProductId(null)
  }

  const now = Date.now()
  // Allow productId enrichment through even if App already hit same path
  if (
    pathname === lastPath &&
    now - lastAt < 1500 &&
    (!pid || pid === lastProductId)
  ) {
    return
  }
  lastPath = pathname
  lastAt = now
  lastProductId = pid

  const payload = {
    session_id: getAnalyticsSessionId(),
    path: pathname,
    referrer: typeof document !== 'undefined' ? document.referrer || '' : '',
  }
  if (pid) payload.product_id = pid

  axios.post('/api/track-visitor.php', payload).catch(() => {})
}

export function trackHeartbeat() {
  const pathname =
    typeof window !== 'undefined' ? window.location.pathname : '/'
  if (pathname.startsWith('/admin')) return

  const payload = {
    session_id: getAnalyticsSessionId(),
    path: pathname,
    referrer: typeof document !== 'undefined' ? document.referrer || '' : '',
    heartbeat: true,
  }
  if (liveProductId) payload.product_id = liveProductId

  axios.post('/api/track-visitor.php', payload).catch(() => {})
}

/**
 * @param {'view_product'|'add_to_cart'|'begin_checkout'|'purchase'} event
 * @param {{ productId?: number, orderId?: number }} [opts]
 */
export function trackFunnelEvent(event, opts = {}) {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
    return
  }
  const payload = {
    session_id: getAnalyticsSessionId(),
    event,
  }
  if (opts.productId) payload.product_id = Number(opts.productId)
  if (opts.orderId) payload.order_id = Number(opts.orderId)

  axios.post('/api/track-funnel.php', payload).catch(() => {})
}
