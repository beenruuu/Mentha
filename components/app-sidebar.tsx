import { Search, Bell, Settings, ChevronRight, Leaf } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function AppSidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 h-screen">
      {/* Logo */}
      <div className="p-4">
        <Link href="/">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center cursor-pointer">
            <Leaf className="w-5 h-5 text-white" />
          </div>
        </Link>
      </div>

      {/* Create Brand Button */}
      <div className="px-4 mb-6">
        <Button className="w-full bg-black hover:bg-gray-800 text-white rounded-lg">+ Crear marca</Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 overflow-y-auto">
        <Link href="/search">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg mb-1">
            <Search className="w-4 h-4" />
            <span className="text-sm">Buscar</span>
          </button>
        </Link>
        <Link href="/notifications">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg mb-1">
            <Bell className="w-4 h-4" />
            <span className="text-sm">Notificaciones</span>
          </button>
        </Link>
        <Link href="/dashboard">
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

        {/* Brands Section */}
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

      {/* Token Usage */}
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

        <Link href="/upgrade">
          <Button variant="outline" className="w-full text-sm bg-transparent">
            Actualizar a Pro →
          </Button>
        </Link>
      </div>
    </aside>
  )
}
