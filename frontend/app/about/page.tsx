'use client'

import React from 'react'
import { useTranslations } from '@/lib/i18n'
import { Navbar as Header } from "@/components/landing";
import FooterSection from "@/components/landing/footer-section";

export default function AboutPage() {
    const { t } = useTranslations()

    return (
        <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white selection:bg-emerald-500/30 transition-colors">
            <Header />
            <main className="pt-32 pb-24">
                <div className="container mx-auto px-4 max-w-4xl">
                    <h1 className="text-4xl md:text-5xl font-bold mb-8 text-gray-900 dark:text-white">
                        {t.footerAbout || "Sobre nosotros"}
                    </h1>

                    <div className="prose prose-gray dark:prose-invert max-w-none">
                        <div className="space-y-8">
                            <section className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm dark:shadow-none">
                                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                                    {t.aboutMission || "Nuestra Misión"}
                                </h2>
                                <p className="text-gray-600 dark:text-gray-300">
                                    {t.aboutMissionText || "En Mentha, creemos que el SEO tradicional está evolucionando. Nuestra misión es ayudar a las marcas a optimizar su visibilidad en los motores de IA generativa como ChatGPT, Claude, Gemini y Perplexity."}
                                </p>
                            </section>

                            <section className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm dark:shadow-none">
                                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                                    {t.aboutVision || "Nuestra Visión"}
                                </h2>
                                <p className="text-gray-600 dark:text-gray-300">
                                    {t.aboutVisionText || "Ser la plataforma líder en Answer Engine Optimization (AEO), permitiendo a las empresas dominar la nueva era de la búsqueda impulsada por inteligencia artificial."}
                                </p>
                            </section>

                            <section className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm dark:shadow-none">
                                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                                    {t.aboutTeam || "Nuestro Equipo"}
                                </h2>
                                <p className="text-gray-600 dark:text-gray-300">
                                    {t.aboutTeamText || "Somos un equipo apasionado de expertos en SEO, IA y desarrollo de productos que trabajan para redefinir cómo las marcas se posicionan en el ecosistema de IA."}
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
