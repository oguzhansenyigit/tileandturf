import React from 'react'
import logoImage from '/logo.svg'

const WhoWeAre = () => {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden bg-gradient-to-br from-green-50 via-white to-green-50">
      {/* Pattern Background */}
      <div 
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233a925c' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>
      
      {/* Diagonal stripes pattern */}
      <div 
        className="absolute inset-0 opacity-[0.06]"
        style={{
          background: `
            repeating-linear-gradient(
              45deg,
              #3a925c 0px,
              #3a925c 40px,
              transparent 40px,
              transparent 80px
            )
          `
        }}
      ></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center max-w-7xl mx-auto">
          {/* Left Side - Content */}
          <div className="text-center lg:text-left relative z-20">
            <div className="inline-block mb-4">
              <span className="text-green-600 font-semibold text-sm uppercase tracking-wider">About Us</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Who We Are
            </h2>
            <div className="space-y-5 text-gray-700 text-base md:text-lg leading-relaxed">
              <p className="font-medium">
                Tile and Turf is your trusted partner for premium building materials and innovative 
                outdoor solutions. With years of experience in the industry, we specialize in providing 
                high-quality products including adjustable pedestals, IPE wood decking, concrete pavers, 
                porcelain pavers, synthetic turf systems, and green roof solutions.
              </p>
              <p>
                Our commitment to excellence and customer satisfaction drives everything we do. We work 
                with architects, contractors, and homeowners to deliver sustainable, durable, and 
                aesthetically pleasing solutions for commercial and residential projects.
              </p>
              <p>
                From rooftop terraces to outdoor patios, from commercial spaces to residential decks, 
                we provide the materials and expertise you need to bring your vision to life.
              </p>
            </div>
          </div>

          {/* Right Side - Logo */}
          <div className="flex justify-center lg:justify-end relative z-20">
            <div className="relative group">
              {/* Decorative background elements */}
              <div className="absolute -top-8 -right-8 w-64 h-64 bg-green-200 rounded-full blur-3xl opacity-30 group-hover:opacity-40 transition-opacity duration-300"></div>
              <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-green-100 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
              
              {/* Logo container with shadow and border */}
              <div className="relative bg-white p-10 md:p-14 rounded-3xl shadow-2xl border-4 border-green-100 transform group-hover:scale-105 group-hover:shadow-3xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent rounded-3xl opacity-50"></div>
                <img 
                  src={logoImage} 
                  alt="Tile and Turf Logo" 
                  className="relative z-10 h-36 md:h-48 w-auto mx-auto drop-shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default WhoWeAre

