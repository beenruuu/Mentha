'use client'

import React from 'react'
import { useTranslations } from '@/lib/i18n'
import { Header } from "@/components/landing/header";
import FooterSection from "@/components/landing/footer-section";

export default function TermsPage() {
  const { t } = useTranslations()
  
  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white selection:bg-emerald-500/30 transition-colors">
      <Header />
      <main className="pt-32 pb-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">{t.termsAndConditions}</h1>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t.termsLastUpdated} {new Date().toLocaleDateString()}</p>
            
            <div className="space-y-8">
              <section className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm dark:shadow-none">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{t.termsSection1Title}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t.termsSection1Text}</p>
              </section>

              <section className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm dark:shadow-none">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{t.termsSection2Title}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t.termsSection2Text}</p>
              </section>

              <section className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm dark:shadow-none">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{t.termsSection3Title}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t.termsSection3Text}</p>
              </section>

              <section className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm dark:shadow-none">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{t.termsSection4Title}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t.termsSection4Text}</p>
              </section>

              <section className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm dark:shadow-none">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{t.termsSection5Title}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t.termsSection5Text}</p>
              </section>

              <section className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm dark:shadow-none">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{t.termsSection6Title}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t.termsSection6Text}</p>
              </section>

              <section className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm dark:shadow-none">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{t.termsSection7Title}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t.termsSection7Text}</p>
              </section>

              <section className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm dark:shadow-none">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{t.termsSection8Title}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t.termsSection8Text}</p>
              </section>
            </div>
          </div>
        </div>
      </main>
      <FooterSection />
    </div>
  )
}
