'use client'

import { Search, TrendingUp, AlertCircle, CheckCircle, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { UserAvatarMenu } from '@/components/user-avatar-menu'

export default function NotificationsPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-emerald-600" />
            <h1 className="text-xl font-semibold">Notificaciones</h1>
          </div>
          <div className="flex-1" />
          <UserAvatarMenu />
        </header>

        <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
          <div className="flex items-center justify-end mb-4">
            <Button variant="outline" size="sm">
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
      </SidebarInset>
    </SidebarProvider>
  )
}





