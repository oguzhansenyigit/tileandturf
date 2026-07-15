import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useCart } from '../context/CartContext'
import { getProductUrl } from '../utils/slug'
import { PLACEHOLDER_IMAGE, productImageSrc } from '../utils/mediaUrl'
import MoneyAmount from './MoneyAmount'

const STORAGE_KEY = 'tt_home_suggest'
const DELAY_MS = 10000
const AUTO_CLOSE_MS = 5000
const PRODUCT_LIMIT = 4

/**
 * Gentle homepage recommendations — no backdrop, opposite side from cart,
 * once per browser session, never while the cart drawer is open.
 */
const HomeSuggestions = () => {
  const { isCartOpen, cart } = useCart()
  const [featureEnabled, setFeatureEnabled] = useState(null) // null = loading
  const [ready, setReady] = useState(false)
  const [open, setOpen] = useState(false)
  const [products, setProducts] = useState([])
  const [visible, setVisible] = useState(false)
  const elapsedRef = useRef(0)
  const lastTickRef = useRef(null)
  const dismissedRef = useRef(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === 'dismissed') {
        dismissedRef.current = true
      }
    } catch {
      /* ignore */
    }
  }, [])

  // Admin on/off (public setting). Default ON if never configured.
  useEffect(() => {
    let cancelled = false
    axios
      .get('/api/admin/settings.php')
      .then((res) => {
        if (cancelled) return
        const status = res.data?.home_suggestions_status
        setFeatureEnabled(status !== 'inactive')
      })
      .catch(() => {
        if (!cancelled) setFeatureEnabled(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Prefetch a few homepage-ordered products early
  useEffect(() => {
    if (featureEnabled !== true) return
    let cancelled = false
    const load = async () => {
      try {
        const res = await axios.get(`/api/products.php?limit=12`)
        if (cancelled || !Array.isArray(res.data)) return
        const cartIds = new Set((cart || []).map((i) => i.id))
        const picks = res.data
          .filter((p) => p && p.id && !cartIds.has(p.id))
          .slice(0, PRODUCT_LIMIT)
        if (picks.length > 0) {
          setProducts(picks)
          setReady(true)
        }
      } catch {
        /* stay silent — no panel without products */
      }
    }
    const t = setTimeout(load, 1500)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [cart, featureEnabled])

  // Dwell timer: only counts while cart is closed and not yet dismissed
  useEffect(() => {
    if (featureEnabled !== true || dismissedRef.current || open) return

    const tick = () => {
      const now = Date.now()
      if (lastTickRef.current == null) {
        lastTickRef.current = now
        return
      }
      if (!isCartOpen && ready) {
        elapsedRef.current += now - lastTickRef.current
      }
      lastTickRef.current = now

      if (elapsedRef.current >= DELAY_MS && ready && !isCartOpen && !dismissedRef.current) {
        setOpen(true)
      }
    }

    lastTickRef.current = Date.now()
    const id = setInterval(tick, 400)
    return () => clearInterval(id)
  }, [isCartOpen, ready, open, featureEnabled])

  // Soft enter animation after open flag
  useEffect(() => {
    if (!open) {
      setVisible(false)
      return
    }
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    if (reduced) {
      setVisible(true)
      return
    }
    const t = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(t)
  }, [open])

  // If cart opens while suggestions are visible, hide quietly (not dismissed)
  useEffect(() => {
    if (isCartOpen && open) {
      setVisible(false)
      setOpen(false)
      // Keep elapsed so we can re-show shortly after cart closes
      elapsedRef.current = DELAY_MS
    }
  }, [isCartOpen, open])

  // Admin turned feature off while panel is showing
  useEffect(() => {
    if (featureEnabled === false && open) {
      setVisible(false)
      setOpen(false)
    }
  }, [featureEnabled, open])

  const dismiss = () => {
    dismissedRef.current = true
    setVisible(false)
    setTimeout(() => setOpen(false), 280)
    try {
      sessionStorage.setItem(STORAGE_KEY, 'dismissed')
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Auto-close shortly after opening (same session dismiss as manual close)
  useEffect(() => {
    if (!open || !visible) return
    const t = setTimeout(() => dismiss(), AUTO_CLOSE_MS)
    return () => clearTimeout(t)
  }, [open, visible])

  if (featureEnabled !== true || !open || products.length === 0 || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <aside
      role="complementary"
      aria-label="Suggested products"
      className={`
        fixed z-30 pointer-events-auto
        left-3 right-3 bottom-24
        md:left-5 md:right-auto md:bottom-6 md:w-[320px]
        transition-all duration-300 ease-out
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 md:-translate-x-3 md:translate-y-0'}
      `}
    >
      <div className="rounded-2xl border border-stone-200/90 bg-white/95 backdrop-blur-sm shadow-[0_12px_40px_rgba(28,25,23,0.12)] overflow-hidden">
        <div className="flex items-start justify-between gap-3 px-4 pt-3.5 pb-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">
              Suggested for you
            </p>
            <p className="text-sm text-stone-700 mt-0.5">Popular picks while you browse</p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            aria-label="Dismiss suggestions"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <ul className="px-2 pb-2">
          {products.map((product) => (
            <li key={product.id}>
              <Link
                to={getProductUrl(product)}
                onClick={dismiss}
                className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-stone-50 transition-colors group"
              >
                <img
                  src={productImageSrc(product.image)}
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover bg-stone-100 shrink-0"
                  onError={(e) => {
                    e.currentTarget.src = PLACEHOLDER_IMAGE
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-stone-800 truncate group-hover:text-primary transition-colors">
                    {product.name}
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    <MoneyAmount amount={product.price} product={product} />
                  </p>
                </div>
                <span className="text-stone-300 group-hover:text-primary transition-colors shrink-0" aria-hidden>
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="px-4 py-2.5 border-t border-stone-100 bg-stone-50/60">
          <Link
            to="/products"
            onClick={dismiss}
            className="text-xs font-semibold text-stone-600 hover:text-primary transition-colors"
          >
            Browse all products
          </Link>
        </div>
      </div>
    </aside>,
    document.body
  )
}

export default HomeSuggestions
