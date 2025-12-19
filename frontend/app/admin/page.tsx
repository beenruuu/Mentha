'use client'

import { useEffect, useState } from 'react'
import {
  Users,
  CreditCard,
  Activity,
  Clock,
  Zap,
  Settings,
  Menu
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserAvatarMenu } from "@/components/layout/user-avatar-menu"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { useSidebar } from '@/components/ui/sidebar'
import { adminService, type PlatformOverview, type UserAnalytics, type SubscriptionOverview } from '@/lib/services/admin'
import { getCountryCode, getCountryName } from '@/lib/utils/countries'
import { StatsGridSkeleton, ChartSkeleton, ListSkeleton } from '@/components/admin/admin-skeletons'
import FlagIcon from '@/components/shared/flag-icon'
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { AdminFinancials } from "@/components/admin/AdminFinancials"


const COLORS = ['#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4']

export default function AdminDashboard() {
  const { setOpenMobile } = useSidebar()
  const [overview, setOverview] = useState<PlatformOverview | null>(null)
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null)
  const [subscriptions, setSubscriptions] = useState<SubscriptionOverview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewData, usersData, subsData] = await Promise.all([
          adminService.getOverview(),
          adminService.getUserAnalytics(),
          adminService.getSubscriptionAnalytics()
        ])
        setOverview(overviewData)
        setUserAnalytics(usersData)
        setSubscriptions(subsData)
      } catch (error) {
        console.error('Error fetching admin data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <>
        <header className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setOpenMobile(true)}
              className="md:hidden p-2 mr-2 rounded-lg hover:bg-secondary"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">Admin Panel</h1>
          </div>
        </header>
        <main className="flex-1 bg-white dark:bg-black rounded-tl-3xl overflow-hidden flex flex-col shadow-2xl relative z-10">
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
            <StatsGridSkeleton count={4} />
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
        </main>
      </>
    )
  }

  const stats = [
    {
      name: 'Total Usuarios',
      value: overview?.stats.total_users || 0,
      change: userAnalytics?.stats.new_users_week || 0,
      changeLabel: 'esta semana',
      icon: Users,
      color: 'text-teal-500',
      bgColor: 'bg-teal-50 dark:bg-teal-900/20'
    },
    {
      name: 'Usuarios Activos (30d)',
      value: overview?.stats.active_users_30d || 0,
      change: Math.round(((overview?.stats.active_users_30d || 0) / (overview?.stats.total_users || 1)) * 100),
      changeLabel: '% del total',
      icon: Activity,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    {
      name: 'MRR',
      value: `$${(subscriptions?.stats.mrr || 0).toLocaleString()}`,
      change: subscriptions?.stats.active_subscriptions || 0,
      changeLabel: 'suscriptores activos',
      icon: CreditCard,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      name: 'Health Score',
      value: `${overview?.health_score || 0}%`,
      change: overview?.stats.total_brands || 0,
      changeLabel: 'marcas activas',
      icon: Zap,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20'
    }
  ]

  return (
    <>
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setOpenMobile(true)}
            className="md:hidden p-2 mr-2 rounded-lg hover:bg-secondary"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">Vista General</h1>

        </div>

        <div className="flex items-center gap-3">
          <UserAvatarMenu />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-white dark:bg-black rounded-tl-3xl overflow-hidden flex flex-col shadow-2xl relative z-10">
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">General</TabsTrigger>
              <TabsTrigger value="financials">Finanzas</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                  <Card key={stat.name} className="border-0 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                          <stat.icon className={`h-6 w-6 ${stat.color}`} />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          +{stat.change} {stat.changeLabel}
                        </span>
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

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Growth Chart */}
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Crecimiento de Usuarios</CardTitle>
                    <CardDescription>Usuarios acumulados en el tiempo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {userAnalytics && userAnalytics.growth.daily.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={userAnalytics.growth.daily}>
                            <defs>
                              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                            <XAxis
                              dataKey="date"
                              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
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
                              dataKey="cumulative_users"
                              stroke="#10b981"
                              strokeWidth={2}
                              fill="url(#colorUsers)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-500">
                          No hay datos de crecimiento disponibles
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Plan Distribution */}
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Distribución de Planes</CardTitle>
                    <CardDescription>Usuarios por tipo de suscripción</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] flex items-center justify-center">
                      {subscriptions && subscriptions.plan_distribution.length > 0 ? (
                        <div className="flex items-center gap-8 w-full">
                          <div className="w-1/2">
                            <ResponsiveContainer width="100%" height={200}>
                              <PieChart>
                                <Pie
                                  data={subscriptions.plan_distribution}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={80}
                                  paddingAngle={5}
                                  dataKey="count"
                                >
                                  {subscriptions.plan_distribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="w-1/2 space-y-3">
                            {subscriptions.plan_distribution.map((plan, index) => (
                              <div key={plan.plan} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                  />
                                  <span className="text-sm capitalize text-gray-700 dark:text-gray-300">
                                    {plan.plan}
                                  </span>
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {plan.count} ({plan.percentage}%)
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-500">No hay datos de suscripciones</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Bottom Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Geography */}
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Top Países</CardTitle>
                    <CardDescription>Distribución geográfica de usuarios</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {userAnalytics?.geography.slice(0, 5).map((geo, index) => (
                        <div key={geo.country} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FlagIcon code={getCountryCode(geo.country) || 'XX'} size={20} />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{getCountryName(geo.country)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${geo.percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-500 w-12 text-right">{geo.percentage}%</span>
                          </div>
                        </div>
                      ))}
                      {(!userAnalytics?.geography || userAnalytics.geography.length === 0) && (
                        <p className="text-sm text-gray-500 text-center py-4">No hay datos geográficos</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Industries */}
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Top Industrias</CardTitle>
                    <CardDescription>Sectores más representados</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {userAnalytics?.industries.slice(0, 5).map((ind, index) => (
                        <div key={ind.industry} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-medium text-gray-500 w-6">{index + 1}</span>
                            <span className="text-sm text-gray-700 dark:text-gray-300">{ind.industry}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-purple-500 rounded-full"
                                style={{ width: `${ind.percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-500 w-12 text-right">{ind.percentage}%</span>
                          </div>
                        </div>
                      ))}
                      {(!userAnalytics?.industries || userAnalytics.industries.length === 0) && (
                        <p className="text-sm text-gray-500 text-center py-4">No hay datos de industrias</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Métricas Rápidas</CardTitle>
                    <CardDescription>Estadísticas clave de la plataforma</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Total Marcas</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {overview?.stats.total_brands || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Total Análisis</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {overview?.stats.total_analyses || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Keywords Tracked</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {overview?.stats.total_keywords || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Competidores</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {overview?.stats.total_competitors || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Churn Rate</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {subscriptions?.churn_rate || 0}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="financials">
              <AdminFinancials />
            </TabsContent>
          </Tabs>

        </div>
      </main>
    </>
  )
}
