import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AppSidebar } from '@/components/app-sidebar'
import Link from 'next/link'

export default function UpgradePage() {
  return (
    <div className="flex min-h-screen bg-[#f5f5f5] dark:bg-[#0A0A0F]">
      <AppSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto md:ml-64">
        <header className="bg-white dark:bg-black border-b border-gray-200 dark:border-[#2A2A30] px-8 py-4 flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <Input placeholder="Buscar..." className="pl-10 pr-20 bg-gray-50 dark:bg-[#0A0A0F] border-gray-200 dark:border-[#2A2A30]" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-xs bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A30] rounded">⌘</kbd>
                <kbd className="px-1.5 py-0.5 text-xs bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A30] rounded">K</kbd>
              </div>
            </div>
          </div>
          <Avatar className="w-10 h-10">
            <AvatarImage src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-VUcSRydRPw7ZxpM77k5JPTb70b6iXC.png" />
            <AvatarFallback>U</AvatarFallback>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          </Avatar>
        </header>

        <div className="p-8">
          {/* Hero */}
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 items-center mb-8">
            <div className="lg:col-span-2">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">Actualiza a Pro y desbloquea insights</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">Más consultas, análisis avanzados, prioridades de soporte y exportes. Todo pensado para escalar tu investigación de marca.</p>

              <div className="flex items-center gap-3">
                <a href="#start-upgrade" className="inline-block bg-black dark:bg-black text-white dark:text-white px-5 py-3 rounded-md text-sm hover:bg-[#1E1E24]">Empezar actualización</a>
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
      </main>
    </div>
  )
}



