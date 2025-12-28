"use client"

import { useTranslations } from "@/lib/i18n"
import Link from "next/link"
import { HeaderThemeToggle } from "@/components/shared/header-theme-toggle"

export function Header() {
  const { t } = useTranslations()

  return (
    <div className="w-full h-12 sm:h-14 md:h-16 lg:h-[84px] fixed left-0 top-0 flex justify-center items-center z-50 px-6 sm:px-8 md:px-12 lg:px-0 bg-white/80 dark:bg-black/80 backdrop-blur-md">
      <div className="w-full h-0 absolute left-0 bottom-0 border-b border-black/10 dark:border-white/10"></div>

      <div className="w-full max-w-[calc(100%-32px)] sm:max-w-[calc(100%-48px)] md:max-w-[calc(100%-64px)] lg:max-w-[700px] lg:w-[700px] h-10 sm:h-11 md:h-12 py-1.5 sm:py-2 px-3 sm:px-4 md:px-4 pr-2 sm:pr-3 bg-white dark:bg-neutral-900 shadow-[0px_1px_3px_rgba(0,0,0,0.1)] dark:shadow-[0px_1px_3px_rgba(0,0,0,0.3)] overflow-hidden rounded-[50px] flex justify-between items-center relative z-30 border border-black/10 dark:border-white/10">
        <div className="flex justify-center items-center">
          <Link href="/" className="flex justify-start items-center">
            <div className="flex flex-col justify-center text-black dark:text-white text-sm sm:text-base md:text-lg lg:text-xl font-medium leading-5 font-sans">
              Mentha
            </div>
          </Link>
          <div className="pl-3 sm:pl-4 md:pl-5 lg:pl-5 hidden sm:flex flex-row gap-2 sm:gap-3 md:gap-4 lg:gap-4">
            <Link href="/#features" className="flex justify-start items-center hover:opacity-70 transition-opacity">
              <div className="flex flex-col justify-center text-black/80 dark:text-white/60 text-xs md:text-[13px] font-medium leading-[14px] font-sans">
                {t.navFeatures}
              </div>
            </Link>
            <Link href="/#pricing" className="flex justify-start items-center hover:opacity-70 transition-opacity">
              <div className="flex flex-col justify-center text-black/80 dark:text-white/60 text-xs md:text-[13px] font-medium leading-[14px] font-sans">
                {t.navPricing}
              </div>
            </Link>
            <Link href="/blog" className="flex justify-start items-center hover:opacity-70 transition-opacity">
              <div className="flex flex-col justify-center text-black/80 dark:text-white/60 text-xs md:text-[13px] font-medium leading-[14px] font-sans">
                {t.footerBlog || "Blog"}
              </div>
            </Link>
          </div>
        </div>
        <div className="h-6 sm:h-7 md:h-8 flex justify-start items-start gap-2 sm:gap-3">
          <HeaderThemeToggle />
          <Link href="/auth/login" className="px-2 sm:px-3 md:px-[14px] py-1 sm:py-[6px] bg-neutral-100 dark:bg-neutral-800 shadow-[0px_1px_2px_rgba(0,0,0,0.08)] overflow-hidden rounded-full flex justify-center items-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors border border-black/10 dark:border-white/10">
            <div className="flex flex-col justify-center text-black dark:text-white text-xs md:text-[13px] font-medium leading-5 font-sans">
              {t.navLogin}
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
