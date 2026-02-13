"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import DisplayCards from "@/components/landing/display-cards"
import YourWorkInSync from "@/components/landing/your-work-in-sync"
import EffortlessIntegration from "@/components/landing/effortless-integration-updated"
import NumbersThatSpeak from "@/components/landing/numbers-that-speak"
import DocumentationSection from "@/components/landing/documentation-section"
import TestimonialsSection from "@/components/landing/testimonials-section"
import FAQSection from "@/components/landing/faq-section"
import PricingSection from "@/components/landing/pricing-section"
import CTASection from "@/components/landing/cta-section"
import FooterSection from "@/components/landing/footer-section"
import Introduction from "@/components/landing/sections/Introduction"
import Tag from "@/components/landing/Tag"
import Navbar from "@/components/landing/sections/Navbar"
import { useTranslations } from "@/lib/i18n"
import { Typewriter } from "@/components/ui/typewriter"

// Reusable Badge Component
function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="px-[14px] py-[6px] bg-white dark:bg-neutral-900 shadow-[0px_0px_0px_4px_rgba(0,0,0,0.05)] overflow-hidden rounded-[90px] flex justify-start items-center gap-[8px] border border-black/10 shadow-xs">
      <div className="w-[14px] h-[14px] relative overflow-hidden flex items-center justify-center">{icon}</div>
      <div className="text-center flex justify-center flex-col text-black dark:text-white/90 text-xs font-medium leading-3 font-sans">
        {text}
      </div>
    </div>
  )
}

