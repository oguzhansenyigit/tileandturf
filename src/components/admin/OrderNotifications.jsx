import React, { useCallback, useEffect, useRef, useState } from 'react'
import adminHttp from '../../utils/adminHttp'

const STORAGE_KEY = 'tt_admin_last_order_id'
const SOUND_KEY = 'tt_admin_order_sound'
const POLL_MS = 12000

function money(v) {
  return `$${(parseFloat(v) || 0).toFixed(2)}`
}

function intvalSafe(v) {
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : 0
}

function playOrderChime() {
  try {
    if (localStorage.getItem(SOUND_KEY) === '0') return
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const now = ctx.currentTime
    ;[523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02 + i * 0.12)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28 + i * 0.12)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + i * 0.12)
      osc.stop(now + 0.35 + i * 0.12)
    })
    setTimeout(() => ctx.close().catch(() => {}), 1200)
  } catch {
    /* ignore */
  }
}

function showDesktopNotification(order) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  try {
    const n = new Notification('New order — Tile and Turf', {
      body: `${order.order_number} · ${order.customerName || 'Customer'} · ${money(order.total)}`,
      tag: `tt-order-${order.id}`,
      requireInteraction: true,
    })
    n.onclick = () => {
      window.focus()
      n.close()
      window.dispatchEvent(new CustomEvent('tt-open-orders'))
    }
  } catch {
    /* ignore */
  }
}

/**
 * Live order alerts while admin panel is open.
 * Polls every 12s; toast + sound + tab title + optional desktop notification.
 */
