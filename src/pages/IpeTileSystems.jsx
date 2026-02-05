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

const IpeTileSystems = () => {
  const [products, setProducts] = useState([])

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      // Fetch all products and filter by category slugs
      const categorySlugs = ['ipe-tile', 'ipe-lumber', 'adjustable-pedestal']
      
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

  const handleDownloadDatasheet = () => {
    window.open('/ipe tech sheet.pdf', '_blank')
  }

  const handleDownloadInfoSheet = () => {
    window.open('/ipe tile info sheet.pdf', '_blank')
  }

  const images = [
    '/ipe1.webp',
    '/ipe2.webp'
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-amber-700 via-amber-600 to-orange-700 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M50 50c0-5.523-4.477-10-10-10s-10 4.477-10 10 4.477 10 10 10 10-4.477 10-10zm10 0c0-8.837-7.163-16-16-16s-16 7.163-16 16 7.163 16 16 16 16-7.163 16-16zM34 68v12H22v-12h12zm-16 0v12H6v-12h12z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        <div className="container mx-auto px-6 md:px-8 py-24 md:py-32 relative z-10">
          <div className="max-w-4xl">
            <div className="mb-6">
              <span className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold rounded-full border border-white/30">
                PREMIUM HARDWOOD SOLUTIONS
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
              IPE Tile Systems
            </h1>
            <p className="text-xl md:text-2xl text-white/95 leading-relaxed mb-8 font-light max-w-3xl">
              Premium Brazilian Walnut (IPE) tile systems offering exceptional durability, natural beauty, and superior performance for outdoor decking and tile applications.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleDownloadDatasheet}
                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-amber-800 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Technical Datasheet</span>
              </button>
              <button
                onClick={handleDownloadInfoSheet}
                className="inline-flex items-center gap-3 px-8 py-4 bg-amber-700 text-white font-semibold rounded-lg hover:bg-amber-800 transition-all duration-200 shadow-lg hover:shadow-xl border border-amber-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span>Info Sheet</span>
              </button>
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

      {/* Overview Section */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-6 md:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                  Premium Brazilian Walnut Excellence
                </h2>
                <div className="space-y-4 text-lg text-gray-600 leading-relaxed">
                  <p>
                    Our IPE Tile Systems feature premium Brazilian Walnut (IPE), renowned for its exceptional density, hardness, and natural resistance to moisture, insects, and decay. This premium hardwood offers unmatched durability and aesthetic appeal.
                  </p>
                  <p>
                    Ideal for outdoor decking projects, rooftop terraces, patios, and commercial applications, IPE wood delivers superior performance while maintaining its natural beauty for decades with minimal maintenance.
                  </p>
                  <p>
                    With its rich, warm tones and exceptional grain patterns, IPE wood creates stunning outdoor spaces that enhance property value while providing long-lasting performance in challenging environments.
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-[4/3] rounded-lg overflow-hidden shadow-2xl">
                  <img
                    src="/ipe tile after.webp"
                    alt="IPE Tile System Installation"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/slider.webp'
                    }}
                  />
                </div>
                <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-amber-100 rounded-lg opacity-30 -z-10"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Before & After Section */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="container mx-auto px-6 md:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Transformation Gallery
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                See the dramatic improvements our IPE Tile Systems deliver through interactive before and after comparisons
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-xl p-6 md:p-8 border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Installation Transformation
              </h3>
              <ImageComparison
                beforeImage="/ipe-tile before.webp"
                afterImage="/ipe tile after.webp"
                alt="IPE Tile System Installation"
              />
              <p className="text-sm text-gray-500 mt-4 text-center">
                Drag the slider to compare before and after installation
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Image Gallery Section */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-6 md:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                System Documentation
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl">
                Visual documentation showcasing IPE Tile System components, applications, and finished installations
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {images.map((image, index) => (
                <div
                  key={index}
                  className="group relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <img
                    src={image}
                    alt={`IPE Tile System ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      e.target.src = '/slider.webp'
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-6 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-white font-semibold text-lg">IPE Tile System Installation</p>
                  </div>
                </div>
              ))}
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
                Explore our range of products for IPE tile systems
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
                <p className="text-gray-400 text-sm mt-2">Products will appear here once they are added to the ipe-tile, ipe-lumber, or adjustable-pedestal categories.</p>
              </div>
            )}
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
                Premium hardwood quality and exceptional engineering deliver unmatched performance and aesthetic appeal
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: 'Exceptional Durability',
                  description: 'IPE wood ranks among the hardest hardwoods in the world, providing exceptional resistance to wear, impact, and weathering. Withstands heavy use and extreme weather conditions.',
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  )
                },
                {
                  title: 'Natural Resistance',
                  description: 'Inherent resistance to moisture, insects, decay, and rot. No chemical treatments required, making it an eco-friendly choice for outdoor applications.',
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  )
                },
                {
                  title: 'Natural Beauty',
                  description: 'Rich, warm brown tones with distinctive grain patterns create stunning visual appeal. Ages gracefully to a beautiful silver-gray patina if left untreated.',
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                  )
                },
                {
                  title: 'Fire Resistance',
                  description: 'Naturally fire-resistant properties make IPE wood ideal for residential and commercial applications where fire safety is a priority.',
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                    </svg>
                  )
                },
                {
                  title: 'Low Maintenance',
                  description: 'Minimal maintenance requirements compared to other wood species. Regular cleaning and occasional oiling maintain its natural beauty and protection.',
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )
                },
                {
                  title: 'Long Lifespan',
                  description: 'When properly maintained, IPE wood can last 40-75 years or more in outdoor applications, providing exceptional value and long-term performance.',
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )
                }
              ].map((feature, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg p-8 shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100"
                >
                  <div className="text-amber-600 mb-4">
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

      {/* Technical Documentation Section */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="container mx-auto px-6 md:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-xl shadow-xl p-8 md:p-12 border border-gray-100">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  Technical Documentation
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Comprehensive technical resources including specifications, installation guidelines, and system requirements
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="border border-gray-200 rounded-lg p-8 hover:border-amber-400 transition-colors bg-gradient-to-br from-white to-amber-50/50">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">Technical Datasheet</h3>
                      <p className="text-sm text-gray-500 font-medium">IPE Tile System Specifications</p>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Detailed technical specifications, material properties, installation guidelines, and performance metrics for our IPE Tile Systems. Includes wood specifications, structural requirements, and maintenance protocols.
                  </p>
                  <button
                    onClick={handleDownloadDatasheet}
                    className="w-full px-6 py-3 bg-amber-700 text-white font-semibold rounded-lg hover:bg-amber-800 transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF
                  </button>
                </div>

                <div className="border border-gray-200 rounded-lg p-8 hover:border-amber-400 transition-colors bg-gradient-to-br from-white to-amber-50/50">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">IPE Tile Info Sheet</h3>
                      <p className="text-sm text-gray-500 font-medium">Product Information Guide</p>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Comprehensive product information guide featuring IPE wood properties, application examples, design considerations, and care instructions. Includes installation photos, design tips, and best practices for successful projects.
                  </p>
                  <button
                    onClick={handleDownloadInfoSheet}
                    className="w-full px-6 py-3 bg-amber-700 text-white font-semibold rounded-lg hover:bg-amber-800 transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Download PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-amber-700 via-amber-600 to-orange-700">
        <div className="container mx-auto px-6 md:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Create Stunning Spaces?
            </h2>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
              Contact our expert team for comprehensive consultation, custom solutions, and professional project support for your IPE Tile System installation.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="/request-quote"
                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-amber-800 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl"
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
                className="inline-flex items-center gap-3 px-8 py-4 bg-amber-800 text-white font-semibold rounded-lg hover:bg-amber-900 transition-all duration-200 shadow-lg hover:shadow-xl border border-amber-700"
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

export default IpeTileSystems

