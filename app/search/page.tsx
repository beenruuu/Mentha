import { Search, Clock, TrendingUp, FileText } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AppSidebar } from "@/components/app-sidebar"
import Link from "next/link"

export default function SearchPage() {
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
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white mb-2">Buscar</h1>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
            <Card className="p-4 md:p-6 bg-white dark:bg-black">
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

            <Card className="p-4 md:p-6 bg-white dark:bg-black">
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

          <Card className="p-4 md:p-6 bg-white dark:bg-black">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">Accesos Rápidos</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
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




