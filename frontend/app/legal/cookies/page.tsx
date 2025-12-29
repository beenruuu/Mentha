'use client'

import React from 'react'
import { Navbar as Header } from "@/components/landing";
import FooterSection from "@/components/landing/footer-section";

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white selection:bg-emerald-500/30 transition-colors">
      <Header />
      <main className="pt-32 pb-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">Política de Cookies</h1>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Última actualización: {new Date().toLocaleDateString()}</p>
            
            <div className="space-y-8">
              <section className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm dark:shadow-none">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">1. ¿Qué son las Cookies?</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Las cookies son pequeños archivos de texto que los sitios web guardan en su ordenador o dispositivo móvil cuando los visita. 
                  Permiten que el sitio recuerde sus acciones y preferencias durante un período de tiempo.
                </p>
              </section>

              <section className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm dark:shadow-none">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">2. Cómo Usamos las Cookies</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Utilizamos cookies para:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                  <li>Mantener su sesión iniciada de forma segura.</li>
                  <li>Recordar sus preferencias de configuración (como idioma o tema).</li>
                  <li>Analizar cómo utiliza nuestro sitio para mejorar el rendimiento.</li>
                </ul>
              </section>

              <section className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm dark:shadow-none">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">3. Tipos de Cookies que Usamos</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-gray-100 dark:bg-zinc-800">
                      <tr>
                        <th className="p-3 rounded-tl-lg text-gray-900 dark:text-white">Tipo</th>
                        <th className="p-3 rounded-tr-lg text-gray-900 dark:text-white">Propósito</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-600 dark:text-gray-300">
                      <tr className="border-b border-gray-200 dark:border-white/10">
                        <td className="p-3 font-medium">Esenciales</td>
                        <td className="p-3">Necesarias para el funcionamiento básico del sitio (autenticación, seguridad). No se pueden desactivar.</td>
                      </tr>
                      <tr className="border-b border-gray-200 dark:border-white/10">
                        <td className="p-3 font-medium">Analíticas</td>
                        <td className="p-3">Nos ayudan a entender cómo los visitantes interactúan con el sitio (ej. Google Analytics).</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium">Funcionales</td>
                        <td className="p-3">Permiten recordar sus preferencias para mejorar su experiencia.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm dark:shadow-none">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">4. Gestión de Cookies</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Puede controlar y/o eliminar las cookies según desee. Puede eliminar todas las cookies que ya están en su ordenador 
                  y puede configurar la mayoría de los navegadores para que impidan su instalación. Sin embargo, si lo hace, es posible 
                  que tenga que ajustar manualmente algunas preferencias cada vez que visite un sitio y que algunos servicios y 
                  funcionalidades no funcionen.
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
