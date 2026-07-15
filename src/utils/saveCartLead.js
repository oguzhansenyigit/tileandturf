/**
 * Soft-save cart + email for abandoned-cart reminders.
 */
import axios from 'axios'
import { getAnalyticsSessionId } from './siteAnalytics'

let lastKey = ''
let lastAt = 0

/**
 * @param {{ email: string, items: any[], source?: 'cart'|'checkout' }} opts
 */
export async function saveCartLead({ email, items, source = 'cart' } = {}) {
  const trimmed = String(email || '').trim().toLowerCase()
  if (!trimmed || !/\S+@\S+\.\S+/.test(trimmed)) {
    return { ok: false, error: 'invalid_email' }
  }
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: 'empty_cart' }
  }

  const key = `${trimmed}|${source}|${items.map((i) => i.id).join(',')}|${items.length}`
  const now = Date.now()
  if (key === lastKey && now - lastAt < 4000) {
    return { ok: true, deduped: true }
  }
  lastKey = key
  lastAt = now

  try {
    const res = await axios.post('/api/save-cart-lead.php', {
      session_id: getAnalyticsSessionId(),
      email: trimmed,
      items,
      source,
    })
    return { ok: !!res.data?.success }
  } catch {
    return { ok: false, error: 'network' }
  }
}
