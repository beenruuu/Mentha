import { useState } from 'react'
import type { PlatformOverview, UserAnalytics, SubscriptionOverview } from '../api/admin'
import {
    Users,
    Activity,
    CreditCard,
    Zap
} from 'lucide-react'

export interface AdminDataProps {
    initialOverview: PlatformOverview | null
    initialUserAnalytics: UserAnalytics | null
    initialSubscriptions: SubscriptionOverview | null
}

export function useAdminData({
    initialOverview,
    initialUserAnalytics,
    initialSubscriptions
}: AdminDataProps) {
    const [overview, setOverview] = useState<PlatformOverview | null>(initialOverview)
    const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(initialUserAnalytics)
    const [subscriptions, setSubscriptions] = useState<SubscriptionOverview | null>(initialSubscriptions)

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

    return {
        overview,
        userAnalytics,
        subscriptions,
        stats
    }
}
