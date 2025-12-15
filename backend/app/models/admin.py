"""
Admin Panel Models - Pydantic schemas for admin functionality
"""
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum


# =====================================================
# ENUMS
# =====================================================

class AdminRole(str, Enum):
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"
    MODERATOR = "moderator"


class SubscriptionPlan(str, Enum):
    FREE = "free"
    STARTER = "starter"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    CANCELED = "canceled"
    PAST_DUE = "past_due"
    TRIALING = "trialing"
    INCOMPLETE = "incomplete"


# =====================================================
# ADMIN USER MODELS
# =====================================================

class AdminUser(BaseModel):
    """Admin user model"""
    id: str
    user_id: str
    role: AdminRole
    permissions: List[str] = []
    is_active: bool = True
    created_at: datetime
    updated_at: datetime


class AdminUserCreate(BaseModel):
    """Create admin user request"""
    user_id: str
    role: AdminRole = AdminRole.ADMIN
    permissions: List[str] = []


# =====================================================
# USER ANALYTICS MODELS
# =====================================================

class UserStats(BaseModel):
    """Overall user statistics"""
    total_users: int
    active_users: int
    new_users_today: int
    new_users_week: int
    new_users_month: int
    suspended_users: int


class UserGrowthPoint(BaseModel):
    """Single point in user growth chart"""
    date: str
    new_users: int
    cumulative_users: int


class UserGrowthData(BaseModel):
    """User growth data over time"""
    daily: List[UserGrowthPoint]
    weekly: List[UserGrowthPoint]
    monthly: List[UserGrowthPoint]


class GeographyStats(BaseModel):
    """User geography distribution"""
    country: str
    user_count: int
    percentage: float


class IndustryStats(BaseModel):
    """User industry distribution"""
    industry: str
    user_count: int
    percentage: float


class RoleStats(BaseModel):
    """User role distribution"""
    role: str
    user_count: int
    percentage: float


class UserAnalytics(BaseModel):
    """Complete user analytics"""
    stats: UserStats
    growth: UserGrowthData
    geography: List[GeographyStats]
    industries: List[IndustryStats]
    roles: List[RoleStats]


# =====================================================
# SUBSCRIPTION MODELS
# =====================================================

class SubscriptionStats(BaseModel):
    """Subscription statistics"""
    total_subscriptions: int
    active_subscriptions: int
    trial_subscriptions: int
    canceled_subscriptions: int
    mrr: float  # Monthly Recurring Revenue
    arr: float  # Annual Recurring Revenue


class PlanDistribution(BaseModel):
    """Distribution by plan"""
    plan: str
    count: int
    percentage: float
    mrr_contribution: float


class SubscriptionOverview(BaseModel):
    """Complete subscription overview"""
    stats: SubscriptionStats
    plan_distribution: List[PlanDistribution]
    recent_upgrades: int
    recent_downgrades: int
    recent_cancellations: int
    churn_rate: float


# =====================================================
# USER MANAGEMENT MODELS
# =====================================================

class UserListItem(BaseModel):
    """User item for list view"""
    id: str
    email: str
    full_name: Optional[str]
    avatar_url: Optional[str]
    country: Optional[str]
    industry: Optional[str]
    role: Optional[str]
    company_name: Optional[str]
    plan: str = "free"
    subscription_status: Optional[str]
    is_suspended: bool = False
    created_at: datetime
    last_login_at: Optional[datetime]
    brands_count: int = 0


class UserDetail(UserListItem):
    """Detailed user view"""
    discovery_source: Optional[str]
    preferred_language: str = "en"
    suspension_reason: Optional[str]
    suspended_at: Optional[datetime]
    login_count: int = 0
    onboarding_completed: bool = False
    onboarding_step: int = 0
    stripe_customer_id: Optional[str]
    subscription_end_date: Optional[datetime]
    brands: List[Dict[str, Any]] = []
    recent_activity: List[Dict[str, Any]] = []


class UserUpdate(BaseModel):
    """Update user request"""
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_suspended: Optional[bool] = None
    suspension_reason: Optional[str] = None


class UserFilters(BaseModel):
    """Filters for user list"""
    search: Optional[str] = None
    plan: Optional[SubscriptionPlan] = None
    country: Optional[str] = None
    industry: Optional[str] = None
    is_suspended: Optional[bool] = None
    created_after: Optional[date] = None
    created_before: Optional[date] = None
    page: int = 1
    limit: int = 20
    sort_by: str = "created_at"
    sort_order: str = "desc"


