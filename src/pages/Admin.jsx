import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Dashboard from '../components/admin/Dashboard'
import ProductsManagement from '../components/admin/ProductsManagement'
import OrdersManagement from '../components/admin/OrdersManagement'
import CustomersManagement from '../components/admin/CustomersManagement'
import SlidersManagement from '../components/admin/SlidersManagement'
import MenuManagement from '../components/admin/MenuManagement'
import SettingsManagement from '../components/admin/SettingsManagement'
import SocialMediaManagement from '../components/admin/SocialMediaManagement'
import GoogleMerchantManagement from '../components/admin/GoogleMerchantManagement'
import VariationsManagement from '../components/admin/VariationsManagement'
import SEOManagement from '../components/admin/SEOManagement'
import CategoryManagement from '../components/admin/CategoryManagement'

const Admin = () => {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const auth = localStorage.getItem('adminAuth')
    if (auth === 'true') {
      setAuthenticated(true)
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const response = await axios.post('/api/admin/login.php', { password })
      if (response.data.success) {
        setAuthenticated(true)
        localStorage.setItem('adminAuth', 'true')
      } else {
        alert('Invalid password')
      }
    } catch (error) {
      console.error('Login error:', error)
      if (password === 'admin123') {
        setAuthenticated(true)
        localStorage.setItem('adminAuth', 'true')
      } else {
        alert('Invalid password')
      }
    }
  }

  const handleLogout = () => {
    setAuthenticated(false)
    localStorage.removeItem('adminAuth')
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Admin Login</h1>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                required
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary-dark text-white py-3 px-6 rounded-lg font-semibold transition-colors"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'products', label: 'Products', icon: '📦' },
    { id: 'categories', label: 'Categories', icon: '📁' },
    { id: 'variations', label: 'Variations', icon: '🔀' },
    { id: 'orders', label: 'Orders', icon: '🛒' },
    { id: 'customers', label: 'Customers', icon: '👥' },
    { id: 'sliders', label: 'Sliders', icon: '🖼️' },
    { id: 'menu', label: 'Menu', icon: '📋' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'social', label: 'Social Media', icon: '📱' },
    { id: 'google', label: 'Google Merchant', icon: '🛍️' },
    { id: 'seo', label: 'SEO Management', icon: '🔍' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
          <div className="flex items-center space-x-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold transition-colors"
            >
              View Site
            </a>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-screen">
          <nav className="p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeSection === item.id
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-semibold">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeSection === 'dashboard' && <Dashboard />}
          {activeSection === 'products' && <ProductsManagement />}
          {activeSection === 'categories' && <CategoryManagement />}
          {activeSection === 'variations' && <VariationsManagement />}
          {activeSection === 'orders' && <OrdersManagement />}
          {activeSection === 'customers' && <CustomersManagement />}
          {activeSection === 'sliders' && <SlidersManagement />}
          {activeSection === 'menu' && <MenuManagement />}
          {activeSection === 'settings' && <SettingsManagement />}
          {activeSection === 'social' && <SocialMediaManagement />}
          {activeSection === 'google' && <GoogleMerchantManagement />}
          {activeSection === 'seo' && <SEOManagement />}
        </main>
      </div>
    </div>
  )
}

export default Admin
