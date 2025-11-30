'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, AlertCircle, Search, ArrowLeft, Clock, BarChart2 } from 'lucide-react'
import { queriesService, type Query } from '@/lib/services/queries'
import { brandsService, type Brand } from '@/lib/services/brands'
import { useTranslations } from '@/lib/i18n'
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { UserAvatarMenu } from '@/components/layout/user-avatar-menu'

export default function QueryDetailPage({ params }: { params: Promise<{ id: string; queryId: string }> }) {
  const { t } = useTranslations()
  const { id: brandId, queryId } = use(params)

  const [query, setQuery] = useState<Query | null>(null)
  const [brand, setBrand] = useState<Brand | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        const [queryData, brandData] = await Promise.all([
          queriesService.getById(queryId),
          brandsService.getById(brandId)
        ])

        setQuery(queryData)
        setBrand(brandData)
      } catch (err) {
        console.error('Error loading query details:', err)
        setError('Error al cargar los detalles de la consulta')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [brandId, queryId])

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen bg-[#f5f5f5] dark:bg-[#0A0A0A]">
          <AppSidebar />
          <main className="flex-1 flex items-center justify-center md:ml-64">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              <p className="text-gray-500">Cargando...</p>
            </div>
          </main>
        </div>
      </SidebarProvider>
    )
  }

  if (error || !query || !brand) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen bg-[#f5f5f5] dark:bg-[#0A0A0A]">
          <AppSidebar />
          <main className="flex-1 flex items-center justify-center md:ml-64">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <p className="text-gray-500">{error || t.brandNotFound}</p>
              <Link href={`/brand/${brandId}`}>
                <Button variant="outline">Volver</Button>
              </Link>
            </div>
          </main>
        </div>
      </SidebarProvider>
    )
  }

  const brandIcon = brand.name?.charAt(0).toUpperCase() || 'B'
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-[#f5f5f5] dark:bg-[#0A0A0A]">
        <AppSidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-auto md:ml-64">
          <header className="bg-white dark:bg-black border-b border-gray-200 dark:border-[#2A2A30] px-4 md:px-8 py-4 flex items-center justify-between gap-4">
            <SidebarTrigger />
            <div className="flex-1 max-w-md hidden sm:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <Input placeholder={t.searchPlaceholder} className="pl-10 pr-20 bg-white dark:bg-[#0A0A0A] border-gray-200 dark:border-[#2A2A30]" />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 text-xs bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A30] rounded">⌘</kbd>
                  <kbd className="px-1.5 py-0.5 text-xs bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A30] rounded">Y</kbd>
                </div>
              </div>
            </div>
            <UserAvatarMenu />
          </header>

          <div className="p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
              {/* Back Button */}
              <Link href={`/brand/${brandId}`}>
                <button className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="uppercase tracking-wide">Volver a {brand.name}</span>
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center ml-1">
                    <span className="text-[8px] font-bold text-white">
                      {brandIcon}
                    </span>
                  </div>
                </button>
              </Link>

              {/* Query Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-3">{query.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                    <span>Creado el: {formatDate(query.created_at)}</span>
                    <span>•</span>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-[8px] font-bold text-white">
                          {brandIcon}
                        </span>
                      </div>
                      <span>{brand.name}</span>
                    </div>
                    {query.category && (
                      <>
                        <span>•</span>
                        <Badge variant="secondary" className="bg-gray-100 dark:bg-[#0A0A0F]">
                          {query.category}
                        </Badge>
                      </>
                    )}
                    {query.priority && (
                      <>
                        <span>•</span>
                        <Badge
                          variant="secondary"
                          className={
                            query.priority === 'high'
                              ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                              : query.priority === 'medium'
                                ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                          }
                        >
                          Prioridad: {query.priority}
                        </Badge>
                      </>
                    )}
                    {query.estimated_volume && (
                      <>
                        <span>•</span>
                        <span>Vol. estimado: {query.estimated_volume.toLocaleString()}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch defaultChecked={query.tracked !== false} />
                    <span className="text-sm font-medium text-green-600">
                      {query.tracked !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Query Question & Answer */}
              <Card className="p-6 bg-white dark:bg-black mb-6">
                <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  Pregunta
                </h2>
                <p className="text-lg text-gray-900 dark:text-white mb-6">{query.question}</p>

                {query.answer && (
                  <>
                    <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                      Respuesta Esperada
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300">{query.answer}</p>
                  </>
                )}
              </Card>

              {/* AI Models where this appears */}
              {query.ai_models && query.ai_models.length > 0 && (
                <Card className="p-6 bg-white dark:bg-black mb-6">
                  <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                    Modelos de IA donde aparece
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {query.ai_models.map((model, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                        {model}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}

              {/* Coming Soon: Position Performance Chart */}
              <Card className="p-6 bg-white dark:bg-black mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Rendimiento de Posición por Modelos
                  </h2>
                  <Badge variant="outline" className="text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700">
                    <Clock className="w-3 h-3 mr-1" />
                    Próximamente
                  </Badge>
                </div>
                <div className="h-48 bg-gray-50 dark:bg-[#0A0A0F] rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      El seguimiento de posiciones en múltiples modelos de IA estará disponible próximamente
                    </p>
                  </div>
                </div>
              </Card>

              {/* Coming Soon: AI Responses Analysis */}
              <Card className="p-6 bg-white dark:bg-black mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Análisis de Respuestas de IA
                  </h2>
                  <Badge variant="outline" className="text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700">
                    <Clock className="w-3 h-3 mr-1" />
                    Próximamente
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Análisis detallado de cómo diferentes modelos de IA responden a esta consulta, incluyendo menciones, posición y sentimiento.
                </p>
                <div className="h-32 bg-gray-50 dark:bg-[#0A0A0F] rounded-lg flex items-center justify-center">
                  <p className="text-sm text-gray-400">Los análisis en tiempo real se activarán cuando ejecutes el análisis</p>
                </div>
              </Card>

              {/* Coming Soon: Semantic Analysis */}
              <Card className="p-6 bg-white dark:bg-black mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Análisis Semántico
                  </h2>
                  <Badge variant="outline" className="text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700">
                    <Clock className="w-3 h-3 mr-1" />
                    Próximamente
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Descubre por qué tu marca aparece (o no) en las respuestas de IA con análisis de conceptos dominantes y gap analysis.
                </p>
              </Card>

              {/* Metadata */}
              <Card className="p-6 bg-gray-50 dark:bg-[#0A0A0F]">
                <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                  Información adicional
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">ID:</span>
                    <p className="text-gray-900 dark:text-white font-mono text-xs mt-1">{query.id}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Frecuencia:</span>
                    <p className="text-gray-900 dark:text-white mt-1">{query.frequency || 'No definida'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Creado:</span>
                    <p className="text-gray-900 dark:text-white mt-1">{formatDate(query.created_at)}</p>
                  </div>
                  {query.updated_at && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Actualizado:</span>
                      <p className="text-gray-900 dark:text-white mt-1">{formatDate(query.updated_at)}</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
