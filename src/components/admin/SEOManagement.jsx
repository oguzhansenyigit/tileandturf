import React, { useState, useEffect } from 'react'
import axios from 'axios'

const SEOManagement = () => {
  const [robotsContent, setRobotsContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchRobots()
  }, [])

  const fetchRobots = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/admin/seo.php?type=robots')
      if (response.data.success) {
        setRobotsContent(response.data.content || '')
      }
    } catch (error) {
      console.error('Error fetching robots.txt:', error)
      setRobotsContent('User-agent: *\nAllow: /\n\nSitemap: https://tileandturf.com/sitemap.xml')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveRobots = async () => {
    setSaving(true)
    try {
      const response = await axios.post('/api/admin/seo.php', {
        type: 'robots',
        content: robotsContent
      })
      if (response.data.success) {
        alert('Robots.txt updated successfully!')
      } else {
        alert('Error updating robots.txt: ' + response.data.error)
      }
    } catch (error) {
      console.error('Error saving robots.txt:', error)
      alert('Error saving robots.txt')
    } finally {
      setSaving(false)
    }
  }

  const testSitemap = () => {
    window.open('/sitemap.xml', '_blank')
  }

  const refreshSitemap = async () => {
    try {
      // First, try to delete static sitemap.xml if it exists (via API)
      try {
        await axios.post('/api/admin/seo.php', {
          type: 'delete_sitemap'
        })
      } catch (e) {
        // Ignore if endpoint doesn't exist or file doesn't exist
        console.log('Delete sitemap step:', e.message)
      }
      
      // Call sitemap.php to regenerate (with cache busting and refresh parameter)
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/sitemap.php?refresh=1&t=${timestamp}`, {
        method: 'GET',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (response.ok) {
        alert('Sitemap refreshed successfully! The sitemap has been regenerated with the latest products and categories.')
        // Open the sitemap in a new tab with cache busting
        setTimeout(() => {
          window.open(`/sitemap.xml?refresh=1&t=${timestamp}`, '_blank')
        }, 500)
      } else {
        alert('Error refreshing sitemap. Please try again.')
      }
    } catch (error) {
      console.error('Error refreshing sitemap:', error)
      alert('Error refreshing sitemap: ' + error.message)
    }
  }

  const testRobots = () => {
    window.open('/api/robots.php', '_blank')
  }

  const testFeed = () => {
    window.open('/api/google-merchant/feed.php', '_blank')
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">SEO Management</h2>
      </div>

      {/* Sitemap Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Sitemap.xml</h3>
        <p className="text-gray-600 mb-4">
          Your sitemap is automatically generated and includes all active products, categories, and pages. Click "Refresh Sitemap" to regenerate it with the latest products and categories.
        </p>
        <div className="flex gap-4">
          <button
            onClick={refreshSitemap}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            title="Refresh sitemap to include latest products and categories"
          >
            Refresh Sitemap
          </button>
          <button
            onClick={testSitemap}
            className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold transition-colors"
          >
            View Sitemap
          </button>
          <a
            href="/sitemap.xml"
            download="sitemap.xml"
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
          >
            Download Sitemap
          </a>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Sitemap URL: <code className="bg-gray-100 px-2 py-1 rounded">https://tileandturf.com/sitemap.xml</code>
        </p>
      </div>

      {/* Robots.txt Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Robots.txt</h3>
        <p className="text-gray-600 mb-4">
          Manage your robots.txt file to control search engine crawlers.
        </p>
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Robots.txt Content</label>
          <textarea
            value={robotsContent}
            onChange={(e) => setRobotsContent(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono text-sm"
            rows="10"
            placeholder="User-agent: *&#10;Allow: /&#10;&#10;Sitemap: https://tileandturf.com/sitemap.xml"
          />
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleSaveRobots}
            disabled={saving}
            className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold transition-colors disabled:bg-gray-300"
          >
            {saving ? 'Saving...' : 'Save Robots.txt'}
          </button>
          <button
            onClick={testRobots}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Test Robots.txt
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Robots.txt URL: <code className="bg-gray-100 px-2 py-1 rounded">https://tileandturf.com/api/robots.php</code>
        </p>
      </div>

      {/* Google Merchant Feed Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Google Merchant Feed</h3>
        <p className="text-gray-600 mb-4">
          Test your Google Merchant Center product feed. Make sure the XML is valid before submitting to Google.
        </p>
        <div className="flex gap-4">
          <button
            onClick={testFeed}
            className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors"
          >
            Test Feed
          </button>
          <a
            href="/api/google-merchant/feed.php"
            download="google-merchant-feed.xml"
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
          >
            Download Feed
          </a>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Feed URL: <code className="bg-gray-100 px-2 py-1 rounded">https://tileandturf.com/api/google-merchant/feed.php</code>
        </p>
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Important:</strong> The feed XML must be valid. Make sure there are no errors before submitting to Google Merchant Center.
          </p>
        </div>
      </div>
    </div>
  )
}

export default SEOManagement

