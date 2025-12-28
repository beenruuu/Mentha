"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { useTranslations } from "@/lib/i18n"
import Tag from "@/components/landing/Tag"

export default function DocumentationSection() {
  const { t } = useTranslations()
  const [activeCard, setActiveCard] = useState(0)
  const [animationKey, setAnimationKey] = useState(0)

  const cards = [
    {
      title: t.docCard1Title,
      description: t.docCard1Desc,
      image: "/modern-dashboard-interface-with-data-visualization.jpg",
    },
    {
      title: t.docCard2Title,
      description: t.docCard2Desc,
      image: "/analytics-dashboard.png",
    },
    {
      title: t.docCard3Title,
      description: t.docCard3Desc,
      image: "/team-collaboration-interface-with-shared-workspace.jpg",
    },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % cards.length)
      setAnimationKey((prev) => prev + 1)
    }, 5000)

    return () => clearInterval(interval)
  }, [cards.length])

  const handleCardClick = (index: number) => {
    setActiveCard(index)
    setAnimationKey((prev) => prev + 1)
  }

  return (
    <div className="w-full border-b border-black/10 dark:border-white/10 flex flex-col justify-center items-center">
      {/* Header Section - Tag style */}
      <section className="py-16 lg:py-24 w-full border-b border-black/10 dark:border-white/10">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="flex justify-center mb-8">
            <Tag>{t.docBadge}</Tag>
          </div>
          <div className="text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              {t.docTitle}
            </h2>
            <p className="text-base md:text-lg text-gray-600 dark:text-white/80 max-w-2xl mx-auto">
              {t.docSubtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <div className="self-stretch px-4 md:px-9 overflow-hidden flex justify-start items-center">
        <div className="flex-1 py-8 md:py-11 flex flex-col md:flex-row justify-start items-center gap-6 md:gap-12">
          {/* Left Column - Feature Cards */}
          <div className="w-full md:w-auto md:max-w-[400px] flex flex-col justify-center items-center gap-4 order-2 md:order-1">
            {cards.map((card, index) => {
              const isActive = index === activeCard

              return (
                <div
                  key={index}
                  onClick={() => handleCardClick(index)}
                  className={`w-full overflow-hidden flex flex-col justify-start items-start transition-all duration-300 cursor-pointer ${isActive
                      ? "bg-white dark:bg-white/5 shadow-[0px_0px_0px_0.75px_rgba(0,0,0,0.1)_inset] dark:shadow-[0px_0px_0px_0.75px_rgba(255,255,255,0.1)_inset]"
                      : "border border-black/10 dark:border-white/10"
                    }`}
                >
                  <div
                    className={`w-full h-0.5 bg-black/5 dark:bg-white/10 overflow-hidden ${isActive ? "opacity-100" : "opacity-0"}`}
                  >
                    <div
                      key={animationKey}
                      className="h-0.5 bg-emerald-500 animate-[progressBar_5s_linear_forwards] will-change-transform"
                    />
                  </div>
                  <div className="px-6 py-5 w-full flex flex-col gap-2">
                    <div className="self-stretch flex justify-center flex-col text-black dark:text-white text-sm font-semibold leading-6 font-sans">
                      {card.title}
                    </div>
                    <div className="self-stretch text-black/70 dark:text-white/60 text-[13px] font-normal leading-[22px] font-sans whitespace-pre-line">
                      {card.description}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right Column - Image */}
          <div className="w-full md:w-auto rounded-lg flex flex-col justify-center items-center gap-2 order-1 md:order-2 md:px-0 px-[00]">
            <div className="w-full md:w-[580px] h-[250px] md:h-[420px] bg-white dark:bg-white/5 shadow-[0px_0px_0px_0.9056603908538818px_rgba(0,0,0,0.08)] dark:shadow-[0px_0px_0px_0.9056603908538818px_rgba(255,255,255,0.1)] overflow-hidden rounded-lg flex flex-col justify-start items-start">
              <div
                className={`w-full h-full transition-all duration-300 ${activeCard === 0
                    ? "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20"
                    : activeCard === 1
                      ? "bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-800/20 dark:to-emerald-700/20"
                      : "bg-gradient-to-br from-emerald-200 to-emerald-300 dark:from-emerald-700/20 dark:to-emerald-600/20"
                  }`}
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes progressBar {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(0%);
          }
        }
      `}</style>
    </div>
  )
}
