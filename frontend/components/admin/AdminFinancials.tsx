"use client"

import { useEffect, useState } from 'react'
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    CreditCard,
    Download,
    Search
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend
} from 'recharts'
import { adminService, type FinancialOverview, type UserFinancials } from '@/lib/services/admin'
import { StatsGridSkeleton, ChartSkeleton, ListSkeleton } from '@/components/admin/admin-skeletons'
import { Badge } from '@/components/ui/badge'

export function AdminFinancials() {
    const [overview, setOverview] = useState<FinancialOverview | null>(null)
    const [userFinancials, setUserFinancials] = useState<UserFinancials[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [overviewData, usersData] = await Promise.all([
                    adminService.getFinancialOverview(),
                    adminService.getUserFinancials()
                ])
                setOverview(overviewData)
                setUserFinancials(usersData)
            } catch (error) {
                console.error('Error fetching financial data:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) {
        return (
            <div className="space-y-6">
                <StatsGridSkeleton count={4} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartSkeleton />
                    <ChartSkeleton />
                </div>
                <ListSkeleton />
            </div>
        )
    }

    const filteredUsers = userFinancials.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.user_id.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const stats = [
        {
            name: 'Ingresos Totales (Est.)',
            value: `€${overview?.stats.total_revenue.toLocaleString()}`,
            subtext: 'Basado en suscripciones activas',
            icon: DollarSign,
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-50 dark:bg-emerald-900/20'
        },
        {
            name: 'Costos Totales (30d)',
            value: `€${overview?.stats.total_cost.toLocaleString()}`,
            subtext: 'Basado en uso de API (Est.)',
            icon: TrendingDown,
            color: 'text-red-500',
            bgColor: 'bg-red-50 dark:bg-red-900/20'
        },
        {
            name: 'Beneficio Neto',
            value: `€${overview?.stats.net_profit.toLocaleString()}`,
            subtext: `${overview?.stats.margin}% Margen`,
            icon: TrendingUp,
            color: 'text-blue-500',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20'
        },
        {
            name: 'ARPU',
            value: `€${overview?.stats.arpu.toLocaleString()}`,
            subtext: 'Ingreso promedio por usuario',
            icon: CreditCard,
            color: 'text-purple-500',
            bgColor: 'bg-purple-50 dark:bg-purple-900/20'
        }
    ]

    // Combine history for charts
    const chartData = overview?.revenue_history.map((item, index) => ({
        date: item.date,
        revenue: item.value,
        cost: overview.cost_history[index]?.value || 0,
        profit: overview.profit_history[index]?.value || 0
    })) || []

    return (
        <div className="space-y-8">
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
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">
                                    {stat.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {stat.subtext}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Ingresos vs Costos (30 días)</CardTitle>
                        <CardDescription>Evolución estimada diaria</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(value) => value.slice(5)}
                                    />
                                    <YAxis
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(value) => `€${value}`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--popover))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px'
                                        }}
                                        formatter={(value: number) => [`€${value}`, '']}
                                    />
                                    <Legend />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        name="Ingresos"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        fill="url(#colorRevenue)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="cost"
                                        name="Costos"
                                        stroke="#ef4444"
                                        strokeWidth={2}
                                        fill="url(#colorCost)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Beneficio Neto (Diario)</CardTitle>
                        <CardDescription>Rentabilidad estimada</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(value) => value.slice(5)}
                                    />
                                    <YAxis
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(value) => `€${value}`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--popover))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px'
                                        }}
                                        formatter={(value: number) => [`€${value}`, 'Beneficio']}
                                    />
                                    <Bar dataKey="profit" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Users Table */}
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Desglose por Usuario</CardTitle>
                            <CardDescription>Rentabilidad individual (Top usuarios por costo)</CardDescription>
                        </div>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar usuario..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead>Plan</TableHead>
                                    <TableHead className="text-right">Ingresos</TableHead>
                                    <TableHead className="text-right">Costos (Uso)</TableHead>
                                    <TableHead className="text-right">Beneficio</TableHead>
                                    <TableHead className="text-right">Margen</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((user) => (
                                        <TableRow key={user.user_id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">{user.email}</span>
                                                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">{user.user_id}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {user.plan}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-emerald-600 font-medium">
                                                €{user.total_revenue.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right text-red-600 font-medium">
                                                €{user.total_cost.toFixed(2)}
                                            </TableCell>
                                            <TableCell className={`text-right font-bold ${user.net_profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                                €{user.net_profit.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {user.total_revenue > 0
                                                    ? `${((user.net_profit / user.total_revenue) * 100).toFixed(1)}%`
                                                    : 'N/A'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            No se encontraron resultados
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
