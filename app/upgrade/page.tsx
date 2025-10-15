import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AppSidebar } from '@/components/app-sidebar'
import Link from 'next/link'

export default function UpgradePage() {
  return (
    <div className="flex min-h-screen bg-[#f5f5f5] dark:bg-[#0A0A0A]">
      <AppSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto md:ml-64">
        <header className="bg-white dark:bg-[#000000] border-b border-gray-200 dark:border-[#2A2A30] px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <Input placeholder="Buscar..." className="pl-10 pr-20 bg-gray-50 dark:bg-[#0A0A0A] border-gray-200 dark:border-[#2A2A30]" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-xs bg-white dark:bg-[#000000] border border-gray-200 dark:border-[#2A2A30] rounded">⌘</kbd>
                <kbd className="px-1.5 py-0.5 text-xs bg-white dark:bg-[#000000] border border-gray-200 dark:border-[#2A2A30] rounded">K</kbd>
              </div>
            </div>
          </div>
          <div className="sm:hidden absolute left-1/2 -translate-x-1/2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" className="w-6 h-6 text-black dark:text-white" aria-hidden="true">
              <path d="M19.7,26.3l3.2-4.2c1.7-2.6,3.5-5.4,3.9-8.5l-1.8,3.4c-1.3,1.8-2.6,3.8-4.1,5.4s-2.3,2.3-2.7,2.4-.2,0-.2-.2c-1-3.3-1.1-7.5.3-10.7s6.4-8,9.5-10.6,2.5-2.1,2.7-2c2.5,4.1,4.3,9.4,3.1,14.3-1.5,6.1-7.9,10.2-13.9,10.7Z" fill="currentColor"/>
              <path d="M33.7,20.5v15.1c0,1-1.6,2.5-2.6,2.7-2.4.4-4.2-1-4.4-3.4s-.2-6.1,0-8,0-.4.2-.6,1.7-.9,2.1-1.2c1.8-1.2,3.3-2.7,4.7-4.5Z" fill="currentColor"/>
              <path d="M16.3,25.4c-.1.1-.9-.6-1.1-.7-1.6-1.5-3.1-3.8-4-5.8-.3,0-.1.3,0,.4.6,2.5,2.6,4.8,4.1,6.9-3.5-.3-7.2-2.6-8.2-6.2s.4-5.7,1.7-8.4c.1,0,1.4,1,1.6,1.1,1.9,1.6,5,4.4,5.8,6.7s.4,4,0,6Z" fill="currentColor"/>
              <path d="M7.3,24.4c1.9,2,4.3,3.2,7,3.9-.3,2.2.5,6.1-.4,8.1s-3.4,2.6-5.1,1.5-1.5-1.6-1.5-2.2v-11.2Z" fill="currentColor"/>
              <path d="M23.9,27.5v8.1c0,.4-.8,1.6-1.1,1.9-1.6,1.4-4.4,1.1-5.4-.9s-.5-1.4-.5-1.6v-6.7c2.4,0,4.7-.1,7-.8Z" fill="currentColor"/>
            </svg>
          </div>
          <Avatar className="w-10 h-10 ml-auto">
            <AvatarImage src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-VUcSRydRPw7ZxpM77k5JPTb70b6iXC.png" />
            <AvatarFallback>U</AvatarFallback>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          </Avatar>
        </header>

        <div className="p-4 md:p-8">
          {/* Hero */}
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 items-center mb-6 md:mb-8">
            <div className="lg:col-span-2">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3">Actualiza a Pro y desbloquea insights</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">Más consultas, análisis avanzados, prioridades de soporte y exportes. Todo pensado para escalar tu investigación de marca.</p>

              <div className="flex items-center gap-3">
                <a href="#start-upgrade" className="inline-block bg-black dark:bg-[#0A0A0A] text-white dark:text-white px-5 py-3 rounded-md text-sm hover:bg-[#1E1E24]">Empezar actualización</a>
                <Link href="/dashboard" className="text-sm text-gray-600 dark:text-gray-300 hover:underline">Volver al panel</Link>
              </div>
            </div>

            <div className="lg:col-span-1">
              <Card className="p-6 bg-white dark:bg-[#000000]">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Tu plan</h3>
                <div className="text-4xl font-bold text-gray-900 dark:text-white">Gratis</div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Prueba básica — limitado a 100 consultas/mes</p>
                <div className="mt-4">
                  <a href="#start-upgrade" className="block w-full text-center bg-black dark:bg-[#0A0A0A] text-white dark:text-white px-3 py-2 rounded-md hover:bg-[#1E1E24]">Actualizar</a>
                </div>
              </Card>
            </div>
          </div>

          {/* Features + Pricing */}
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 bg-white dark:bg-[#000000]">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide mb-2">Por qué Pro</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">Accede a mayor cuota de consultas, historial extendido y análisis por modelo.</p>
            </Card>

            <Card className="p-6 bg-white dark:bg-[#000000]">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide mb-2">Soporte</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">Canal dedicado y tiempos de respuesta prioritarios para incidencias y configuraciones.</p>
            </Card>

            <Card className="p-6 bg-white dark:bg-[#000000]">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide mb-2">Exportes</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">Exporta reportes en CSV/PDF y conecta con tus pipelines de datos.</p>
            </Card>
          </div>

          {/* Pricing Tiers */}
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 bg-white dark:bg-[#000000]">
              <h5 className="text-lg font-semibold text-gray-900 dark:text-white">Pro Básico</h5>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">$29<span className="text-sm font-medium">/mes</span></div>
              <ul className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>1,000 consultas/mes</li>
                <li>Análisis por modelo</li>
                <li>Soporte por email</li>
              </ul>
              <div className="mt-6">
                <a className="inline-block w-full text-center bg-black dark:bg-[#0A0A0A] text-white dark:text-white px-4 py-2 rounded-md hover:bg-[#1E1E24]">Seleccionar</a>
              </div>
            </Card>

            <Card className="p-6 bg-white dark:bg-[#000000] border-2 border-black dark:border-[#2A2A30]">
              <h5 className="text-lg font-semibold text-gray-900 dark:text-white">Pro Plus</h5>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">$79<span className="text-sm font-medium">/mes</span></div>
              <ul className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>5,000 consultas/mes</li>
                <li>Historial extendido 12 meses</li>
                <li>Soporte prioritario</li>
              </ul>
              <div className="mt-6">
                <a className="inline-block w-full text-center bg-black dark:bg-[#0A0A0A] text-white dark:text-white px-4 py-2 rounded-md hover:bg-[#1E1E24]">Seleccionar</a>
              </div>
            </Card>

            <Card className="p-6 bg-white dark:bg-[#000000]">
              <h5 className="text-lg font-semibold text-gray-900 dark:text-white">Enterprise</h5>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">Contacto<span className="text-sm font-medium">/mes</span></div>
              <ul className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>Consultas ilimitadas</li>
                <li>SLA y soporte dedicado</li>
                <li>Integración personalizada</li>
              </ul>
              <div className="mt-6">
                <a className="inline-block w-full text-center bg-black dark:bg-[#0A0A0A] text-white dark:text-white px-4 py-2 rounded-md hover:bg-[#1E1E24]">Contactar</a>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}






