'use client'

import React from 'react'
import { useTranslations } from '@/lib/i18n'
import { Navbar as Header } from "@/components/landing";
import FooterSection from "@/components/landing/footer-section";

export default function ContactPage() {
    const { t } = useTranslations()

    return (
        <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white selection:bg-emerald-500/30 transition-colors">
            <Header />
            <main className="pt-32 pb-24">
                <div className="container mx-auto px-4 max-w-4xl">
                    <h1 className="text-4xl md:text-5xl font-bold mb-8 text-gray-900 dark:text-white">
                        {t.footerContact || "Contacto"}
                    </h1>

                    <div className="prose prose-gray dark:prose-invert max-w-none">
                        <div className="space-y-8">
                            <section className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm dark:shadow-none">
                                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                                    {t.contactEmail || "Email"}
                                </h2>
                                <p className="text-gray-600 dark:text-gray-300">
                                    <a href="mailto:hello@mentha.ai" className="text-emerald-500 hover:text-emerald-400 transition-colors">
                                        hello@mentha.ai
                                    </a>
                                </p>
                            </section>

                            <section className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm dark:shadow-none">
                                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                                    {t.contactSocial || "Redes Sociales"}
                                </h2>
                                <div className="flex flex-wrap gap-4">
                                    <a href="https://twitter.com/mentha" className="text-emerald-500 hover:text-emerald-400 transition-colors" target="_blank" rel="noopener noreferrer">
                                        Twitter / X
                                    </a>
                                    <a href="https://linkedin.com/company/mentha" className="text-emerald-500 hover:text-emerald-400 transition-colors" target="_blank" rel="noopener noreferrer">
                                        LinkedIn
                                    </a>
                                </div>
                            </section>

                            <section className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm dark:shadow-none">
                                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                                    {t.contactSupport || "Soporte"}
                                </h2>
                                <p className="text-gray-600 dark:text-gray-300">
                                    {t.contactSupportText || "Para soporte técnico o consultas sobre tu cuenta, envía un email a "}
                                    <a href="mailto:support@mentha.ai" className="text-emerald-500 hover:text-emerald-400 transition-colors">
                                        support@mentha.ai
                                    </a>
                                </p>
                            </section>
                        </div>
                    </div>
                </div>
            </main>
            <FooterSection />
        </div>
    )
}
