import React, { useState, useEffect } from 'react'
import ImageComparison from '../components/ImageComparison'
import ProductCard from '../components/ProductCard'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import axios from 'axios'

// Custom Arrow Components for Product Slider
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

const SyntheticTurfSystems = () => {
  const [products, setProducts] = useState([])

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      // Fetch all products and filter by category slugs
      const categorySlugs = ['synthetic-grass', 'adjustable-pedestal', 'fiberglass-grating']
      
      // Fetch all products
      const response = await axios.get('/api/products.php')
      const allProducts = Array.isArray(response.data) ? response.data : []
      
      // Filter products by category slugs (case-insensitive matching)
      const filteredProducts = allProducts.filter(product => {
        // is_hidden can be string "0" or "1", or boolean, or number
        const isHidden = product.is_hidden === "1" || product.is_hidden === 1 || product.is_hidden === true
        if (!product.id || isHidden) return false
        const categorySlug = product.category_slug?.toLowerCase() || ''
        const matches = categorySlugs.some(slug => {
          const searchSlug = slug.toLowerCase()
          const exactMatch = categorySlug === searchSlug
          const containsMatch = categorySlug.includes(searchSlug) || searchSlug.includes(categorySlug)
          return exactMatch || containsMatch
        })
        return matches
      })
      
      // Remove duplicates and limit to max 10
      const uniqueProducts = []
      const productIds = new Set()
      filteredProducts.forEach(product => {
        if (!productIds.has(product.id)) {
          productIds.add(product.id)
          uniqueProducts.push(product)
        }
      })
      
      const finalProducts = uniqueProducts.slice(0, 10)
      setProducts(finalProducts)
    } catch (error) {
      setProducts([])
    }
  }

  const comparisons = [
    {
      before: '/syntethic-turf before 1.webp',
      after: '/syntethic-turf after 1.webp',
      title: 'Installation Transformation 1'
    },
    {
      before: '/syntethic-turf before 2.webp',
      after: '/syntethic-turf after 2.webp',
      title: 'Installation Transformation 2'
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-green-700 via-green-600 to-emerald-700 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M50 50c0-5.523-4.477-10-10-10s-10 4.477-10 10 4.477 10 10 10 10-4.477 10-10zm10 0c0-8.837-7.163-16-16-16s-16 7.163-16 16 7.163 16 16 16 16-7.163 16-16zM34 68v12H22v-12h12zm-16 0v12H6v-12h12z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        <div className="container mx-auto px-6 md:px-8 py-24 md:py-32 relative z-10">
          <div className="max-w-4xl">
            <div className="mb-6">
              <span className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold rounded-full border border-white/30">
                ARTIFICIAL TURF SOLUTIONS
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
              Synthetic Turf Systems
            </h1>
            <p className="text-xl md:text-2xl text-white/95 leading-relaxed mb-8 font-light max-w-3xl">
              Premium synthetic turf solutions designed for durability, aesthetics, and performance. Transform outdoor spaces with low-maintenance, high-quality artificial grass systems.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <a
                href="/syn1.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-200 border border-white/30 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Technical Data Sheet</span>
              </a>
              <a
                href="/syn2.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-200 border border-white/30 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Catalog</span>
              </a>
            </div>
          </div>
        </div>
        
        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-20">
            <path d="M0 80L60 70C120 60 240 40 360 30C480 20 600 20 720 25C840 30 960 40 1080 45C1200 50 1320 50 1380 50L1440 50V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="white"/>
          </svg>
        </div>
      </div>

      {/* Installation Video Section */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-6 md:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Installation Process
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl">
                Watch our detailed installation video demonstrating the professional installation process for Synthetic Turf Systems
              </p>
            </div>
            <div className="bg-gray-900 rounded-xl shadow-2xl overflow-hidden">
              <video
                className="w-full h-auto"
                controls
                poster="/syntethic-turf after 1.webp"
              >
                <source src="/izgara-animasyon-final-yuksek-kalite.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            <p className="text-sm text-gray-500 mt-4 text-center">
              Professional installation video demonstrating the complete Synthetic Turf System installation process
            </p>
          </div>
        </div>
      </section>

      {/* Overview Section */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="container mx-auto px-6 md:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center">
              <div className="relative">
                <div className="aspect-[4/3] rounded-lg overflow-hidden shadow-2xl">
                  <img
                    src="/syntethic-turf after 1.webp"
                    alt="Synthetic Turf System Installation"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/slider.webp'
                    }}
                  />
                </div>
                <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-green-100 rounded-lg opacity-30 -z-10"></div>
              </div>
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                  Premium Synthetic Turf Solutions
                </h2>
                <div className="space-y-4 text-lg text-gray-600 leading-relaxed">
                  <p>
                    Our Synthetic Turf Systems deliver exceptional quality, durability, and aesthetic appeal for residential and commercial applications. Engineered to withstand heavy use while maintaining a natural, lush appearance year-round.
                  </p>
                  <p>
                    Designed for maximum performance with superior drainage, UV resistance, and weather durability. Our systems provide the perfect solution for high-traffic areas, sports fields, and residential landscapes.
                  </p>
                  <p>
                    With minimal maintenance requirements and exceptional longevity, our synthetic turf systems offer outstanding value while creating beautiful, functional outdoor spaces.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Products Section */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-6 md:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Related Products
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Explore our range of products for synthetic turf systems
              </p>
            </div>

            {products.length > 0 ? (
              products.length > 4 ? (
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
                        }
                      },
                      {
                        breakpoint: 768,
                        settings: {
                          slidesToShow: 2,
                          slidesToScroll: 1,
                          arrows: true,
                        }
                      },
                      {
                        breakpoint: 640,
                        settings: {
                          slidesToShow: 1,
                          slidesToScroll: 1,
                          arrows: true,
                        }
                      }
                    ]}
                  >
                    {products.map((product) => (
                      <div key={product.id} className="px-2" onClick={(e) => e.stopPropagation()}>
                        <ProductCard product={product} />
                      </div>
                    ))}
                  </Slider>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No products found in these categories.</p>
                <p className="text-gray-400 text-sm mt-2">Products will appear here once they are added to the synthetic-grass, adjustable-pedestal, or fiberglass-grating categories.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Before & After Section */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-6 md:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Transformation Gallery
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                See the dramatic improvements our Synthetic Turf Systems deliver through interactive before and after comparisons
              </p>
            </div>

            <div className="space-y-12">
              {comparisons.map((comparison, index) => (
                <div key={index} className="bg-gray-50 rounded-xl shadow-xl p-6 md:p-8 border border-gray-100">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                    {comparison.title}
                  </h3>
                  <ImageComparison
                    beforeImage={comparison.before}
                    afterImage={comparison.after}
                    alt={comparison.title}
                  />
                  <p className="text-sm text-gray-500 mt-4 text-center">
                    Drag the slider to compare before and after installation
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="container mx-auto px-6 md:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Key Features & Benefits
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Advanced technology and premium materials deliver exceptional performance and aesthetic appeal
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: 'Natural Appearance',
                  description: 'Realistic grass-like appearance with superior texture and color. Achieve the natural look of real grass without the maintenance requirements.',
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                  )
                },
                {
                  title: 'Superior Drainage',
                  description: 'Advanced drainage system ensures efficient water management. Prevent pooling and maintain optimal surface conditions in all weather conditions.',
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  )
                },
                {
                  title: 'UV Resistance',
                  description: 'Premium UV-resistant materials prevent fading and degradation. Maintain vibrant color and appearance even under intense sunlight exposure.',
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  )
                },
                {
                  title: 'Low Maintenance',
                  description: 'Minimal maintenance requirements compared to natural grass. No mowing, watering, or fertilizing needed while maintaining pristine appearance.',
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )
                },
                {
                  title: 'Durability',
                  description: 'Engineered for exceptional durability and longevity. Withstand heavy use, weather extremes, and maintain performance for years to come.',
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  )
                },
                {
                  title: 'Environmentally Friendly',
                  description: 'Water-saving solution that eliminates the need for irrigation. Reduce water consumption while maintaining beautiful outdoor spaces.',
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )
                }
              ].map((feature, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg p-8 shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100"
                >
                  <div className="text-green-600 mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-green-700 via-green-600 to-emerald-700">
        <div className="container mx-auto px-6 md:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Space?
            </h2>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
              Contact our expert team for comprehensive consultation, custom solutions, and professional project support for your Synthetic Turf System installation.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="/request-quote"
                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-green-700 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <span>Request a Quote</span>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </a>
              <a
                href="/contact"
                className="inline-flex items-center gap-3 px-8 py-4 bg-emerald-700 text-white font-semibold rounded-lg hover:bg-emerald-800 transition-all duration-200 shadow-lg hover:shadow-xl border border-emerald-600"
              >
                <span>Contact Support</span>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default SyntheticTurfSystems

