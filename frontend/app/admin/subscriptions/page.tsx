'use client'

import { useEffect, useState } from 'react'
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'
import { AdminPageWrapper } from '@/components/admin/admin-page-wrapper'
import { StatsGridSkeleton, ChartSkeleton } from '@/components/admin/admin-skeletons'
import { adminService, type SubscriptionOverview } from '@/lib/services/admin'

const COLORS = {
  free: '#94a3b8',
  starter: '#10b981',
  pro: '#8b5cf6',
  enterprise: '#f59e0b'
}

const PLAN_PRICES = {
  free: 0,
  starter: 29,
  pro: 79,
  enterprise: 299
}

export default function SubscriptionsPage() {
  const [data, setData] = useState<SubscriptionOverview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const subscriptionData = await adminService.getSubscriptionAnalytics()
        setData(subscriptionData)
      } catch (error) {
        console.error('Error fetching subscription data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <AdminPageWrapper title="Suscripciones" subtitle="Cargando...">
        <div className="space-y-6">
          <StatsGridSkeleton count={4} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        </div>
      </AdminPageWrapper>
    )
  }

  const stats = [
    {
      name: 'MRR',
      value: `$${(data?.stats.mrr || 0).toLocaleString()}`,
      description: 'Ingresos mensuales recurrentes',
      icon: DollarSign,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    {
      name: 'ARR',
      value: `$${(data?.stats.arr || 0).toLocaleString()}`,
      description: 'Ingresos anuales proyectados',
      icon: TrendingUp,
      color: 'text-teal-500',
      bgColor: 'bg-teal-50 dark:bg-teal-900/20'
    },
    {
      name: 'Suscripciones Activas',
      value: data?.stats.active_subscriptions || 0,
      description: `${data?.stats.trial_subscriptions || 0} en período de prueba`,
      icon: CheckCircle2,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      name: 'Churn Rate',
      value: `${data?.churn_rate || 0}%`,
      description: 'Tasa de cancelación mensual',
      icon: data?.churn_rate && data.churn_rate > 5 ? AlertCircle : CheckCircle2,
      color: data?.churn_rate && data.churn_rate > 5 ? 'text-red-500' : 'text-green-500',
      bgColor: data?.churn_rate && data.churn_rate > 5 
        ? 'bg-red-50 dark:bg-red-900/20' 
        : 'bg-green-50 dark:bg-green-900/20'
    }
  ]

  // Calculate revenue by plan
  const revenueByPlan = data?.plan_distribution.map(plan => ({
    name: plan.plan.charAt(0).toUpperCase() + plan.plan.slice(1),
    users: plan.count,
    revenue: plan.mrr_contribution,
    fill: COLORS[plan.plan as keyof typeof COLORS] || '#94a3b8'
  })) || []

  return (
    <AdminPageWrapper 
      title="Suscripciones" 
      subtitle="Métricas de ingresos"
      actions={
        <Button variant="outline" size="sm" className="hidden md:flex h-8 text-xs font-medium bg-white dark:bg-[#1E1E24] border-gray-200 dark:border-gray-800 shadow-sm">
          <ExternalLink className="mr-2 h-4 w-4" />
          Stripe Dashboard
        </Button>
      }
    >
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
                <p className="text-xs text-gray-400 mt-0.5">
                  {stat.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan Distribution - Improved Visual */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Distribución por Plan</CardTitle>
            <CardDescription>Usuarios en cada plan de suscripción</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {data && data.plan_distribution.length > 0 ? (
                <div className="flex h-full items-center gap-8">
                  {/* Donut Chart */}
                  <div className="w-1/2">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={data.plan_distribution.map(p => ({
                            name: p.plan.charAt(0).toUpperCase() + p.plan.slice(1),
                            value: p.count,
                            fill: COLORS[p.plan as keyof typeof COLORS] || '#94a3b8'
                          }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {data.plan_distribution.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[entry.plan as keyof typeof COLORS] || '#94a3b8'}
                              strokeWidth={0}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [`${value} usuarios`, 'Usuarios']}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Legend with bars */}
                  <div className="w-1/2 space-y-4">
                    {data.plan_distribution.map((plan) => {
                      const color = COLORS[plan.plan as keyof typeof COLORS] || '#94a3b8'
                      return (
                        <div key={plan.plan}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: color }} 
                              />
                              <span className="text-sm font-medium capitalize text-gray-700 dark:text-gray-300">
                                {plan.plan}
                              </span>
                            </div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {plan.count}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ 
                                width: `${plan.percentage}%`,
                                backgroundColor: color
                              }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{plan.percentage}%</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No hay datos de suscripciones
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Plan */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Ingresos por Plan</CardTitle>
            <CardDescription>Contribución al MRR por plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {revenueByPlan.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueByPlan} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis
                      type="number"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      width={80}
                    />
                    <Tooltip
                      formatter={(value: number) => [`$${value}`, 'MRR']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                      {revenueByPlan.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No hay datos de ingresos
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Details */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Detalles por Plan</CardTitle>
          <CardDescription>Métricas detalladas de cada plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data?.plan_distribution.map((plan) => {
              const price = PLAN_PRICES[plan.plan as keyof typeof PLAN_PRICES] || 0
              const color = COLORS[plan.plan as keyof typeof COLORS] || '#94a3b8'
              
              return (
                <div
                  key={plan.plan}
                  className="p-4 rounded-xl border border-gray-200 dark:border-gray-800"
                  style={{ borderLeftColor: color, borderLeftWidth: '4px' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white capitalize">
                      {plan.plan}
                    </h4>
                    <Badge
                      style={{ backgroundColor: `${color}20`, color: color }}
                    >
                      ${price}/mes
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Usuarios</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {plan.count}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">% del total</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {plan.percentage}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">MRR</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        ${plan.mrr_contribution.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Subscription Health */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Estado de Suscripciones</CardTitle>
          <CardDescription>Resumen del estado actual</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="font-medium text-green-700 dark:text-green-400">Activas</span>
              </div>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                {data?.stats.active_subscriptions || 0}
              </p>
            </div>
            
            <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-cyan-500" />
                <span className="font-medium text-cyan-700 dark:text-cyan-400">En Prueba</span>
              </div>
              <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-400">
                {data?.stats.trial_subscriptions || 0}
              </p>
            </div>
            
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="font-medium text-red-700 dark:text-red-400">Canceladas</span>
              </div>
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                {data?.stats.canceled_subscriptions || 0}
              </p>
            </div>
            
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <span className="font-medium text-amber-700 dark:text-amber-400">Cambios Recientes</span>
              </div>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                {(data?.recent_upgrades || 0) + (data?.recent_downgrades || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </AdminPageWrapper>
  )
}
