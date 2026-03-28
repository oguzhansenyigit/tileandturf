import React, { useState, useEffect } from 'react'
import axios from 'axios'

const getDefaultFeedUrl = () =>
  (typeof window !== 'undefined' ? window.location.origin : '') + '/api/google-merchant/feed.php'

const ISSUE_LABELS = {
  no_image: 'Görsel yok',
  no_price: 'Fiyat 0 veya eksik',
  short_description: 'Açıklama çok kısa',
  no_title: 'Başlık yok',
  no_slug: 'Slug yok'
}

const GoogleMerchantManagement = () => {
  const [feedUrl, setFeedUrl] = useState(getDefaultFeedUrl())
  const [feedUrlDirty, setFeedUrlDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [diagnostics, setDiagnostics] = useState(null)
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/admin/settings.php')
      // API returns { setting_key: setting_value } object
      const data = response.data && typeof response.data === 'object' ? response.data : {}
      const savedUrl = data.google_merchant_feed_url || ''
      const url = savedUrl.trim() || getDefaultFeedUrl()
      setFeedUrl(url)
      setFeedUrlDirty(false)
    } catch (error) {
      console.error('Error fetching settings:', error)
      setFeedUrl(getDefaultFeedUrl())
    } finally {
      setLoading(false)
    }
  }

  const handleFeedUrlChange = (e) => {
    setFeedUrl(e.target.value)
    setFeedUrlDirty(true)
    setSaveMessage(null)
  }

  const handleSaveFeedUrl = async () => {
    setSaving(true)
    setSaveMessage(null)
    try {
      await axios.post('/api/admin/settings.php', {
        google_merchant_feed_url: feedUrl.trim() || getDefaultFeedUrl()
      })
      setFeedUrlDirty(false)
      setSaveMessage('Feed URL kaydedildi.')
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      console.error('Error saving feed URL:', error)
      setSaveMessage('Kaydetme hatası. Tekrar deneyin.')
    } finally {
      setSaving(false)
    }
  }

  const handleTestFeed = () => {
    window.open(feedUrl, '_blank')
  }

  const handleCopyFeedUrl = () => {
    navigator.clipboard.writeText(feedUrl)
    setSaveMessage('URL panoya kopyalandı.')
    setTimeout(() => setSaveMessage(null), 2000)
  }

  const fetchDiagnostics = async () => {
    setDiagnosticsLoading(true)
    try {
      const res = await axios.get('/api/admin/feed-diagnostics.php')
      setDiagnostics(res.data)
    } catch (err) {
      console.error('Diagnostics error:', err)
      setDiagnostics({ error: 'Yüklenemedi' })
    } finally {
      setDiagnosticsLoading(false)
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
      <h2 className="text-2xl font-bold text-gray-800">Google Merchant Center</h2>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Product Feed</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Feed URL</label>
            <div className="flex flex-wrap gap-2 items-start">
              <input
                type="url"
                value={feedUrl}
                onChange={handleFeedUrlChange}
                placeholder="https://example.com/api/google-merchant/feed.php"
                className="flex-1 min-w-[280px] border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
              />
              {feedUrlDirty && (
                <button
                  onClick={handleSaveFeedUrl}
                  disabled={saving}
                  className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-60"
                >
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              )}
              <button
                onClick={handleCopyFeedUrl}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Kopyala
              </button>
              <button
                onClick={handleTestFeed}
                className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Test Et
              </button>
            </div>
            {saveMessage && (
              <p className={`text-sm mt-2 font-medium ${saveMessage.includes('hatası') ? 'text-red-600' : 'text-green-600'}`}>
                {saveMessage}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-2">
              Bu URL&apos;yi Google Merchant Center → Products → Feeds bölümünde kullanın. Özel domain kullanıyorsanız buraya feed adresinizi yazıp kaydedin.
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
        <h3 className="text-xl font-bold text-gray-800 mb-4">Feed Durumu / Ürün Kontrolü</h3>
        <p className="text-gray-600 mb-4">
          Feed&apos;e girebilecek ve Google Merchant&apos;ta onay alabilecek ürünleri kontrol edin.
        </p>
        <button
          onClick={fetchDiagnostics}
          disabled={diagnosticsLoading}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-60"
        >
          {diagnosticsLoading ? 'Kontrol ediliyor...' : 'Ürünleri Kontrol Et'}
        </button>
        {diagnostics && !diagnostics.error && (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                Feed&apos;e uygun: {diagnostics.feed_ready}
              </span>
              <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
                Sorunlu: {diagnostics.with_issues}
              </span>
              <span className="text-gray-600">Toplam aktif: {diagnostics.total_active}</span>
            </div>
            {diagnostics.with_issues > 0 && (
              <div className="border border-amber-200 rounded-lg p-4 bg-amber-50">
                <h4 className="font-semibold text-amber-900 mb-3">Düzeltilmesi gereken ürünler</h4>
                <div className="space-y-3 text-sm">
                  {Object.entries(diagnostics.issues).map(([key, list]) =>
                    list.length > 0 ? (
                      <div key={key}>
                        <span className="font-medium text-amber-800">{ISSUE_LABELS[key]}:</span>
                        <ul className="mt-1 ml-4 list-disc">
                          {list.slice(0, 15).map((p) => (
                            <li key={p.id}>
                              <a
                                href={`/admin?section=products&edit=${p.id}`}
                                className="text-primary hover:underline"
                              >
                                #{p.id} {p.name || '(isimsiz)'}
                              </a>
                            </li>
                          ))}
                          {list.length > 15 && (
                            <li className="text-gray-600">+{list.length - 15} ürün daha</li>
                          )}
                        </ul>
                      </div>
                    ) : null
                  )}
                </div>
                <p className="mt-3 text-amber-800 text-sm">
                  Bu ürünleri düzenleyip görsel, fiyat veya açıklama ekleyin.
                </p>
              </div>
            )}
          </div>
        )}
        {diagnostics?.error && (
          <p className="mt-4 text-red-600">{diagnostics.error}</p>
        )}
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

