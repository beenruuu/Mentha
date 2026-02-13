/**
 * Admin Service
 * API client for admin panel operations
 */

import { fetchAPI } from '@/lib/api-client'

// =====================================================
// TYPES
// =====================================================

export interface UserStats {
  total_users: number
  active_users: number
  new_users_today: number
  new_users_week: number
  new_users_month: number
  suspended_users: number
}

export interface UserGrowthPoint {
  date: string
  new_users: number
  cumulative_users: number
}

export interface UserGrowthData {
  daily: UserGrowthPoint[]
  weekly: UserGrowthPoint[]
  monthly: UserGrowthPoint[]
}

export interface GeographyStats {
  country: string
  user_count: number
  percentage: number
}

export interface IndustryStats {
  industry: string
  user_count: number
  percentage: number
}

export interface RoleStats {
  role: string
  user_count: number
  percentage: number
}

export interface UserAnalytics {
  stats: UserStats
  growth: UserGrowthData
  geography: GeographyStats[]
  industries: IndustryStats[]
  roles: RoleStats[]
}

export interface SubscriptionStats {
  total_subscriptions: number
  active_subscriptions: number
  trial_subscriptions: number
  canceled_subscriptions: number
  mrr: number
  arr: number
}

export interface PlanDistribution {
  plan: string
  count: number
  percentage: number
  mrr_contribution: number
}

export interface SubscriptionOverview {
  stats: SubscriptionStats
  plan_distribution: PlanDistribution[]
  recent_upgrades: number
  recent_downgrades: number
  recent_cancellations: number
  churn_rate: number
}

export interface UserListItem {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  country?: string
  industry?: string
  role?: string
  company_name?: string
  plan: string
  subscription_status?: string
  is_suspended: boolean
  created_at: string
  last_login_at?: string
  brands_count: number
}

export interface UserDetail extends UserListItem {
  discovery_source?: string
  preferred_language: string
  suspension_reason?: string
  suspended_at?: string
  login_count: number
  onboarding_completed: boolean
  onboarding_step: number
  stripe_customer_id?: string
  subscription_end_date?: string
  brands: { id: string; name: string; domain: string }[]
  recent_activity: any[]
}

