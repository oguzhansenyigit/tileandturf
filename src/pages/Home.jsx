import React from 'react'
import HeroSlider from '../components/Slider'
import Tagline from '../components/Tagline'
import CategoryGrid from '../components/CategoryGrid'
import ProductSection from '../components/ProductSection'
import WhoWeAre from '../components/WhoWeAre'

const Home = () => {
  return (
    <div>
      <HeroSlider />
      <CategoryGrid />
      <Tagline />
      <ProductSection />
      <WhoWeAre />
    </div>
  )
}

export default Home

