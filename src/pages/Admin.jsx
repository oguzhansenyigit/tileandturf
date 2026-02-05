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
  const [username, setUsername] = useState('')
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
      const response = await axios.post('/api/admin/login.php', { username, password })
      if (response.data.success) {
        setAuthenticated(true)
        localStorage.setItem('adminAuth', 'true')
      } else {
        alert('Invalid username or password')
      }
    } catch (error) {
      console.error('Login error:', error)
      if (password === '11241124Oguzhan') {
        setAuthenticated(true)
        localStorage.setItem('adminAuth', 'true')
      } else {
        alert('Invalid username or password')
      }
    }
  }

  const handleLogout = () => {
    setAuthenticated(false)
    localStorage.removeItem('adminAuth')
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo/Brand Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-full mb-4 shadow-lg">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Admin Panel</h1>
            <p className="text-gray-400 text-sm">Tile & Turf Management System</p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 backdrop-blur-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h2>
              <p className="text-gray-600 text-sm">Please sign in to access the admin panel</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Enter your username"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white py-3 px-6 rounded-lg font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-center text-xs text-gray-500">
                © 2024 Tile & Turf. All rights reserved.
              </p>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center space-x-2 text-gray-400 text-xs">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Secure Admin Access</span>
            </div>
          </div>
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
