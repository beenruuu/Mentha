"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/landing/sections/Navbar'
import Hero from '@/components/landing/sections/Hero'
import LogoTicker from '@/components/landing/sections/LogoTicker'
import Introduction from '@/components/landing/sections/Introduction'
import Features from '@/components/landing/sections/Features'
import Integrations from '@/components/landing/sections/Integrations'
import Pricing from '@/components/landing/sections/Pricing'
import Faqs from '@/components/landing/sections/Faqs'
import CallToAction from '@/components/landing/sections/CallToAction'
import Footer from '@/components/landing/sections/Footer'

export default function LandingPage() {


  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-emerald-500/30">
      <Navbar />
      <Hero />
      <LogoTicker />
      <Introduction />
      <Features />
      <Integrations />
      <Pricing />
      <Faqs />
      <CallToAction />
      <Footer />
    </div>
  )
}


