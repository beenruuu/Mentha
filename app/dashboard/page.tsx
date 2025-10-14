import { Search, Info, ArrowUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AppSidebar } from "@/components/app-sidebar"

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      <AppSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto md:ml-64">
        {/* Header */}
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

        {/* Content */}
        <div className="p-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-8">Movimientos de ranking esta semana.</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Brand Overview */}
            <Card className="p-6 bg-white">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Resumen de Marca</h2>
                <Info className="w-4 h-4 text-gray-400" />
              </div>
              <div className="space-y-4">
                {[
                  { name: "Vercel", icon: "▲", iconBg: "bg-black", score: 75, change: 3.0 },
                  { name: "Strava", icon: "S", iconBg: "bg-[#FC4C02]", score: 72, change: 0.4 },
                  { name: "Airbnb", icon: "A", iconBg: "bg-[#FF5A5F]", score: 71, change: 6.6 },
                  { name: "Revolut", icon: "R", iconBg: "bg-white border border-gray-300", score: 69, change: 4.6 },
                ].map((brand) => (
                  <div key={brand.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 ${brand.iconBg} rounded-full flex items-center justify-center`}>
                        <span
                          className={`text-xs font-bold ${brand.iconBg === "bg-white border border-gray-300" ? "text-black" : "text-white"}`}
                        >
                          {brand.icon}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{brand.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center relative">
                        <span className="text-xs font-semibold text-gray-900">{brand.score}</span>
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                          <circle
                            cx="20"
                            cy="20"
                            r="18"
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="2"
                            strokeDasharray={`${(brand.score / 100) * 113} 113`}
                          />
                        </svg>
                      </div>
                      <div className="flex items-center gap-1 text-green-600">
                        <ArrowUp className="w-3 h-3" />
                        <span className="text-sm font-semibold">{brand.change}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Competitor Overview */}
            <Card className="p-6 bg-white">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Resumen de Competidores</h2>
                <div className="flex items-center gap-2">
                  {[
                    { name: "Airbnb", color: "bg-[#FF5A5F]" },
                    { name: "Strava", color: "bg-[#FC4C02]" },
                    { name: "Vercel", color: "bg-black" },
                    { name: "Revolut", color: "bg-white border border-gray-300" },
                  ].map((brand) => (
                    <div key={brand.name} className="flex items-center gap-1.5">
                      <div className={`w-4 h-4 ${brand.color} rounded-full`}></div>
                      <span className="text-xs text-gray-600">{brand.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-5">
                {[
                  { name: "Airbnb", icon: "A", iconBg: "bg-[#FF5A5F]", percentage: 71, position: 1.8 },
                  { name: "Booking.com", icon: "B", iconBg: "bg-[#003580]", percentage: 57, position: 2.4 },
                  { name: "Expedia", icon: "E", iconBg: "bg-[#FFCB05]", percentage: 54, position: 3.4 },
                  { name: "Trivago", icon: "T", iconBg: "bg-[#007FAD]", percentage: 51, position: 4.4 },
                ].map((competitor) => (
                  <div key={competitor.name}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 ${competitor.iconBg} rounded flex items-center justify-center`}>
                          <span className="text-[10px] font-bold text-white">{competitor.icon}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{competitor.name}</span>
                        <span className="text-sm text-gray-600">{competitor.percentage}%</span>
                      </div>
                      <span className="text-xs text-gray-500">POSICIÓN PROM. {competitor.position}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${competitor.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Mentha quick view removed to avoid duplication */}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Notable Changes */}
            <Card className="lg:col-span-2 p-6 bg-white">
              <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Cambios Notables</h2>
              <div className="space-y-3">
                {[
                  {
                    text: "Ranking mejorado para",
                    brand: "Strava",
                    brandIcon: "S",
                    brandBg: "bg-[#FC4C02]",
                    context: "en",
                    model: "Claude-4-sonnet",
                    modelIcon: "✨",
                    modelBg: "bg-orange-100",
                    query: "consultas de fitness",
                  },
                  {
                    text: "Nueva mención detectada para",
                    brand: "Airbnb",
                    brandIcon: "A",
                    brandBg: "bg-[#FF5A5F]",
                    context: "en",
                    model: "GPT-5",
                    modelIcon: "⚫",
                    modelBg: "bg-gray-100",
                    query: "recomendaciones de viaje",
                  },
                  {
                    text: "Mejora de rendimiento para",
                    brand: "Vercel",
                    brandIcon: "▲",
                    brandBg: "bg-black",
                    context: "en",
                    model: "Grok-3",
                    modelIcon: "⚡",
                    modelBg: "bg-gray-100",
                    query: "consultas de herramientas de desarrollo",
                  },
                  {
                    text: "Revolut",
                    brand: "Revolut",
                    brandIcon: "R",
                    brandBg: "bg-white border border-gray-300",
                    context: "visibilidad aumentada en",
                    model: "Gemini-2.5-flash",
                    modelIcon: "✦",
                    modelBg: "bg-blue-100",
                    query: "comparaciones fintech",
                  },
                ].map((change, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-700 flex-wrap">
                    <span>{change.text}</span>
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 hover:bg-gray-100"
                    >
                      <div className={`w-3.5 h-3.5 ${change.brandBg} rounded-full flex items-center justify-center`}>
                        <span
                          className={`text-[8px] font-bold ${change.brandBg.includes("bg-white") ? "text-black" : "text-white"}`}
                        >
                          {change.brandIcon}
                        </span>
                      </div>
                      <span className="font-medium">{change.brand}</span>
                    </Badge>
                    <span>{change.context}</span>
                    <Badge
                      variant="secondary"
                      className={`flex items-center gap-1.5 px-2 py-0.5 ${change.modelBg} hover:${change.modelBg}`}
                    >
                      <span>{change.modelIcon}</span>
                      <span className="font-medium">{change.model}</span>
                    </Badge>
                    <span className="text-gray-500">{change.query}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Promotional Card */}
            <Card className="p-6 bg-gradient-to-br from-pink-300 to-pink-400 border-0 relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-gray-900 mb-6 leading-tight">
                  Ser invisible en
                  <br />
                  IA duele más
                  <br />
                  que un error 404
                </h3>
                <Button className="bg-black hover:bg-gray-800 text-white">Rastrea tu marca</Button>
              </div>
              <div className="absolute right-4 bottom-4 w-32 h-32">
                <svg viewBox="0 0 120 120" className="w-full h-full">
                  {/* Person climbing ladder */}
                  <g stroke="black" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    {/* Ladder */}
                    <line x1="70" y1="90" x2="85" y2="40" />
                    <line x1="80" y1="90" x2="95" y2="40" />
                    <line x1="72" y1="80" x2="82" y2="80" />
                    <line x1="74" y1="70" x2="84" y2="70" />
                    <line x1="76" y1="60" x2="86" y2="60" />
                    <line x1="78" y1="50" x2="88" y2="50" />

                    {/* Person */}
                    <circle cx="82" cy="55" r="6" fill="white" />
                    <line x1="82" y1="61" x2="82" y2="75" />
                    <line x1="82" y1="65" x2="75" y2="70" />
                    <line x1="82" y1="65" x2="88" y2="58" />
                    <line x1="82" y1="75" x2="77" y2="85" />
                    <line x1="82" y1="75" x2="87" y2="85" />
                  </g>

                  {/* Star */}
                  <g transform="translate(95, 25)">
                    <path
                      d="M 0,-8 L 2,-2 L 8,-2 L 3,2 L 5,8 L 0,4 L -5,8 L -3,2 L -8,-2 L -2,-2 Z"
                      fill="none"
                      stroke="black"
                      strokeWidth="2"
                    />
                  </g>

                  {/* Sparkles */}
                  <text x="105" y="20" fontSize="12">
                    +
                  </text>
                  <text x="110" y="35" fontSize="10">
                    ✦
                  </text>
                </svg>
              </div>
            </Card>
          </div>

          {/* Data Table */}
          <Card className="p-6 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Marca
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Posición promedio
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Tasa de inclusión
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Mejor modelo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      name: "Airbnb",
                      icon: "A",
                      iconBg: "bg-[#FF5A5F]",
                      position: "1.8",
                      rate: 89,
                      model: "gpt-5",
                      modelIcon: "⚫",
                    },
                    {
                      name: "Strava",
                      icon: "S",
                      iconBg: "bg-[#FC4C02]",
                      position: "1.8",
                      rate: 89,
                      model: "claude-4-sonnet",
                      modelIcon: "✨",
                    },
                    {
                      name: "Vercel",
                      icon: "▲",
                      iconBg: "bg-black",
                      position: "1.8",
                      rate: 89,
                      model: "grok-3",
                      modelIcon: "⚡",
                    },
                  ].map((row) => (
                    <tr key={row.name} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 ${row.iconBg} rounded-full flex items-center justify-center`}>
                            <span className="text-xs font-bold text-white">{row.icon}</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{row.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-700">{row.position}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center relative">
                            <span className="text-xs font-semibold text-gray-900">{row.rate}</span>
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                              <circle
                                cx="20"
                                cy="20"
                                r="18"
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="2"
                                strokeDasharray={`${(row.rate / 100) * 113} 113`}
                              />
                            </svg>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          variant="secondary"
                          className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 hover:bg-gray-100 w-fit"
                        >
                          <span>{row.modelIcon}</span>
                          <span className="font-medium text-sm">{row.model}</span>
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
