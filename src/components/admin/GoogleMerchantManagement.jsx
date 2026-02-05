import React, { useState, useEffect } from 'react'
import axios from 'axios'

const GoogleMerchantManagement = () => {
  const [feedUrl, setFeedUrl] = useState('')
  const [settings, setSettings] = useState({
    store_name: '',
    store_url: '',
    feed_url: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSettings()
    setFeedUrl(`${window.location.origin}/api/google-merchant/feed.php`)
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      // Fetch settings if API exists
      const response = await axios.get('/api/admin/settings.php')
      const data = Array.isArray(response.data) ? response.data : []
      const storeName = data.find(s => s.key === 'google_merchant_store_name')
      const storeUrl = data.find(s => s.key === 'google_merchant_store_url')
      const feedUrlSetting = data.find(s => s.key === 'google_merchant_feed_url')
      
      setSettings({
        store_name: storeName?.value || '',
        store_url: storeUrl?.value || window.location.origin,
        feed_url: feedUrlSetting?.value || `${window.location.origin}/api/google-merchant/feed.php`
      })
    } catch (error) {
      console.error('Error fetching settings:', error)
      setSettings({
        store_name: '',
        store_url: window.location.origin,
        feed_url: `${window.location.origin}/api/google-merchant/feed.php`
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTestFeed = () => {
    window.open(feedUrl, '_blank')
  }

  const handleCopyFeedUrl = () => {
    navigator.clipboard.writeText(feedUrl)
    alert('Feed URL copied to clipboard!')
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
      <h2 className="text-2xl font-bold text-gray-800">Google Merchant Center</h2>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Product Feed</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Feed URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={feedUrl}
                readOnly
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 bg-gray-50"
              />
              <button
                onClick={handleCopyFeedUrl}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Copy
              </button>
              <button
                onClick={handleTestFeed}
                className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Test Feed
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Use this URL in Google Merchant Center to import your products.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-blue-800 mb-2">Integration Instructions</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Go to <strong>Google Merchant Center</strong></li>
          <li>Navigate to <strong>Products → Feeds</strong></li>
          <li>Click <strong>"Add primary feed"</strong></li>
          <li>Select <strong>"Scheduled fetch"</strong></li>
          <li>Enter the feed URL above</li>
          <li>Set fetch frequency (daily recommended)</li>
          <li>Click <strong>"Test feed"</strong> to verify</li>
          <li>Once verified, submit the feed</li>
        </ol>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Feed Information</h3>
        <div className="space-y-3 text-gray-700">
          <div>
            <span className="font-semibold">Format:</span> XML (RSS 2.0)
          </div>
          <div>
            <span className="font-semibold">Products:</span> All active products from your catalog
          </div>
          <div>
            <span className="font-semibold">Update Frequency:</span> Real-time (fetch when needed)
          </div>
          <div>
            <span className="font-semibold">Required Fields:</span> ID, Title, Description, Link, Image, Price, Availability
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-yellow-800 mb-2">⚠️ Important Notes</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Ensure all products have valid images, prices, and descriptions</li>
          <li>Product prices should be in USD format</li>
          <li>Products must have stock status set correctly</li>
          <li>Feed URL must be accessible publicly (no authentication required)</li>
          <li>Check Google Merchant Center dashboard for feed status and errors</li>
        </ul>
      </div>
    </div>
  )
}

export default GoogleMerchantManagement

