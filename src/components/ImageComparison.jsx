import React, { useState, useRef, useEffect } from 'react'

const ImageComparison = ({ beforeImage, afterImage, alt = 'Comparison' }) => {
  const [sliderPosition, setSliderPosition] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [hasAutoSlid, setHasAutoSlid] = useState(false)
  const containerRef = useRef(null)

  // Auto-slide animation on mount (only once)
  useEffect(() => {
    if (hasAutoSlid) return
    
    const duration = 3000 // 3 seconds for animation
    const startTime = Date.now()
    const startPosition = 0
    const endPosition = 100
    
    let animationId
    
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
        animationId = requestAnimationFrame(animate)
      } else {
        setHasAutoSlid(true)
        // Reset to middle position after animation
        setSliderPosition(50)
      }
    }
    
    animationId = requestAnimationFrame(animate)
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [hasAutoSlid])

  const handleMouseDown = (e) => {
    setIsDragging(true)
    updateSliderPosition(e)
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    updateSliderPosition(e)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e) => {
    setIsDragging(true)
    updateSliderPosition(e.touches[0])
  }

  const handleTouchMove = (e) => {
    if (!isDragging) return
    if (e.cancelable) {
      e.preventDefault()
    }
    updateSliderPosition(e.touches[0])
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  const updateSliderPosition = (e) => {
    if (!containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setSliderPosition(percentage)
  }

  useEffect(() => {
    if (!isDragging) return
    
    const mouseMoveHandler = (e) => {
      if (!isDragging) return
      updateSliderPosition(e)
    }
    
    const mouseUpHandler = () => {
      setIsDragging(false)
    }
    
    const touchMoveHandler = (e) => {
      if (!isDragging) return
      if (e.cancelable) {
        e.preventDefault()
      }
      updateSliderPosition(e.touches[0])
    }
    
    const touchEndHandler = () => {
      setIsDragging(false)
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
  }, [isDragging])

  if (!beforeImage || !afterImage) {
    return null
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-96 md:h-[500px] rounded-lg overflow-hidden shadow-lg cursor-col-resize"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
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
        className="absolute inset-0 overflow-hidden"
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
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg z-10"
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

export default ImageComparison

