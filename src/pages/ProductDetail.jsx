import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { useCart } from '../context/CartContext'
import { useWhatsApp } from '../hooks/useWhatsApp'
import {
  SITE_ORIGIN,
  SITE_NAME,
  SITE_AUTHOR,
  SITE_PUBLISHER,
  DEFAULT_ROBOTS,
  GENERIC_KEYWORDS,
  GENERIC_DESCRIPTION,
} from '../config/siteSeo'
import { applyDocumentSeo, applyProductJsonLd, clearProductJsonLd } from '../utils/documentSeo'
import { getProductBrochureUrl } from '../utils/porcelainCatalog'
import {
  buildVariationsFromProductData,
  getColorOptionVisual,
  getOptionSizeLabels,
  getVariationOptionKey,
  isDuplicateOfColorVariation,
} from '../utils/variationOption'
import { PLACEHOLDER_IMAGE, preloadImages, productImageSrc } from '../utils/mediaUrl'
import ImageComparison from '../components/ImageComparison'
import ProductVariationSelector from '../components/ProductVariationSelector'
import ProductCard from '../components/ProductCard'
import MoneyAmount from '../components/MoneyAmount'
import { applyCategoryDiscount } from '../utils/pricing'
import { trackPageView, setLiveProductId } from '../utils/siteAnalytics'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

// Custom Arrow Components for Related Products
const NextArrow = ({ onClick }) => (
  <button
    onClick={onClick}
    className="absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-100 text-gray-700 rounded-full p-2 md:p-3 shadow-lg border border-gray-200 transition-all hover:scale-110"
    aria-label="Next"
  >
    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  </button>
)

const PrevArrow = ({ onClick }) => (
  <button
    onClick={onClick}
    className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-100 text-gray-700 rounded-full p-2 md:p-3 shadow-lg border border-gray-200 transition-all hover:scale-110"
    aria-label="Previous"
  >
    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  </button>
)

