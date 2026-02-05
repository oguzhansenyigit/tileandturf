import React, { useState } from 'react'

const Resources = () => {
  const [hoveredCard, setHoveredCard] = useState(null)

  const resources = [
    {
      id: 1,
      title: 'SYNTHETIC TURF SYSTEMS',
      description: 'Access the latest technical data sheet (TDS) and catalog for our Synthetic Turf Systems. Download the PDFs for detailed product specifications and installation guidelines.',
      image: 'https://tileandturf.com/wp-content/uploads/2025/06/izgara-uzerine_Interactive-LightMix-copy.jpg',
      tdsUrl: '/syntetic-turf-TDS.pdf',
      catalogUrl: '/synt1.pdf',
      gradient: 'from-green-500 to-emerald-600',
      icon: '🌱'
    },
    {
      id: 2,
      title: 'IPE TILE SYSTEMS',
      description: 'IPE (Brazilian Walnut) is renowned for its dense, hard-wearing nature and natural resistance to moisture, insects, and decay—making it an ideal choice for outdoor decking projects, rooftop terraces, patios, and commercial applications.',
      image: 'https://tileandturf.com/wp-content/uploads/2024/06/IMG_0959-1.jpg',
      tdsUrl: '/ipe-tile-tech-sheet.pdf',
      catalogUrl: null,
      gradient: 'from-amber-600 to-orange-700',
      icon: '🪵'
    },
    {
      id: 3,
      title: 'ADJUSTABLE PEDESTAL SYSTEMS',
      description: 'Access comprehensive technical documentation for our Adjustable Pedestal Systems, engineered to provide flexible and durable support for raised flooring applications.',
      image: 'https://tileandturf.com/wp-content/uploads/2025/06/WhatsApp-Image-2025-06-15-at-16.45.00.jpeg',
      tdsUrl: '/pedestal-2 (1).pdf',
      catalogUrl: null,
      gradient: 'from-blue-500 to-indigo-600',
      icon: '🔧'
    },
    {
      id: 4,
      title: 'PORCELAIN PAVERS SYSTEMS',
      description: 'Find detailed technical specifications and catalog, performance data, and installation guidelines for our porcelain pavers. Download the latest Technical Data Sheets and catalogs to ensure proper handling, application, and maintenance of your products.',
      image: 'https://tileandturf.com/wp-content/uploads/2025/07/Square-ARC_LDS_CH_CountyWide_3838.jpg',
      tdsUrl: '/Porcelain-Paver-TDS-1.pdf',
      catalogUrl: '/porcelain-paver-katalog.pdf',
      gradient: 'from-gray-600 to-slate-700',
      icon: '🏗️'
    },
    {
      id: 5,
      title: 'GREEN ROOF SYSTEMS',
      description: 'Green Roof Systems are sustainable roofing solutions that combine vegetation, drainage, and structural support to create functional green spaces on rooftops. They improve thermal insulation, reduce stormwater runoff, and enhance building energy efficiency.',
      image: 'https://tileandturf.com/wp-content/uploads/2025/12/green-roof-system-3-scaled.png',
      tdsUrl: 'https://tileandturf.com/wp-content/uploads/2025/12/TT-01-00.pdf',
      catalogUrl: '/greenroof.pdf',
      gradient: 'from-teal-500 to-cyan-600',
      icon: '🌿'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-primary via-primary-dark to-primary overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-block mb-6">
              <span className="text-6xl">📚</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg">
              Resource Library
            </h1>
            <p className="text-xl md:text-2xl text-white/90 leading-relaxed">
              Comprehensive technical documentation, data sheets, and installation guides for all our product systems.
            </p>
          </div>
        </div>
        {/* Decorative Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="rgb(249, 250, 251)"/>
          </svg>
        </div>
      </div>

      {/* Resources Grid */}
      <div className="container mx-auto px-4 py-16 -mt-8 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {resources.map((resource, index) => (
            <div
              key={resource.id}
              onMouseEnter={() => setHoveredCard(resource.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className="group relative bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl"
              style={{
                animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
              }}
            >
              {/* Gradient Overlay on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${resource.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
              
              {/* Image Section */}
              <div className="relative h-64 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10"></div>
                <img
                  src={resource.image}
                  alt={resource.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={(e) => {
                    e.target.src = '/slider.webp'
                  }}
                />
                {/* Icon Badge */}
                <div className="absolute top-4 right-4 z-20">
                  <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl">{resource.icon}</span>
                  </div>
                </div>
                {/* Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                  <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                    {resource.title}
                  </h2>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-6 md:p-8">
                <p className="text-gray-600 leading-relaxed mb-6 text-lg">
                  {resource.description}
                </p>
                
                {/* Download Buttons */}
                <div className="space-y-3">
                  {/* Technical Data Sheet Button */}
                  {resource.tdsUrl && (
                    <a
                      href={resource.tdsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center justify-center gap-3 w-full px-6 py-4 bg-gradient-to-r ${resource.gradient} hover:shadow-lg text-white font-semibold rounded-xl transition-all duration-300 transform group-hover:scale-105 active:scale-95`}
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span className="text-lg">Download Technical Data Sheet</span>
                      <svg
                        className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
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
                  )}
                  
                  {/* Catalog Button */}
                  {resource.catalogUrl && (
                    <a
                      href={resource.catalogUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-3 w-full px-6 py-4 bg-white border-2 border-gray-300 hover:border-primary hover:bg-gray-50 text-gray-800 font-semibold rounded-xl transition-all duration-300 transform group-hover:scale-105 active:scale-95"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-lg">Download Catalog</span>
                      <svg
                        className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
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
                  )}
                </div>
              </div>

              {/* Decorative Corner */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${resource.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-bl-full`}></div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-r from-primary via-primary-dark to-primary rounded-3xl p-8 md:p-12 shadow-2xl overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}></div>
            </div>
            
            <div className="relative z-10 text-center">
              <div className="inline-block mb-6">
                <span className="text-5xl">💬</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Need Additional Resources?
              </h3>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Can't find what you're looking for? Contact our technical support team for assistance with product specifications, installation guidance, or custom documentation.
              </p>
              <a
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary font-bold rounded-xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg"
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
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

export default Resources

