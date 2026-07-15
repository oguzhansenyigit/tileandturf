import React, { useState, useEffect } from 'react'
import axios from 'axios'

const SettingsManagement = () => {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [savingHomeSuggest, setSavingHomeSuggest] = useState(false)
  const [topBanner, setTopBanner] = useState({
    text: '',
    is_active: true
  })
  const [productDetailPromo, setProductDetailPromo] = useState({
    content: '',
    is_active: true
  })
  const [homeSuggestionsOn, setHomeSuggestionsOn] = useState(true)

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
      // Default ON when setting has never been saved
      setHomeSuggestionsOn(data.home_suggestions_status !== 'inactive')
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

  const handleToggleHomeSuggestions = async (next) => {
    const previous = homeSuggestionsOn
    setHomeSuggestionsOn(next)
    setSavingHomeSuggest(true)
    try {
      await axios.post('/api/admin/settings.php', {
        home_suggestions_status: next ? 'active' : 'inactive',
      })
    } catch (error) {
      console.error('Error saving home suggestions setting:', error)
      setHomeSuggestionsOn(previous)
      alert('Could not save setting. Please try again.')
    } finally {
      setSavingHomeSuggest(false)
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Homepage product suggestions</h3>
            <p className="text-sm text-gray-600 mt-1 max-w-xl">
              After ~10 seconds on the homepage, gently show a small recommended-products card.
              Turn this off anytime — visitors will stop seeing it on their next page load.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={homeSuggestionsOn}
            disabled={savingHomeSuggest}
            onClick={() => handleToggleHomeSuggestions(!homeSuggestionsOn)}
            className={`
              relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors
              focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
              disabled:opacity-60
              ${homeSuggestionsOn ? 'bg-primary' : 'bg-gray-300'}
            `}
          >
            <span
              className={`
                inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform
                ${homeSuggestionsOn ? 'translate-x-7' : 'translate-x-1'}
              `}
            />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Status:{' '}
          <span className={`font-semibold ${homeSuggestionsOn ? 'text-green-700' : 'text-gray-600'}`}>
            {homeSuggestionsOn ? 'On' : 'Off'}
          </span>
          {savingHomeSuggest ? ' · Saving…' : ''}
        </p>
      </div>
    </div>
  )
}

export default SettingsManagement