const stripHtmlToPlain = (html) =>
  String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const ProductDetail = () => {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(null)
  const [galleryImages, setGalleryImages] = useState([])
  const [showComparison, setShowComparison] = useState(true)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [variations, setVariations] = useState([])
  const [selectedVariations, setSelectedVariations] = useState({})
  const [variationPrices, setVariationPrices] = useState({})
  const [selectedSize, setSelectedSize] = useState('')
  const [variationLibraryLoading, setVariationLibraryLoading] = useState(false)
  const productFetchGen = useRef(0)
  const [sqft, setSqft] = useState('')
  const [length, setLength] = useState(null)
  const [lengthInput, setLengthInput] = useState('')
  const [measureError, setMeasureError] = useState('')
  const [measureHint, setMeasureHint] = useState('')
  const [productDetailPromo, setProductDetailPromo] = useState(null)
  const [categoryPDFs, setCategoryPDFs] = useState({ datasheet_pdf: null, brochure_pdf: null })
  const { addToCart, addToCartSilently } = useCart()
  const { openWhatsApp } = useWhatsApp()

  useEffect(() => {
    fetchProduct()
  }, [slug])

  useEffect(() => {
    const need = searchParams.get('need_measure')
    if (need === 'sqft') {
      setMeasureHint('Please enter square feet (sqft) before adding this product to your cart.')
    } else if (need === 'length') {
      setMeasureHint('Please enter length before adding this product to your cart.')
    } else if (need === '1' || need === 'true') {
      setMeasureHint('Please enter sqft or length before adding this product to your cart.')
    } else {
      setMeasureHint('')
    }
  }, [searchParams])

  useEffect(() => {
    if (sqft !== '' || length) setMeasureError('')
  }, [sqft, length])

  useEffect(() => {
    return () => setLiveProductId(null)
  }, [])

  const primaryColorVariation = useMemo(
    () => variations.find((v) => v.type === 'color'),
    [variations]
  )

  const displayableVariations = useMemo(() => {
    if (!variations.length) return []
    let productVariationsJson = {}
    try {
      productVariationsJson = product?.variations
        ? typeof product.variations === 'string'
          ? JSON.parse(product.variations)
          : product.variations
        : {}
    } catch {
      productVariationsJson = {}
    }
    const colorVars = variations.filter((v) => v.type === 'color')
    return variations.filter(
      (v) => v.type === 'color' || !isDuplicateOfColorVariation(v, productVariationsJson, colorVars)
    )
  }, [variations, product?.variations])

  const colorVisualByKey = useMemo(() => {
    const map = new Map()
    if (!primaryColorVariation?.options) return map
    for (const option of primaryColorVariation.options) {
      const key = getVariationOptionKey(option)
      if (key) map.set(String(key), getColorOptionVisual(option))
    }
    return map
  }, [primaryColorVariation])

  const selectedColorRoomScene = useMemo(() => {
    if (!primaryColorVariation) return null
    const key = selectedVariations[primaryColorVariation.id]
    if (!key) return null
    return colorVisualByKey.get(String(key))?.roomScene || null
  }, [primaryColorVariation, selectedVariations, colorVisualByKey])

  const applyColorVisual = useCallback(
    (optionKey) => {
      if (!product) return
      setShowComparison(false)
      if (!optionKey) {
        setSelectedImage(product.image || PLACEHOLDER_IMAGE)
        return
      }
      const visual = colorVisualByKey.get(String(optionKey))
      const fallback = product.image || PLACEHOLDER_IMAGE
      if (!visual) {
        setSelectedImage(fallback)
        return
      }
      const preview = visual.swatch || visual.roomScene || fallback
      setSelectedImage(preview)
      if (visual.roomScene && visual.roomScene !== preview) {
        const full = productImageSrc(visual.roomScene)
        const img = new Image()
        img.onload = () => setSelectedImage(visual.roomScene)
        img.src = full
      }
    },
    [product, colorVisualByKey]
  )

  useEffect(() => {
    if (!primaryColorVariation) return
    const urls = []
    for (const visual of colorVisualByKey.values()) {
      if (visual.swatch) urls.push(visual.swatch)
      if (visual.roomScene) urls.push(visual.roomScene)
    }
    preloadImages(urls)
  }, [primaryColorVariation, colorVisualByKey])

  useEffect(() => {
    if (!product || loading) return
    const slugOrId =
      product.slug && String(product.slug).trim() !== ''
        ? product.slug
        : product.id
    const pathSegment = encodeURIComponent(String(slugOrId))
    const origin = SITE_ORIGIN.replace(/\/$/, '')
    const canonicalUrl = `${origin}/product/${pathSegment}`
    const title =
      (product.meta_title && String(product.meta_title).trim()) ||
      `${product.name} | ${SITE_NAME}`
    let description =
      (product.meta_description && String(product.meta_description).trim()) ||
      stripHtmlToPlain(product.description)
    if (description.length > 165) {
      description = `${description.slice(0, 162)}...`
    }
    if (!description) description = GENERIC_DESCRIPTION
    const keywords =
      (product.meta_keywords && String(product.meta_keywords).trim()) ||
      GENERIC_KEYWORDS
    applyDocumentSeo({
      title,
      description,
      keywords,
      canonicalUrl,
      robots: DEFAULT_ROBOTS,
      author: SITE_AUTHOR,
      publisher: SITE_PUBLISHER,
    })

    const price = parseFloat(product.price)
    const imageUrl = product.image
      ? product.image.startsWith('http')
        ? product.image
        : `${origin}${product.image.startsWith('/') ? '' : '/'}${product.image}`
      : undefined
    const availability =
      String(product.status || 'active').toLowerCase() === 'active'
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock'

    applyProductJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': `${canonicalUrl}#product`,
      name: product.name,
      description: description || undefined,
      image: imageUrl ? [imageUrl] : undefined,
      sku: product.sku || String(product.id),
      mpn: product.sku || String(product.id),
      brand: {
        '@type': 'Brand',
        name: 'Tile and Turf',
      },
      url: canonicalUrl,
      offers: {
        '@type': 'Offer',
        url: canonicalUrl,
        priceCurrency: 'USD',
        price: Number.isFinite(price) ? price.toFixed(2) : undefined,
        availability,
        itemCondition: 'https://schema.org/NewCondition',
        seller: {
          '@type': 'Organization',
          name: 'Tile and Turf',
          '@id': `${origin}/#organization`,
        },
      },
    })

    return () => clearProductJsonLd()
  }, [product, loading])

  const fetchProductDetailPromo = async () => {
    try {
      // Fetch all settings at once
      const response = await axios.get('/api/admin/settings.php')
      const settings = response.data || {}
      
      const content = settings.product_detail_promo_content || ''
      const status = settings.product_detail_promo_status || 'inactive'
      const isActive = status === 'active' || status === '1'
      
      if (isActive && content) {
        setProductDetailPromo(content)
      } else {
        setProductDetailPromo(null)
      }
    } catch (error) {
      // If settings don't exist, just don't show the promo
      setProductDetailPromo(null)
    }
  }

  const fetchProduct = async () => {
    if (!slug) {
      setLoading(false)
      return
    }
    
    const fetchGen = ++productFetchGen.current
    setLoading(true)
    setVariationLibraryLoading(false)
    try {
      // Try to fetch by slug first, fallback to id if slug is numeric
      const isNumeric = /^\d+$/.test(slug)
      // Decode slug if it's encoded (React Router may have already decoded it)
      let decodedSlug = slug
      try {
        decodedSlug = decodeURIComponent(slug)
      } catch (e) {
        // If already decoded, use as is
        decodedSlug = slug
      }
      const apiUrl = isNumeric 
        ? `/api/products.php?id=${slug}`
        : `/api/products.php?slug=${encodeURIComponent(decodedSlug)}`
      
      const response = await axios.get(apiUrl)
      let productData = response.data
      
      // Handle case where API returns array instead of single object
      if (Array.isArray(productData) && productData.length > 0) {
        productData = productData[0]
      }
      
      // Check if product was found
      if (!productData || productData === null || (typeof productData === 'object' && Object.keys(productData).length === 0)) {
        console.error('Product not found', { apiUrl, productData })
        setLoading(false)
        navigate('/products', { replace: true })
        return
      }
      
      // Redirect to slug URL if we got product by id and it has a slug
      if (productData && isNumeric && productData.slug && productData.slug.trim() !== '') {
        const newUrl = `/product/${encodeURIComponent(productData.slug)}`
        if (window.location.pathname !== newUrl) {
          window.history.replaceState({}, '', newUrl)
        }
      }
      setProduct(productData)
      setSelectedVariations({})
      setVariationPrices({})
      setSelectedSize('')
      // Reset length and sqft inputs when product changes
      setLength(null)
      setLengthInput('')
      setSqft('')
      setMeasureError('')

      if (productData?.id) {
        trackPageView({
          path: window.location.pathname,
          productId: productData.id,
        })
      }
      
      // Fetch category PDFs if product has category
      if (productData.category_id) {
        try {
          const categoryResponse = await axios.get(`/api/categories.php`)
          const categories = Array.isArray(categoryResponse.data) ? categoryResponse.data : []
          const category = categories.find(cat => cat.id == productData.category_id || cat.id === parseInt(productData.category_id))
          if (category) {
            setCategoryPDFs({
              datasheet_pdf: category.datasheet_pdf || null,
              brochure_pdf: category.brochure_pdf || null
            })
          } else {
            setCategoryPDFs({ datasheet_pdf: null, brochure_pdf: null })
          }
        } catch (error) {
          console.error('Error fetching category PDFs:', error)
          setCategoryPDFs({ datasheet_pdf: null, brochure_pdf: null })
        }
      } else {
        setCategoryPDFs({ datasheet_pdf: null, brochure_pdf: null })
      }
      
      let variationsData = null
      try {
        if (productData.variations) {
          variationsData =
            typeof productData.variations === 'string'
              ? JSON.parse(productData.variations)
              : productData.variations
        }
      } catch (e) {
        console.error('Error parsing variations:', e)
        variationsData = null
      }

      const variationIds =
        variationsData && typeof variationsData === 'object'
          ? Object.keys(variationsData)
              .filter((id) => id !== 'product_variations')
              .map((id) => parseInt(id, 10))
              .filter((id) => !Number.isNaN(id))
          : []

      if (variationIds.length > 0) {
        setVariationLibraryLoading(true)
        try {
          const res = await axios.get('/api/admin/variations.php')
          if (fetchGen === productFetchGen.current) {
            const allList = Array.isArray(res.data) ? res.data : []
            const validVariations = buildVariationsFromProductData(variationsData, allList)
            setVariations(validVariations)
          }
        } catch (e) {
          console.error('Error fetching variation library:', e)
          if (fetchGen === productFetchGen.current) {
            setVariations(buildVariationsFromProductData(variationsData, []))
          }
        } finally {
          if (fetchGen === productFetchGen.current) {
            setVariationLibraryLoading(false)
          }
        }
      } else {
        setVariations([])
      }

      // Parse gallery images
      if (productData.gallery_images) {
        try {
          const gallery = typeof productData.gallery_images === 'string' 
            ? JSON.parse(productData.gallery_images) 
            : productData.gallery_images
          setGalleryImages(Array.isArray(gallery) ? gallery : [])
        } catch (e) {
          setGalleryImages([])
        }
      } else {
        setGalleryImages([])
      }
      
      // Set initial selected image
      setSelectedImage(productData.image || '/slider.webp')
      
      // Fetch related products
      if (productData.related_products) {
        try {
          const relatedIds = typeof productData.related_products === 'string' 
            ? JSON.parse(productData.related_products) 
            : productData.related_products
          
          if (Array.isArray(relatedIds) && relatedIds.length > 0) {
            const relatedPromises = relatedIds.map(relatedId => 
              axios.get(`/api/products.php?id=${relatedId}`).catch(() => null)
            )
            const relatedResults = await Promise.all(relatedPromises)
            const validProducts = relatedResults
              .filter(result => result && result.data)
              .map(result => result.data)
            setRelatedProducts(validProducts)
          }
        } catch (e) {
          console.error('Error parsing related products:', e)
          setRelatedProducts([])
        }
      }
      
      await fetchProductDetailPromo()
      setLoading(false)
    } catch (error) {
      console.error('Error fetching product:', error)
      setLoading(false)
      // If product not found or error, redirect to products page
      if (error.response && (error.response.status === 404 || error.response.status === 400)) {
        navigate('/products', { replace: true })
      } else {
        // For other errors, still set loading to false
        setProduct(null)
        setLoading(false)
      }
    }
  }

  const calculateFinalPrice = () => {
    // If variations are selected, use only variation prices (don't add base price)
    const hasSelectedVariations = Object.keys(selectedVariations).length > 0
    
    if (hasSelectedVariations) {
      // Use variation prices only, not base price
      let totalVariationPrice = 0
      Object.keys(selectedVariations).forEach(variationId => {
        const price = variationPrices[variationId]
        if (price) {
          totalVariationPrice += parseFloat(price)
        }
      })
      const raw =
        totalVariationPrice > 0 ? totalVariationPrice : parseFloat(product?.price) || 0
      return applyCategoryDiscount(raw, product)
    }
    
    return applyCategoryDiscount(parseFloat(product?.price) || 0, product)
  }

  const isVariationSelectionComplete = () => {
    if (displayableVariations.length === 0) return true

    const primaryColorId = primaryColorVariation?.id

    const allVariationsSelected = displayableVariations.every((v) => {
      if (v.type === 'color') {
        return primaryColorId != null && Boolean(selectedVariations[primaryColorId])
      }
      return Boolean(selectedVariations[v.id])
    })
    if (!allVariationsSelected) return false

    const key = primaryColorId != null ? selectedVariations[primaryColorId] : null
    const selOpt = primaryColorVariation?.options?.find(
      (o) => String(getVariationOptionKey(o)) === String(key)
    )
    const sizeOptions = getOptionSizeLabels(selOpt || {})
    if (sizeOptions.length >= 2 && !selectedSize) return false

    return true
  }

  const handleAddToCart = () => {
    if (!isVariationSelectionComplete()) {
      alert('Please select all required options (color, size, etc.) before adding to cart.')
      return
    }
    
    // Check if sqft or length is enabled (handle both boolean and integer 0/1 from database)
    const isSqftEnabled = product.sqft_enabled == 1 || product.sqft_enabled === true
    const isLengthEnabled = product.length_enabled == 1 || product.length_enabled === true
    
    // Validate sqft or length if enabled
    if (isSqftEnabled && (sqft === '' || sqft === null || isNaN(sqft) || sqft <= 0)) {
      setMeasureError('Please enter square feet (sqft) before continuing.')
      alert('Please enter square feet (sqft) before continuing.')
      return
    }
    
    if (isLengthEnabled && (!length || length === null || length === '' || length <= 0)) {
      setMeasureError('Please enter length before continuing.')
      alert('Please enter length before continuing.')
      return
    }

    setMeasureError('')
    
    let finalPrice = calculateFinalPrice()
    
    // Calculate price based on sqft if enabled
    if (isSqftEnabled && sqft !== '' && !isNaN(sqft) && sqft > 0) {
      // If variation is selected, use variation price; otherwise use base sqft_price
      const hasSelectedVariations = Object.keys(selectedVariations).length > 0
      let pricePerSqft = parseFloat(product.sqft_price) || 0
      
      if (hasSelectedVariations && Object.keys(variationPrices).length > 0) {
        // Use variation price as price per sqft
        // Sum all variation prices (in case multiple variations selected)
        let totalVariationPrice = 0
        Object.keys(selectedVariations).forEach(variationId => {
          const price = variationPrices[variationId]
          if (price) {
            totalVariationPrice += parseFloat(price)
          }
        })
        if (totalVariationPrice > 0) {
          pricePerSqft = totalVariationPrice
        }
      }
      
      finalPrice = parseFloat(sqft) * pricePerSqft
    }
    
    // Calculate price based on length if enabled
    // Formula: base_price + ((length - 1) * increment_price)
    // 1 length = base_price, 2 length = base_price + increment, etc.
    if (isLengthEnabled && product.length_base_price && product.length_increment_price) {
      finalPrice = parseFloat(product.length_base_price) + ((length - 1) * parseFloat(product.length_increment_price))
    }
    
    // For packaged products: use package price from the Price field.
    // Never override sqft/length pricing — those already produced the correct line total.
    const isPackaged = product.is_packaged == 1 || product.is_packaged === true
    let priceForCart = finalPrice

    if (isPackaged && !isSqftEnabled && !isLengthEnabled) {
      priceForCart = parseFloat(product.price) || 0
    }
    
    const productWithVariations = {
      ...product,
      price: priceForCart,
      selectedVariations: selectedVariations,
      variationPrices: variationPrices,
      selectedSize: selectedSize || undefined,
      sqft: isSqftEnabled ? sqft : null,
      length: isLengthEnabled ? length : null,
      quantity: isSqftEnabled || isLengthEnabled ? 1 : quantity
    }
    
    // If sqft or length enabled, add once with the calculated values
    // Otherwise, add multiple times based on quantity
    if (isSqftEnabled || isLengthEnabled) {
      addToCart(productWithVariations)
    } else {
      for (let i = 0; i < quantity; i++) {
        addToCart(productWithVariations)
      }
    }
  }

  const handleWhatsApp = () => {
    const message = `Hello, I'm interested in ${product?.name}. Product ID: ${product?.id}`
    openWhatsApp(message)
  }

  const handleQuickOrder = async () => {
    // Add to cart without opening the sidebar
    if (!isVariationSelectionComplete()) {
      alert('Please select all required options before proceeding to checkout.')
      return
    }
    
    // Validate sqft or length if enabled
    const isSqftEnabled = product.sqft_enabled == 1 || product.sqft_enabled === true
    const isLengthEnabled = product.length_enabled == 1 || product.length_enabled === true
    
    if (isSqftEnabled && (sqft === '' || sqft === null || isNaN(sqft) || sqft <= 0)) {
      setMeasureError('Please enter square feet (sqft) before continuing.')
      alert('Please enter square feet (sqft) before continuing.')
      return
    }
    
    if (isLengthEnabled && (!length || length === null || length === '' || length <= 0)) {
      setMeasureError('Please enter length before continuing.')
      alert('Please enter length before continuing.')
      return
    }

    setMeasureError('')
    
    let finalPrice = calculateFinalPrice()
    
    // Calculate price based on sqft if enabled
    if (isSqftEnabled && sqft !== '' && !isNaN(sqft) && sqft > 0) {
      // If variation is selected, use variation price; otherwise use base sqft_price
      const hasSelectedVariations = Object.keys(selectedVariations).length > 0
      let pricePerSqft = parseFloat(product.sqft_price) || 0
      
      if (hasSelectedVariations && Object.keys(variationPrices).length > 0) {
        // Use variation price as price per sqft
        // Sum all variation prices (in case multiple variations selected)
        let totalVariationPrice = 0
        Object.keys(selectedVariations).forEach(variationId => {
          const price = variationPrices[variationId]
          if (price) {
            totalVariationPrice += parseFloat(price)
          }
        })
        if (totalVariationPrice > 0) {
          pricePerSqft = totalVariationPrice
        }
      }
      
      finalPrice = parseFloat(sqft) * pricePerSqft
    }
    
    // Calculate price based on length if enabled
    // Formula: base_price + ((length - 1) * increment_price)
    // 1 length = base_price, 2 length = base_price + increment, etc.
    if (isLengthEnabled && product.length_base_price && product.length_increment_price) {
      finalPrice = parseFloat(product.length_base_price) + ((length - 1) * parseFloat(product.length_increment_price))
    }
    
    // For packaged products: use package price from the Price field.
    // Never override sqft/length pricing — those already produced the correct line total.
    const isPackaged = product.is_packaged == 1 || product.is_packaged === true
    let priceForCart = finalPrice

    if (isPackaged && !isSqftEnabled && !isLengthEnabled) {
      priceForCart = parseFloat(product.price) || 0
    }
    
    const productWithVariations = {
      ...product,
      price: priceForCart,
      selectedVariations: selectedVariations,
      variationPrices: variationPrices,
      selectedSize: selectedSize || undefined,
      sqft: isSqftEnabled ? sqft : null,
      length: isLengthEnabled ? length : null,
      quantity: isSqftEnabled || isLengthEnabled ? 1 : Math.max(1, quantity),
    }
    
    // Await cart write (+ localStorage sync) before navigating, or Checkout redirects to /cart
    try {
      if (addToCartSilently) {
        await addToCartSilently(productWithVariations)
      } else {
        await addToCart(productWithVariations, true)
      }
    } catch (e) {
      console.error('Quick checkout add-to-cart failed:', e)
      alert('Could not add product to cart. Please try again.')
      return
    }

    navigate('/checkout')
  }

  const handleDownloadDatasheet = () => {
    // Priority: product PDF > category PDF
    const pdfUrl = product?.datasheet_pdf || categoryPDFs.datasheet_pdf
    if (pdfUrl) {
      window.open(pdfUrl, '_blank')
    } else {
      alert('Technical datasheet not available for this product.')
    }
  }

  const handleDownloadBrochure = () => {
    const pdfUrl = getProductBrochureUrl(product, categoryPDFs.brochure_pdf)
    if (pdfUrl) {
      window.open(pdfUrl, '_blank')
    } else {
      alert('Product brochure not available for this product.')
    }
  }

  const handleWhatsAppShare = () => {
    const productUrl = product?.slug ? `/product/${product.slug}` : `/product/${product?.id}`
    const message = `Check out this product: ${product?.name} - ${window.location.origin}${productUrl}`
    openWhatsApp(message)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <div className="aspect-[4/3] w-full bg-gray-100 rounded-lg animate-pulse mb-6" />
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-10 bg-gray-100 rounded animate-pulse w-3/4" />
            <div className="h-6 bg-gray-100 rounded animate-pulse w-1/3" />
            <div className="h-24 bg-gray-100 rounded animate-pulse" />
            <div className="h-12 bg-gray-100 rounded animate-pulse w-full" />
          </div>
        </div>
      </div>
    )
  }

  // Check if PDFs are available (product or category) - must be after loading check
  const hasDatasheet = product?.datasheet_pdf || categoryPDFs.datasheet_pdf
  const hasBrochure = !!getProductBrochureUrl(product, categoryPDFs.brochure_pdf)

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-600 text-lg">Product not found.</p>
        <Link to="/products" className="text-primary hover:underline mt-4 inline-block">
          Back to Products
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          {/* Main Image or Comparison */}
          {product.comparison_before && product.comparison_after && showComparison ? (
            <div className="mb-6">
              <div className="relative">
                <ImageComparison 
                  beforeImage={product.comparison_before} 
                  afterImage={product.comparison_after}
                  alt={product.name}
                />
                <button
                  onClick={() => setShowComparison(false)}
                  className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold shadow-md transition-colors z-10"
                >
                  View Gallery
                </button>
              </div>
              {/* Product Detail Promo Banner - Mobile Only */}
              {productDetailPromo && (
                <div className="lg:hidden mt-0 bg-gradient-to-r from-green-50 to-emerald-50 border-t-2 border-green-200 py-3 px-4">
                  <div 
                    className="text-sm font-semibold text-gray-800 text-center"
                    dangerouslySetInnerHTML={{ __html: productDetailPromo }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="mb-6">
              <div className="aspect-[4/3] w-full overflow-hidden rounded-lg shadow-lg bg-gray-50">
                <img
                  key={productImageSrc(selectedImage || product.image)}
                  src={productImageSrc(selectedImage || product.image)}
                  alt={product.name}
                  width={800}
                  height={600}
                  className="w-full h-full object-contain"
                  decoding="async"
                  fetchPriority="high"
                  onError={(e) => {
                    e.currentTarget.src = PLACEHOLDER_IMAGE
                  }}
                />
              </div>
              {/* Product Detail Promo Banner - Mobile Only */}
              {productDetailPromo && (
                <div className="lg:hidden mt-0 bg-gradient-to-r from-green-50 to-emerald-50 border-t-2 border-green-200 py-3 px-4">
                  <div 
                    className="text-sm font-semibold text-gray-800 text-center"
                    dangerouslySetInnerHTML={{ __html: productDetailPromo }}
                  />
                </div>
              )}
              {product.comparison_before && product.comparison_after && (
                <button
                  onClick={() => setShowComparison(true)}
                  className="mt-2 w-full bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  View Before/After Comparison
                </button>
              )}
            </div>
          )}

          {/* Gallery Images */}
          {(galleryImages.length > 0 || product.image || selectedColorRoomScene) && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Gallery</h3>
              <div className="grid grid-cols-4 gap-2">
                {selectedColorRoomScene && (
                  <button
                    type="button"
                    title="Room scene (selected color)"
                    onClick={() => {
                      setSelectedImage(selectedColorRoomScene)
                      setShowComparison(false)
                    }}
                    className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                      selectedImage === selectedColorRoomScene && !showComparison
                        ? 'border-primary ring-2 ring-primary'
                        : 'border-amber-300 hover:border-amber-400'
                    }`}
                  >
                    <img
                      src={productImageSrc(selectedColorRoomScene)}
                      alt=""
                      className="w-full h-20 object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                )}
                {product.image && (
                  <button
                    onClick={() => {
                      setSelectedImage(product.image)
                      setShowComparison(false)
                    }}
                    className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                      selectedImage === product.image && !showComparison ? 'border-primary ring-2 ring-primary' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      width={80}
                      height={80}
                      className="w-full h-20 object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                )}
                {galleryImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedImage(img)
                      setShowComparison(false)
                    }}
                    className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                      selectedImage === img && !showComparison ? 'border-primary ring-2 ring-primary' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} - Gallery ${index + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-20 object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">{product.name}</h1>
          {!(product.call_for_pricing == 1 || product.call_for_pricing === true) && (
            <p className="text-3xl font-bold text-primary mb-6">
              {(() => {
                const isPackaged = product.is_packaged == 1 || product.is_packaged === true
                const isSqftEnabled = product.sqft_enabled == 1 || product.sqft_enabled === true
                const isLengthEnabled = product.length_enabled == 1 || product.length_enabled === true
                const finalPrice = calculateFinalPrice()
                const hasVariations = Object.keys(selectedVariations).length > 0
                
                // Sqft pricing display
                if (isSqftEnabled && product.sqft_price) {
                let sqftDisplayAmount = parseFloat(product.sqft_price) || 0
                if (hasVariations && Object.keys(variationPrices).length > 0) {
                  let totalVariationPrice = 0
                  Object.keys(selectedVariations).forEach((variationId) => {
                    const price = variationPrices[variationId]
                    if (price) totalVariationPrice += parseFloat(price)
                  })
                  if (totalVariationPrice > 0) {
                    sqftDisplayAmount = totalVariationPrice
                  }
                }

                return (
                  <>
                    <MoneyAmount amount={sqftDisplayAmount} product={product} />
                    <span className="text-sm font-normal text-gray-600 ml-2">
                      /per sqft
                    </span>
                  </>
                )
              }
              
              // Length pricing display
              if (isLengthEnabled && product.length_base_price) {
                let pricePerLength = parseFloat(product.length_base_price) || 0
                
                if (hasVariations && Object.keys(variationPrices).length > 0) {
                  let totalVariationPrice = 0
                  Object.keys(selectedVariations).forEach((variationId) => {
                    const price = variationPrices[variationId]
                    if (price) totalVariationPrice += parseFloat(price)
                  })
                  if (totalVariationPrice > 0) {
                    pricePerLength = totalVariationPrice
                  }
                }
                
                return (
                  <>
                    <MoneyAmount amount={pricePerLength} product={product} />
                    <span className="text-sm font-normal text-gray-600 ml-2">
                      /length
                    </span>
                  </>
                )
              }
              
              // Package pricing display
              if (isPackaged && product.pack_size) {
                const showUnitPrice = product.show_unit_price == 1 || product.show_unit_price === true
                
                // Use package price from database directly (admin panel "Price" field)
                // Don't use variation prices for display
                const packagePrice = parseFloat(product.price) || 0
                
                // Priority: pcs_per_box > pack_size > 1
                // pcs_per_box = kutudaki adet sayısı (doğru değer, öncelikli)
                // pack_size = paket içindeki birim sayısı (fallback)
                let piecesInBox
                if (product.pcs_per_box != null && product.pcs_per_box !== '' && product.pcs_per_box !== 0) {
                  piecesInBox = parseFloat(product.pcs_per_box)
                } else if (product.pack_size != null && product.pack_size !== '' && product.pack_size !== 0) {
                  piecesInBox = parseFloat(product.pack_size)
                } else {
                  piecesInBox = 1
                }
                
                // Calculate unit price: package price / pieces in box
                const unitPrice = packagePrice / piecesInBox
                
                // If show_unit_price is true, show unit price "$X.XX/pcs Sold per box (X pcs per box)" format
                if (showUnitPrice) {
                  const pcsPerBox = (product.pcs_per_box != null && product.pcs_per_box !== '' && product.pcs_per_box !== 0) ? ` (${product.pcs_per_box} pcs per box)` : ''
                  return (
                    <>
                      <MoneyAmount amount={unitPrice} product={product} />
                      <span className="text-sm font-normal text-gray-600 ml-2">
                        /pcs Sold per box{pcsPerBox}
                      </span>
                    </>
                  )
                }
                
                return <MoneyAmount amount={packagePrice} product={product} />
              }
              
              const showUnitPriceForPiece = product.show_unit_price == 1 || product.show_unit_price === true
              if (!isPackaged && showUnitPriceForPiece) {
                return (
                  <>
                    <MoneyAmount amount={finalPrice} product={product} />
                    <span className="text-sm font-normal text-gray-600 ml-2">
                      /pcs
                    </span>
                  </>
                )
              }
              
              return <MoneyAmount amount={finalPrice} product={product} />
            })()}
            </p>
          )}
          
          <div className="mb-6">
            <p className="text-gray-700 leading-relaxed">
              {product.description || 'Premium quality product designed for durability and performance.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mb-6 flex flex-wrap gap-3">
            {hasDatasheet && (
              <button
                onClick={handleDownloadDatasheet}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors text-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Technical Datasheet</span>
                {!product?.datasheet_pdf && categoryPDFs.datasheet_pdf && (
                  <span className="text-xs text-gray-500">(Category)</span>
                )}
              </button>
            )}
            
            {hasBrochure && (
              <button
                onClick={handleDownloadBrochure}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors text-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span>Product Brochure</span>
                {!product?.brochure_pdf && categoryPDFs.brochure_pdf && (
                  <span className="text-xs text-gray-500">(Category)</span>
                )}
              </button>
            )}
            
            <button
              onClick={handleWhatsAppShare}
              className="flex items-center space-x-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg font-semibold transition-colors text-sm"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              <span>Share on WhatsApp</span>
            </button>
          </div>

          <ProductVariationSelector
            product={product}
            variations={variations}
            variationLibraryLoading={variationLibraryLoading}
            selectedVariations={selectedVariations}
            setSelectedVariations={setSelectedVariations}
            variationPrices={variationPrices}
            setVariationPrices={setVariationPrices}
            selectedSize={selectedSize}
            setSelectedSize={setSelectedSize}
            onColorVisualChange={applyColorVisual}
          />


          {(measureHint || measureError) && (
            <div
              className={`mb-4 rounded-lg border-l-4 p-3 text-sm font-semibold ${
                measureError
                  ? 'border-red-500 bg-red-50 text-red-800'
                  : 'border-amber-500 bg-amber-50 text-amber-900'
              }`}
            >
              {measureError || measureHint}
            </div>
          )}

          {/* Sqft Input - Only show if sqft_enabled */}
          {(product.sqft_enabled == 1 || product.sqft_enabled === true) && (
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">
                Square Feet (Sqft) *
              </label>
              <input
                type="number"
                value={sqft}
                onChange={(e) => {
                  const value = e.target.value === '' ? '' : parseFloat(e.target.value);
                  setSqft(value === '' || isNaN(value) ? '' : (value > 0 ? value : ''));
                }}
                step="0.01"
                min="0"
                className={`w-full rounded-lg px-4 py-2 font-semibold border ${
                  measureError ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter sqft"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Required — enter the area in square feet.</p>
              {measureError && (
                <p className="text-red-600 text-sm font-semibold mt-1">{measureError}</p>
              )}
              {product.sqft_price && sqft !== '' && !isNaN(sqft) && sqft > 0 && (() => {
                const hasSelectedVariations = Object.keys(selectedVariations).length > 0
                let pricePerSqft = parseFloat(product.sqft_price) || 0
                
                if (hasSelectedVariations && Object.keys(variationPrices).length > 0) {
                  // Use variation price as price per sqft
                  let totalVariationPrice = 0
                  Object.keys(selectedVariations).forEach(variationId => {
                    const price = variationPrices[variationId]
                    if (price) {
                      totalVariationPrice += parseFloat(price)
                    }
                  })
                  if (totalVariationPrice > 0) {
                    pricePerSqft = totalVariationPrice
                  }
                }
                
                const discountedPerSqft = applyCategoryDiscount(pricePerSqft, product)
                const totalPrice = parseFloat(sqft) * discountedPerSqft
                
                return (
                  <p className="text-sm text-gray-600 mt-1">
                    Price per sqft:{' '}
                    <MoneyAmount amount={pricePerSqft} product={product} /> | Total: $
                    {totalPrice.toFixed(2)}
                  </p>
                )
              })()}
            </div>
          )}

          {/* Length Input - Only show if length_enabled */}
          {(product.length_enabled == 1 || product.length_enabled === true) && (
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">
                Length *
              </label>
              <input
                type="number"
                value={lengthInput}
                onChange={(e) => {
                  const value = e.target.value
                  setLengthInput(value)
                  // Update length state only if valid number
                  const numValue = parseInt(value)
                  if (value !== '' && !isNaN(numValue) && numValue >= 1) {
                    setLength(numValue)
                  } else {
                    setLength(null)
                  }
                }}
                onBlur={(e) => {
                  // If empty or invalid on blur, keep it empty (don't set default)
                  const numValue = parseInt(e.target.value)
                  if (e.target.value === '' || isNaN(numValue) || numValue < 1) {
                    setLengthInput('')
                    setLength(null)
                  } else {
                    setLengthInput(e.target.value)
                    setLength(numValue)
                  }
                }}
                min="1"
                className={`w-24 rounded-lg px-3 py-2 font-semibold border ${
                  measureError ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter length"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Required — enter length before adding to cart.</p>
              {measureError && (
                <p className="text-red-600 text-sm font-semibold mt-1">{measureError}</p>
              )}
              {product.length_base_price && product.length_increment_price && length && (
                <p className="text-sm text-gray-600 mt-1">
                  Base:{' '}
                  <MoneyAmount amount={product.length_base_price} product={product} /> | Increment:{' '}
                  <MoneyAmount amount={product.length_increment_price} product={product} /> per unit |
                  Total: $
                  {(
                    applyCategoryDiscount(product.length_base_price, product) +
                    (length - 1) * applyCategoryDiscount(product.length_increment_price, product)
                  ).toFixed(2)}
                </p>
              )}
            </div>
          )}

          {/* Quantity - Only show if neither sqft nor length is enabled */}
          {!(product.sqft_enabled == 1 || product.sqft_enabled === true) && !(product.length_enabled == 1 || product.length_enabled === true) && (
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">Quantity:</label>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center border border-gray-300 rounded-lg px-4 py-2 font-semibold"
                  min="1"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {product.call_for_pricing == 1 || product.call_for_pricing === true ? (
              <button
                onClick={handleWhatsApp}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span>Call For Pricing</span>
              </button>
            ) : product.catalog_mode === 'yes' ? (
              <button
                onClick={() => navigate('/request-quote', { state: { product } })}
                className="w-full bg-primary hover:bg-primary-dark text-white py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Request Quote
              </button>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={!isVariationSelectionComplete()}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 transform ${
                  isVariationSelectionComplete()
                    ? 'bg-primary hover:bg-primary-dark text-white hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isVariationSelectionComplete() ? 'Add to Cart' : 'Please Select at Least One Variation'}
              </button>
            )}

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleWhatsApp}
                className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span>WhatsApp Support</span>
              </button>

              <button
                onClick={handleQuickOrder}
                disabled={!isVariationSelectionComplete()}
                className={`py-3 px-4 rounded-lg font-semibold transition-colors ${
                  isVariationSelectionComplete()
                    ? 'bg-primary-dark hover:bg-gray-900 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Quick Checkout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Complementary Products</h2>
          {relatedProducts.length > 4 ? (
            <div className="relative px-10 md:px-12">
              <Slider
                dots={false}
                arrows={true}
                infinite={true}
                speed={500}
                slidesToShow={4}
                slidesToScroll={1}
                autoplay={true}
                autoplaySpeed={3000}
                nextArrow={<NextArrow />}
                prevArrow={<PrevArrow />}
                swipeToSlide={true}
                touchThreshold={10}
                preventDefaultTouchmoveEvent={false}
                responsive={[
                  {
                    breakpoint: 1024,
                    settings: {
                      slidesToShow: 3,
                      slidesToScroll: 1,
                      arrows: true,
                      swipeToSlide: true,
                      touchThreshold: 10,
                      preventDefaultTouchmoveEvent: false,
                    }
                  },
                  {
                    breakpoint: 768,
                    settings: {
                      slidesToShow: 2,
                      slidesToScroll: 1,
                      arrows: true,
                      swipeToSlide: true,
                      touchThreshold: 10,
                      preventDefaultTouchmoveEvent: false,
                    }
                  },
                  {
                    breakpoint: 640,
                    settings: {
                      slidesToShow: 1,
                      slidesToScroll: 1,
                      arrows: true,
                      swipeToSlide: true,
                      touchThreshold: 10,
                      preventDefaultTouchmoveEvent: false,
                    }
                  }
                ]}
              >
                {relatedProducts.map((relatedProduct) => (
                  <div key={relatedProduct.id} className="px-2" onClick={(e) => e.stopPropagation()}>
                    <ProductCard product={relatedProduct} />
                  </div>
                ))}
              </Slider>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ProductDetail
