import { Search, MapPin, Globe, ExternalLink, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { AppSidebar } from "@/components/app-sidebar"
import Link from "next/link"

const brandData: Record<string, any> = {
  airbnb: {
    name: "Airbnb",
    icon: "A",
    iconBg: "bg-[#FF5A5F]",
    description:
      "Plataforma global de alquiler vacacional que conecta viajeros con alojamientos únicos y experiencias locales.",
    location: "San Francisco, EE.UU.",
    website: "https://www.airbnb.com",
    score: 71,
    change: 6.6,
    competitors: [
      { name: "Booking.com", icon: "B", iconBg: "bg-[#003580]", score: 57, change: 3.0 },
      { name: "Expedia", icon: "E", iconBg: "bg-[#FFCB05]", score: 54, change: 3.0 },
      { name: "Trivago", icon: "T", iconBg: "bg-[#007FAD]", score: 51, change: 3.0 },
    ],
    potentialCompetitors: [
      { name: "Hotels.com", icon: "H", iconBg: "bg-[#D32F2F]" },
      { name: "Kayak", icon: "K", iconBg: "bg-[#FF6600]" },
      { name: "Agoda", icon: "A", iconBg: "bg-[#4A90E2]" },
      { name: "TripAdvisor", icon: "T", iconBg: "bg-[#00AF87]" },
    ],
    queries: [
      {
        id: "vacation-rental-booking",
        title:
          "¿Cuáles son los sitios de reserva de alquiler vacacional más confiables con buena verificación de anfitriones?",
      },
    ],
  },
  strava: {
    name: "Strava",
    icon: "S",
    iconBg: "bg-[#FC4C02]",
    description:
      "Red social de fitness para atletas que rastrean, analizan y comparten sus entrenamientos y actividades.",
    location: "San Francisco, EE.UU.",
    website: "https://www.strava.com",
    score: 72,
    change: 0.4,
    competitors: [
      { name: "Nike Run Club", icon: "N", iconBg: "bg-black", score: 65, change: 2.1 },
      { name: "MapMyRun", icon: "M", iconBg: "bg-[#0066CC]", score: 58, change: 1.5 },
      { name: "Garmin Connect", icon: "G", iconBg: "bg-[#007CC3]", score: 55, change: 2.8 },
    ],
    potentialCompetitors: [
      { name: "Runkeeper", icon: "R", iconBg: "bg-[#2DC76D]" },
      { name: "Fitbit", icon: "F", iconBg: "bg-[#00B0B9]" },
      { name: "Peloton", icon: "P", iconBg: "bg-black" },
      { name: "Zwift", icon: "Z", iconBg: "bg-[#FC6719]" },
    ],
    queries: [
      {
        id: "fitness-tracking-apps",
        title: "¿Mejores aplicaciones de seguimiento de fitness para corredores y ciclistas?",
      },
    ],
  },
  vercel: {
    name: "Vercel",
    icon: "▲",
    iconBg: "bg-black",
    description:
      "Plataforma cloud frontend para construir, desplegar y escalar aplicaciones web modernas con rendimiento óptimo.",
    location: "San Francisco, EE.UU.",
    website: "https://www.vercel.com",
    score: 75,
    change: 3.0,
    competitors: [
      { name: "Netlify", icon: "N", iconBg: "bg-[#00C7B7]", score: 68, change: 2.5 },
      { name: "AWS Amplify", icon: "A", iconBg: "bg-[#FF9900]", score: 62, change: 1.8 },
      { name: "Cloudflare Pages", icon: "C", iconBg: "bg-[#F38020]", score: 59, change: 2.2 },
    ],
    potentialCompetitors: [
      { name: "Railway", icon: "R", iconBg: "bg-black" },
      { name: "Render", icon: "R", iconBg: "bg-[#46E3B7]" },
      { name: "Fly.io", icon: "F", iconBg: "bg-[#7B3FF2]" },
      { name: "Heroku", icon: "H", iconBg: "bg-[#430098]" },
    ],
    queries: [
      {
        id: "frontend-deployment-platforms",
        title: "¿Cuáles son las mejores plataformas para desplegar aplicaciones Next.js?",
      },
    ],
  },
  revolut: {
    name: "Revolut",
    icon: "R",
    iconBg: "bg-white border border-gray-300",
    description:
      "Aplicación de banca digital que ofrece cambio de divisas, transferencias de dinero y herramientas de gestión financiera.",
    location: "Londres, Reino Unido",
    website: "https://www.revolut.com",
    score: 69,
    change: 4.6,
    competitors: [
      { name: "N26", icon: "N", iconBg: "bg-[#36A18B]", score: 64, change: 2.3 },
      { name: "Monzo", icon: "M", iconBg: "bg-[#14233C]", score: 61, change: 1.9 },
      { name: "Wise", icon: "W", iconBg: "bg-[#9FE870]", score: 58, change: 3.1 },
    ],
    potentialCompetitors: [
      { name: "Chime", icon: "C", iconBg: "bg-[#00C48C]" },
      { name: "Cash App", icon: "C", iconBg: "bg-[#00D632]" },
      { name: "PayPal", icon: "P", iconBg: "bg-[#003087]" },
      { name: "Venmo", icon: "V", iconBg: "bg-[#3D95CE]" },
    ],
    queries: [
      {
        id: "digital-banking-apps",
        title: "¿Qué aplicaciones de banca digital ofrecen las mejores tarifas de transferencia internacional?",
      },
    ],
  },
}

export default async function BrandDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const brand = brandData[id]

  if (!brand) {
    return <div>Marca no encontrada</div>
  }

  return (
    <div className="flex min-h-screen bg-[#f5f5f5] dark:bg-black">
      <AppSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto md:ml-64">
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
          {/* Brand Header */}
          <Card className="p-4 md:p-6 bg-white dark:bg-black mb-4 md:mb-6">
            <div className="flex flex-col md:flex-row items-start justify-between gap-4">
              <div className="flex items-start gap-3 md:gap-4 w-full">
                <div className={`w-10 h-10 md:w-12 md:h-12 ${brand.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <span
                    className={`text-lg md:text-xl font-bold ${brand.iconBg.includes("border") ? "text-black dark:text-white" : "text-white"}`}
                  >
                    {brand.icon}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white mb-2">{brand.name}</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{brand.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      <span>{brand.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-4 h-4" />
                      <a href={brand.website} className="hover:text-gray-700 dark:hover:text-gray-300">
                        {brand.website}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Notable Changes */}
          <Card className="p-4 md:p-6 bg-white dark:bg-black mb-4 md:mb-6">
            <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">Cambios Notables</h2>
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
                  brand: brand.name,
                  brandIcon: brand.icon,
                  brandBg: brand.iconBg,
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
                  query: "herramientas de desarrollo",
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
                <div key={idx} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 flex-wrap">
                  <span>{change.text}</span>
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 dark:bg-[#0A0A0F] hover:bg-gray-100 dark:hover:bg-[#1E1E24]"
                  >
                    <div className={`w-3.5 h-3.5 ${change.brandBg} rounded-full flex items-center justify-center`}>
                      <span
                        className={`text-[8px] font-bold ${change.brandBg.includes("border") ? "text-black dark:text-white" : "text-white"}`}
                      >
                        {change.brandIcon}
                      </span>
                    </div>
                    <span className="font-medium">{change.brand}</span>
                  </Badge>
                  <span>{change.context}</span>
                  <Badge
                    variant="secondary"
                    className={`flex items-center gap-1.5 px-2 py-0.5 ${change.modelBg} dark:bg-[#1E1E24] dark:border dark:border-[#2A2A30] hover:${change.modelBg} dark:hover:bg-[#2A2A30]`}
                  >
                    <span>{change.modelIcon}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{change.model}</span>
                  </Badge>
                  <span className="text-gray-500 dark:text-gray-400">{change.query}</span>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
            {/* Brand Overview */}
            <Card className="lg:col-span-2 p-4 md:p-6 bg-white dark:bg-black">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Resumen de Marca</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-[#2A2A30]">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 ${brand.iconBg} rounded-full flex items-center justify-center`}>
                      <span
                        className={`text-xs font-bold ${brand.iconBg.includes("border") ? "text-black dark:text-white" : "text-white"}`}
                      >
                        {brand.icon}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{brand.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center relative">
                      <span className="text-xs font-semibold text-gray-900 dark:text-white z-10">{brand.score}</span>
                      <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle
                          cx="20"
                          cy="20"
                          r="16"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="3"
                          className="dark:stroke-[#0A0A0F]"
                        />
                        <circle
                          cx="20"
                          cy="20"
                          r="16"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="3"
                          strokeDasharray={`${(brand.score / 100) * 100.53} 100.53`}
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <div className="flex items-center gap-1 text-green-600">
                      <span className="text-lg">↗</span>
                      <span className="text-sm font-semibold">{brand.change}</span>
                    </div>
                  </div>
                </div>
                {brand.competitors.map((competitor: any) => (
                  <div key={competitor.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 ${competitor.iconBg} rounded-full flex items-center justify-center`}>
                        <span className="text-xs font-bold text-white">{competitor.icon}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{competitor.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center relative">
                        <span className="text-xs font-semibold text-gray-900 dark:text-white z-10">{competitor.score}</span>
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                          <circle
                            cx="20"
                            cy="20"
                            r="16"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="3"
                            className="dark:stroke-[#0A0A0F]"
                          />
                          <circle
                            cx="20"
                            cy="20"
                            r="16"
                            fill="none"
                            stroke="#9ca3af"
                            strokeWidth="3"
                            strokeDasharray={`${(competitor.score / 100) * 100.53} 100.53`}
                            strokeLinecap="round"
                            className="dark:stroke-[#0A0A0F]"
                          />
                        </svg>
                      </div>
                      <div className="flex items-center gap-1 text-green-600">
                        <span className="text-lg">↗</span>
                        <span className="text-sm font-semibold">{competitor.change}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Potential Competitors */}
            <Card className="p-4 md:p-6 bg-white dark:bg-black">
              <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                Competidores Potenciales
              </h2>
              <div className="space-y-3">
                {brand.potentialCompetitors.map((competitor: any) => (
                  <div key={competitor.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 ${competitor.iconBg} rounded flex items-center justify-center`}>
                        <span className="text-[10px] font-bold text-white">{competitor.icon}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{competitor.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-1 hover:bg-gray-100 dark:hover:bg-[#1E1E24] rounded">
                        <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 dark:hover:bg-[#1E1E24] rounded">
                        <Plus className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Position Trends */}
          <Card className="p-4 md:p-6 bg-white dark:bg-black">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Tendencias de Posición por Modelos
                </h2>
                <div className="hidden md:flex flex-wrap items-center gap-2">
                  <button className="px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium bg-white dark:bg-black border border-gray-300 dark:border-[#2A2A30] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1E1E24]">
                    Modelos
                  </button>
                  <button className="px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1E1E24] rounded-lg">
                    Personas
                  </button>
                  <button className="px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1E1E24] rounded-lg">
                    Regiones
                  </button>
                  <button className="px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1E1E24] rounded-lg">
                    Idiomas
                  </button>
                </div>
              </div>
              <div className="flex md:hidden flex-wrap items-center gap-2">
                <button className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-black border border-gray-300 dark:border-[#2A2A30] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1E1E24]">
                  Modelos
                </button>
                <button className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1E1E24] rounded-lg">
                  Personas
                </button>
                <button className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1E1E24] rounded-lg">
                  Regiones
                </button>
                <button className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1E1E24] rounded-lg">
                  Idiomas
                </button>
              </div>
            </div>

            {/* Chart */}
            <div className="relative h-64 md:h-80 overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 1200 320" preserveAspectRatio="xMidYMid meet">
                {/* Grid lines */}
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                  <g key={i}>
                    <line
                      x1="100"
                      y1={30 + i * 26}
                      x2="1150"
                      y2={30 + i * 26}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    <text x="50" y={35 + i * 26} fontSize="12" fill="#9ca3af" textAnchor="end">
                      {i === 0 ? "1" : i === 3 ? "4" : i === 6 ? "7" : i === 9 ? "10" : ""}
                    </text>
                  </g>
                ))}

                {/* X-axis labels */}
                {["Aug 11", "Aug 18", "Aug 25", "Sep 1", "Sep 8"].map((label, i) => (
                  <text key={label} x={100 + i * 262.5} y="300" fontSize="12" fill="#9ca3af" textAnchor="middle">
                    {label}
                  </text>
                ))}

                {/* Lines */}
                <polyline
                  points="100,100 362.5,95 625,90 887.5,85 1150,80"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2"
                />
                <polyline
                  points="100,150 362.5,155 625,160 887.5,165 1150,170"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="2"
                />
                <polyline
                  points="100,180 362.5,175 625,170 887.5,165 1150,160"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                />

                {/* Data points */}
                {[100, 362.5, 625, 887.5, 1150].map((x, i) => (
                  <g key={i}>
                    <circle cx={x} cy={100 - i * 5} r="4" fill="#06b6d4" />
                    <circle cx={x} cy={150 + i * 5} r="4" fill="#fbbf24" />
                    <circle cx={x} cy={180 - i * 5} r="4" fill="#10b981" />
                  </g>
                ))}
              </svg>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 mt-6">
              {[
                { name: "gpt-5", color: "bg-[#06b6d4]", icon: "⚫" },
                { name: "claude-4-sonnet", color: "bg-[#fbbf24]", icon: "✨" },
                { name: "grok-3", color: "bg-[#10b981]", icon: "⚡" },
                { name: "gemini-2-5-flash", color: "bg-[#a855f7]", icon: "✦" },
              ].map((model) => (
                <div key={model.name} className="flex items-center gap-2">
                  <div className={`w-3 h-3 ${model.color} rounded-full`}></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">{model.name}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Queries Section */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Consultas Rastreadas</h2>
            <div className="space-y-3">
              {brand.queries.map((query: any) => (
                <Link key={query.id} href={`/brand/${params.id}/query/${query.id}`}>
                  <Card className="p-4 bg-white dark:bg-black hover:shadow-md transition-shadow cursor-pointer">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{query.title}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}




