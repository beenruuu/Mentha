'use client'

import { Search, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { UserAvatarMenu } from '@/components/user-avatar-menu'
import Link from 'next/link'

export default function UpgradePage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-emerald-600" />
            <h1 className="text-xl font-semibold">Actualizar Plan</h1>
          </div>
          <div className="flex-1" />
          <UserAvatarMenu />
        </header>

        <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
          {/* Hero */}
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 items-center mb-8">
            <div className="lg:col-span-2">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">Actualiza a Pro y desbloquea insights</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">Más consultas, análisis avanzados, prioridades de soporte y exportes. Todo pensado para escalar tu investigación de marca.</p>

              <div className="flex items-center gap-3">
                <a href="#start-upgrade" className="inline-block bg-black dark:bg-white text-white dark:text-black px-5 py-3 rounded-md text-sm hover:bg-gray-800 dark:hover:bg-gray-200">Empezar actualización</a>
                <Link href="/dashboard" className="text-sm text-gray-600 dark:text-gray-300 hover:underline">Volver al panel</Link>
              </div>
            </div>

            <div className="lg:col-span-1">
              <Card className="p-6 bg-white dark:bg-black">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Tu plan</h3>
                <div className="text-4xl font-bold text-gray-900 dark:text-white">Gratis</div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Prueba básica — limitado a 100 consultas/mes</p>
                <div className="mt-4">
                  <a href="#start-upgrade" className="block w-full text-center bg-black dark:bg-black text-white dark:text-white px-3 py-2 rounded-md hover:bg-[#1E1E24]">Actualizar</a>
                </div>
              </Card>
            </div>
          </div>

          {/* Features + Pricing */}
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 bg-white dark:bg-black">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide mb-2">Por qué Pro</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">Accede a mayor cuota de consultas, historial extendido y análisis por modelo.</p>
            </Card>

            <Card className="p-6 bg-white dark:bg-black">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide mb-2">Soporte</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">Canal dedicado y tiempos de respuesta prioritarios para incidencias y configuraciones.</p>
            </Card>

            <Card className="p-6 bg-white dark:bg-black">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide mb-2">Exportes</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">Exporta reportes en CSV/PDF y conecta con tus pipelines de datos.</p>
            </Card>
          </div>

          {/* Pricing Tiers */}
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 bg-white dark:bg-black">
              <h5 className="text-lg font-semibold text-gray-900 dark:text-white">Pro Básico</h5>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">$29<span className="text-sm font-medium">/mes</span></div>
              <ul className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>1,000 consultas/mes</li>
                <li>Análisis por modelo</li>
                <li>Soporte por email</li>
              </ul>
              <div className="mt-6">
                <a className="inline-block w-full text-center bg-black dark:bg-black text-white dark:text-white px-4 py-2 rounded-md hover:bg-[#1E1E24]">Seleccionar</a>
              </div>
            </Card>

            <Card className="p-6 bg-white dark:bg-black border-2 border-black dark:border-[#2A2A30]">
              <h5 className="text-lg font-semibold text-gray-900 dark:text-white">Pro Plus</h5>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">$79<span className="text-sm font-medium">/mes</span></div>
              <ul className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>5,000 consultas/mes</li>
                <li>Historial extendido 12 meses</li>
                <li>Soporte prioritario</li>
              </ul>
              <div className="mt-6">
                <a className="inline-block w-full text-center bg-black dark:bg-black text-white dark:text-white px-4 py-2 rounded-md hover:bg-[#1E1E24]">Seleccionar</a>
              </div>
            </Card>

            <Card className="p-6 bg-white dark:bg-black">
              <h5 className="text-lg font-semibold text-gray-900 dark:text-white">Enterprise</h5>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">Contacto<span className="text-sm font-medium">/mes</span></div>
              <ul className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>Consultas ilimitadas</li>
                <li>SLA y soporte dedicado</li>
                <li>Integración personalizada</li>
              </ul>
              <div className="mt-6">
                <a className="inline-block w-full text-center bg-black dark:bg-black text-white dark:text-white px-4 py-2 rounded-md hover:bg-[#1E1E24]">Contactar</a>
              </div>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}




