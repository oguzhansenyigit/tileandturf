import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import ImageComparison from '../components/ImageComparison'
import ProductCard from '../components/ProductCard'
import axios from 'axios'

const PorcelainPaver = () => {
  const [categoryData, setCategoryData] = useState(null)
  const [products, setProducts] = useState([])
  const [recommendedProducts, setRecommendedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [beforeImage, setBeforeImage] = useState('/porcelain-paver.webp')
  const [afterImage, setAfterImage] = useState('/porcelain-paver-after.webp')
  const [mainImage, setMainImage] = useState('/porcelain-paver2.webp')
  const [catalogPdf, setCatalogPdf] = useState('/Porcelain-Paver-catalogue (2).pdf')
  const [tdsPdf, setTdsPdf] = useState('/Porcelain-Paver-TDS (4).pdf')

  useEffect(() => {
    fetchCategoryData()
    fetchRecommendedProducts()
  }, [])

  const fetchCategoryData = async () => {
    setLoading(true)
    try {
      // Try to get category by slug 'porcelain-paver'
      const categoriesResponse = await axios.get('/api/categories.php')
      const categories = Array.isArray(categoriesResponse.data) ? categoriesResponse.data : []
      const porcelainCategory = categories.find(cat => 
        cat.slug === 'porcelain-paver' || 
        cat.slug === 'porcelain-pavers' ||
        cat.name?.toLowerCase().includes('porcelain')
      )

      if (porcelainCategory) {
        setCategoryData(porcelainCategory)
        
        // Set PDFs from category if available
        if (porcelainCategory.brochure_pdf) {
          setCatalogPdf(porcelainCategory.brochure_pdf)
        }
        if (porcelainCategory.datasheet_pdf) {
          setTdsPdf(porcelainCategory.datasheet_pdf)
        }

        // Fetch products in this category
        const productsResponse = await axios.get(`/api/products.php?category=${porcelainCategory.slug}`)
        const categoryProducts = Array.isArray(productsResponse.data) ? productsResponse.data : []
        setProducts(categoryProducts)

        // Find a product with before/after images
        const productWithComparison = categoryProducts.find(p => p.comparison_before && p.comparison_after)
        if (productWithComparison) {
          setBeforeImage(productWithComparison.comparison_before)
          setAfterImage(productWithComparison.comparison_after)
        }

        // Find main product image
        const mainProduct = categoryProducts.find(p => p.image)
        if (mainProduct) {
          setMainImage(mainProduct.image)
        }
      } else {
        // Fallback: use default values
        setCategoryData({
          name: 'Porcelain Paver',
          description: 'Premium porcelain paver systems offering exceptional durability, elegance, and aesthetic appeal for outdoor and indoor applications.'
        })
      }
    } catch (error) {
      console.error('Error fetching category data:', error)
      // Fallback: use default values
      setCategoryData({
        name: 'Porcelain Paver',
        description: 'Premium porcelain paver systems offering exceptional durability, elegance, and aesthetic appeal for outdoor and indoor applications.'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchRecommendedProducts = async () => {
    try {
      const response = await axios.get('/api/products.php?limit=8')
      // Filter out hidden products and porcelain paver products, take first 4
      const allProducts = Array.isArray(response.data) ? response.data.filter(p => !p.is_hidden) : []
      const filtered = allProducts.filter(p => 
        !p.category_name?.toLowerCase().includes('porcelain') &&
        !p.name?.toLowerCase().includes('porcelain')
      )
      setRecommendedProducts(filtered.slice(0, 4))
    } catch (error) {
      console.error('Error fetching recommended products:', error)
      setRecommendedProducts([])
    }
  }

  const handleDownloadCatalog = () => {
    if (catalogPdf) {
      window.open(catalogPdf, '_blank')
    }
  }

  const handleDownloadTDS = () => {
    if (tdsPdf) {
      window.open(tdsPdf, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-gray-700 via-gray-600 to-slate-700 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M50 50c0-5.523-4.477-10-10-10s-10 4.477-10 10 4.477 10 10 10 10-4.477 10-10zm10 0c0-8.837-7.163-16-16-16s-16 7.163-16 16 7.163 16 16 16 16-7.163 16-16zM34 68v12H22v-12h12zm-16 0v12H6v-12h12z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        <div className="container mx-auto px-6 md:px-8 py-24 md:py-32 relative z-10">
          <div className="max-w-4xl">
            <div className="mb-6">
              <span className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold rounded-full border border-white/30">
                PREMIUM PAVING SOLUTIONS
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
              {categoryData?.name || 'Porcelain Paver'}
            </h1>
            <p className="text-xl md:text-2xl text-white/95 leading-relaxed mb-8 font-light max-w-3xl">
              {categoryData?.description || 'Premium porcelain paver systems offering exceptional durability, elegance, and aesthetic appeal for outdoor and indoor applications.'}
            </p>
            <div className="flex flex-wrap gap-4">
              {catalogPdf && (
                <button
                  onClick={handleDownloadCatalog}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span>Product Catalog</span>
                </button>
              )}
              {tdsPdf && (
                <button
                  onClick={handleDownloadTDS}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 font-semibold rounded-lg hover:bg-white/20 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Technical Data Sheet</span>
                </button>
              )}
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
                  Premium Porcelain Paver Excellence
                </h2>
                <div className="space-y-4 text-lg text-gray-600 leading-relaxed">
                  <p>
                    Our Porcelain Paver Systems represent the pinnacle of durable, elegant paving solutions. Engineered for exceptional strength, longevity, and aesthetic appeal across residential and commercial applications.
                  </p>
                  <p>
                    Designed to withstand heavy use and extreme weather conditions, our porcelain pavers offer superior performance while maintaining their beauty for decades with minimal maintenance.
                  </p>
                  <p>
                    With a wide range of colors, textures, and patterns, our porcelain paver systems provide endless design possibilities while delivering consistent quality and reliability.
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-[4/3] rounded-lg overflow-hidden shadow-2xl">
                  <img
                    src={mainImage}
                    alt="Porcelain Paver System Product"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/slider.webp'
                    }}
                  />
                </div>
                <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-gray-100 rounded-lg opacity-30 -z-10"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Before & After Section */}
      {(beforeImage && afterImage) && (
        <section className="py-20 md:py-28 bg-gray-50">
          <div className="container mx-auto px-6 md:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  Transformation Gallery
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  See the dramatic improvements our Porcelain Paver Systems deliver through interactive before and after comparisons
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-xl p-6 md:p-8 border border-gray-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  Installation Transformation
                </h3>
                <ImageComparison
                  beforeImage={beforeImage}
                  afterImage={afterImage}
                  alt="Porcelain Paver System Installation"
                />
                <p className="text-sm text-gray-500 mt-4 text-center">
                  Drag the slider to compare before and after installation
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Products in Category Section */}
      {products.length > 0 && (
        <section className="py-20 md:py-28 bg-white">
          <div className="container mx-auto px-6 md:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  Porcelain Paver Products
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Explore our range of premium porcelain paver products
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Recommended Products Section */}
      {recommendedProducts.length > 0 && (
        <section className="py-20 md:py-28 bg-gray-50">
          <div className="container mx-auto px-6 md:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  Recommended Products
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Discover complementary products that work perfectly with our Porcelain Paver Systems
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {recommendedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-6 md:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Key Features & Benefits
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Advanced manufacturing and premium materials deliver exceptional performance and aesthetic appeal
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: 'Exceptional Durability',
                  description: 'Manufactured to withstand heavy traffic, freeze-thaw cycles, and extreme weather conditions. Maintains structural integrity and appearance for decades.',
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  )
                },
                {
                  title: 'Versatile Applications',
                  description: 'Suitable for patios, walkways, pool decks, commercial plazas, driveways, and more. Adapt to various design requirements and architectural styles.',
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  )
                },
                {
                  title: 'Low Maintenance',
                  description: 'Minimal maintenance requirements compared to other paving materials. Simple cleaning and occasional sealing maintain appearance and performance.',
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )
                },
                {
                  title: 'Slip Resistant',
                  description: 'Textured surface provides excellent slip resistance even when wet, making it ideal for pool areas, walkways, and commercial applications.',
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )
                },
                {
                  title: 'Frost Resistant',
                  description: 'Excellent resistance to freeze-thaw cycles, making it suitable for cold climate applications without cracking or deterioration.',
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )
                },
                {
                  title: 'Eco-Friendly',
                  description: 'Made from natural materials with sustainable manufacturing processes. Long-lasting design reduces the need for replacement and waste.',
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )
                }
              ].map((feature, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300 border border-gray-100"
                >
                  <div className="text-primary mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
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
      <section className="py-20 md:py-28 bg-gradient-to-br from-primary to-primary-dark text-white">
        <div className="container mx-auto px-6 md:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your Space?
            </h2>
            <p className="text-xl mb-8 text-white/90">
              Contact our team today to discuss your project and explore our premium Porcelain Paver solutions
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="/request-quote"
                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-primary font-semibold rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Request a Quote
              </a>
              <a
                href="/contact"
                className="inline-flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 font-semibold rounded-lg hover:bg-white/20 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default PorcelainPaver
