/**
 * First-touch traffic attribution (paid vs organic).
 */
const ATTR_KEY = 'tt_first_touch_attr'

function readStoredAttribution() {
  try {
    const raw = localStorage.getItem(ATTR_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function writeStoredAttribution(attr) {
  try {
    localStorage.setItem(ATTR_KEY, JSON.stringify(attr))
  } catch {
    // ignore
  }
}

/**
 * Capture UTM / gclid / referrer on first visit of this browser profile.
 * Does not overwrite an existing first-touch record.
 */
export function captureFirstTouchAttribution() {
  if (typeof window === 'undefined') return null

  const existing = readStoredAttribution()
  if (existing?.captured_at) {
    return existing
  }

  let params
  try {
    params = new URLSearchParams(window.location.search || '')
  } catch {
    params = new URLSearchParams()
  }

  const attr = {
    utm_source: (params.get('utm_source') || '').slice(0, 120),
    utm_medium: (params.get('utm_medium') || '').slice(0, 120),
    utm_campaign: (params.get('utm_campaign') || '').slice(0, 180),
    gclid: (params.get('gclid') || params.get('gbraid') || params.get('wbraid') || '').slice(0, 120),
    landing_path: `${window.location.pathname || '/'}${window.location.search || ''}`.slice(0, 500),
    referrer: (document.referrer || '').slice(0, 500),
    captured_at: Date.now(),
  }

  writeStoredAttribution(attr)
  return attr
}

export function getFirstTouchAttribution() {
  return captureFirstTouchAttribution() || readStoredAttribution() || {}
}

/** Fields to send with checkout / tracking payloads. */
export function getAttributionPayload() {
  const a = getFirstTouchAttribution() || {}
  return {
    utm_source: a.utm_source || '',
    utm_medium: a.utm_medium || '',
    utm_campaign: a.utm_campaign || '',
    gclid: a.gclid || '',
    landing_path: a.landing_path || '',
    referrer: a.referrer || '',
  }
}
