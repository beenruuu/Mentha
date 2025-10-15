import { Search, TrendingUp, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { AppSidebar } from "@/components/app-sidebar"

export default function NotificationsPage() {
  return (
    <div className="flex min-h-screen bg-[#f5f5f5] dark:bg-[#0A0A0F]">
      <AppSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto md:ml-64">
        <header className="bg-white dark:bg-black border-b border-gray-200 dark:border-[#2A2A30] px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <Input placeholder="Buscar..." className="pl-10 pr-20 bg-gray-50 dark:bg-[#0A0A0F] border-gray-200 dark:border-[#2A2A30]" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-xs bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A30] rounded">⌘</kbd>
                <kbd className="px-1.5 py-0.5 text-xs bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A30] rounded">K</kbd>
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white mb-2">Notificaciones</h1>
              <p className="text-gray-600 dark:text-gray-400">Mantente al día con los cambios en tus marcas.</p>
            </div>
            <Button variant="outline" className="text-sm bg-transparent dark:bg-transparent dark:text-white dark:border-[#2A2A30]">
              Marcar todas como leídas
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 max-w-4xl">
            {/* Today */}
            <div className="mb-4">
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Hoy</h2>
              <div className="space-y-3">
                <Card className="p-4 bg-white dark:bg-black hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-green-500">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Mejora en el ranking de Airbnb</h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Hace 2h</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
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

                <Card className="p-4 bg-white dark:bg-black hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Nueva mención detectada</h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Hace 4h</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
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
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Ayer</h2>
              <div className="space-y-3">
                <Card className="p-4 bg-white dark:bg-black hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Cambio en la competencia</h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Hace 1d</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
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

                <Card className="p-4 bg-white dark:bg-black hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Strava alcanza nuevo récord</h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Hace 1d</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
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
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Esta Semana</h2>
              <div className="space-y-3">
                <Card className="p-4 bg-white dark:bg-black hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Informe semanal disponible</h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Hace 3d</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
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




