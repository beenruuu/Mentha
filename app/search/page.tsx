import { Search, Clock, TrendingUp, FileText } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AppSidebar } from "@/components/app-sidebar"
import { MenuButton } from "@/components/menu-button"
import Link from "next/link"

export default function SearchPage() {
  return (
    <div className="flex min-h-screen bg-[#f5f5f5] dark:bg-[#0A0A0A]">
      <AppSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto md:ml-64">
        <header className="bg-white dark:bg-black border-b border-gray-200 dark:border-[#2A2A30] px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <MenuButton />
          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <Input placeholder="Buscar..." className="pl-10 pr-20 bg-white dark:bg-[#0A0A0A] border-gray-200 dark:border-[#2A2A30]" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-xs bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A30] rounded">⌘</kbd>
                <kbd className="px-1.5 py-0.5 text-xs bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A30] rounded">Y</kbd>
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
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">Buscar</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Encuentra marcas, consultas e insights en tu panel.</p>

          <div className="max-w-2xl mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Buscar marcas, consultas, modelos..."
                className="pl-12 pr-4 py-6 text-base bg-white dark:bg-black border-gray-300 dark:border-[#2A2A30]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="p-6 bg-white dark:bg-black">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">Búsquedas Recientes</h2>
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
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-[#1E1E24] rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Search className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{item.text}</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{item.time}</span>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-white dark:bg-black">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">Búsquedas Populares</h2>
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
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-[#1E1E24] rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{item.text}</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{item.count}</span>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <Card className="p-6 bg-white dark:bg-black">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">Accesos Rápidos</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: "Airbnb", icon: "A", iconBg: "bg-[#FF5A5F]", queries: "12 consultas" },
                { name: "Strava", icon: "S", iconBg: "bg-[#FC4C02]", queries: "8 consultas" },
                { name: "Vercel", icon: "▲", iconBg: "bg-black", queries: "15 consultas" },
                { name: "Revolut", icon: "R", iconBg: "bg-white border border-gray-300", queries: "6 consultas" },
              ].map((brand) => (
                <Link key={brand.name} href={`/brand/${brand.name.toLowerCase()}`}>
                  <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-black">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-8 h-8 ${brand.iconBg} rounded-full flex items-center justify-center`}>
                        <span
                          className={`text-sm font-bold ${brand.iconBg.includes("border") ? "text-black dark:text-white" : "text-white"}`}
                        >
                          {brand.icon}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{brand.name}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{brand.queries}</p>
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





