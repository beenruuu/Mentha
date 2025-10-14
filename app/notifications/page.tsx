import { Search, Bell, Settings, ChevronRight, Command, TrendingUp, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function NotificationsPage() {
  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4">
          <Link href="/">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center cursor-pointer">
              <Command className="w-5 h-5 text-white" />
            </div>
          </Link>
        </div>

        <div className="px-4 mb-6">
          <Button className="w-full bg-black hover:bg-gray-800 text-white rounded-lg">+ Crear marca</Button>
        </div>

        <nav className="flex-1 px-3">
          <Link href="/search">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg mb-1">
              <Search className="w-4 h-4" />
              <span className="text-sm">Buscar</span>
            </button>
          </Link>
          <Link href="/notifications">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-900 bg-gray-100 rounded-lg mb-1">
              <Bell className="w-4 h-4" />
              <span className="text-sm font-medium">Notificaciones</span>
            </button>
          </Link>
          <Link href="/">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg mb-1 justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 flex items-center justify-center">
                  <div className="w-3 h-3 border-2 border-gray-600 rounded"></div>
                </div>
                <span className="text-sm">Panel</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
          <Link href="/settings">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg mb-6">
              <Settings className="w-4 h-4" />
              <span className="text-sm">Configuración</span>
            </button>
          </Link>

          <div className="mb-3">
            <div className="flex items-center gap-2 px-3 mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase">Marcas</span>
              <ChevronRight className="w-3 h-3 text-gray-400 rotate-90" />
            </div>
            <div className="space-y-1">
              <Link href="/brand/airbnb">
                <button className="w-full flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-[#FF5A5F] rounded-full flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold">A</span>
                    </div>
                    <span className="text-sm">Airbnb</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </Link>
              <Link href="/brand/strava">
                <button className="w-full flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-[#FC4C02] rounded-full flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold">S</span>
                    </div>
                    <span className="text-sm">Strava</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </Link>
              <Link href="/brand/vercel">
                <button className="w-full flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-black rounded-full flex items-center justify-center">
                      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="white">
                        <path d="M12 2L2 19.5h20L12 2z" />
                      </svg>
                    </div>
                    <span className="text-sm">Vercel</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </Link>
              <Link href="/brand/revolut">
                <button className="w-full flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-white border border-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-[10px] text-black font-bold">R</span>
                    </div>
                    <span className="text-sm">Revolut</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </Link>
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-900 mb-1">Casi alcanzas tu límite</p>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-yellow-500 rounded-full"
                style={{ width: "25%" }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">2,564 / 10,000 tokens usados</p>
          </div>
          <Button variant="outline" className="w-full text-sm bg-transparent">
            Actualizar a Pro →
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
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
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">Notificaciones</h1>
              <p className="text-gray-600">Mantente al día con los cambios en tus marcas.</p>
            </div>
            <Button variant="outline" className="text-sm bg-transparent">
              Marcar todas como leídas
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 max-w-4xl">
            {/* Today */}
            <div className="mb-4">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Hoy</h2>
              <div className="space-y-3">
                <Card className="p-4 bg-white hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-green-500">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="text-sm font-semibold text-gray-900">Mejora en el ranking de Airbnb</h3>
                        <span className="text-xs text-gray-500">Hace 2h</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Airbnb subió 3 posiciones en GPT-5 para consultas de "recomendaciones de viaje".
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-[#FF5A5F]/10 text-[#FF5A5F] hover:bg-[#FF5A5F]/10">
                          Airbnb
                        </Badge>
                        <Badge variant="secondary" className="bg-gray-100 hover:bg-gray-100">
                          GPT-5
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 bg-white hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="text-sm font-semibold text-gray-900">Nueva mención detectada</h3>
                        <span className="text-xs text-gray-500">Hace 4h</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Vercel fue mencionado en Claude-4-sonnet para "herramientas de desarrollo web".
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-black/10 hover:bg-black/10">
                          Vercel
                        </Badge>
                        <Badge variant="secondary" className="bg-orange-100 hover:bg-orange-100">
                          Claude-4-sonnet
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Yesterday */}
            <div className="mb-4">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Ayer</h2>
              <div className="space-y-3">
                <Card className="p-4 bg-white hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="text-sm font-semibold text-gray-900">Cambio en la competencia</h3>
                        <span className="text-xs text-gray-500">Hace 1d</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Booking.com superó a Expedia en el ranking de "sitios de reserva de hoteles".
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-blue-100 hover:bg-blue-100">
                          Booking.com
                        </Badge>
                        <Badge variant="secondary" className="bg-gray-100 hover:bg-gray-100">
                          Competencia
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 bg-white hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="text-sm font-semibold text-gray-900">Strava alcanza nuevo récord</h3>
                        <span className="text-xs text-gray-500">Hace 1d</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Strava alcanzó la posición #1 en Grok-3 para "aplicaciones de fitness".
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-[#FC4C02]/10 text-[#FC4C02] hover:bg-[#FC4C02]/10">
                          Strava
                        </Badge>
                        <Badge variant="secondary" className="bg-gray-100 hover:bg-gray-100">
                          Grok-3
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* This Week */}
            <div>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Esta Semana</h2>
              <div className="space-y-3">
                <Card className="p-4 bg-white hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="text-sm font-semibold text-gray-900">Informe semanal disponible</h3>
                        <span className="text-xs text-gray-500">Hace 3d</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Tu informe semanal de rendimiento está listo para revisar.
                      </p>
                      <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                        Ver informe
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
