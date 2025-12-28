'use client'

import React from 'react'
import { useTranslations } from '@/lib/i18n'
import { Header } from "@/components/landing/header";
import FooterSection from "@/components/landing/footer-section";

export default function PrivacyPage() {
  const { t } = useTranslations()
  
  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white selection:bg-emerald-500/30 transition-colors">
      <Header />
      <main className="pt-32 pb-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">{t.privacyPolicy}</h1>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t.privacyLastUpdated} {new Date().toLocaleDateString()}</p>
            
            <div className="space-y-8">
              <section className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm dark:shadow-none">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{t.privacySection1Title}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t.privacySection1Text}</p>
              </section>

              <section className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm dark:shadow-none">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{t.privacySection2Title}</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{t.privacySection2Text}</p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                  <li>{t.privacySection2Item1}</li>
                  <li>{t.privacySection2Item2}</li>
                  <li>{t.privacySection2Item3}</li>
                  <li>{t.privacySection2Item4}</li>
                </ul>
              </section>

              <section className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm dark:shadow-none">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{t.privacySection3Title}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t.privacySection3Text}</p>
              </section>

              <section className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm dark:shadow-none">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{t.privacySection4Title}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t.privacySection4Text}</p>
              </section>

              <section className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm dark:shadow-none">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{t.privacySection5Title}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t.privacySection5Text}</p>
              </section>

              <section className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm dark:shadow-none">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{t.privacySection6Title}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t.privacySection6Text}</p>
              </section>

              <section className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm dark:shadow-none">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{t.privacySection7Title}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t.privacySection7Text}</p>
              </section>
            </div>
          </div>
        </div>
      </main>
      <FooterSection />
    </div>
  )
}
