import { useState, useEffect, useCallback } from 'react'
import {
  DEFAULT_WHATSAPP_URL,
  DEFAULT_WHATSAPP_MESSAGE,
  fetchWhatsAppUrl,
  openWhatsApp as openWhatsAppWindow
} from '../utils/whatsapp'

export function useWhatsApp() {
  const [whatsappUrl, setWhatsappUrl] = useState(DEFAULT_WHATSAPP_URL)

  useEffect(() => {
    let cancelled = false
    fetchWhatsAppUrl().then((url) => {
      if (!cancelled) setWhatsappUrl(url)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const openWhatsApp = useCallback(
    (message = DEFAULT_WHATSAPP_MESSAGE) => {
      openWhatsAppWindow(whatsappUrl, message)
    },
    [whatsappUrl]
  )

  return { whatsappUrl, openWhatsApp }
}