export interface PaginatedUsers {
  users: UserListItem[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export interface UserFilters {
  search?: string
  plan?: string
  country?: string
  industry?: string
  is_suspended?: boolean
  page?: number
  limit?: number
  sort_by?: string
  sort_order?: string
}

export interface OnboardingFunnelStep {
  step: number
  step_name: string
  users_reached: number
  users_completed: number
  drop_off_count: number
  drop_off_rate: number
  avg_time_seconds?: number
}

export interface OnboardingStats {
  total_started: number
  total_completed: number
  completion_rate: number
  avg_completion_time_minutes: number
  in_progress: number
}

export interface OnboardingDataAggregated {
  top_countries: { name: string; count: number }[]
  top_industries: { name: string; count: number }[]
  top_roles: { name: string; count: number }[]
  top_discovery_sources: { name: string; count: number }[]
  entity_types: { name: string; count: number }[]
}

export interface OnboardingAnalytics {
  stats: OnboardingStats
  funnel: OnboardingFunnelStep[]
  data_insights: OnboardingDataAggregated
  daily_completions: { date: string; count: number }[]
}

export interface PlatformStats {
  total_users: number
  total_brands: number
  total_analyses: number
  total_keywords: number
  total_competitors: number
  active_users_24h: number
  active_users_7d: number
  active_users_30d: number
}

export interface TrendPoint {
  date: string
  value: number
}

export interface PlatformTrends {
  user_growth: TrendPoint[]
  analysis_volume: TrendPoint[]
  active_users: TrendPoint[]
}

export interface PlatformOverview {
  stats: PlatformStats
  trends: PlatformTrends
  top_features: { feature: string; usage_count: number; unique_users: number }[]
  health_score: number
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  parent_id?: string
  icon?: string
  color?: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CategoryCreate {
  name: string
  slug: string
  description?: string
  parent_id?: string
  icon?: string
  color?: string
  sort_order?: number
}

export interface CategoryUpdate {
  name?: string
  slug?: string
  description?: string
  parent_id?: string
  icon?: string
  color?: string
  sort_order?: number
  is_active?: boolean
}

export interface AuditLogEntry {
  id: string
  admin_id: string
  admin_email?: string
  action: string
  target_type?: string
  target_id?: string
  old_values?: Record<string, any>
  new_values?: Record<string, any>
  ip_address?: string
  created_at: string
}

export interface AdminUser {
  id: string
  user_id: string
  role: 'admin' | 'super_admin' | 'moderator'
  permissions: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

// =====================================================
// FINANCIAL ANALYTICS TYPES
// =====================================================

export interface FinancialStats {
  total_revenue: number
  total_cost: number
  net_profit: number
  margin: number
  arpu: number
}

export interface FinancialOverview {
  stats: FinancialStats
  revenue_history: TrendPoint[]
  cost_history: TrendPoint[]
  profit_history: TrendPoint[]
}

export interface UserFinancials {
  user_id: string
  email: string
  plan: string
  subscription_status: string
  total_revenue: number
  total_cost: number
  net_profit: number
  usage_breakdown: Record<string, number>
}

// =====================================================
// ADMIN SERVICE
// =====================================================

export const adminService = {
  // Platform Overview
  async getOverview(): Promise<PlatformOverview> {
    return fetchAPI<PlatformOverview>('/admin/overview')
  },

  // User Analytics
  async getUserAnalytics(): Promise<UserAnalytics> {
    return fetchAPI<UserAnalytics>('/admin/analytics/users')
  },

  // Subscription Analytics
  async getSubscriptionAnalytics(): Promise<SubscriptionOverview> {
    return fetchAPI<SubscriptionOverview>('/admin/analytics/subscriptions')
  },

  // Onboarding Analytics
  async getOnboardingAnalytics(): Promise<OnboardingAnalytics> {
    return fetchAPI<OnboardingAnalytics>('/admin/analytics/onboarding')
  },

  // Financial Analytics
  async getFinancialOverview(): Promise<FinancialOverview> {
    return fetchAPI<FinancialOverview>('/admin/analytics/financials/overview')
  },

  async getUserFinancials(): Promise<UserFinancials[]> {
    return fetchAPI<UserFinancials[]>('/admin/analytics/financials/users')
  },

  // User Management
  async getUsers(filters: UserFilters = {}): Promise<PaginatedUsers> {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value))
      }
    })
    return fetchAPI<PaginatedUsers>(`/admin/users?${params.toString()}`)
  },

  async getUserDetail(userId: string): Promise<UserDetail> {
    return fetchAPI<UserDetail>(`/admin/users/${userId}`)
  },

  async updateUser(userId: string, data: Partial<UserDetail>): Promise<void> {
    await fetchAPI(`/admin/users/${userId}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async suspendUser(userId: string, reason: string): Promise<void> {
    await fetchAPI(`/admin/users/${userId}/suspend?reason=${encodeURIComponent(reason)}`, { method: 'POST' })
  },

  async unsuspendUser(userId: string): Promise<void> {
    await fetchAPI(`/admin/users/${userId}/unsuspend`, { method: 'POST' })
  },

  async deleteUser(userId: string): Promise<void> {
    await fetchAPI(`/admin/users/${userId}`, { method: 'DELETE' })
  },

  // Categories
  async getCategories(includeInactive = false): Promise<Category[]> {
    return fetchAPI<Category[]>(`/admin/categories?include_inactive=${includeInactive}`)
  },

  async createCategory(data: CategoryCreate): Promise<Category> {
    return fetchAPI<Category>('/admin/categories', { method: 'POST', body: JSON.stringify(data) })
  },

  async updateCategory(id: string, data: CategoryUpdate): Promise<Category> {
    return fetchAPI<Category>(`/admin/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  async deleteCategory(id: string): Promise<void> {
    await fetchAPI(`/admin/categories/${id}`, { method: 'DELETE' })
  },

  // Audit Log
  async getAuditLog(limit = 100): Promise<AuditLogEntry[]> {
    return fetchAPI<AuditLogEntry[]>(`/admin/audit-log?limit=${limit}`)
  },

  // Admin User
  async getCurrentAdmin(): Promise<AdminUser> {
    return fetchAPI<AdminUser>('/admin/me')
  },
}
