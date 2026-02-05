import React from 'react'
import { Link } from 'react-router-dom'

const CategoryGrid = () => {
  const categories = [
    {
      name: 'ADJUSTABLE PEDESTAL',
      slug: 'adjustable-pedestal',
      image: '/adjustable-pedestal-mainpage.webp',
      description: 'Professional pedestal systems for elevated surfaces'
    },
    {
      name: 'GREEN ROOF SYSTEM',
      slug: 'green-roof-system',
      image: '/greenroof-mainpage.webp',
      description: 'Sustainable green roof solutions'
    },
    {
      name: 'SYNTHETIC SYSTEMS',
      slug: 'synthetic-grass',
      image: '/slider3.webp',
      description: 'High-quality synthetic turf solutions'
    },
    {
      name: 'IPE TILE SYSTEMS',
      slug: 'ipe-tile',
      image: '/slider5.webp',
      description: 'Premium IPE wood tile systems'
    }
  ]

  return (
    <div className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Our Product Categories
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8">
            Discover our premium selection of building materials designed for excellence
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((category) => (
            <Link
              key={category.slug}
              to={`/products?category=${category.slug}`}
              className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1"
            >
              <div className="relative h-[500px] overflow-hidden">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                {/* Gradient Overlay - More subtle */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20 group-hover:from-black/90 group-hover:via-black/50 transition-all duration-500"></div>
                
                {/* Content Overlay */}
                <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                  <div className="transform group-hover:translate-y-0 translate-y-1 transition-transform duration-500">
                    <h3 className="text-xl md:text-2xl font-semibold mb-2 tracking-tight">
                      {category.name}
                    </h3>
                    <p className="text-gray-200 mb-5 text-xs md:text-sm opacity-85 line-clamp-2 leading-relaxed">
                      {category.description}
                    </p>
                    <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-sm px-5 py-2.5 rounded-full text-sm font-medium group-hover:bg-primary/90 group-hover:bg-opacity-90 transition-all duration-300">
                      <span>Shop Now</span>
                      <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CategoryGrid