const OrderNotifications = ({ onOpenOrders, onBadgeChange }) => {
  const [toasts, setToasts] = useState([])
  const [pendingCount, setPendingCount] = useState(0)
  const [unseen, setUnseen] = useState(0)
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem(SOUND_KEY) !== '0')
  const [desktopOk, setDesktopOk] = useState(
    () => typeof Notification !== 'undefined' && Notification.permission === 'granted'
  )
  const lastIdRef = useRef(0)
  const primedRef = useRef(false)
  const titleBaseRef = useRef('Admin Panel · Tile and Turf')
  const blinkRef = useRef(null)

  useEffect(() => {
    onBadgeChange?.({ pending: pendingCount, unseen })
  }, [pendingCount, unseen, onBadgeChange])

  const dismissToast = useCallback((toastKey) => {
    setToasts((prev) => prev.filter((t) => t.toastKey !== toastKey))
  }, [])

  const clearUnseen = useCallback(() => {
    setUnseen(0)
    if (blinkRef.current) {
      clearInterval(blinkRef.current)
      blinkRef.current = null
    }
    document.title = titleBaseRef.current
  }, [])

  const startTitleBlink = useCallback(() => {
    if (blinkRef.current) return
    let flip = false
    blinkRef.current = setInterval(() => {
      flip = !flip
      document.title = flip
        ? `🔔 New order! · ${titleBaseRef.current}`
        : titleBaseRef.current
    }, 1200)
  }, [])

  const handleNewOrders = useCallback(
    (orders) => {
      if (!orders?.length) return
      setUnseen((n) => n + orders.length)
      playOrderChime()
      orders.forEach((o) => showDesktopNotification(o))
      startTitleBlink()

      setToasts((prev) =>
        [
          ...orders.map((o) => ({
            ...o,
            toastKey: `${o.id}-${Date.now()}`,
          })),
          ...prev,
        ].slice(0, 6)
      )

      window.dispatchEvent(new CustomEvent('tt-new-orders', { detail: { orders } }))
    },
    [startTitleBlink]
  )

  const poll = useCallback(async () => {
    try {
      const since = lastIdRef.current || 0
      const res = await adminHttp.get(`/api/admin/orders.php?action=poll&since_id=${since}`)
      if (!res.data?.success) return

      const latest = intvalSafe(res.data.latest_id)
      setPendingCount(intvalSafe(res.data.pending_count))

      if (!primedRef.current) {
        // Baseline: never toast the entire history on first paint
        primedRef.current = true
        lastIdRef.current = latest
        try {
          localStorage.setItem(STORAGE_KEY, String(latest))
        } catch {
          /* ignore */
        }
        return
      }

      const news = Array.isArray(res.data.new_orders) ? res.data.new_orders : []
      if (news.length > 0) {
        handleNewOrders(news)
      }
      if (latest > lastIdRef.current) {
        lastIdRef.current = latest
        try {
          localStorage.setItem(STORAGE_KEY, String(latest))
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* ignore */
    }
  }, [handleNewOrders])

  useEffect(() => {
    document.title = titleBaseRef.current
    try {
      const saved = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10)
      // Use saved id so orders placed while admin was closed are reported on next poll
      if (saved > 0) {
        lastIdRef.current = saved
        primedRef.current = true
      }
    } catch {
      /* ignore */
    }

    poll()
    const t = setInterval(poll, POLL_MS)

    const onOpen = () => {
      clearUnseen()
      onOpenOrders?.()
    }
    window.addEventListener('tt-open-orders', onOpen)

    return () => {
      clearInterval(t)
      window.removeEventListener('tt-open-orders', onOpen)
      if (blinkRef.current) clearInterval(blinkRef.current)
      document.title = titleBaseRef.current
    }
  }, [poll, onOpenOrders, clearUnseen])

  const enableDesktop = async () => {
    if (typeof Notification === 'undefined') return
    const perm = await Notification.requestPermission()
    setDesktopOk(perm === 'granted')
  }

  const toggleSound = () => {
    const next = !soundOn
    setSoundOn(next)
    localStorage.setItem(SOUND_KEY, next ? '1' : '0')
    if (next) playOrderChime()
  }

  const viewOrder = (order) => {
    dismissToast(order.toastKey)
    clearUnseen()
    onOpenOrders?.()
    window.dispatchEvent(new CustomEvent('tt-view-order', { detail: { orderId: order.id } }))
  }

  return (
    <>
      <div className="flex items-center gap-2 mr-1">
        {pendingCount > 0 && (
          <button
            type="button"
            onClick={() => {
              clearUnseen()
              onOpenOrders?.()
            }}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100"
            title="Pending orders"
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            {pendingCount} pending
          </button>
        )}
        {unseen > 0 && (
          <button
            type="button"
            onClick={() => {
              clearUnseen()
              onOpenOrders?.()
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white animate-pulse"
          >
            {unseen} new
          </button>
        )}
        <button
          type="button"
          onClick={toggleSound}
          className="px-2 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
          title={soundOn ? 'Mute order sound' : 'Enable order sound'}
        >
          {soundOn ? '🔊' : '🔇'}
        </button>
        {!desktopOk && typeof Notification !== 'undefined' && (
          <button
            type="button"
            onClick={enableDesktop}
            className="hidden md:inline-flex px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            title="Enable desktop notifications"
          >
            🔔 Alerts
          </button>
        )}
      </div>

      <div className="fixed top-20 right-4 z-[100] w-full max-w-sm space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.toastKey}
            className="pointer-events-auto bg-white border-2 border-primary shadow-xl rounded-xl p-4"
            style={{ animation: 'ttToastIn 0.3s ease-out' }}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-primary">New order</p>
                <p className="text-base font-bold text-gray-900 mt-0.5">{t.order_number}</p>
                <p className="text-sm text-gray-700">
                  {t.customerName || 'Customer'}
                  {t.item_count != null ? ` · ${t.item_count} item(s)` : ''}
                </p>
                <p className="text-lg font-bold text-gray-900 mt-1">{money(t.total)}</p>
              </div>
              <button
                type="button"
                onClick={() => dismissToast(t.toastKey)}
                className="text-gray-400 hover:text-gray-700 text-lg leading-none"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => viewOrder(t)}
                className="flex-1 px-3 py-2 bg-primary text-white text-sm font-semibold rounded-lg"
              >
                View order
              </button>
              <button
                type="button"
                onClick={() => dismissToast(t.toastKey)}
                className="px-3 py-2 border border-gray-200 text-sm font-semibold rounded-lg text-gray-700"
              >
                Later
              </button>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes ttToastIn {
          from { opacity: 0; transform: translateX(24px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  )
}

export default OrderNotifications
