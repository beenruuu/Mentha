"use client"

import { Button } from "@/components/ui/button"
import { useTranslations } from "@/lib/i18n"
import Link from "next/link"

export function HeroSection() {
  const { t } = useTranslations()

  return (
    <section className="relative pt-[216px] pb-16">
      <div className="max-w-[1060px] mx-auto px-4">
        <div className="flex flex-col items-center gap-12">
          {/* Hero Content */}
          <div className="max-w-[937px] flex flex-col items-center gap-3">
            <div className="flex flex-col items-center gap-6">
              <h1 className="max-w-[748px] text-center text-black dark:text-white text-5xl md:text-[80px] font-normal leading-tight md:leading-[96px] font-serif">
                {t.heroTitle}
              </h1>
              <p className="max-w-[506px] text-center text-black/80 dark:text-white/60 text-lg font-medium leading-7">
                {t.heroDescription}
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center">
            <Link href="/auth/signup">
              <Button className="h-10 px-12 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-full font-medium text-sm shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset]">
                {t.heroStartTrial}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
