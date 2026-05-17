import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import AdminLayout from './layouts/AdminLayout'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import TermsAndConditions from './pages/TermsAndConditions'
import PrivacyPolicy from './pages/PrivacyPolicy'
import DistanceSalesAgreement from './pages/DistanceSalesAgreement'
import ReturnPolicy from './pages/ReturnPolicy'
import ShippingPolicy from './pages/ShippingPolicy'
import Resources from './pages/Resources'
import RequestQuote from './pages/RequestQuote'
import Register from './pages/Register'
import Login from './pages/Login'
import TrackOrder from './pages/TrackOrder'
import Contact from './pages/Contact'
import OrderConfirmation from './pages/OrderConfirmation'
import Admin from './pages/Admin'
import GreenRoofSystems from './pages/GreenRoofSystems'
import PaverPedestalSystems from './pages/PaverPedestalSystems'
import SyntheticTurfSystems from './pages/SyntheticTurfSystems'
import IpeTileSystems from './pages/IpeTileSystems'
import ConcretePaversSystem from './pages/ConcretePaversSystem'
import PorcelainPaver from './pages/PorcelainPaver'
import PedestalCalculator from './pages/PedestalCalculator'
import NotFound from './pages/NotFound'
import { CartProvider } from './context/CartContext'
import axios from 'axios'
import {
  SITE_ORIGIN,
  SITE_NAME,
  SITE_AUTHOR,
  SITE_PUBLISHER,
  DEFAULT_ROBOTS,
  HOME_TITLE,
  HOME_DESCRIPTION,
  HOME_KEYWORDS,
  GENERIC_DESCRIPTION,
  GENERIC_KEYWORDS,
  PRODUCTS_TITLE,
  PRODUCTS_DESCRIPTION,
} from './config/siteSeo'
import { applyDocumentSeo } from './utils/documentSeo'

const ROUTE_SEO = {
  '/': { title: HOME_TITLE, description: HOME_DESCRIPTION, keywords: HOME_KEYWORDS },
  '/products': {
    title: PRODUCTS_TITLE,
    description: PRODUCTS_DESCRIPTION,
    keywords: GENERIC_KEYWORDS,
  },
  '/resources': {
    title: 'Resource Library | Tile and Turf',
    description:
      'Download technical data sheets and catalogs for synthetic turf, IPE tiles, pavers, and pedestal systems.',
    keywords: GENERIC_KEYWORDS,
  },
  '/contact': {
    title: 'Contact | Tile and Turf',
    description:
      'Get in touch with Tile and Turf for technical support, product guidance, and project-specific recommendations.',
    keywords: GENERIC_KEYWORDS,
  },
}

const titleFromPath = (pathname) => {
  const parts = pathname.split('/').filter(Boolean)
  const last = parts[parts.length - 1] || ''
  if (!last) return SITE_NAME
  return last
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ')
}

// Track visitor on app load
axios.post('/api/track-visitor.php').catch(() => {})

// Track visitor activity periodically
setInterval(() => {
  axios.post('/api/track-visitor.php').catch(() => {})
}, 60000) // Every minute

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // Scroll to top when route changes
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // Instant scroll, no animation
    })
  }, [pathname])

  return null
}

