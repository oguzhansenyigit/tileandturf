import React, { useState, useEffect } from 'react'
import Slider from 'react-slick'
import { Link } from 'react-router-dom'
import axios from 'axios'
import slider1 from '/slider.webp'
import slider2 from '/slider5.webp'

const HeroSlider = () => {
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    fetchSliders()
  }, [])

  const fetchSliders = async () => {
    try {
      const response = await axios.get('/api/admin/sliders.php')
      if (Array.isArray(response.data) && response.data.length > 0) {
        const activeSliders = response.data
          .filter(slider => slider.status === 'active')
          .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
        
        if (activeSliders.length > 0) {
          setSlides(activeSliders.map(slider => {
            // Ensure image URL is properly formatted
            let imageUrl = slider.image || ''
            
            // If empty, skip
            if (!imageUrl) {
              return null
            }
            
            // If it's already an absolute URL (http/https), use as is
            if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
              // Already absolute, use as is
            }
            // If relative path doesn't start with /, add it
            else if (!imageUrl.startsWith('/')) {
              imageUrl = '/' + imageUrl
            }
            // If it starts with /api/, it should work but we can also try to add cache-busting
            // For incognito mode, we might need to ensure the path is correct
            
            return {
              image: imageUrl,
              title: slider.title,
              description: slider.description || '',
              buttonText: slider.button_text || 'Shop Now',
              link: slider.button_link || '/products',
              positionX: slider.image_position_x || 'center',
              positionY: slider.image_position_y || 'center'
            }
          }).filter(slide => slide !== null))
        } else {
          // Fallback to default slides
          setSlides([
            {
              image: slider1,
              title: 'PORCELAIN PAVER',
              description: 'Premium quality porcelain pavers that combine exceptional durability with timeless elegance.',
              buttonText: 'Shop Now',
              link: '/products/concrete-pavers-system',
              positionX: 'center',
              positionY: 'top'
            },
            {
              image: slider2,
              title: 'IPE TILE SYSTEM',
              description: 'Discover the unmatched beauty and strength of IPE wood tile systems.',
              buttonText: 'Shop Now',
              link: '/products/ipe-tile-systems',
              positionX: 'center',
              positionY: 'top'
            }
          ])
        }
      } else {
        // Fallback to default slides
        setSlides([
          {
            image: slider1,
            title: 'PORCELAIN PAVER',
            description: 'Premium quality porcelain pavers that combine exceptional durability with timeless elegance.',
            buttonText: 'Shop Now',
            link: '/products/concrete-pavers-system',
            positionX: 'center',
            positionY: 'top'
          },
          {
            image: slider2,
            title: 'IPE TILE SYSTEM',
            description: 'Discover the unmatched beauty and strength of IPE wood tile systems.',
            buttonText: 'Shop Now',
            link: '/products/ipe-tile-systems',
            positionX: 'center',
            positionY: 'top'
          }
        ])
      }
    } catch (error) {
      console.error('Error fetching sliders:', error)
      // Fallback to default slides
      setSlides([
        {
          image: slider1,
          title: 'PORCELAIN PAVER',
          description: 'Premium quality porcelain pavers that combine exceptional durability with timeless elegance.',
          buttonText: 'Shop Now',
          link: '/products/concrete-pavers-system',
          positionX: 'center',
          positionY: 'top'
        },
        {
          image: slider2,
          title: 'IPE TILE SYSTEM',
          description: 'Discover the unmatched beauty and strength of IPE wood tile systems.',
          buttonText: 'Shop Now',
          link: '/products/ipe-tile-systems',
          positionX: 'center',
          positionY: 'top'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  // Custom arrow components
  const NextArrow = ({ onClick }) => (
    <button
      onClick={onClick}
      className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
      aria-label="Next slide"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )

  const PrevArrow = ({ onClick }) => (
    <button
      onClick={onClick}
      className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
      aria-label="Previous slide"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  )

  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    fade: true,
    cssEase: 'linear',
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
  }

  const getBackgroundPosition = (positionX, positionY) => {
    const xMap = { left: 'left', center: 'center', right: 'right' }
    return xMap[positionX] || 'center'
  }

  if (loading) {
    return (
      <div className="relative h-[600px] md:h-[700px] w-full bg-gray-200 animate-pulse"></div>
    )
  }

  if (slides.length === 0) {
    return null
  }

  return (
    <div className="relative h-[600px] md:h-[700px] w-full">
      <Slider {...settings}>
        {slides.map((slide, index) => (
          <div key={index}>
            <div
              className="relative h-[600px] md:h-[700px] w-full bg-cover bg-no-repeat overflow-hidden"
              style={{ 
                backgroundImage: `url(${slide.image})`, 
                backgroundPositionX: getBackgroundPosition(slide.positionX, slide.positionY),
                backgroundPositionY: isMobile ? 'center' : 'calc(50% - 50px)',
                backgroundSize: 'cover'
              }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-40"></div>
              
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="text-center text-white px-4 max-w-4xl">
                  <h1 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-lg">
                    {slide.title}
                  </h1>
                  {slide.description && (
                    <p className="text-lg md:text-xl mb-8 drop-shadow-md max-w-2xl mx-auto">
                      {slide.description}
                    </p>
                  )}
                  {slide.buttonText && (
                    <Link
                      to={slide.link}
                      className="inline-block bg-primary hover:bg-primary-dark text-white px-10 py-4 rounded-lg font-semibold text-lg transition-colors shadow-lg"
                    >
                      {slide.buttonText}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  )
}

export default HeroSlider

