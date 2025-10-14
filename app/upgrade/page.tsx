import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AppSidebar } from '@/components/app-sidebar'
import Link from 'next/link'

export default function UpgradePage() {
  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      <AppSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto md:ml-64">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Buscar..." className="pl-10 pr-20 bg-gray-50 border-gray-200" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-xs bg-white border border-gray-200 rounded">⌘</kbd>
                <kbd className="px-1.5 py-0.5 text-xs bg-white border border-gray-200 rounded">K</kbd>
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
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Actualizar a Pro</h1>
          <p className="text-gray-600 mb-8">En la versión Pro obtendrás más consultas, prioridad en soporte y funciones avanzadas.</p>

          <Card className="p-6 bg-white max-w-3xl">
            <h2 className="text-xl font-semibold mb-3">¿Qué incluye Pro?</h2>
            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
              <li>Más consultas mensuales</li>
              <li>Acceso a análisis avanzados</li>
              <li>Soporte prioritario</li>
              <li>Integraciones y exportaciones</li>
            </ul>

            <div className="mt-6 flex items-center gap-3">
              <a className="inline-block bg-black text-white px-4 py-2 rounded-md text-sm" href="#start-upgrade">
                Empezar actualización
              </a>
              <Link href="/dashboard" className="text-sm text-gray-600 hover:underline">
                Volver al panel
              </Link>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
