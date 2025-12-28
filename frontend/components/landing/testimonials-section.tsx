"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { useTranslations } from "@/lib/i18n"

// Badge component for consistency
function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="px-[14px] py-[6px] bg-white dark:bg-white/10 shadow-[0px_0px_0px_4px_rgba(0,0,0,0.05)] overflow-hidden rounded-[90px] flex justify-start items-center gap-[8px] border border-black/10 shadow-xs">
      <div className="w-[14px] h-[14px] relative overflow-hidden flex items-center justify-center">{icon}</div>
      <div className="text-center flex justify-center flex-col text-black dark:text-white/90 text-xs font-medium leading-3 font-sans">
        {text}
      </div>
    </div>
  )
}

export default function TestimonialsSection() {
  const { t } = useTranslations()
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const testimonials = [
    {
      quote: t.testimonial1Quote,
      name: t.testimonial1Name,
      company: t.testimonial1Company,
      image: "/testimonials/elena.png",
    },
    {
      quote: t.testimonial2Quote,
      name: t.testimonial2Name,
      company: t.testimonial2Company,
      image: "/testimonials/david.png",
    },
    {
      quote: t.testimonial3Quote,
      name: t.testimonial3Name,
      company: t.testimonial3Company,
      image: "/testimonials/sarah.png",
    },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
        setTimeout(() => {
          setIsTransitioning(false)
        }, 100)
      }, 300)
    }, 12000) // increased from 6000ms to 12000ms for longer testimonial display

    return () => clearInterval(interval)
  }, [testimonials.length])

  const handleNavigationClick = (index: number) => {
    setIsTransitioning(true)
    setTimeout(() => {
      setActiveTestimonial(index)
      setTimeout(() => {
        setIsTransitioning(false)
      }, 100)
    }, 300)
  }

  return (
    <div className="w-full border-b border-black/10 dark:border-white/10 flex flex-col justify-center items-center">
      {/* Header Section */}

      {/* Testimonial Content */}
      <div className="self-stretch px-2 overflow-hidden flex justify-start items-center bg-background border border-b border-l-0 border-r-0 border-t-0 dark:border-white/10">
        <div className="flex-1 py-16 md:py-17 flex flex-col md:flex-row justify-center items-end gap-6">
          <div className="self-stretch px-3 md:px-12 justify-center items-start gap-4 flex flex-col md:flex-row">
            <div className="relative p-1 bg-white dark:bg-white/10 rounded-xl shadow-lg">
              <img
                className="w-48 h-50 md:w-48 md:h-50 rounded-lg object-cover transition-all duration-700 ease-in-out testimonial-sketch"
                style={{
                  opacity: isTransitioning ? 0.6 : 1,
                  transform: isTransitioning ? "scale(0.95)" : "scale(1)",
                  transition: "opacity 0.7s ease-in-out, transform 0.7s ease-in-out",
                }}
                src={testimonials[activeTestimonial].image || "/placeholder.svg"}
                alt={testimonials[activeTestimonial].name}
              />
            </div>
            <div className="flex-1 px-6 py-6 shadow-[0px_0px_0px_0.75px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col justify-start items-start gap-6 shadow-none pb-0 pt-0">
              <div
                className="self-stretch justify-start flex flex-col text-black dark:text-white text-2xl md:text-[32px] font-medium leading-10 md:leading-[42px] font-sans min-h-[180px] md:min-h-[200px] overflow-visible transition-all duration-700 ease-in-out tracking-tight"
                style={{
                  filter: isTransitioning ? "blur(4px)" : "blur(0px)",
                  transition: "filter 0.7s ease-in-out",
                }}
              >
                "{testimonials[activeTestimonial].quote}"
              </div>
              <div
                className="self-stretch flex flex-col justify-start items-start gap-1 transition-all duration-700 ease-in-out"
                style={{
                  filter: isTransitioning ? "blur(4px)" : "blur(0px)",
                  transition: "filter 0.7s ease-in-out",
                }}
              >
                <div className="self-stretch justify-center flex flex-col text-black/90 dark:text-white/90 text-lg font-medium leading-[26px] font-sans">
                  {testimonials[activeTestimonial].name}
                </div>
                <div className="self-stretch justify-center flex flex-col text-black/70 dark:text-white/60 text-lg font-medium leading-[26px] font-sans">
                  {testimonials[activeTestimonial].company}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          <div className="pr-6 justify-start items-start gap-[14px] flex">
            <button
              onClick={() => handleNavigationClick((activeTestimonial - 1 + testimonials.length) % testimonials.length)}
              className="w-9 h-9 shadow-[0px_1px_2px_rgba(0,0,0,0.08)] overflow-hidden rounded-full border border-black/15 dark:border-white/20 justify-center items-center gap-2 flex hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <div className="w-6 h-6 relative overflow-hidden">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M15 18L9 12L15 6"
                    stroke="currentColor"
                    className="text-black dark:text-white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </button>
            <button
              onClick={() => handleNavigationClick((activeTestimonial + 1) % testimonials.length)}
              className="w-9 h-9 shadow-[0px_1px_2px_rgba(0,0,0,0.08)] overflow-hidden rounded-full border border-black/15 dark:border-white/20 justify-center items-center gap-2 flex hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <div className="w-6 h-6 relative overflow-hidden">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M9 18L15 12L9 6"
                    stroke="currentColor"
                    className="text-black dark:text-white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* SVG Filters for Sketch Effect */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <filter id="sketch-light" colorInterpolationFilters="sRGB">
            <feColorMatrix type="saturation" values="0" result="gray" />
            <feConvolveMatrix in="gray" order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" result="edges" />
            <feColorMatrix in="edges" type="matrix" values="0 0 0 0 0
                                                            0 0 0 0 0
                                                            0 0 0 0 0
                                                            0 0 0 4 0" />
          </filter>
          <filter id="sketch-dark" colorInterpolationFilters="sRGB">
            <feColorMatrix type="saturation" values="0" result="gray" />
            <feConvolveMatrix in="gray" order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" result="edges" />
            <feColorMatrix in="edges" type="matrix" values="0 0 0 0 1
                                                            0 0 0 0 1
                                                            0 0 0 0 1
                                                            0 0 0 4 0" />
          </filter>
        </defs>
      </svg>
      <style>{`
        .testimonial-sketch {
          filter: url(#sketch-light);
        }
        :is(.dark) .testimonial-sketch {
          filter: url(#sketch-dark);
        }
      `}</style>
    </div>
  )
}
