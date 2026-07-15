import React from 'react'
import HeroSlider from '../components/Slider'
import Tagline from '../components/Tagline'
import CategoryGrid from '../components/CategoryGrid'
import ProductSection from '../components/ProductSection'
import WhoWeAre from '../components/WhoWeAre'
import HomeSuggestions from '../components/HomeSuggestions'

const Home = () => {
  return (
    <div>
      <h1 className="sr-only">Tile and Turf Outdoor Flooring Systems</h1>
      <HeroSlider />
      <CategoryGrid />
      <Tagline />
      <ProductSection />
      <WhoWeAre />
      <HomeSuggestions />
    </div>
  )
}

export default Home