class PaginatedUsers(BaseModel):
    """Paginated user list response"""
    users: List[UserListItem]
    total: int
    page: int
    limit: int
    total_pages: int


# =====================================================
# ONBOARDING ANALYTICS MODELS
# =====================================================

class OnboardingFunnelStep(BaseModel):
    """Single step in onboarding funnel"""
    step: int
    step_name: str
    users_reached: int
    users_completed: int
    drop_off_count: int
    drop_off_rate: float
    avg_time_seconds: Optional[float]


class OnboardingStats(BaseModel):
    """Onboarding statistics"""
    total_started: int
    total_completed: int
    completion_rate: float
    avg_completion_time_minutes: float
    in_progress: int


class OnboardingDataAggregated(BaseModel):
    """Aggregated onboarding data from form fields"""
    top_countries: List[Dict[str, Any]]
    top_industries: List[Dict[str, Any]]
    top_roles: List[Dict[str, Any]]
    top_discovery_sources: List[Dict[str, Any]]
    entity_types: List[Dict[str, Any]]


class OnboardingAnalytics(BaseModel):
    """Complete onboarding analytics"""
    stats: OnboardingStats
    funnel: List[OnboardingFunnelStep]
    data_insights: OnboardingDataAggregated
    daily_completions: List[Dict[str, Any]]


# =====================================================
# PLATFORM OVERVIEW MODELS
# =====================================================

class PlatformStats(BaseModel):
    """Platform-wide statistics"""
    total_users: int
    total_brands: int
    total_analyses: int
    total_keywords: int
    total_competitors: int
    active_users_24h: int
    active_users_7d: int
    active_users_30d: int


class FeatureUsage(BaseModel):
    """Feature usage statistics"""
    feature: str
    usage_count: int
    unique_users: int
    last_used: datetime


class TrendPoint(BaseModel):
    """Point in trend data"""
    date: str
    value: float


class PlatformTrends(BaseModel):
    """Platform trends over time"""
    user_growth: List[TrendPoint]
    analysis_volume: List[TrendPoint]
    active_users: List[TrendPoint]


class PlatformOverview(BaseModel):
    """Complete platform overview"""
    stats: PlatformStats
    trends: PlatformTrends
    top_features: List[FeatureUsage]
    health_score: float  # 0-100


# =====================================================
# FINANCIAL ANALYTICS MODELS
# =====================================================

class FinancialStats(BaseModel):
    """Financial statistics"""
    total_revenue: float
    total_cost: float
    net_profit: float
    margin: float
    arpu: float  # Average Revenue Per User


class FinancialOverview(BaseModel):
    """Financial overview data"""
    stats: FinancialStats
    revenue_history: List[TrendPoint]
    cost_history: List[TrendPoint]
    profit_history: List[TrendPoint]


class UserFinancials(BaseModel):
    """Financial data for a specific user"""
    user_id: str
    email: str
    plan: str
    subscription_status: str
    total_revenue: float
    total_cost: float
    net_profit: float
    usage_breakdown: Dict[str, float]  # e.g., {"analyses": 1.50, "keywords": 0.50}


# =====================================================
# CATEGORY MODELS
# =====================================================

class Category(BaseModel):
    """Category model"""
    id: str
    name: str
    slug: str
    description: Optional[str]
    parent_id: Optional[str]
    icon: Optional[str]
    color: Optional[str]
    sort_order: int = 0
    is_active: bool = True
    created_at: datetime
    updated_at: datetime


class CategoryCreate(BaseModel):
    """Create category request"""
    name: str
    slug: str
    description: Optional[str] = None
    parent_id: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    sort_order: int = 0


class CategoryUpdate(BaseModel):
    """Update category request"""
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


# =====================================================
# AUDIT LOG MODELS
# =====================================================

class AuditLogEntry(BaseModel):
    """Audit log entry"""
    id: str
    admin_id: str
    admin_email: Optional[str]
    action: str
    target_type: Optional[str]
    target_id: Optional[str]
    old_values: Optional[Dict[str, Any]]
    new_values: Optional[Dict[str, Any]]
    ip_address: Optional[str]
    created_at: datetime


class AuditLogFilters(BaseModel):
    """Filters for audit log"""
    admin_id: Optional[str] = None
    action: Optional[str] = None
    target_type: Optional[str] = None
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None
    page: int = 1
    limit: int = 50
