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
import MyAccount from './pages/MyAccount'
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
import { SettingsProvider } from './context/SettingsContext'
import axios from 'axios'

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

function App() {
  // Disable browser's automatic scroll restoration
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  return (
    <SettingsProvider>
      <CartProvider>
        <Router>
        <ScrollToTop />
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
          <Route path="/pedestal-calculator" element={<Layout><PedestalCalculator /></Layout>} />
          <Route path="/request-quote" element={<Layout><RequestQuote /></Layout>} />
          <Route path="/register" element={<Layout><Register /></Layout>} />
          <Route path="/login" element={<Layout><Login /></Layout>} />
          <Route path="/my-account" element={<Layout><MyAccount /></Layout>} />
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
          
          {/* 404 Page - Must be last */}
          <Route path="*" element={<Layout><NotFound /></Layout>} />
        </Routes>
      </Router>
      </CartProvider>
    </SettingsProvider>
  )
}

export default App