function SeoMeta() {
  const { pathname } = useLocation()

  useEffect(() => {
    const origin = SITE_ORIGIN.replace(/\/$/, '')
    const canonicalUrl = `${origin}${pathname === '/' ? '/' : pathname}`

    if (pathname.startsWith('/product/')) {
      return
    }

    if (pathname.startsWith('/admin')) {
      applyDocumentSeo({
        title: `Admin | ${SITE_NAME}`,
        description: GENERIC_DESCRIPTION,
        keywords: GENERIC_KEYWORDS,
        canonicalUrl,
        robots: 'noindex, nofollow',
        author: SITE_AUTHOR,
        publisher: SITE_PUBLISHER,
      })
      return
    }

    const preset = ROUTE_SEO[pathname]
    if (preset) {
      applyDocumentSeo({
        title: preset.title,
        description: preset.description,
        keywords: preset.keywords,
        canonicalUrl,
        robots: DEFAULT_ROBOTS,
        author: SITE_AUTHOR,
        publisher: SITE_PUBLISHER,
      })
      return
    }

    const pageTitle = `${titleFromPath(pathname)} | ${SITE_NAME}`
    applyDocumentSeo({
      title: pageTitle,
      description: GENERIC_DESCRIPTION,
      keywords: GENERIC_KEYWORDS,
      canonicalUrl,
      robots: DEFAULT_ROBOTS,
      author: SITE_AUTHOR,
      publisher: SITE_PUBLISHER,
    })
  }, [pathname])

  return null
}

function App() {
  // Disable browser's automatic scroll restoration
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  return (
    <CartProvider>
      <Router>
        <ScrollToTop />
        <SeoMeta />
        <Routes>
          {/* Public Routes - Website Frontend */}
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/products" element={<Layout><Products /></Layout>} />
          {/* Specific product category routes - must be before generic /products/:category route */}
          <Route path="/products/green-roof-systems" element={<Layout><GreenRoofSystems /></Layout>} />
          <Route path="/green-roof-systems" element={<Layout><GreenRoofSystems /></Layout>} />
          <Route path="/products/paver-pedestal-systems" element={<Layout><PaverPedestalSystems /></Layout>} />
          <Route path="/products/synthetic-systems" element={<Layout><SyntheticTurfSystems /></Layout>} />
          <Route path="/products/ipe-tile-systems" element={<Layout><IpeTileSystems /></Layout>} />
          <Route path="/products/concrete-pavers-system" element={<Layout><ConcretePaversSystem /></Layout>} />
          <Route path="/products/porcelain-paver" element={<Layout><PorcelainPaver /></Layout>} />
          <Route path="/porcelain-paver" element={<Layout><PorcelainPaver /></Layout>} />
          {/* Generic routes - must be after specific routes */}
          <Route path="/products/:category" element={<Layout><Products /></Layout>} />
          <Route path="/product/:slug" element={<Layout><ProductDetail /></Layout>} />
          <Route path="/cart" element={<Layout><Cart /></Layout>} />
          <Route path="/checkout" element={<Layout><Checkout /></Layout>} />
          <Route path="/resources" element={<Layout><Resources /></Layout>} />
          <Route path="/request-quote" element={<Layout><RequestQuote /></Layout>} />
          <Route path="/register" element={<Layout><Register /></Layout>} />
          <Route path="/login" element={<Layout><Login /></Layout>} />
          <Route path="/track-order" element={<Layout><TrackOrder /></Layout>} />
          <Route path="/contact" element={<Layout><Contact /></Layout>} />
          <Route path="/order-confirmation/:orderId" element={<Layout><OrderConfirmation /></Layout>} />
          <Route path="/terms-and-conditions" element={<Layout><TermsAndConditions /></Layout>} />
          <Route path="/privacy-policy" element={<Layout><PrivacyPolicy /></Layout>} />
          <Route path="/distance-sales-agreement" element={<Layout><DistanceSalesAgreement /></Layout>} />
          <Route path="/return-policy" element={<Layout><ReturnPolicy /></Layout>} />
          <Route path="/shipping-policy" element={<Layout><ShippingPolicy /></Layout>} />
          <Route path="/pedestal-calculator" element={<Layout><PedestalCalculator /></Layout>} />

          {/* Admin Routes - Separate Layout */}
          <Route path="/admin" element={<AdminLayout><Admin /></AdminLayout>} />
          <Route path="/admin/*" element={<AdminLayout><Admin /></AdminLayout>} />

          <Route path="*" element={<Layout><NotFound /></Layout>} />
        </Routes>
      </Router>
    </CartProvider>
  )
}

export default App

