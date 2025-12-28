"use client"

import { useState } from "react"
import { useTranslations } from "@/lib/i18n"
import Link from "next/link"
import Tag from "@/components/landing/Tag"

export default function PricingSection() {
  const { t } = useTranslations()
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annually">("annually")

  const pricing = {
    starter: {
      monthly: 0,
      annually: 0,
    },
    professional: {
      monthly: 20,
      annually: 16, // 20% discount for annual
    },
    enterprise: {
      monthly: 200,
      annually: 160, // 20% discount for annual
    },
  }

  return (
    <div id="pricing" className="w-full flex flex-col justify-center items-center gap-2">
      {/* Header Section - Introduction style */}
      <section className="py-16 lg:py-20 w-full border-b border-black/10 dark:border-white/10">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="flex justify-center mb-8">
            <Tag>{t.pricingTag}</Tag>
          </div>
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              {t.pricingTitle} <span className="text-emerald-500 dark:text-emerald-400">{t.pricingTitleHighlight}</span>
            </h2>
            <p className="text-base md:text-lg text-gray-600 dark:text-white/80 max-w-3xl mx-auto">
              {t.pricingDescription}
            </p>
          </div>
        </div>
      </section>

      {/* Billing Toggle Section */}
      <div className="self-stretch px-6 md:px-16 py-9 relative flex justify-center items-center gap-4">
        {/* Horizontal line */}
        <div className="w-full max-w-[1060px] h-0 absolute left-1/2 transform -translate-x-1/2 top-[63px] border-t border-black/10 dark:border-white/10 z-0"></div>

        {/* Toggle Container */}
        <div className="p-3 relative bg-black/5 dark:bg-white/5 border border-black/5 backdrop-blur-[44px] backdrop-saturate-150 backdrop-brightness-110 flex justify-center items-center rounded-lg z-20 before:absolute before:inset-0 before:bg-white dark:before:bg-neutral-900 before:opacity-60 before:rounded-lg before:-z-10">
          <div className="p-[2px] bg-black/10 dark:bg-white/10 shadow-[0px_1px_0px_white] dark:shadow-none rounded-[99px] border-[0.5px] border-black/5 flex justify-center items-center gap-[2px] relative">
            <div
              className={`absolute top-[2px] w-[calc(50%-1px)] h-[calc(100%-4px)] bg-white dark:bg-neutral-800 shadow-[0px_2px_4px_rgba(0,0,0,0.08)] rounded-[99px] transition-all duration-300 ease-in-out ${billingPeriod === "annually" ? "left-[2px]" : "right-[2px]"
                }`}
            />

            <button
              onClick={() => setBillingPeriod("annually")}
              className="px-4 py-1 rounded-[99px] flex justify-center items-center gap-2 transition-colors duration-300 relative z-10 flex-1"
            >
              <div
                className={`text-[13px] font-medium leading-5 font-sans transition-colors duration-300 ${billingPeriod === "annually" ? "text-black dark:text-white" : "text-black/40 dark:text-white/40"
                  }`}
              >
                {t.billedAnnuallyLabel || "Anual"}
              </div>
            </button>

            <button
              onClick={() => setBillingPeriod("monthly")}
              className="px-4 py-1 rounded-[99px] flex justify-center items-center gap-2 transition-colors duration-300 relative z-10 flex-1"
            >
              <div
                className={`text-[13px] font-medium leading-5 font-sans transition-colors duration-300 ${billingPeriod === "monthly" ? "text-black dark:text-white" : "text-black/40 dark:text-white/40"
                  }`}
              >
                {t.billedMonthlyLabel || "Mensual"}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards Section */}
      <div className="self-stretch border-b border-t border-black/10 dark:border-white/10 flex justify-center items-center">
        <div className="flex justify-center items-start w-full">
          {/* Left Decorative Pattern */}
          <div className="w-12 self-stretch relative overflow-hidden hidden md:block">
            <div className="w-[162px] left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
              {Array.from({ length: 200 }).map((_, i) => (
                <div
                  key={i}
                  className="self-stretch h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-black/5 dark:outline-white/5 outline-offset-[-0.25px]"
                ></div>
              ))}
            </div>
          </div>

          {/* Pricing Cards Container */}
          <div className="flex-1 flex flex-col md:flex-row justify-center items-center gap-6 py-12 md:py-0">
            {/* Starter Plan */}
            <div className="flex-1 max-w-full md:max-w-none self-stretch px-6 py-5 border border-black/10 dark:border-white/10 overflow-hidden flex flex-col justify-start items-start gap-12 bg-transparent">
              {/* Plan Header */}
              <div className="self-stretch flex flex-col justify-start items-center gap-9">
                <div className="self-stretch flex flex-col justify-start items-start gap-2">
                  <div className="text-black/90 dark:text-white text-lg font-medium leading-7 font-sans">{t.pricingStarter}</div>
                  <div className="w-full max-w-[242px] text-black/70 dark:text-white/60 text-sm font-normal leading-5 font-sans">
                    {t.pricingStarterDescription}
                  </div>
                </div>

                <div className="self-stretch flex flex-col justify-start items-start gap-2">
                  <div className="flex flex-col justify-start items-start gap-1">
                    <div className="relative h-[60px] flex items-center text-black dark:text-white text-5xl font-medium leading-[60px] font-serif tracking-wide">
                      <span className="invisible">{pricing.starter[billingPeriod]}€</span>
                      <span
                        className="absolute inset-0 flex items-center transition-all duration-500"
                        style={{
                          opacity: billingPeriod === "annually" ? 1 : 0,
                          transform: `scale(${billingPeriod === "annually" ? 1 : 0.8})`,
                          filter: `blur(${billingPeriod === "annually" ? 0 : 4}px)`,
                        }}
                        aria-hidden={billingPeriod !== "annually"}
                      >
                        {pricing.starter.annually}€
                      </span>
                      <span
                        className="absolute inset-0 flex items-center transition-all duration-500"
                        style={{
                          opacity: billingPeriod === "monthly" ? 1 : 0,
                          transform: `scale(${billingPeriod === "monthly" ? 1 : 0.8})`,
                          filter: `blur(${billingPeriod === "monthly" ? 0 : 4}px)`,
                        }}
                        aria-hidden={billingPeriod !== "monthly"}
                      >
                        {pricing.starter.monthly}€
                      </span>
                    </div>
                    <div className="text-black/50 dark:text-white/40 text-sm font-medium font-sans">
                      {t.perMonth}
                    </div>
                  </div>
                </div>

                <Link href="/auth/signup" className="self-stretch px-4 py-[10px] relative bg-black dark:bg-neutral-800 shadow-[0px_2px_4px_rgba(0,0,0,0.12)] overflow-hidden rounded-[99px] flex justify-center items-center hover:opacity-90 transition-opacity">
                  <div className="w-full h-[41px] absolute left-0 top-[-0.5px] bg-gradient-to-b from-[rgba(255,255,255,0.20)] to-[rgba(0,0,0,0.10)] mix-blend-multiply"></div>
                  <div className="max-w-[108px] flex justify-center flex-col text-white text-[13px] font-medium leading-5 font-sans">
                    {t.pricingStarterCTA}
                  </div>
                </Link>
              </div>

              <div className="self-stretch flex flex-col justify-start items-start gap-2">
                {[
                  t.pricingStarterFeature1,
                  t.pricingStarterFeature2,
                  t.pricingStarterFeature3,
                  t.pricingStarterFeature4,
                ].map((feature, index) => (
                  <div key={index} className="self-stretch flex justify-start items-center gap-[13px]">
                    <div className="w-4 h-4 relative flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M10 3L4.5 8.5L2 6"
                          stroke="#9CA3AF"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 text-black/80 dark:text-white/70 text-[12.5px] font-normal leading-5 font-sans">
                      {feature}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Professional Plan (Featured) */}
            <div className="flex-1 max-w-full md:max-w-none self-stretch px-6 py-5 bg-emerald-500 dark:bg-emerald-600 border border-black/10 overflow-hidden flex flex-col justify-start items-start gap-12 shadow-xl">
              {/* Plan Header */}
              <div className="self-stretch flex flex-col justify-start items-center gap-9">
                <div className="self-stretch flex flex-col justify-start items-start gap-2">
                  <div className="text-white text-lg font-medium leading-7 font-sans">{t.pricingPro}</div>
                  <div className="w-full max-w-[242px] text-white/80 text-sm font-normal leading-5 font-sans">
                    {t.pricingProDescription}
                  </div>
                </div>

                <div className="self-stretch flex flex-col justify-start items-start gap-2">
                  <div className="flex flex-col justify-start items-start gap-1">
                    <div className="relative h-[60px] flex items-center text-white text-5xl font-medium leading-[60px] font-serif tracking-wide">
                      <span className="invisible">{pricing.professional[billingPeriod]}€</span>
                      <span
                        className="absolute inset-0 flex items-center transition-all duration-500"
                        style={{
                          opacity: billingPeriod === "annually" ? 1 : 0,
                          transform: `scale(${billingPeriod === "annually" ? 1 : 0.8})`,
                          filter: `blur(${billingPeriod === "annually" ? 0 : 4}px)`,
                        }}
                        aria-hidden={billingPeriod !== "annually"}
                      >
                        {pricing.professional.annually}€
                      </span>
                      <span
                        className="absolute inset-0 flex items-center transition-all duration-500"
                        style={{
                          opacity: billingPeriod === "monthly" ? 1 : 0,
                          transform: `scale(${billingPeriod === "monthly" ? 1 : 0.8})`,
                          filter: `blur(${billingPeriod === "monthly" ? 0 : 4}px)`,
                        }}
                        aria-hidden={billingPeriod !== "monthly"}
                      >
                        {pricing.professional.monthly}€
                      </span>
                    </div>
                    <div className="text-white/70 text-sm font-medium font-sans">
                      {t.perMonth}
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <Link href="/auth/signup" className="self-stretch px-4 py-[10px] relative bg-white shadow-[0px_2px_4px_rgba(0,0,0,0.12)] overflow-hidden rounded-[99px] flex justify-center items-center hover:bg-neutral-50 transition-colors">
                  <div className="w-full h-[41px] absolute left-0 top-[-0.5px] bg-gradient-to-b from-[rgba(255,255,255,0)] to-[rgba(0,0,0,0.10)] mix-blend-multiply"></div>
                  <div className="max-w-[108px] flex justify-center flex-col text-emerald-600 text-[13px] font-medium leading-5 font-sans">
                    {t.pricingProCTA}
                  </div>
                </Link>
              </div>

              <div className="self-stretch flex flex-col justify-start items-start gap-2">
                {[
                  t.pricingProFeature1,
                  t.pricingProFeature2,
                  t.pricingProFeature3,
                  t.pricingProFeature4,
                  t.pricingProFeature5,
                  t.pricingProFeature6,
                ].map((feature, index) => (
                  <div key={index} className="self-stretch flex justify-start items-center gap-[13px]">
                    <div className="w-4 h-4 relative flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M10 3L4.5 8.5L2 6"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 text-white text-[12.5px] font-normal leading-5 font-sans">{feature}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="flex-1 max-w-full md:max-w-none self-stretch px-6 py-5 bg-transparent border border-black/10 dark:border-white/10 overflow-hidden flex flex-col justify-start items-start gap-12">
              {/* Plan Header */}
              <div className="self-stretch flex flex-col justify-start items-center gap-9">
                <div className="self-stretch flex flex-col justify-start items-start gap-2">
                  <div className="text-black/90 dark:text-white text-lg font-medium leading-7 font-sans">{t.pricingEnterprise}</div>
                  <div className="w-full max-w-[242px] text-black/70 dark:text-white/60 text-sm font-normal leading-5 font-sans">
                    {t.pricingEnterpriseDescription}
                  </div>
                </div>

                <div className="self-stretch flex flex-col justify-start items-start gap-2">
                  <div className="flex flex-col justify-start items-start gap-1">
                    <div className="relative h-[60px] flex items-center text-black dark:text-white text-5xl font-medium leading-[60px] font-serif tracking-wide">
                      {t.pricingEnterprisePrice}
                    </div>
                    <div className="text-black/50 dark:text-white/40 text-sm font-medium font-sans">
                      {t.contactUs}
                    </div>
                  </div>
                </div>

                <Link href="/auth/signup" className="self-stretch px-4 py-[10px] relative bg-black dark:bg-neutral-800 shadow-[0px_2px_4px_rgba(0,0,0,0.12)] overflow-hidden rounded-[99px] flex justify-center items-center hover:opacity-90 transition-opacity">
                  <div className="w-full h-[41px] absolute left-0 top-[-0.5px] bg-gradient-to-b from-[rgba(255,255,255,0.20)] to-[rgba(0,0,0,0.10)] mix-blend-multiply"></div>
                  <div className="max-w-[108px] flex justify-center flex-col text-white text-[13px] font-medium leading-5 font-sans">
                    {t.pricingEnterpriseCTA}
                  </div>
                </Link>
              </div>

              <div className="self-stretch flex flex-col justify-start items-start gap-2">
                {[
                  t.pricingEnterpriseFeature1,
                  t.pricingEnterpriseFeature2,
                  t.pricingEnterpriseFeature3,
                  t.pricingEnterpriseFeature4,
                  t.pricingEnterpriseFeature5,
                  t.pricingEnterpriseFeature6,
                ].map((feature, index) => (
                  <div key={index} className="self-stretch flex justify-start items-center gap-[13px]">
                    <div className="w-4 h-4 relative flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M10 3L4.5 8.5L2 6"
                          stroke="#9CA3AF"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 text-black/80 dark:text-white/70 text-[12.5px] font-normal leading-5 font-sans">
                      {feature}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Decorative Pattern */}
          <div className="w-12 self-stretch relative overflow-hidden hidden md:block">
            <div className="w-[162px] left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
              {Array.from({ length: 200 }).map((_, i) => (
                <div
                  key={i}
                  className="self-stretch h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-black/5 dark:outline-white/5 outline-offset-[-0.25px]"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
