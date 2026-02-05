import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getProductUrl } from '../utils/slug'
import { useCart } from '../context/CartContext'
import axios from 'axios'
import logoImage from '/logo.svg'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProductsDropdownOpen, setIsProductsDropdownOpen] = useState(false)
  const [menuItems, setMenuItems] = useState([])
  const [ourProductsMenu, setOurProductsMenu] = useState(null)
  const [productsSubmenu, setProductsSubmenu] = useState([])
  const [topBanner, setTopBanner] = useState({ text: '', status: 'active', link: '/products' })
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const { getCartItemCount, openCart } = useCart()
  const cartCount = getCartItemCount()
  const [user, setUser] = useState(null)

  // Check if user is logged in and listen for changes
  useEffect(() => {
    const checkUser = () => {
      const userData = localStorage.getItem('user')
      if (userData) {
        try {
          setUser(JSON.parse(userData))
        } catch (e) {
          setUser(null)
        }
      } else {
        setUser(null)
      }
    }
    
    // Check initially
    checkUser()
    
    // Listen for storage events (from other tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        checkUser()
      }
    }
    
    // Listen for custom events (from same tab)
    const handleUserChange = () => {
      checkUser()
    }
    
    // Also check on focus (when user logs in/out in another tab)
    const handleFocus = () => {
      checkUser()
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('userChanged', handleUserChange)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('userChanged', handleUserChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  useEffect(() => {
    fetchMenuItems()
    fetchTopBanner()
  }, [])

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get('/api/admin/menu.php')
      if (Array.isArray(response.data)) {
        const allItems = response.data.filter(item => item.status === 'active')
        
        // Find "OUR PRODUCTS" menu (by slug or name)
        const ourProducts = allItems.find(item => 
          (item.slug === 'our-products' || item.slug === 'products' || item.name === 'OUR PRODUCTS') && !item.parent_id
        )
        
        if (ourProducts) {
          setOurProductsMenu(ourProducts)
          // Get submenu items (children of OUR PRODUCTS)
          const submenu = allItems
            .filter(item => item.parent_id && parseInt(item.parent_id) === parseInt(ourProducts.id))
            .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
          // Map menu items to category slugs - update paths to point to filtered shop pages
          const mappedSubmenu = submenu.length > 0 ? submenu.map(item => {
            const name = item.name?.toLowerCase() || ''
            let path = item.link || item.path || '/products'
            
            // Map to category filter pages
            if (name.includes('ipe tile') || name.includes('ipe-tile')) {
              path = '/products/ipe-tile'
            } else if (name.includes('ipe wood deck') || name.includes('ipe-wood-deck')) {
              path = '/products/ipe-lumber'
            } else if (name.includes('concrete pavers') || name.includes('concrete-pavers')) {
              path = '/products/concrete-pavers-systems'
            } else if (name.includes('porcelain paver') || name.includes('porcelain-paver')) {
              path = '/products/porcelain-paver-systems'
            } else if (name.includes('synthetic grass') || name.includes('synthetic-grass')) {
              path = '/products/synthetic-grass'
            } else if (name.includes('green roof') || name.includes('green-roof')) {
              path = '/products/green-roof-systems'
            }
            
            return { ...item, path }
          }) : [
            { name: 'Adjustable Pedestal', path: '/products/adjustable-pedestal' },
            { name: 'IPE Tile', path: '/products/ipe-tile' },
            { name: 'IPE Wood Deck', path: '/products/ipe-lumber' },
            { name: 'Concrete Pavers', path: '/products/concrete-pavers-systems' },
            { name: 'Porcelain Paver', path: '/products/porcelain-paver-systems' },
            { name: 'Synthetic Grass', path: '/products/synthetic-grass' },
          ]
          setProductsSubmenu(mappedSubmenu)
        } else {
          // Fallback if OUR PRODUCTS not found
      setProductsSubmenu([
        { name: 'Adjustable Pedestal', path: '/products/adjustable-pedestal' },
        { name: 'IPE Tile', path: '/products/ipe-tile' },
        { name: 'IPE Wood Deck', path: '/products/ipe-lumber' },
        { name: 'Concrete Pavers', path: '/products/concrete-pavers-systems' },
        { name: 'Porcelain Paver', path: '/products/porcelain-paver-systems' },
        { name: 'Synthetic Grass', path: '/products/synthetic-grass' },
      ])
        }
        
        // Get other menu items (excluding OUR PRODUCTS)
        const otherItems = allItems
          .filter(item => !item.parent_id && item.id !== ourProducts?.id)
          .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
        setMenuItems(otherItems)
      }
    } catch (error) {
      console.error('Error fetching menu items:', error)
      // Fallback to default menu
      setMenuItems([
        { name: 'GREEN ROOF SYSTEMS', link: '/products/green-roof-systems' },
        { name: 'PAVER PEDESTAL SYSTEMS', link: '/products/paver-pedestal-systems' },
        { name: 'SYNTHETIC SYSTEMS', link: '/products/synthetic-systems' },
        { name: 'IPE TILE SYSTEMS', link: '/products/ipe-tile-systems' },
        { name: 'CONCRETE PAVERS SYSTEM', link: '/products/concrete-pavers-system' },
        { name: 'RESOURCE LIBRARY', link: '/resources' },
      ])
      setProductsSubmenu([
        { name: 'Adjustable Pedestal', path: '/products/adjustable-pedestal' },
        { name: 'IPE Tile', path: '/products/ipe-tile' },
        { name: 'IPE Wood Deck', path: '/products/ipe-lumber' },
        { name: 'Concrete Pavers', path: '/products/concrete-pavers-systems' },
        { name: 'Porcelain Paver', path: '/products/porcelain-paver-systems' },
        { name: 'Synthetic Grass', path: '/products/synthetic-grass' },
      ])
    }
  }

  const fetchTopBanner = async () => {
    try {
      const response = await axios.get('/api/admin/settings.php')
      if (response.data) {
        setTopBanner({
          text: response.data.top_banner_text || '🌿 Special Offer: Enjoy up to 25% OFF on all eco-friendly decking, tiles, and outdoor materials! Visit Our Shop →',
          status: response.data.top_banner_status || 'active',
          link: response.data.top_banner_link || '/products'
        })
      }
    } catch (error) {
      console.error('Error fetching top banner:', error)
    }
  }

  const handleWhatsApp = () => {
    const message = 'Hello, I need support with your products.'
    const whatsappUrl = `https://wa.me/15167741808?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const handleSearch = async (e) => {
    const term = e.target.value
    setSearchTerm(term)
    
    if (term.trim().length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }
    
    setIsSearching(true)
    try {
      const response = await axios.get(`/api/products.php?search=${encodeURIComponent(term)}`)
      const results = Array.isArray(response.data) ? response.data : []
      setSearchResults(results.slice(0, 5)) // Limit to 5 results
      setShowSearchResults(results.length > 0)
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
      setShowSearchResults(false)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchTerm)}`
    }
  }

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSearchResults && !event.target.closest('.search-container')) {
        setShowSearchResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showSearchResults])

  return (
    <header className="bg-white sticky top-0 z-50 shadow-lg">
      {/* Top Banner - Gradient */}
      {topBanner.status === 'active' && topBanner.text && (
        <div 
          className="fixed top-0 left-0 right-0 z-[9999] shadow-lg"
          style={{
            textAlign: 'center',
            background: 'linear-gradient(90deg, #43a047, #bdbdbd)',
            color: '#fff',
            padding: '10px 15px',
            fontWeight: 600,
            fontSize: '14px',
            boxShadow: '0 3px 8px rgba(0,0,0,0.25)'
          }}
        >
          <Link 
            to={topBanner.link || '/products'} 
            className="block md:inline-block"
            style={{
              color: '#ffffff',
              textDecoration: 'none'
            }}
          >
            <span className="hidden md:inline">{topBanner.text}</span>
            <span className="md:hidden text-xs">{topBanner.text.length > 50 ? topBanner.text.substring(0, 50) + '...' : topBanner.text}</span>
          </Link>
        </div>
      )}

      {/* Top Bar: Hours (left) - Logo (center) - Social Icons (right) */}
      <div className="border-b border-gray-200" style={{ marginTop: '46px' }}>
        <div className="container mx-auto px-4 py-3 bg-white">
          <div className="flex items-center justify-between">
            {/* Opening Hours and Calculator - Desktop */}
            <div className="hidden md:flex items-center space-x-2 text-sm font-semibold mr-2 lg:mr-4">
              {/* Opening Hours - Horizontal Layout */}
              <div className="flex items-center space-x-1.5 lg:space-x-2 text-gray-800 bg-gradient-to-r from-gray-50 to-gray-100 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg border border-primary/20 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="bg-primary/10 p-1 lg:p-1.5 rounded flex-shrink-0">
                  <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex items-center space-x-1.5 lg:space-x-3 leading-tight">
                  <span className="text-gray-800 font-bold text-[10px] lg:text-xs">MON-FRI: <span className="text-primary font-extrabold">07:00-18:00</span></span>
                  <span className="text-gray-400 hidden lg:inline">|</span>
                  <span className="text-gray-800 font-bold text-[10px] lg:text-xs">SAT-SUN: <span className="text-primary font-extrabold">07:00-14:00</span></span>
                </div>
              </div>
              
              {/* Pedestal Calculator Link - Compact */}
              <Link
                to="/pedestal-calculator"
                className="flex items-center space-x-1.5 lg:space-x-2 text-gray-800 bg-gradient-to-r from-primary/10 to-primary/5 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg border border-primary/30 shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-300 group animate-pulse-primary"
              >
                <div className="bg-primary/20 p-1 lg:p-1.5 rounded group-hover:bg-primary/30 transition-colors flex-shrink-0">
                  <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex flex-col leading-tight min-w-0">
                  <span className="text-gray-900 font-bold text-[10px] lg:text-xs group-hover:text-primary transition-colors truncate">Pedestal Calculator</span>
                  <span className="text-gray-600 text-[9px] lg:text-[10px] hidden lg:block">Calculate pedestals needed</span>
                </div>
              </Link>
            </div>

            {/* Logo - Center */}
            <Link to="/" className="flex items-center justify-center flex-1 md:flex-none">
              <img src={logoImage} alt="Logo" className="h-12 md:h-16 w-auto" />
            </Link>

            {/* Desktop Search, Login/Register, Social Icons and Cart - Right */}
            <div className="hidden md:flex items-center space-x-2 lg:space-x-3">
              {/* Desktop Search - Always Visible */}
              <div className="relative search-container">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearch}
                    placeholder="Search by product name or SKU..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-48 lg:w-64 text-sm"
                  />
                  <button
                    type="submit"
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </form>
                
                {/* Search Results Dropdown */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 mt-2 w-48 lg:w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                    {searchResults.map((product) => (
                      <Link
                        key={product.id}
                        to={getProductUrl(product)}
                        onClick={() => {
                          setShowSearchResults(false)
                          setSearchTerm('')
                        }}
                        className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          {product.image && (
                            <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{product.name}</p>
                            {product.sku && (
                              <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                            )}
                            <p className="text-sm font-bold text-primary mt-1">${(parseFloat(product.price) || 0).toFixed(2)}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                    {searchTerm.trim() && (
                      <Link
                        to={`/products?search=${encodeURIComponent(searchTerm)}`}
                        onClick={() => {
                          setShowSearchResults(false)
                          setSearchTerm('')
                        }}
                        className="block px-4 py-3 text-center text-sm font-semibold text-primary hover:bg-primary hover:text-white transition-colors border-t border-gray-200"
                      >
                        View All Results
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Login/Register or My Account Links - Before Cart */}
              <div className="flex items-center space-x-1 lg:space-x-2 border-r border-gray-300 pr-2 lg:pr-3">
                {user ? (
                  <Link
                    to="/my-account"
                    className="text-gray-700 hover:text-primary font-semibold text-xs lg:text-sm transition-colors px-2 lg:px-3 py-1.5 rounded hover:bg-gray-50 whitespace-nowrap"
                  >
                    My Account
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="text-gray-700 hover:text-primary font-semibold text-xs lg:text-sm transition-colors px-2 lg:px-3 py-1.5 rounded hover:bg-gray-50 whitespace-nowrap"
                    >
                      Login
                    </Link>
                    <span className="text-gray-300 hidden lg:inline">|</span>
                    <Link
                      to="/register"
                      className="text-gray-700 hover:text-primary font-semibold text-xs lg:text-sm transition-colors px-2 lg:px-3 py-1.5 rounded hover:bg-gray-50 whitespace-nowrap"
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>

              {/* Tracking Order Link */}
              <Link
                to="/track-order"
                className="text-gray-700 hover:text-primary font-semibold text-xs lg:text-sm transition-colors px-2 lg:px-3 py-1.5 rounded hover:bg-gray-50 border-r border-gray-300 pr-2 lg:pr-3 whitespace-nowrap"
              >
                Track Order
              </Link>

              <button
                onClick={handleWhatsApp}
                className="bg-green-600 hover:bg-green-700 text-white p-2.5 rounded-full transition-colors shadow-md"
                title="WhatsApp Support"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </button>
              <button
                onClick={openCart}
                className="relative p-2 lg:p-3 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors shadow-md font-semibold flex items-center space-x-1 lg:space-x-2"
              >
                <svg
                  className="w-5 h-5 lg:w-6 lg:h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span className="hidden lg:inline">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-lg">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile: Search, Login, Track Order, WhatsApp, Cart and Menu Button */}
            <div className="flex md:hidden items-center space-x-2">
              {/* Mobile Search - Toggle */}
              <button
                onClick={() => {
                  setIsMobileSearchOpen(!isMobileSearchOpen)
                  if (!isMobileSearchOpen) {
                    setTimeout(() => {
                      const searchInput = document.getElementById('mobile-search-input')
                      if (searchInput) {
                        searchInput.focus()
                      }
                    }, 100)
                  }
                }}
                className="p-2 text-gray-600 hover:text-primary transition-colors"
                title="Search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button
                onClick={handleWhatsApp}
                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full transition-colors"
                title="WhatsApp Support"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </button>
              <button
                onClick={openCart}
                className="relative p-2 bg-primary text-white rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </button>
              <button
                className="p-2 hover:bg-gray-100 rounded text-gray-700"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Input - Controlled by state */}
      {isMobileSearchOpen && (
        <div className="md:hidden border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-3">
          <div className="relative search-container">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                id="mobile-search-input"
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Search products by name or SKU..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
              <button
                type="submit"
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
            
            {/* Mobile Search Results */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                {searchResults.map((product) => (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    onClick={() => {
                      setShowSearchResults(false)
                      setSearchTerm('')
                      setIsMobileSearchOpen(false)
                    }}
                    className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {product.image && (
                        <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{product.name}</p>
                        {product.sku && (
                          <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                        )}
                        <p className="text-sm font-bold text-primary mt-1">${(parseFloat(product.price) || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
                {searchTerm.trim() && (
                  <Link
                    to={`/products?search=${encodeURIComponent(searchTerm)}`}
                    onClick={() => {
                      setShowSearchResults(false)
                      setSearchTerm('')
                      setIsMobileSearchOpen(false)
                    }}
                    className="block px-4 py-3 text-center text-sm font-semibold text-primary hover:bg-primary hover:text-white transition-colors border-t border-gray-200"
                  >
                    View All Results
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
        </div>
      )}

      {/* Navigation Menu */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <nav className="hidden lg:flex items-center justify-center py-3">
            {/* Our Products with Dropdown */}
            {ourProductsMenu && (
              <div 
                className="relative flex items-center"
                onMouseEnter={() => setIsProductsDropdownOpen(true)}
                onMouseLeave={() => setIsProductsDropdownOpen(false)}
              >
                <Link
                  to={ourProductsMenu.link || '/products'}
                  className="text-gray-600 hover:text-primary transition-colors text-sm font-bold py-2 px-4 relative"
                >
                  {ourProductsMenu.name}
                  <svg className="inline-block ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Link>
                <div className="h-6 w-px bg-gray-300 mx-2"></div>
                
                {/* Dropdown Menu */}
                {isProductsDropdownOpen && productsSubmenu.length > 0 && (
                  <div className="absolute top-full left-0 mt-0 w-56 bg-white shadow-2xl rounded-lg border border-gray-200 py-2 z-[100]">
                    {productsSubmenu.map((item) => (
                      <Link
                        key={item.id || item.path}
                        to={item.link || item.path}
                        className="block px-4 py-3 text-gray-700 hover:bg-primary hover:text-white transition-colors text-sm font-semibold"
                        onClick={() => setIsProductsDropdownOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Other Menu Items */}
            {menuItems.map((item, index) => (
              <React.Fragment key={item.id || item.link}>
                <Link
                  to={item.link || item.path || '#'}
                  className="text-gray-600 hover:text-primary transition-colors text-sm font-bold py-2 px-4 relative group"
                >
                  {item.name}
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-primary group-hover:w-3/4 transition-all duration-300"></span>
                </Link>
                {index < menuItems.length - 1 && (
                  <div className="h-6 w-px bg-gray-300 mx-2"></div>
                )}
              </React.Fragment>
            ))}
          </nav>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <nav className="lg:hidden py-4">
              {/* Mobile Login/Register/Track Order or My Account */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <div className="flex flex-col space-y-2">
                  {user ? (
                    <Link
                      to="/my-account"
                      className="block py-2 px-4 text-gray-700 hover:text-primary hover:bg-gray-50 rounded transition-colors font-semibold"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Account
                    </Link>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="block py-2 px-4 text-gray-700 hover:text-primary hover:bg-gray-50 rounded transition-colors font-semibold"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Login
                      </Link>
                      <Link
                        to="/register"
                        className="block py-2 px-4 text-gray-700 hover:text-primary hover:bg-gray-50 rounded transition-colors font-semibold"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Register
                      </Link>
                    </>
                  )}
                  <Link
                    to="/track-order"
                    className="block py-2 px-4 text-gray-700 hover:text-primary hover:bg-gray-50 rounded transition-colors font-semibold"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Track Order
                  </Link>
                  <Link
                    to="/pedestal-calculator"
                    className="flex items-center space-x-2 py-2 px-4 text-gray-700 hover:text-primary hover:bg-gray-50 rounded transition-colors font-semibold bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <div className="flex flex-col">
                      <span>Pedestal Calculator</span>
                      <span className="text-xs text-gray-500 font-normal">Calculate how many pedestals you need</span>
                    </div>
                  </Link>
                </div>
              </div>
              
              {ourProductsMenu && (
                <div className="mb-4">
                  <button
                    onClick={() => setIsProductsDropdownOpen(!isProductsDropdownOpen)}
                    className="w-full flex items-center justify-between py-2 text-gray-600 hover:text-primary transition-colors font-medium"
                  >
                    {ourProductsMenu.name}
                    <svg className={`w-4 h-4 transform transition-transform ${isProductsDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isProductsDropdownOpen && productsSubmenu.length > 0 && (
                    <div className="pl-4 mt-2 space-y-2">
                      {productsSubmenu.map((item) => (
                        <Link
                          key={item.id || item.path}
                          to={item.link || item.path}
                          className="block py-2 text-gray-600 hover:text-primary transition-colors text-sm"
                          onClick={() => {
                            setIsMenuOpen(false)
                            setIsProductsDropdownOpen(false)
                          }}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {menuItems.map((item) => (
                <Link
                  key={item.id || item.link}
                  to={item.link || item.path || '#'}
                  className="block py-2 text-gray-600 hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header

