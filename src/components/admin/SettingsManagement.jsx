import React, { useState, useEffect } from 'react'
import axios from 'axios'

const SettingsManagement = () => {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [topBanner, setTopBanner] = useState({
    text: '',
    is_active: true
  })
  const [productDetailPromo, setProductDetailPromo] = useState({
    content: '',
    is_active: true
  })
  const [catalogMode, setCatalogMode] = useState(false)
  const [whatsappNumber, setWhatsappNumber] = useState('15167741808')
  const [phoneNumber, setPhoneNumber] = useState('15167741808')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/admin/settings.php')
      const data = response.data
      setSettings(data)
      // Settings API returns object with key-value pairs
      setTopBanner({
        text: data.top_banner_text || '',
        is_active: data.top_banner_status === 'active' || data.top_banner_active === '1'
      })
      setProductDetailPromo({
        content: data.product_detail_promo_content || '',
        is_active: data.product_detail_promo_status === 'active' || data.product_detail_promo_active === '1'
      })
      setCatalogMode(data.catalog_mode === 'active' || data.catalog_mode === '1')
      setWhatsappNumber(data.whatsapp_number || '15167741808')
      setPhoneNumber(data.phone_number || '15167741808')
    } catch (error) {
      console.error('Error fetching settings:', error)
      setSettings({})
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTopBanner = async () => {
    try {
      await axios.post('/api/admin/settings.php', {
        top_banner_text: topBanner.text,
        top_banner_status: topBanner.is_active ? 'active' : 'inactive',
        top_banner_link: '/products'
      })
      alert('Top banner settings saved successfully!')
      fetchSettings()
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error saving settings')
    }
  }

  const handleSaveProductDetailPromo = async () => {
    try {
      await axios.post('/api/admin/settings.php', {
        product_detail_promo_content: productDetailPromo.content,
        product_detail_promo_status: productDetailPromo.is_active ? 'active' : 'inactive'
      })
      alert('Product detail promo settings saved successfully!')
      fetchSettings()
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error saving settings')
    }
  }

  const handleSaveCatalogMode = async () => {
    try {
      await axios.post('/api/admin/settings.php', {
        catalog_mode: catalogMode ? 'active' : 'inactive'
      })
      alert('Catalog mode settings saved successfully!')
      fetchSettings()
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error saving settings')
    }
  }

  const handleSaveContactInfo = async () => {
    try {
      await axios.post('/api/admin/settings.php', {
        whatsapp_number: whatsappNumber,
        phone_number: phoneNumber
      })
      alert('Contact information saved successfully!')
      fetchSettings()
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error saving settings')
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Settings</h2>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Top Banner (Promotional Banner)</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Banner Text</label>
            <input
              type="text"
              value={topBanner.text}
              onChange={(e) => setTopBanner({ ...topBanner, text: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              placeholder="e.g., 🌿 Special Offer: Enjoy up to 25% OFF on all eco-friendly decking, tiles, and outdoor materials! Visit Our Shop →"
            />
          </div>
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={topBanner.is_active}
                onChange={(e) => setTopBanner({ ...topBanner, is_active: e.target.checked })}
                className="rounded"
              />
              <span className="text-gray-700 font-semibold">Show Banner</span>
            </label>
          </div>
          <button
            onClick={handleSaveTopBanner}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Save Banner Settings
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Product Detail Promo Banner</h3>
        <p className="text-sm text-gray-600 mb-4">
          This banner appears below the product image on mobile devices. Use it to highlight free shipping, promotions, or special offers.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Promo Content</label>
            <textarea
              value={productDetailPromo.content}
              onChange={(e) => setProductDetailPromo({ ...productDetailPromo, content: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              rows="4"
              placeholder="e.g., 🚚 Free Shipping on Orders Over $100 | 🎉 Special Discount: 20% OFF on All Products This Week!"
            />
            <p className="text-xs text-gray-500 mt-1">
              You can use emojis and HTML tags for formatting. This will be displayed below the product image on mobile devices.
            </p>
          </div>
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={productDetailPromo.is_active}
                onChange={(e) => setProductDetailPromo({ ...productDetailPromo, is_active: e.target.checked })}
                className="rounded"
              />
              <span className="text-gray-700 font-semibold">Show Promo Banner</span>
            </label>
          </div>
          <button
            onClick={handleSaveProductDetailPromo}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Save Promo Banner Settings
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Contact Information</h3>
        <p className="text-sm text-gray-600 mb-4">
          Update WhatsApp and phone numbers that appear throughout the website. Enter numbers without spaces or special characters (e.g., 15167741808).
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">WhatsApp Number</label>
            <input
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              placeholder="15167741808"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter WhatsApp number without + or spaces (e.g., 15167741808)
            </p>
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Phone Number</label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              placeholder="15167741808"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter phone number without + or spaces (e.g., 15167741808)
            </p>
          </div>
          <button
            onClick={handleSaveContactInfo}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Save Contact Information
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Catalog Mode</h3>
        <p className="text-sm text-gray-600 mb-4">
          When enabled, all prices will be hidden and "Add to Cart" buttons will be replaced with "Call for Price" buttons that link to (516) 774-1808.
        </p>
        <div className="space-y-4">
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={catalogMode}
                onChange={(e) => setCatalogMode(e.target.checked)}
                className="rounded"
              />
              <span className="text-gray-700 font-semibold">Enable Catalog Mode</span>
            </label>
          </div>
          <button
            onClick={handleSaveCatalogMode}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Save Catalog Mode Settings
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsManagement

