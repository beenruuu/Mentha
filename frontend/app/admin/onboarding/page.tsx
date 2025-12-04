'use client'

import { useEffect, useState } from 'react'
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  Users,
  TrendingDown,
  ArrowRight,
  Sparkles,
  Globe,
  Briefcase,
  Building2,
  MessageSquare
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
  Cell,
  AreaChart,
  Area
} from 'recharts'
import { AdminPageWrapper } from '@/components/admin/admin-page-wrapper'
import { StatsGridSkeleton, ChartSkeleton, ListSkeleton } from '@/components/admin/admin-skeletons'
import { adminService, type OnboardingAnalytics } from '@/lib/services/admin'
import { getCountryCode, getCountryName } from '@/lib/utils/countries'
import FlagIcon from '@/components/shared/flag-icon'

const STEP_COLORS = [
  '#10b981', // emerald
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#84cc16', // lime
  '#14b8a6'  // teal
]

const STEP_ICONS = [
  Users,
  Building2,
  Sparkles,
  Users,
  MessageSquare,
  Clock,
  CheckCircle2
]

export default function OnboardingPage() {
  const [data, setData] = useState<OnboardingAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const onboardingData = await adminService.getOnboardingAnalytics()
        setData(onboardingData)
      } catch (error) {
        console.error('Error fetching onboarding data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <AdminPageWrapper title="Analytics de Onboarding" subtitle="Cargando...">
        <div className="space-y-6">
          <StatsGridSkeleton count={4} />
          <ChartSkeleton />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ListSkeleton />
            <ListSkeleton />
            <ListSkeleton />
          </div>
        </div>
      </AdminPageWrapper>
    )
  }

  const stats = [
    {
      name: 'Onboardings Iniciados',
      value: data?.stats.total_started || 0,
      icon: ClipboardList,
      color: 'text-teal-500',
      bgColor: 'bg-teal-50 dark:bg-teal-900/20'
    },
    {
      name: 'Completados',
      value: data?.stats.total_completed || 0,
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    {
      name: 'Tasa de Conversión',
      value: `${data?.stats.completion_rate || 0}%`,
      icon: TrendingDown,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      name: 'Tiempo Promedio',
      value: `${Math.round(data?.stats.avg_completion_time_minutes || 0)} min`,
      icon: Clock,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20'
    }
  ]

  // Prepare funnel data
  const funnelData = data?.funnel.map((step, index) => ({
    name: step.step_name,
    value: step.users_reached,
    dropOff: step.drop_off_rate,
    fill: STEP_COLORS[index % STEP_COLORS.length]
  })) || []

  return (
    <AdminPageWrapper title="Analytics de Onboarding" subtitle={`${data?.stats.total_completed || 0} completados`}>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {stat.name}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Funnel Visualization */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Embudo de Onboarding</CardTitle>
          <CardDescription>Conversión paso a paso del proceso de onboarding</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data?.funnel.map((step, index) => {
              const Icon = STEP_ICONS[index] || ClipboardList
              const color = STEP_COLORS[index % STEP_COLORS.length]
              const widthPercent = data.funnel[0]?.users_reached 
                ? (step.users_reached / data.funnel[0].users_reached) * 100
                : 0
              
              return (
                <div key={step.step} className="relative">
                  <div className="flex items-center gap-4">
                    {/* Step indicator */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <Icon className="h-5 w-5" style={{ color }} />
                    </div>

                    {/* Step content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {step.step_name}
                        </h4>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            {step.users_reached} usuarios
                          </span>
                          {step.drop_off_rate > 0 && (
                            <span className="text-red-500 flex items-center gap-1">
                              <TrendingDown className="h-3 w-3" />
                              {step.drop_off_rate.toFixed(1)}% abandonos
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden relative">
                        <div
                          className="h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-3"
                          style={{
                            width: `${widthPercent}%`,
                            backgroundColor: color,
                            minWidth: '60px'
                          }}
                        >
                          <span className="text-xs font-medium text-white">
                            {widthPercent.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Arrow to next step */}
                    {index < (data?.funnel.length || 0) - 1 && (
                      <ArrowRight className="h-5 w-5 text-gray-300 shrink-0" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Data Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Completions Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Completados por Día</CardTitle>
            <CardDescription>Onboardings completados en los últimos 30 días</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {data?.daily_completions && data.daily_completions.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.daily_completions}>
                    <defs>
                      <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => value.slice(5)}
                    />
                    <YAxis
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#colorCompletions)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No hay datos de completados
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Drop-off Analysis */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Análisis de Abandonos</CardTitle>
            <CardDescription>Pasos con mayor tasa de abandono</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {data?.funnel && data.funnel.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.funnel.filter(s => s.drop_off_rate > 0)}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis
                      type="number"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <YAxis
                      type="category"
                      dataKey="step_name"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      width={100}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Abandono']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="drop_off_rate" fill="#ef4444" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No hay datos de abandonos
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Countries */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-teal-500" />
              <CardTitle className="text-lg">Top Países</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.data_insights.top_countries.slice(0, 5).map((country, index) => (
                <div key={country.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FlagIcon code={getCountryCode(country.name) || 'XX'} size={20} />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{getCountryName(country.name)}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {country.count}
                  </span>
                </div>
              ))}
              {(!data?.data_insights.top_countries || data.data_insights.top_countries.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4">Sin datos</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Industries */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-lg">Top Industrias</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.data_insights.top_industries.slice(0, 5).map((industry, index) => (
                <div key={industry.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500 w-5">{index + 1}</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{industry.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {industry.count}
                  </span>
                </div>
              ))}
              {(!data?.data_insights.top_industries || data.data_insights.top_industries.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4">Sin datos</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Discovery Sources */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-lg">Fuentes de Descubrimiento</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.data_insights.top_discovery_sources.slice(0, 5).map((source, index) => (
                <div key={source.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500 w-5">{index + 1}</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{source.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {source.count}
                  </span>
                </div>
              ))}
              {(!data?.data_insights.top_discovery_sources || data.data_insights.top_discovery_sources.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4">Sin datos</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminPageWrapper>
  )
}
