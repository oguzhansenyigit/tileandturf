import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import CartSidebar from './CartSidebar'
import FloatingCartButton from './FloatingCartButton'
import PageTransition from './PageTransition'
import { useCart } from '../context/CartContext'
import { useSettings } from '../context/SettingsContext'

const stripJsonComments = (text) =>
  text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .trim()

const Layout = ({ children }) => {
  const { isCartOpen, closeCart } = useCart()
  const { pathname } = useLocation()
  const { googleAdsHeadTag, googleAdsPageRules, googleAdsClickRules } = useSettings()

  useEffect(() => {
    // Prevent scroll jump on page refresh
    if (window.history.scrollRestoration) {
      window.history.scrollRestoration = 'manual'
    }
    
    // Scroll to top on mount (page refresh)
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const existing = document.querySelectorAll('[data-dynamic-google-tag="1"]')
    existing.forEach((el) => el.remove())

    if (!googleAdsHeadTag || !googleAdsHeadTag.trim()) {
      return
    }

    const parser = new DOMParser()
    const doc = parser.parseFromString(`<head>${googleAdsHeadTag}</head>`, 'text/html')
    const insertedNodes = []

    Array.from(doc.head.children).forEach((node) => {
      if (node.tagName.toLowerCase() === 'script') {
        const script = document.createElement('script')
        Array.from(node.attributes).forEach((attr) => {
          script.setAttribute(attr.name, attr.value)
        })
        script.text = node.textContent || ''
        script.setAttribute('data-dynamic-google-tag', '1')
        document.head.appendChild(script)
        insertedNodes.push(script)
        return
      }
      const clone = node.cloneNode(true)
      clone.setAttribute('data-dynamic-google-tag', '1')
      document.head.appendChild(clone)
      insertedNodes.push(clone)
    })

    return () => {
      insertedNodes.forEach((node) => node.remove())
    }
  }, [googleAdsHeadTag])

  useEffect(() => {
    if (!googleAdsPageRules || !googleAdsPageRules.trim()) return
    let rules = []
    try {
      const parsed = JSON.parse(stripJsonComments(googleAdsPageRules))
      rules = Array.isArray(parsed) ? parsed : []
    } catch {
      return
    }

    rules.forEach((rule, index) => {
      if (!rule || typeof rule !== 'object') return
      const path = String(rule.path || '')
      const pathPrefix = String(rule.pathPrefix || '')
      const shouldMatchExact = path && pathname === path
      const shouldMatchPrefix = pathPrefix && pathname.startsWith(pathPrefix)
      if (!shouldMatchExact && !shouldMatchPrefix) return
      if (typeof window.gtag !== 'function') return

      const oncePerSession = Boolean(rule.oncePerSession)
      const storageKey = `google_ads_page_rule_fired_${index}_${path || pathPrefix}`
      if (oncePerSession && sessionStorage.getItem(storageKey) === '1') return

      const eventName = rule.event || 'conversion'
      const params = (rule.params && typeof rule.params === 'object') ? rule.params : {}
      window.gtag(eventName, params)

      if (oncePerSession) {
        sessionStorage.setItem(storageKey, '1')
      }
    })
  }, [pathname, googleAdsPageRules])

  useEffect(() => {
    if (!googleAdsClickRules || !googleAdsClickRules.trim()) return undefined
    let rules = []
    try {
      const parsed = JSON.parse(stripJsonComments(googleAdsClickRules))
      rules = Array.isArray(parsed) ? parsed : []
    } catch {
      return undefined
    }

    const handleClick = (evt) => {
      const target = evt.target
      if (!(target instanceof Element)) return

      rules.forEach((rule, index) => {
        if (!rule || typeof rule !== 'object') return
        const selector = String(rule.selector || '')
        if (!selector) return
        const matched = target.closest(selector)
        if (!matched) return
        if (typeof window.gtag !== 'function') return

        const oncePerSession = Boolean(rule.oncePerSession)
        const storageKey = `google_ads_click_rule_fired_${index}_${selector}`
        if (oncePerSession && sessionStorage.getItem(storageKey) === '1') return

        const eventName = rule.event || 'conversion'
        const params = (rule.params && typeof rule.params === 'object') ? rule.params : {}
        window.gtag(eventName, params)

        if (oncePerSession) {
          sessionStorage.setItem(storageKey, '1')
        }
      })
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [googleAdsClickRules])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      <Footer />
      <FloatingCartButton />
      <CartSidebar isOpen={isCartOpen} onClose={closeCart} />
    </div>
  )
}

export default Layout

