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
import { CartProvider } from './context/CartContext'
import axios from 'axios'

const DEFAULT_SEO = {
  title: 'Tile and Turf | Premium Outdoor Flooring Systems',
  description: 'Discover premium decking, pavers, synthetic turf, and pedestal systems with technical resources and fast support from Tile and Turf.',
}

const ROUTE_SEO = {
  '/': {
    title: 'Tile and Turf | Premium Outdoor Flooring Systems',
    description: 'Premium outdoor systems for synthetic turf, porcelain pavers, IPE tiles, and green roofs with expert support and technical documentation.',
  },
  '/products': {
    title: 'Products | Tile and Turf',
    description: 'Browse all Tile and Turf products including decking, pavers, synthetic systems, and installation-ready outdoor materials.',
  },
  '/resources': {
    title: 'Resource Library | Tile and Turf',
    description: 'Download technical data sheets and catalogs for synthetic turf, IPE tiles, pavers, and pedestal systems.',
  },
  '/contact': {
    title: 'Contact | Tile and Turf',
    description: 'Get in touch with Tile and Turf for technical support, product guidance, and project-specific recommendations.',
  },
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
    const seo = ROUTE_SEO[pathname] || DEFAULT_SEO
    document.title = seo.title

    let descriptionTag = document.querySelector('meta[name="description"]')
    if (!descriptionTag) {
      descriptionTag = document.createElement('meta')
      descriptionTag.setAttribute('name', 'description')
      document.head.appendChild(descriptionTag)
    }
    descriptionTag.setAttribute('content', seo.description)

    let canonicalTag = document.querySelector('link[rel="canonical"]')
    if (!canonicalTag) {
      canonicalTag = document.createElement('link')
      canonicalTag.setAttribute('rel', 'canonical')
      document.head.appendChild(canonicalTag)
    }

    canonicalTag.setAttribute('href', `https://tileandturf.com${pathname}`)
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
          
          {/* Admin Routes - Separate Layout */}
          <Route path="/admin" element={<AdminLayout><Admin /></AdminLayout>} />
          <Route path="/admin/*" element={<AdminLayout><Admin /></AdminLayout>} />
        </Routes>
      </Router>
    </CartProvider>
  )
}

export default App

