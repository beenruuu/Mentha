import { Search, Bell, Settings, ChevronRight, Command, Clock, TrendingUp, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

export default function SearchPage() {
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
            <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-900 bg-gray-100 rounded-lg mb-1">
              <Search className="w-4 h-4" />
              <span className="text-sm font-medium">Buscar</span>
            </button>
          </Link>
          <Link href="/notifications">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg mb-1">
              <Bell className="w-4 h-4" />
              <span className="text-sm">Notificaciones</span>
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
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Buscar</h1>
          <p className="text-gray-600 mb-8">Encuentra marcas, consultas e insights en tu panel.</p>

          <div className="max-w-2xl mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Buscar marcas, consultas, modelos..."
                className="pl-12 pr-4 py-6 text-base bg-white border-gray-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="p-6 bg-white">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Búsquedas Recientes</h2>
              </div>
              <div className="space-y-3">
                {[
                  { text: "Airbnb rendimiento", time: "Hace 2 horas" },
                  { text: "Comparación Strava vs competidores", time: "Hace 5 horas" },
                  { text: "Vercel ranking en GPT-5", time: "Ayer" },
                  { text: "Revolut menciones fintech", time: "Hace 2 días" },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Search className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{item.text}</span>
                    </div>
                    <span className="text-xs text-gray-500">{item.time}</span>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-white">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-5 h-5 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Búsquedas Populares</h2>
              </div>
              <div className="space-y-3">
                {[
                  { text: "Mejores marcas en IA", count: "234 búsquedas" },
                  { text: "Ranking de modelos", count: "189 búsquedas" },
                  { text: "Comparación de competidores", count: "156 búsquedas" },
                  { text: "Tendencias de menciones", count: "142 búsquedas" },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-700">{item.text}</span>
                    </div>
                    <span className="text-xs text-gray-500">{item.count}</span>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <Card className="p-6 bg-white">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Accesos Rápidos</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: "Airbnb", icon: "A", iconBg: "bg-[#FF5A5F]", queries: "12 consultas" },
                { name: "Strava", icon: "S", iconBg: "bg-[#FC4C02]", queries: "8 consultas" },
                { name: "Vercel", icon: "▲", iconBg: "bg-black", queries: "15 consultas" },
                { name: "Revolut", icon: "R", iconBg: "bg-white border border-gray-300", queries: "6 consultas" },
              ].map((brand) => (
                <Link key={brand.name} href={`/brand/${brand.name.toLowerCase()}`}>
                  <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-8 h-8 ${brand.iconBg} rounded-full flex items-center justify-center`}>
                        <span
                          className={`text-sm font-bold ${brand.iconBg.includes("border") ? "text-black" : "text-white"}`}
                        >
                          {brand.icon}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{brand.name}</span>
                    </div>
                    <p className="text-xs text-gray-500">{brand.queries}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
