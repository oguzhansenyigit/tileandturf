import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { getProductUrl } from '../utils/slug'
import { useCart } from '../context/CartContext'
import { useWhatsApp } from '../hooks/useWhatsApp'
import { PLACEHOLDER_IMAGE, productImageSrc } from '../utils/mediaUrl'
import MoneyAmount from './MoneyAmount'
import { getProductBrochureUrl } from '../utils/porcelainCatalog'

const ProductCard = ({ product }) => {
  const { addToCart } = useCart()
  const { openWhatsApp } = useWhatsApp()
  const navigate = useNavigate()
  const [showComparison, setShowComparison] = useState(false)
  const [imgSrc, setImgSrc] = useState(() => productImageSrc(product?.image))

  const needsOptions =
    product?.sqft_enabled == 1 ||
    product?.sqft_enabled === true ||
    product?.length_enabled == 1 ||
    product?.length_enabled === true

  useEffect(() => {
    setImgSrc(productImageSrc(product?.image))
  }, [product?.image])

  // Handle ESC key to close modal
  useEffect(() => {
    if (showComparison) {
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          setShowComparison(false)
        }
      }
      // Disable body scroll when modal is open
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', handleEscape)
      
      return () => {
        document.body.style.overflow = 'unset'
        document.removeEventListener('keydown', handleEscape)
      }
    }
  }, [showComparison])

  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    // Sqft/length products are priced from customer input on the detail page.
    // Adding from the card would use the leftover base `price` field and undercharge.
    if (needsOptions) {
      navigate(getProductUrl(product))
      return
    }
    addToCart(product)
  }

  const handleDownloadDatasheet = (e) => {
    e.preventDefault()
    e.stopPropagation()
    // Priority: product PDF > category PDF
    const pdfUrl = product.datasheet_pdf || product.category_datasheet_pdf
    if (pdfUrl) {
      window.open(pdfUrl, '_blank')
    } else {
      alert('Technical datasheet not available for this product.')
    }
  }

  const handleDownloadBrochure = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const pdfUrl = getProductBrochureUrl(product, product.category_brochure_pdf)
    if (pdfUrl) {
      window.open(pdfUrl, '_blank')
    } else {
      alert('Product brochure not available for this product.')
    }
  }

  const handleWhatsAppShare = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const productUrl = getProductUrl(product)
    const message = `Check out this product: ${product.name} - ${window.location.origin}${productUrl}`
    openWhatsApp(message)
  }

  const handleShowComparison = (e) => {
    e.preventDefault()
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()
    if (product.comparison_before && product.comparison_after) {
      setShowComparison(true)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
      <Link to={getProductUrl(product)} className="block">
        <div className="relative h-64 overflow-hidden">
          <img
            src={imgSrc}
            alt={product.name}
            width={400}
            height={256}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            loading="lazy"
            decoding="async"
            onError={() => setImgSrc(PLACEHOLDER_IMAGE)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
      </Link>
      
      <div className="p-4">
        <Link to={`/product/${product.id}`}>
          <h3 className="text-lg font-semibold text-gray-800 mb-2 hover:text-primary transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>
        {product.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {product.description}
          </p>
        )}
        {!(product.call_for_pricing == 1 || product.call_for_pricing === true) && (
          <p className="text-xl font-bold text-primary mb-4">
            {(() => {
              const isPackaged = product.is_packaged == 1 || product.is_packaged === true
              const isLengthEnabled = product.length_enabled == 1 || product.length_enabled === true
              const basePrice = parseFloat(product.price) || 0
              
              // Sqft pricing display
              if (product.sqft_enabled == 1 || product.sqft_enabled === true) {
              return (
                <>
                  <MoneyAmount amount={product.sqft_price} product={product} />
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    /per sqft
                  </span>
                </>
              )
            }
            
            // Length pricing display
            if (isLengthEnabled && product.length_base_price) {
              return (
                <>
                  <MoneyAmount amount={product.length_base_price} product={product} />
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    /length
                  </span>
                </>
              )
            }
            
            // Package pricing display
            if (isPackaged && product.pack_size) {
              const showUnitPrice = product.show_unit_price == 1 || product.show_unit_price === true
              
              // basePrice is the package price in database (admin panel "Price" field)
              const packagePrice = basePrice
              
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
              
              // Otherwise show package price
              return <MoneyAmount amount={packagePrice} product={product} />
            }
            
            // Per piece (adet) pricing display - if show_unit_price is true but not packaged
            const showUnitPrice = product.show_unit_price == 1 || product.show_unit_price === true
            if (!isPackaged && showUnitPrice) {
              return (
                <>
                  <MoneyAmount amount={basePrice} product={product} />
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    /pcs
                  </span>
                </>
              )
            }
            
            // Regular price display
            return <MoneyAmount amount={basePrice} product={product} />
          })()}
          </p>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <div className="flex gap-2">
            {product.call_for_pricing == 1 || product.call_for_pricing === true ? (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const message = `Hello, I'm interested in ${product.name}. Product ID: ${product.id} - Please provide pricing information.`
                  openWhatsApp(message)
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-1"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span>Call For Pricing</span>
              </button>
            ) : (
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-primary hover:bg-primary-dark text-white py-2 px-3 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {needsOptions ? 'Select Options' : 'Add to Cart'}
              </button>
            )}
            {product.comparison_before && product.comparison_after && (
              <button
                onClick={handleShowComparison}
                onMouseDown={(e) => {
                  e.stopPropagation()
                  e.nativeEvent.stopImmediatePropagation()
                }}
                onTouchStart={(e) => {
                  e.stopPropagation()
                  e.nativeEvent.stopImmediatePropagation()
                }}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 text-blue-700 py-2 px-3 rounded-lg font-semibold text-xs transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5 group relative z-10"
                title="View Before & After Comparison"
              >
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-medium">Before & After</span>
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  View comparison images
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                    <div className="border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </button>
            )}
          </div>
          
          {/* Additional Actions */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleDownloadDatasheet}
              className="flex flex-col items-center justify-center p-2 bg-gray-50 hover:bg-green-50 rounded-lg transition-all duration-300 text-xs font-medium text-gray-700 group/btn animate-pulse-green"
              title="Download Technical Datasheet"
            >
              <svg className="w-4 h-4 mb-1 text-gray-600 group-hover/btn:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Datasheet</span>
            </button>
            
            <button
              onClick={handleWhatsAppShare}
              className="flex flex-col items-center justify-center p-2 bg-gray-50 hover:bg-green-50 rounded-lg transition-colors text-xs font-medium text-gray-700 group/btn"
              title="Share via WhatsApp"
            >
              <svg className="w-4 h-4 mb-1 text-gray-600 group-hover/btn:text-green-600 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              <span>WhatsApp</span>
            </button>
            
            <button
              onClick={handleDownloadBrochure}
              className="flex flex-col items-center justify-center p-2 bg-gray-50 hover:bg-green-50 rounded-lg transition-all duration-300 text-xs font-medium text-gray-700 group/btn animate-pulse-green"
              title="Download Product Brochure"
            >
              <svg className="w-4 h-4 mb-1 text-gray-600 group-hover/btn:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span>Brochure</span>
            </button>
          </div>
        </div>
      </div>

      {/* Comparison Modal - Using Portal to render outside component tree */}
      {showComparison && product.comparison_before && product.comparison_after && createPortal(
        <div 
          className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4"
          onClick={() => setShowComparison(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">{product.name} - Before & After</h3>
              <button
                onClick={() => setShowComparison(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <AnimatedImageComparison 
                beforeImage={product.comparison_before}
                afterImage={product.comparison_after}
                alt={product.name}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

// Animated Image Comparison Component with auto-sliding animation
const AnimatedImageComparison = ({ beforeImage, afterImage, alt = 'Comparison' }) => {
  const [sliderPosition, setSliderPosition] = useState(0)
  const [isAnimating, setIsAnimating] = useState(true)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!isAnimating) return

    const duration = 5000 // 5 seconds for full animation
    const startTime = Date.now()
    const startPosition = 0
    const endPosition = 100

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Ease-in-out easing function
      const easeInOut = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2
      
      const currentPosition = startPosition + (endPosition - startPosition) * easeInOut
      setSliderPosition(currentPosition)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
        // Reset and restart animation after a brief pause
        setTimeout(() => {
          setSliderPosition(0)
          setIsAnimating(true)
        }, 1000)
      }
    }

    const animationId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationId)
  }, [isAnimating])

  const handleMouseDown = (e) => {
    setIsAnimating(false)
    updateSliderPosition(e)
  }

  const handleMouseMove = (e) => {
    if (isAnimating) return
    updateSliderPosition(e)
  }

  const handleMouseUp = () => {
    // Restart animation after user interaction
    setTimeout(() => {
      setSliderPosition(0)
      setIsAnimating(true)
    }, 1000)
  }

  const handleTouchStart = (e) => {
    setIsAnimating(false)
    updateSliderPosition(e.touches[0])
  }

  const handleTouchMove = (e) => {
    if (isAnimating) return
    if (e.cancelable) {
      e.preventDefault()
    }
    updateSliderPosition(e.touches[0])
  }

  const handleTouchEnd = () => {
    // Restart animation after user interaction
    setTimeout(() => {
      setSliderPosition(0)
      setIsAnimating(true)
    }, 1000)
  }

  const updateSliderPosition = (e) => {
    if (!containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setSliderPosition(percentage)
  }

  useEffect(() => {
    if (isAnimating) return
    
    const mouseMoveHandler = (e) => {
      if (isAnimating) return
      updateSliderPosition(e)
    }
    
    const mouseUpHandler = () => {
      setTimeout(() => {
        setSliderPosition(0)
        setIsAnimating(true)
      }, 1000)
    }
    
    const touchMoveHandler = (e) => {
      if (isAnimating) return
      if (e.cancelable) {
        e.preventDefault()
      }
      updateSliderPosition(e.touches[0])
    }
    
    const touchEndHandler = () => {
      setTimeout(() => {
        setSliderPosition(0)
        setIsAnimating(true)
      }, 1000)
    }
    
    document.addEventListener('mousemove', mouseMoveHandler)
    document.addEventListener('mouseup', mouseUpHandler)
    document.addEventListener('touchmove', touchMoveHandler, { passive: false })
    document.addEventListener('touchend', touchEndHandler)
    
    return () => {
      document.removeEventListener('mousemove', mouseMoveHandler)
      document.removeEventListener('mouseup', mouseUpHandler)
      document.removeEventListener('touchmove', touchMoveHandler)
      document.removeEventListener('touchend', touchEndHandler)
    }
  }, [isAnimating])

  if (!beforeImage || !afterImage) {
    return null
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-96 md:h-[500px] rounded-lg overflow-hidden shadow-lg cursor-col-resize"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Before Image (Background) */}
      <div className="absolute inset-0">
        <img
          src={beforeImage}
          alt={`${alt} - Before`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* After Image (Clipped) */}
      <div
        className="absolute inset-0 overflow-hidden transition-none"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={afterImage}
          alt={`${alt} - After`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Slider Line */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg z-10 transition-none"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
      >
        {/* Slider Handle */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing">
          <div className="flex space-x-1">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-sm font-semibold">
        Before
      </div>
      <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded text-sm font-semibold">
        After
      </div>
    </div>
  )
}

export default ProductCard

