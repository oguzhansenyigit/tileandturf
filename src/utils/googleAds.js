import axios from 'axios'

const DEFAULT_CONFIG = {
  enabled: false,
  tagId: '',
  purchaseLabel: '',
}

let configPromise = null
let initPromise = null

const validTagId = (value) => /^AW-\d+$/.test(String(value || '').trim())
const validLabel = (value) => /^[A-Za-z0-9_-]+$/.test(String(value || '').trim())

export const getGoogleAdsConfig = () => {
  if (!configPromise) {
    configPromise = axios
      .get('/api/admin/settings.php')
      .then(({ data }) => ({
        enabled: data?.google_ads_status === 'active',
        tagId: String(data?.google_ads_tag_id || '').trim(),
        purchaseLabel: String(data?.google_ads_purchase_label || '').trim(),
      }))
      .catch(() => DEFAULT_CONFIG)
  }
  return configPromise
}

const ensureGtag = () => {
  window.dataLayer = window.dataLayer || []
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments)
    }
}

export const initializeGoogleAds = async () => {
  if (initPromise) return initPromise

  initPromise = getGoogleAdsConfig().then((config) => {
    if (!config.enabled || !validTagId(config.tagId)) return config

    ensureGtag()
    if (!document.querySelector(`script[data-google-ads-id="${config.tagId}"]`)) {
      const script = document.createElement('script')
      script.async = true
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.tagId)}`
      script.dataset.googleAdsId = config.tagId
      document.head.appendChild(script)
    }

    window.gtag('js', new Date())
    window.gtag('config', config.tagId)
    return config
  })

  return initPromise
}

export const trackGoogleAdsPurchase = async ({ transactionId, value, currency = 'USD' }) => {
  const config = await initializeGoogleAds()
  const cleanTransactionId = String(transactionId || '').trim()
  const amount = Number(value)

  if (
    !config.enabled ||
    !validTagId(config.tagId) ||
    !validLabel(config.purchaseLabel) ||
    !cleanTransactionId ||
    !Number.isFinite(amount) ||
    amount < 0
  ) {
    return false
  }

  const storageKey = `tt_google_ads_purchase_${cleanTransactionId}`
  try {
    if (localStorage.getItem(storageKey) === 'sent') return false
  } catch {
    // Tracking still works when storage is unavailable.
  }

  ensureGtag()
  window.gtag('event', 'conversion', {
    send_to: `${config.tagId}/${config.purchaseLabel}`,
    value: amount,
    currency,
    transaction_id: cleanTransactionId,
  })

  try {
    localStorage.setItem(storageKey, 'sent')
  } catch {
    // Ignore storage failures.
  }
  return true
}
