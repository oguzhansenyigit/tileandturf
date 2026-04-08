import React, { useState, useEffect } from 'react'
import axios from 'axios'

const DEFAULT_PAGE_RULES_TEMPLATE = `[
  // Thank-you sayfasinda conversion tetikle
  {
    "path": "/thank-you",
    "event": "conversion",
    "params": { "send_to": "AW-17685411407/REPLACE_LABEL" },
    "oncePerSession": false
  },
  // Tum urun detay sayfalarinda view_item event'i
  {
    "pathPrefix": "/product/",
    "event": "view_item",
    "params": { "send_to": "AW-17685411407/view_item" }
  }
]`

const DEFAULT_CLICK_RULES_TEMPLATE = `[
  // Urun linkine tiklayinca conversion tetikle
  {
    "selector": "a[href*='/product/']",
    "event": "conversion",
    "params": { "send_to": "AW-17685411407/product_click" }
  },
  // Checkout submit tusuna tiklayinca begin_checkout tetikle
  {
    "selector": "button[type='submit']",
    "event": "begin_checkout",
    "params": {}
  }
]`

const stripJsonComments = (text) =>
  text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .trim()

/** Default GA4 (edit measurement ID in Google if needed) */
const DEFAULT_HEAD_TRACKING = `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-PYRWVR3C8R"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-PYRWVR3C8R');
</script>`

const DEFAULT_BODY_TRACKING = `<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-WT2MHGP7"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`

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
  const [headTrackingSnippets, setHeadTrackingSnippets] = useState(DEFAULT_HEAD_TRACKING)
  const [bodyTrackingSnippets, setBodyTrackingSnippets] = useState(DEFAULT_BODY_TRACKING)
  const [googleAdsPageRules, setGoogleAdsPageRules] = useState(DEFAULT_PAGE_RULES_TEMPLATE)
  const [googleAdsClickRules, setGoogleAdsClickRules] = useState(DEFAULT_CLICK_RULES_TEMPLATE)

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
      {
        let head = (data.head_tracking_snippets || data.google_ads_head_tag || '').trim()
        if (!head) head = DEFAULT_HEAD_TRACKING
        setHeadTrackingSnippets(head)
        let body = (data.body_tracking_snippets || '').trim()
        if (!body) body = DEFAULT_BODY_TRACKING
        setBodyTrackingSnippets(body)
      }
      setGoogleAdsPageRules(data.google_ads_page_rules || DEFAULT_PAGE_RULES_TEMPLATE)
      setGoogleAdsClickRules(data.google_ads_click_rules || DEFAULT_CLICK_RULES_TEMPLATE)
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

  const handleSaveTrackingSnippets = async () => {
    try {
      await axios.post('/api/admin/settings.php', {
        head_tracking_snippets: headTrackingSnippets,
        body_tracking_snippets: bodyTrackingSnippets,
        google_ads_head_tag: ''
      })
      alert('Tracking codes saved successfully!')
      fetchSettings()
    } catch (error) {
      console.error('Error saving tracking codes:', error)
      alert('Error saving tracking codes')
    }
  }

  const handleSaveGoogleAdsRules = async () => {
    try {
      JSON.parse(stripJsonComments(googleAdsPageRules || '[]'))
      JSON.parse(stripJsonComments(googleAdsClickRules || '[]'))
    } catch (error) {
      alert('Rules JSON format is invalid. Please check syntax.')
      return
    }

    try {
      await axios.post('/api/admin/settings.php', {
        google_ads_page_rules: googleAdsPageRules,
        google_ads_click_rules: googleAdsClickRules
      })
      alert('Google Ads rules saved successfully!')
      fetchSettings()
    } catch (error) {
      console.error('Error saving Google Ads rules:', error)
      alert('Error saving Google Ads rules')
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

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Tracking &amp; analytics (head + body)</h3>
        <p className="text-sm text-gray-600 mb-4">
          Paste all site-wide tracking here so you do not need code deploys. Production uses <code>index.php</code> to inject these into every page.
          Put <strong>one</strong> primary Google tag in <code>&lt;head&gt;</code> when possible (or use Google Tag Manager to load GA4, Ads, etc.).
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Head snippets (<code>&lt;/head&gt;</code> öncesi — gtag, GTM script, doğrulama meta)
            </label>
            <textarea
              value={headTrackingSnippets}
              onChange={(e) => setHeadTrackingSnippets(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono text-sm"
              rows="12"
            />
            <p className="text-xs text-gray-500 mt-2">
              Varsayılan: GA4 <code>G-PYRWVR3C8R</code>. Google Ads AW / ek <code>gtag(&apos;config&apos;)</code> satırlarını aynı kutuya ekleyebilir veya GTM ile yönetebilirsiniz.
            </p>
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Body (hemen <code>&lt;body&gt;</code> açılışından sonra — GTM noscript vb.)
            </label>
            <textarea
              value={bodyTrackingSnippets}
              onChange={(e) => setBodyTrackingSnippets(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono text-sm"
              rows="6"
            />
          </div>
          <button
            onClick={handleSaveTrackingSnippets}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Save tracking codes
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Google Ads Event Rules (Page + Click)</h3>
        <p className="text-sm text-gray-600 mb-4">
          Define custom tracking rules in JSON. Page rules trigger on route open; click rules trigger when elements are clicked.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Page Rules JSON</label>
            <textarea
              value={googleAdsPageRules}
              onChange={(e) => setGoogleAdsPageRules(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono text-sm"
              rows="8"
              placeholder={DEFAULT_PAGE_RULES_TEMPLATE}
            />
            <p className="text-xs text-gray-600 mt-2">
              <strong>How to use:</strong> Use <code>path</code> for exact match (e.g. <code>/thank-you</code>) or{' '}
              <code>pathPrefix</code> for starts-with match (e.g. <code>/product/</code>).{' '}
              <code>event</code> is the gtag event name. <code>params</code> contains Google Ads values like{' '}
              <code>send_to</code>. Set <code>oncePerSession</code> to <code>true</code> if you want it to fire once per browser session.
            </p>
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Click Rules JSON</label>
            <textarea
              value={googleAdsClickRules}
              onChange={(e) => setGoogleAdsClickRules(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono text-sm"
              rows="8"
              placeholder={DEFAULT_CLICK_RULES_TEMPLATE}
            />
            <p className="text-xs text-gray-600 mt-2">
              <strong>How to use:</strong> <code>selector</code> must be a valid CSS selector (e.g.{' '}
              <code>a[href*='/product/']</code>, <code>.add-to-cart-btn</code>). When a clicked element matches this selector,{' '}
              <code>event</code> and <code>params</code> are sent with gtag. Use one rule per click target for clean reporting.
            </p>
          </div>
          <button
            onClick={handleSaveGoogleAdsRules}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Save Google Ads Rules
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsManagement

