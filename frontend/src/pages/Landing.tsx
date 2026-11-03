import { useEffect } from 'react'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Cta, Faq, Features, Gallery, Hardware, Hero, HowItWorks, Preview, StackMarquee, Story } from '@/components/landing/sections'

export default function Landing() {
  useEffect(() => {
    document.title = 'Bee Guardian — Real-time hive monitoring'
  }, [])
  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <main>
        <Hero />
        <StackMarquee />
        <Story />
        <Features />
        <Preview />
        <HowItWorks />
        <Hardware />
        <Gallery />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </div>
  )
}