export default function LandingPage() {
  const { t } = useTranslations()
  const [activeCard, setActiveCard] = useState(0)
  const [progress, setProgress] = useState(0)
  const mountedRef = useRef(true)

  useEffect(() => {
    const progressInterval = setInterval(() => {
      if (!mountedRef.current) return

      setProgress((prev) => {
        if (prev >= 100) {
          if (mountedRef.current) {
            setActiveCard((current) => (current + 1) % 3)
          }
          return 0
        }
        return prev + 2 // 2% every 100ms = 5 seconds total
      })
    }, 100)

    return () => {
      clearInterval(progressInterval)
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const handleCardClick = (index: number) => {
    if (!mountedRef.current) return
    setActiveCard(index)
    setProgress(0)
  }

  return (
    <div className="w-full min-h-screen relative bg-white dark:bg-black overflow-x-hidden flex flex-col justify-start items-center">
      <div className="relative flex flex-col justify-start items-center w-full">
        {/* Main container with proper margins */}
        <div className="w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-0 lg:max-w-[1400px] lg:w-[1400px] relative flex flex-col justify-start items-start min-h-screen">
          {/* Left vertical line */}
          <div className="w-[1px] h-full absolute left-4 sm:left-6 md:left-8 lg:left-0 top-0 bg-black/10 dark:bg-white/10 shadow-[1px_0px_0px_white] dark:shadow-none z-0"></div>

          {/* Right vertical line */}
          <div className="w-[1px] h-full absolute right-4 sm:right-6 md:right-8 lg:right-0 top-0 bg-black/10 dark:bg-white/10 shadow-[1px_0px_0px_white] dark:shadow-none z-0"></div>

          <div className="self-stretch pt-[9px] overflow-hidden border-b border-black/5 dark:border-white/5 flex flex-col justify-center items-center gap-4 sm:gap-6 md:gap-8 lg:gap-[66px] relative z-10">
            {/* Navigation - Fixed/Sticky */}
            <Navbar />

            {/* Hero Section */}
            <div className="pt-16 sm:pt-20 md:pt-24 lg:pt-[216px] pb-8 sm:pb-12 md:pb-16 flex flex-col justify-start items-center px-2 sm:px-4 md:px-8 lg:px-0 w-full sm:pl-0 sm:pr-0 pl-0 pr-0">
              <div className="w-full max-w-[937px] lg:w-[937px] flex flex-col justify-center items-center gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                <div className="self-stretch rounded-[3px] flex flex-col justify-center items-center gap-4 sm:gap-5 md:gap-6 lg:gap-8">
                  <h1 className="w-full max-w-[900px] lg:max-w-[1200px] text-center flex flex-col justify-center items-center text-black dark:text-white text-[32px] xs:text-[40px] sm:text-[52px] md:text-[72px] lg:text-[96px] font-black leading-[1.02] sm:leading-[1.05] md:leading-[1.05] lg:leading-[1.05] font-sans tracking-tight px-2 sm:px-4 md:px-0">
                    <span className="inline-block">
                      {t.heroTitle}
                    </span>
                    <span className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 bg-clip-text text-transparent inline-block pb-2">
                      {t.heroTitleHighlight}
                    </span>
                  </h1>
                  <div className="w-full max-w-[580px] lg:w-[580px] text-center flex justify-center flex-col text-black/60 dark:text-white/60 sm:text-lg md:text-xl leading-[1.4] sm:leading-[1.45] md:leading-[1.5] lg:leading-7 font-sans px-2 sm:px-4 md:px-0 lg:text-lg font-medium text-sm mt-2">
                    {t.heroDescription}
                  </div>
                </div>
              </div>

              <div className="w-full max-w-[497px] lg:w-[497px] flex flex-col justify-center items-center gap-6 sm:gap-8 md:gap-10 lg:gap-12 relative z-10 mt-6 sm:mt-8 md:mt-10 lg:mt-12">
                <div className="flex justify-start items-center gap-4">
                  <Link href="/auth/signup" className="h-10 sm:h-11 md:h-12 px-6 sm:px-8 md:px-10 lg:px-12 py-2 sm:py-[6px] relative bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset] overflow-hidden rounded-full flex justify-center items-center transition-colors">
                    <div className="flex flex-col justify-center text-white text-sm sm:text-base md:text-[15px] font-medium leading-5 font-sans">
                      {t.heroStartTrial}
                    </div>
                  </Link>
                </div>
              </div>

              <div className="absolute top-[180px] sm:top-[200px] md:top-[220px] lg:top-[280px] left-1/2 transform -translate-x-1/2 z-0 pointer-events-none overflow-visible">
                {/* Main Emerald Glow */}
                <div
                  className="w-[800px] sm:w-[1200px] md:w-[1800px] lg:w-[2400px] h-[500px] sm:h-[700px] md:h-[900px] lg:h-[1100px] rounded-full blur-[120px] opacity-30 dark:opacity-20"
                  style={{
                    background: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.4) 0%, rgba(16, 185, 129, 0.1) 40%, transparent 70%)',
                  }}
                />
                {/* Secondary Teal Glow */}
                <div
                  className="absolute top-1/4 left-1/4 w-[600px] sm:w-[1000px] md:w-[1400px] h-[400px] sm:h-[600px] md:h-[800px] rounded-full blur-[100px] opacity-20 dark:opacity-10 mix-blend-screen"
                  style={{
                    background: 'radial-gradient(ellipse at center, rgba(45, 212, 191, 0.3) 0%, transparent 70%)',
                  }}
                />
              </div>

              <div className="w-full max-w-[960px] lg:w-[960px] pt-2 sm:pt-4 pb-6 sm:pb-8 md:pb-10 px-2 sm:px-4 md:px-6 lg:px-11 flex flex-col justify-center items-center gap-2 relative z-5 my-8 sm:my-12 md:my-16 lg:my-16 mb-0 lg:pb-0">
                <div className="w-full max-w-[960px] lg:w-[960px] h-[200px] sm:h-[280px] md:h-[450px] lg:h-[695.55px] bg-white dark:bg-neutral-900 shadow-[0px_0px_0px_0.9056603908538818px_rgba(0,0,0,0.08)] overflow-hidden rounded-[6px] sm:rounded-[8px] lg:rounded-[9.06px] flex flex-col justify-start items-start">
                  {/* Dashboard Content */}
                  <div className="self-stretch flex-1 flex justify-start items-start">
                    {/* Main Content */}
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="relative w-full h-full overflow-hidden">
                        {/* Product Image 1 - Análisis AEO */}
                        <div
                          className={`absolute inset-0 transition-all duration-500 ease-in-out ${activeCard === 0 ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-95 blur-sm"
                            }`}
                        >
                          <img
                            src="/mentha-preview.png"
                            alt="Mentha Dashboard - Análisis AEO"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Product Image 2 - Inteligencia Competitiva */}
                        <div
                          className={`absolute inset-0 transition-all duration-500 ease-in-out ${activeCard === 1 ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-95 blur-sm"
                            }`}
                        >
                          <img
                            src="/mentha-preview.png"
                            alt="Mentha Dashboard - Inteligencia Competitiva"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Product Image 3 - Protección de Marca */}
                        <div
                          className={`absolute inset-0 transition-all duration-500 ease-in-out ${activeCard === 2 ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-95 blur-sm"
                            }`}
                        >
                          <img
                            src="/mentha-preview.png"
                            alt="Mentha Dashboard - Protección de Marca"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="self-stretch border-t border-black/10 dark:border-white/10 border-b border-black/10 dark:border-white/10 flex justify-center items-start">
                <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden">
                  {/* Left decorative pattern */}
                  <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
                    {Array.from({ length: 50 }).map((_, i) => (
                      <div
                        key={i}
                        className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] dark:outline-white/5 outline-offset-[-0.25px]"
                      ></div>
                    ))}
                  </div>
                </div>

                <div className="flex-1 px-0 sm:px-2 md:px-0 flex flex-col md:flex-row justify-center items-stretch gap-0">
                  {/* Feature Cards */}
                  <FeatureCard
                    title={t.featureAEOTitle}
                    description={t.featureAEODescription}
                    isActive={activeCard === 0}
                    progress={activeCard === 0 ? progress : 0}
                    onClick={() => handleCardClick(0)}
                  />
                  <FeatureCard
                    title={t.featureCompetitorTitle}
                    description={t.featureCompetitorDescription}
                    isActive={activeCard === 1}
                    progress={activeCard === 1 ? progress : 0}
                    onClick={() => handleCardClick(1)}
                  />
                  <FeatureCard
                    title={t.featureBrandTitle}
                    description={t.featureBrandDescription}
                    isActive={activeCard === 2}
                    progress={activeCard === 2 ? progress : 0}
                    onClick={() => handleCardClick(2)}
                  />
                </div>

                <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden">
                  {/* Right decorative pattern */}
                  <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
                    {Array.from({ length: 50 }).map((_, i) => (
                      <div
                        key={i}
                        className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] dark:outline-white/5 outline-offset-[-0.25px]"
                      ></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Introduction Section (Paradigm Shift) */}
              <Introduction />

              {/* Social Proof Section - Introduction style */}
              <section className="py-16 lg:py-20 w-full border-b border-black/10 dark:border-white/10">
                <div className="container max-w-5xl mx-auto px-4">
                  <div className="flex justify-center mb-8">
                    <Tag>{t.socialProofBadge}</Tag>
                  </div>
                  <div className="text-center">
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                      {t.socialProofTitle}
                    </h2>
                    <p className="text-base md:text-lg lg:text-xl text-gray-600 dark:text-white/80 max-w-3xl mx-auto">
                      {t.socialProofDescription}
                    </p>
                  </div>
                  {/* Company Logos */}
                  <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 mt-12 opacity-60">
                    <div className="text-gray-400 dark:text-white/40 font-medium text-lg">TechCorp</div>
                    <div className="text-gray-400 dark:text-white/40 font-medium text-lg">InnovateLab</div>
                    <div className="text-gray-400 dark:text-white/40 font-medium text-lg">DataFlow</div>
                    <div className="text-gray-400 dark:text-white/40 font-medium text-lg">CloudScale</div>
                    <div className="text-gray-400 dark:text-white/40 font-medium text-lg">NexGen</div>
                  </div>
                </div>

              </section>

              {/* Bento Grid Section */}
              <div className="w-full border-b border-black/10 dark:border-white/10 flex flex-col justify-center items-center" id="features">
                {/* Header Section */}
                <div className="self-stretch px-4 sm:px-6 md:px-8 lg:px-0 lg:max-w-[1400px] lg:w-[1400px] py-8 sm:py-12 md:py-16 border-b border-black/10 dark:border-white/10 flex justify-center items-center gap-6">
                  <div className="w-full max-w-[616px] lg:w-[616px] px-4 sm:px-6 py-4 sm:py-5 overflow-hidden rounded-lg flex flex-col justify-start items-center gap-3 sm:gap-4">
                    <Tag>{t.bentoBadge}</Tag>
                    <div className="w-full max-w-[598.06px] lg:w-[598.06px] text-center flex justify-center flex-col text-black dark:text-white text-xl sm:text-2xl md:text-3xl lg:text-5xl font-bold leading-tight md:leading-[60px] font-sans tracking-tight">
                      {t.bentoTitle}
                    </div>
                    <div className="self-stretch text-center text-black/70 dark:text-white/60 text-sm sm:text-base font-normal leading-6 sm:leading-7 font-sans">
                      {t.bentoDescription}
                    </div>
                  </div>
                </div>

                {/* Bento Grid Content */}
                <div className="self-stretch flex justify-center items-start">
                  <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden">
                    {/* Left decorative pattern */}
                    <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
                      {Array.from({ length: 200 }).map((_, i) => (
                        <div
                          key={i}
                          className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-black/5 dark:outline-white/5 outline-offset-[-0.25px]"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 border-l border-r border-black/10 dark:border-white/10">
                    {/* Left - Smart. Simple. Brilliant. */}
                    <div className="border-r-0 md:border-r border-black/10 dark:border-white/10 p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-start items-start gap-4 sm:gap-6">
                      <div className="flex flex-col gap-2">
                        <h3 className="text-black dark:text-white text-lg sm:text-xl font-semibold leading-tight font-sans">
                          {t.smartSimpleTitle}
                        </h3>
                        <p className="text-black/70 dark:text-white/60 text-sm md:text-base font-normal leading-relaxed font-sans">
                          {t.smartSimpleDescription}
                        </p>
                      </div>
                      <div className="w-full h-[200px] sm:h-[250px] md:h-[300px] rounded-lg flex items-center justify-center overflow-visible">
                        <DisplayCards />
                      </div>
                    </div>

                    {/* Right - Motores de IA */}
                    <div className="p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-start items-start gap-4 sm:gap-6 bg-transparent">
                      <div className="flex flex-col gap-2">
                        <h3 className="text-black dark:text-white text-lg sm:text-xl font-semibold leading-tight font-sans">
                          {t.integrationTitle}
                        </h3>
                        <p className="text-black/70 dark:text-white/60 text-sm md:text-base font-normal leading-relaxed font-sans">
                          {t.integrationDescription}
                        </p>
                      </div>
                      <div className="w-full h-[200px] sm:h-[250px] md:h-[300px] rounded-lg flex overflow-hidden justify-center items-center relative bg-transparent">
                        <div className="w-full h-full flex items-center justify-center bg-transparent">
                          <EffortlessIntegration width={400} height={250} className="max-w-full max-h-full" />
                        </div>
                        {/* Gradient mask for soft bottom edge */}
                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-black to-transparent pointer-events-none"></div>
                      </div>
                    </div>
                  </div>

                  <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden">
                    {/* Right decorative pattern */}
                    <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
                      {Array.from({ length: 200 }).map((_, i) => (
                        <div
                          key={i}
                          className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] dark:outline-white/5 outline-offset-[-0.25px]"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>



              {/* Documentation Section */}
              <DocumentationSection />

              {/* Testimonials Section */}
              <TestimonialsSection />

              {/* Pricing Section */}
              <PricingSection />

              {/* FAQ Section */}
              <FAQSection />

              {/* CTA Section */}
              <CTASection />

              {/* Footer Section */}
              <FooterSection />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// FeatureCard component definition inline to fix import error
function FeatureCard({
  title,
  description,
  isActive,
  progress,
  onClick,
}: {
  title: string
  description: string
  isActive: boolean
  progress: number
  onClick: () => void
}) {
  return (
    <div
      className={`w-full md:flex-1 self-stretch px-6 py-5 overflow-hidden flex flex-col justify-start items-start gap-2 cursor-pointer relative border-b md:border-b-0 last:border-b-0 ${isActive
        ? "bg-white dark:bg-neutral-900 shadow-[0px_0px_0px_0.75px_rgba(0,0,0,0.1)_inset] dark:shadow-none"
        : "border-l-0 border-r-0 md:border border-black/10 dark:border-white/5"
        }`}
      onClick={onClick}
    >
      {isActive && (
        <div className="absolute top-0 left-0 w-full h-0.5 bg-black/5 dark:bg-white/10">
          <div
            className="h-full bg-black dark:bg-emerald-500 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="self-stretch flex justify-center flex-col text-black dark:text-white text-sm md:text-sm font-semibold leading-6 md:leading-6 font-sans">
        {title}
      </div>
      <div className="self-stretch text-black/70 dark:text-white/60 text-[13px] md:text-[13px] font-normal leading-[22px] md:leading-[22px] font-sans">
        {description}
      </div>
    </div>
  )
}



