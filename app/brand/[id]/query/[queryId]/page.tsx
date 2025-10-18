import { Search, ArrowLeft, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { MenuButton } from "@/components/menu-button"
import Link from "next/link"

const brandData: Record<string, any> = {
  airbnb: {
    name: "Airbnb",
    icon: "A",
    iconBg: "bg-[#FF5A5F]",
  },
  strava: {
    name: "Strava",
    icon: "S",
    iconBg: "bg-[#FC4C02]",
  },
  vercel: {
    name: "Vercel",
    icon: "▲",
    iconBg: "bg-black",
  },
  revolut: {
    name: "Revolut",
    icon: "R",
    iconBg: "bg-white border border-gray-300",
  },
}

const queryData: Record<string, any> = {
  "vacation-rental-booking": {
    title:
      "¿Cuáles son los sitios de reserva de alquiler vacacional más confiables con buena verificación de anfitriones?",
    created: "4-8-2025",
    tracked: 5,
    nextRun: "10-9-2025",
  },
  "fitness-tracking-apps": {
    title: "¿Mejores aplicaciones de seguimiento de fitness para corredores y ciclistas?",
    created: "4-8-2025",
    tracked: 5,
    nextRun: "10-9-2025",
  },
  "frontend-deployment-platforms": {
    title: "¿Cuáles son las mejores plataformas para desplegar aplicaciones Next.js?",
    created: "4-8-2025",
    tracked: 5,
    nextRun: "10-9-2025",
  },
  "digital-banking-apps": {
    title: "¿Qué aplicaciones de banca digital ofrecen las mejores tarifas de transferencia internacional?",
    created: "4-8-2025",
    tracked: 5,
    nextRun: "10-9-2025",
  },
}

export default function QueryDetailPage({ params }: { params: { id: string; queryId: string } }) {
  const brand = brandData[params.id]
  const query = queryData[params.queryId]

  if (!brand || !query) {
    return <div>Consulta no encontrada</div>
  }

  return (
    <SidebarProvider>
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
          {/* Back Button */}
          <Link href={`/brand/${params.id}`}>
            <button className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6">
              <ArrowLeft className="w-4 h-4" />
              <span className="uppercase tracking-wide">Volver a {brand.name}</span>
              <div className={`w-4 h-4 ${brand.iconBg} rounded-full flex items-center justify-center ml-1`}>
                <span
                  className={`text-[8px] font-bold ${brand.iconBg.includes("border") ? "text-black dark:text-white" : "text-white"}`}
                >
                  {brand.icon}
                </span>
              </div>
            </button>
          </Link>

          {/* Query Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-3">{query.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>Creado el: {query.created}</span>
                <span>•</span>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 ${brand.iconBg} rounded-full flex items-center justify-center`}>
                    <span
                      className={`text-[8px] font-bold ${brand.iconBg.includes("border") ? "text-black dark:text-white" : "text-white"}`}
                    >
                      {brand.icon}
                    </span>
                  </div>
                  <Badge variant="secondary" className="bg-gray-100 dark:bg-[#0A0A0F]">
                    ⚡
                  </Badge>
                  <span>+1</span>
                </div>
                <span>•</span>
                <span>Rastreado {query.tracked} veces</span>
                <span>•</span>
                <span>Próxima ejecución: {query.nextRun}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch defaultChecked />
                <span className="text-sm font-medium text-green-600">Activo</span>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 dark:border-[#2A2A30] rounded-lg hover:bg-gray-50 dark:hover:bg-[#0A0A0A]">
                Última ejecución
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Average Rank */}
          <Card className="p-6 bg-gray-50 dark:bg-[#0A0A0F] mb-6">
            <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Ranking Promedio por Modelos
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Los rankings muestran cómo se desempeña tu marca en diferentes modelos. Los números más bajos son mejores
              (1 es el mejor ranking).
            </p>
          </Card>

          {/* Position Performance Chart */}
          <Card className="p-6 bg-white dark:bg-black mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Rendimiento de Posición por Modelos
              </h2>
              <div className="flex items-center gap-2">
                <button className="px-4 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1E1E24] rounded-lg">
                  General
                </button>
                <button className="px-4 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1E1E24] rounded-lg">
                  Competidores
                </button>
                <button className="px-4 py-1.5 text-sm font-medium bg-white dark:bg-black border border-gray-300 dark:border-[#2A2A30] rounded-lg hover:bg-gray-50 dark:hover:bg-[#0A0A0A]">
                  Modelos
                </button>
                <button className="px-4 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1E1E24] rounded-lg">
                  Personas
                </button>
                <button className="px-4 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1E1E24] rounded-lg">
                  Regiones
                </button>
                <button className="px-4 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1E1E24] rounded-lg">
                  Idiomas
                </button>
              </div>
            </div>

            <div className="relative h-96">
              <svg className="w-full h-full" viewBox="0 0 1200 380">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                  <g key={i}>
                    <line
                      x1="100"
                      y1={30 + i * 32}
                      x2="1150"
                      y2={30 + i * 32}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    <text x="50" y={35 + i * 32} fontSize="12" fill="#9ca3af" textAnchor="end">
                      {i === 0 ? "1" : i === 3 ? "4" : i === 6 ? "7" : i === 9 ? "10" : ""}
                    </text>
                  </g>
                ))}
                {["Aug 11", "Aug 18", "Aug 25", "Sep 1", "Sep 8"].map((label, i) => (
                  <text key={label} x={100 + i * 262.5} y="360" fontSize="12" fill="#9ca3af" textAnchor="middle">
                    {label}
                  </text>
                ))}
                <polyline
                  points="100,60 362.5,62 625,64 887.5,66 1150,68"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="3"
                />
                <polyline
                  points="100,140 362.5,138 625,136 887.5,134 1150,132"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="3"
                />
                <polyline
                  points="100,150 362.5,148 625,146 887.5,144 1150,142"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                />
                {[100, 362.5, 625, 887.5, 1150].map((x, i) => (
                  <g key={i}>
                    <circle cx={x} cy={60 + i * 2} r="5" fill="#06b6d4" stroke="white" strokeWidth="2" />
                    <circle cx={x} cy={140 - i * 2} r="5" fill="#fbbf24" stroke="white" strokeWidth="2" />
                    <circle cx={x} cy={150 - i * 2} r="5" fill="#10b981" stroke="white" strokeWidth="2" />
                  </g>
                ))}
              </svg>
            </div>

            <div className="flex items-center justify-center gap-6 mt-6">
              {[
                { name: "gpt-5", color: "bg-[#06b6d4]", icon: "⚫" },
                { name: "claude-4-sonnet", color: "bg-[#fbbf24]", icon: "✨" },
                { name: "grok-3", color: "bg-[#10b981]", icon: "⚡" },
                { name: "gemini-2-5-flash", color: "bg-[#a855f7]", icon: "✦" },
              ].map((model) => (
                <div key={model.name} className="flex items-center gap-2">
                  <div className={`w-3 h-3 ${model.color} rounded-full`}></div>
                  <span className="text-xs text-gray-600">{model.name}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* AI Responses Analysis */}
          <Card className="p-6 bg-white dark:bg-black mb-6">
            <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
              Análisis de Respuestas de IA
            </h2>
            <div className="space-y-4">
              {[
                {
                  model: "GPT-5",
                  icon: "⚫",
                  mentioned: true,
                  position: 2,
                  response:
                    "Para reservar alquileres vacacionales confiables, **Airbnb** es una excelente opción con verificación de anfitriones y sistema de reseñas robusto. También puedes considerar Booking.com y Vrbo, que ofrecen garantías similares.",
                  competitors: ["Booking.com", "Vrbo"],
                  sentiment: "positivo",
                  sources: ["airbnb.com/trust", "airbnb.com/host-verification"],
                },
                {
                  model: "Claude-4-sonnet",
                  icon: "✨",
                  mentioned: true,
                  position: 1,
                  response:
                    "**Airbnb** es probablemente la plataforma más reconocida para alquileres vacacionales. Ofrece verificación de identidad para anfitriones, sistema de reseñas transparente y protección para huéspedes. Otras opciones incluyen Vrbo y HomeAway.",
                  competitors: ["Vrbo", "HomeAway"],
                  sentiment: "muy positivo",
                  sources: [],
                },
                {
                  model: "Gemini-2.5-flash",
                  icon: "✦",
                  mentioned: false,
                  position: null,
                  response:
                    "Para alquileres vacacionales seguros, Booking.com y Vrbo son opciones sólidas con verificación de propiedades. También puedes explorar Expedia para paquetes completos.",
                  competitors: ["Booking.com", "Vrbo", "Expedia"],
                  sentiment: "neutral",
                  sources: ["booking.com", "vrbo.com"],
                },
                {
                  model: "Perplexity",
                  icon: "◆",
                  mentioned: true,
                  position: 3,
                  response:
                    "Las plataformas más confiables incluyen Booking.com, Vrbo y Airbnb. Airbnb destaca por su programa de verificación de anfitriones y cobertura de seguro.",
                  competitors: ["Booking.com", "Vrbo"],
                  sentiment: "positivo",
                  sources: ["airbnb.com", "trustpilot.com"],
                },
              ].map((ai, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${
                    ai.mentioned
                      ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900"
                      : "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-black border border-gray-300 dark:border-[#2A2A30]"
                      >
                        <span>{ai.icon}</span>
                        <span className="font-medium text-sm">{ai.model}</span>
                      </Badge>
                      {ai.mentioned ? (
                        <Badge className="bg-green-600 dark:bg-green-700 text-white">Mencionado en posición {ai.position}</Badge>
                      ) : (
                        <Badge className="bg-red-600 dark:bg-red-700 text-white">No mencionado</Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={`${
                          ai.sentiment === "muy positivo"
                            ? "border-green-500 text-green-700 dark:text-green-400"
                            : ai.sentiment === "positivo"
                              ? "border-green-400 text-green-600 dark:text-green-400"
                              : "border-gray-400 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {ai.sentiment === "muy positivo" ? "😊" : ai.sentiment === "positivo" ? "🙂" : "😐"} {ai.sentiment}
                      </Badge>
                    </div>
                    <Button size="sm" variant="outline" className="h-7 text-xs">
                      Ver completo
                    </Button>
                  </div>
                  <p
                    className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: ai.response }}
                  />
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 dark:text-gray-400">Competidores mencionados:</span>
                      <div className="flex items-center gap-1">
                        {ai.competitors.map((comp, i) => (
                          <Badge key={i} variant="secondary" className="bg-gray-200 dark:bg-[#1E1E24] text-xs">
                            {comp}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {ai.sources.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400">Fuentes citadas:</span>
                        <div className="flex items-center gap-1">
                          {ai.sources.map((source, i) => (
                            <a
                              key={i}
                              href={`https://${source}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {source}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Semantic Analysis */}
          <Card className="p-6 bg-white dark:bg-black mb-6">
            <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
              Análisis Semántico: Por Qué Apareces (o No)
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Conceptos Dominantes en Respuestas</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { term: "verificación", count: 8 },
                    { term: "confiable", count: 7 },
                    { term: "reseñas", count: 6 },
                    { term: "seguro", count: 5 },
                    { term: "anfitriones", count: 5 },
                    { term: "protección", count: 4 },
                    { term: "transparente", count: 3 },
                    { term: "identidad", count: 3 },
                  ].map((concept) => (
                    <Badge
                      key={concept.term}
                      variant="secondary"
                      className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 py-1"
                      style={{ fontSize: `${10 + concept.count * 1.5}px` }}
                    >
                      {concept.term} ({concept.count})
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Gap Analysis</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Términos que tus competidores tienen en sus descripciones y tú no:
                </p>
                <div className="space-y-2">
                  {[
                    { term: "garantía de precio", competitor: "Booking.com", impact: "Alta" },
                    { term: "cancelación flexible", competitor: "Vrbo", impact: "Alta" },
                    { term: "soporte 24/7", competitor: "Expedia", impact: "Media" },
                  ].map((gap, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-[#0A0A0F] rounded">
                      <div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{gap.term}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({gap.competitor})</span>
                      </div>
                      <Badge
                        className={gap.impact === "Alta" ? "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400" : "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400"}
                      >
                        {gap.impact}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Competitor Comparison */}
          <Card className="p-6 bg-white dark:bg-black">
            <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
              Comparación de Competidores
            </h2>
            <div className="h-32 bg-gray-50 dark:bg-[#0A0A0F] rounded-lg"></div>
          </Card>
        </div>
      </main>
      </div>
    </SidebarProvider>
  )
}




