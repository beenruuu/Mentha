"""
Admin CRUD Operations
Database operations for admin panel functionality
"""
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from supabase import Client

from app.models.admin import (
    UserStats, UserGrowthPoint, UserGrowthData, GeographyStats,
    IndustryStats, RoleStats, UserAnalytics, UserListItem, UserDetail,
    UserFilters, PaginatedUsers, SubscriptionStats, PlanDistribution,
    SubscriptionOverview, OnboardingFunnelStep, OnboardingStats,
    OnboardingDataAggregated, OnboardingAnalytics, PlatformStats,
    PlatformOverview, PlatformTrends, TrendPoint, FeatureUsage,
    Category, CategoryCreate, CategoryUpdate, AuditLogEntry,
    AdminUser, AdminUserCreate
)


class AdminCRUD:
    """CRUD operations for admin panel"""
    
    def __init__(self, supabase: Client):
        self.supabase = supabase
    
    # =====================================================
    # ADMIN AUTHENTICATION
    # =====================================================
    
    async def is_admin(self, user_id: str) -> bool:
        """Check if user is an admin"""
        try:
            result = self.supabase.table("admin_users").select("*").eq("user_id", user_id).eq("is_active", True).execute()
            return len(result.data) > 0
        except Exception:
            return False
    
    async def get_admin(self, user_id: str) -> Optional[AdminUser]:
        """Get admin user details"""
        try:
            result = self.supabase.table("admin_users").select("*").eq("user_id", user_id).execute()
            if result.data:
                return AdminUser(**result.data[0])
            return None
        except Exception:
            return None
    
    async def create_admin(self, admin_data: AdminUserCreate) -> Optional[AdminUser]:
        """Create a new admin user"""
        try:
            result = self.supabase.table("admin_users").insert({
                "user_id": admin_data.user_id,
                "role": admin_data.role,
                "permissions": admin_data.permissions
            }).execute()
            if result.data:
                return AdminUser(**result.data[0])
            return None
        except Exception:
            return None
    
    # =====================================================
    # USER ANALYTICS
    # =====================================================
    
    async def get_user_stats(self) -> UserStats:
        """Get overall user statistics"""
        now = datetime.utcnow()
        today = now.date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        # Total users
        total_result = self.supabase.table("profiles").select("id", count="exact").execute()
        total_users = total_result.count or 0
        
        # New users today
        today_result = self.supabase.table("profiles").select("id", count="exact").gte("created_at", today.isoformat()).execute()
        new_today = today_result.count or 0
        
        # New users this week
        week_result = self.supabase.table("profiles").select("id", count="exact").gte("created_at", week_ago.isoformat()).execute()
        new_week = week_result.count or 0
        
        # New users this month
        month_result = self.supabase.table("profiles").select("id", count="exact").gte("created_at", month_ago.isoformat()).execute()
        new_month = month_result.count or 0
        
        # Suspended users
        suspended_result = self.supabase.table("profiles").select("id", count="exact").eq("is_suspended", True).execute()
        suspended = suspended_result.count or 0
        
        # Active users (logged in last 30 days)
        active_result = self.supabase.table("profiles").select("id", count="exact").gte("last_login_at", month_ago.isoformat()).execute()
        active_users = active_result.count or 0
        
        return UserStats(
            total_users=total_users,
            active_users=active_users,
            new_users_today=new_today,
            new_users_week=new_week,
            new_users_month=new_month,
            suspended_users=suspended
        )
    
    async def get_user_growth(self, days: int = 30) -> UserGrowthData:
        """Get user growth data"""
        # Get daily growth data using view
        try:
            result = self.supabase.table("profiles").select("created_at").execute()
            
            # Process into daily buckets
            daily_counts: Dict[str, int] = {}
            for user in result.data:
                date_str = user["created_at"][:10]
                daily_counts[date_str] = daily_counts.get(date_str, 0) + 1
            
            # Build daily growth points
            daily = []
            cumulative = 0
            sorted_dates = sorted(daily_counts.keys())[-days:]
            
            for date in sorted_dates:
                count = daily_counts.get(date, 0)
                cumulative += count
                daily.append(UserGrowthPoint(
                    date=date,
                    new_users=count,
                    cumulative_users=cumulative
                ))
            
            return UserGrowthData(
                daily=daily,
                weekly=[],  # Can be computed from daily
                monthly=[]  # Can be computed from daily
            )
        except Exception as e:
            print(f"Error getting user growth: {e}")
            return UserGrowthData(daily=[], weekly=[], monthly=[])
    
    async def get_geography_stats(self) -> List[GeographyStats]:
        """Get user geography distribution"""
        try:
            result = self.supabase.rpc("get_geography_distribution").execute()
            if result.data:
                return [GeographyStats(**item) for item in result.data]
        except:
            pass
        
        # Fallback: manual query
        try:
            result = self.supabase.table("profiles").select("country").not_.is_("country", "null").execute()
            counts: Dict[str, int] = {}
            total = 0
            for user in result.data:
                country = user.get("country", "Unknown")
                counts[country] = counts.get(country, 0) + 1
                total += 1
            
            return [
                GeographyStats(
                    country=country,
                    user_count=count,
                    percentage=round(count * 100 / total, 2) if total > 0 else 0
                )
                for country, count in sorted(counts.items(), key=lambda x: x[1], reverse=True)
            ]
        except Exception as e:
            print(f"Error getting geography stats: {e}")
            return []
    
    async def get_industry_stats(self) -> List[IndustryStats]:
        """Get user industry distribution"""
        try:
            result = self.supabase.table("profiles").select("industry").not_.is_("industry", "null").execute()
            counts: Dict[str, int] = {}
            total = 0
            for user in result.data:
                industry = user.get("industry", "Other")
                counts[industry] = counts.get(industry, 0) + 1
                total += 1
            
            return [
                IndustryStats(
                    industry=industry,
                    user_count=count,
                    percentage=round(count * 100 / total, 2) if total > 0 else 0
                )
                for industry, count in sorted(counts.items(), key=lambda x: x[1], reverse=True)
            ]
        except Exception as e:
            print(f"Error getting industry stats: {e}")
            return []
    
    async def get_role_stats(self) -> List[RoleStats]:
        """Get user role distribution"""
        try:
            result = self.supabase.table("profiles").select("role").not_.is_("role", "null").execute()
            counts: Dict[str, int] = {}
            total = 0
            for user in result.data:
                role = user.get("role", "Other")
                counts[role] = counts.get(role, 0) + 1
                total += 1
            
            return [
                RoleStats(
                    role=role,
                    user_count=count,
                    percentage=round(count * 100 / total, 2) if total > 0 else 0
                )
                for role, count in sorted(counts.items(), key=lambda x: x[1], reverse=True)
            ]
        except Exception as e:
            print(f"Error getting role stats: {e}")
            return []
    
    async def get_user_analytics(self) -> UserAnalytics:
        """Get complete user analytics"""
        stats = await self.get_user_stats()
        growth = await self.get_user_growth()
        geography = await self.get_geography_stats()
        industries = await self.get_industry_stats()
        roles = await self.get_role_stats()
        
        return UserAnalytics(
            stats=stats,
            growth=growth,
            geography=geography,
            industries=industries,
            roles=roles
        )
    
    # =====================================================
    # USER MANAGEMENT
    # =====================================================
    
    async def get_users(self, filters: UserFilters) -> PaginatedUsers:
        """Get paginated list of users"""
        try:
            # Build query
            query = self.supabase.table("profiles").select(
                "*, subscriptions(plan_name, status)",
                count="exact"
            )
            
            # Apply filters
            if filters.search:
                query = query.or_(f"email.ilike.%{filters.search}%,full_name.ilike.%{filters.search}%")
            
            if filters.country:
                query = query.eq("country", filters.country)
            
            if filters.industry:
                query = query.eq("industry", filters.industry)
            
            if filters.is_suspended is not None:
                query = query.eq("is_suspended", filters.is_suspended)
            
            if filters.created_after:
                query = query.gte("created_at", filters.created_after.isoformat())
            
            if filters.created_before:
                query = query.lte("created_at", filters.created_before.isoformat())
            
            # Sorting
            order_method = query.order(filters.sort_by, desc=(filters.sort_order == "desc"))
            
            # Pagination
            offset = (filters.page - 1) * filters.limit
            result = order_method.range(offset, offset + filters.limit - 1).execute()
            
            total = result.count or 0
            
            # Get brand counts for each user
            users = []
            for user_data in result.data:
                # Get brand count
                brand_result = self.supabase.table("brands").select("id", count="exact").eq("user_id", user_data["id"]).execute()
                brand_count = brand_result.count or 0
                
                # Extract subscription info
                sub = user_data.get("subscriptions")
                plan = "free"
                sub_status = None
                if sub and isinstance(sub, list) and len(sub) > 0:
                    plan = sub[0].get("plan_name", "free")
                    sub_status = sub[0].get("status")
                elif sub and isinstance(sub, dict):
                    plan = sub.get("plan_name", "free")
                    sub_status = sub.get("status")
                
                users.append(UserListItem(
                    id=user_data["id"],
                    email=user_data["email"],
                    full_name=user_data.get("full_name"),
                    avatar_url=user_data.get("avatar_url"),
                    country=user_data.get("country"),
                    industry=user_data.get("industry"),
                    role=user_data.get("role"),
                    company_name=user_data.get("company_name"),
                    plan=plan,
                    subscription_status=sub_status,
                    is_suspended=user_data.get("is_suspended", False),
                    created_at=user_data["created_at"],
                    last_login_at=user_data.get("last_login_at"),
                    brands_count=brand_count
                ))
            
            return PaginatedUsers(
                users=users,
                total=total,
                page=filters.page,
                limit=filters.limit,
                total_pages=(total + filters.limit - 1) // filters.limit
            )
        
        except Exception as e:
            print(f"Error getting users: {e}")
            return PaginatedUsers(users=[], total=0, page=1, limit=20, total_pages=0)
    
    async def get_user_detail(self, user_id: str) -> Optional[UserDetail]:
        """Get detailed user information"""
        try:
            # Get user profile with subscription
            result = self.supabase.table("profiles").select(
                "*, subscriptions(*)"
            ).eq("id", user_id).execute()
            
            if not result.data:
                return None
            
            user_data = result.data[0]
            
            # Get brands
            brands_result = self.supabase.table("brands").select("id, name, domain").eq("user_id", user_id).execute()
            brands = brands_result.data or []
            
            # Get onboarding data
            onboarding_result = self.supabase.table("onboarding_data").select("*").eq("user_id", user_id).execute()
            onboarding = onboarding_result.data[0] if onboarding_result.data else {}
            
            # Get recent activity
            activity_result = self.supabase.table("user_activity").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(10).execute()
            activity = activity_result.data or []
            
            # Extract subscription info
            sub = user_data.get("subscriptions")
            plan = "free"
            sub_status = None
            sub_end = None
            stripe_id = None
            
            if sub and isinstance(sub, list) and len(sub) > 0:
                s = sub[0]
                plan = s.get("plan_name", "free")
                sub_status = s.get("status")
                sub_end = s.get("current_period_end")
                stripe_id = s.get("stripe_customer_id")
            elif sub and isinstance(sub, dict):
                plan = sub.get("plan_name", "free")
                sub_status = sub.get("status")
                sub_end = sub.get("current_period_end")
                stripe_id = sub.get("stripe_customer_id")
            
            return UserDetail(
                id=user_data["id"],
                email=user_data["email"],
                full_name=user_data.get("full_name"),
                avatar_url=user_data.get("avatar_url"),
                country=user_data.get("country"),
                industry=user_data.get("industry"),
                role=user_data.get("role"),
                company_name=user_data.get("company_name"),
                discovery_source=user_data.get("discovery_source"),
                preferred_language=user_data.get("preferred_language", "en"),
                plan=plan,
                subscription_status=sub_status,
                is_suspended=user_data.get("is_suspended", False),
                suspension_reason=user_data.get("suspension_reason"),
                suspended_at=user_data.get("suspended_at"),
                created_at=user_data["created_at"],
                last_login_at=user_data.get("last_login_at"),
                login_count=user_data.get("login_count", 0),
                brands_count=len(brands),
                onboarding_completed=onboarding.get("completed_at") is not None,
                onboarding_step=onboarding.get("step_completed", 0),
                stripe_customer_id=stripe_id,
                subscription_end_date=sub_end,
                brands=brands,
                recent_activity=activity
            )
        
        except Exception as e:
            print(f"Error getting user detail: {e}")
            return None
    
    async def update_user(self, user_id: str, update_data: Dict[str, Any], admin_id: str) -> bool:
        """Update user profile"""
        try:
            # Get old values for audit
            old_result = self.supabase.table("profiles").select("*").eq("id", user_id).execute()
            old_values = old_result.data[0] if old_result.data else {}
            
            # Handle suspension
            if "is_suspended" in update_data:
                if update_data["is_suspended"]:
                    update_data["suspended_at"] = datetime.utcnow().isoformat()
                else:
                    update_data["suspended_at"] = None
                    update_data["suspension_reason"] = None
            
            # Update
            result = self.supabase.table("profiles").update(update_data).eq("id", user_id).execute()
            
            # Log audit
            await self.log_audit_action(
                admin_id=admin_id,
                action="update_user",
                target_type="user",
                target_id=user_id,
                old_values=old_values,
                new_values=update_data
            )
            
            return True
        except Exception as e:
            print(f"Error updating user: {e}")
            return False
    
    async def suspend_user(self, user_id: str, reason: str, admin_id: str) -> bool:
        """Suspend a user account"""
        return await self.update_user(
            user_id=user_id,
            update_data={
                "is_suspended": True,
                "suspension_reason": reason
            },
            admin_id=admin_id
        )
    
    async def unsuspend_user(self, user_id: str, admin_id: str) -> bool:
        """Unsuspend a user account"""
        return await self.update_user(
            user_id=user_id,
            update_data={
                "is_suspended": False,
                "suspension_reason": None
            },
            admin_id=admin_id
        )
    
    async def delete_user(self, user_id: str, admin_id: str) -> bool:
        """Delete a user account (cascades to all related data)"""
        try:
            # Log before deletion
            user_result = self.supabase.table("profiles").select("*").eq("id", user_id).execute()
            old_values = user_result.data[0] if user_result.data else {}
            
            # Delete (will cascade)
            self.supabase.table("profiles").delete().eq("id", user_id).execute()
            
            # Log audit
            await self.log_audit_action(
                admin_id=admin_id,
                action="delete_user",
                target_type="user",
                target_id=user_id,
                old_values=old_values,
                new_values=None
            )
            
            return True
        except Exception as e:
            print(f"Error deleting user: {e}")
            return False
    
    # =====================================================
    # SUBSCRIPTION ANALYTICS
    # =====================================================
    
    async def get_subscription_overview(self) -> SubscriptionOverview:
        """Get subscription analytics overview"""
        try:
            # Get all subscriptions
            result = self.supabase.table("subscriptions").select("*").execute()
            subscriptions = result.data or []
            
            # Calculate stats
            total = len(subscriptions)
            active = sum(1 for s in subscriptions if s.get("status") == "active")
            trial = sum(1 for s in subscriptions if s.get("status") == "trialing")
            canceled = sum(1 for s in subscriptions if s.get("status") == "canceled")
            
            # MRR calculation (simplified)
            mrr = 0
            plan_prices = {"starter": 29, "pro": 79, "enterprise": 299}
            for s in subscriptions:
                if s.get("status") == "active":
                    plan = s.get("plan_name", "free")
                    interval = s.get("billing_interval", "month")
                    price = plan_prices.get(plan, 0)
                    if interval == "year":
                        mrr += price * 0.8 / 12  # Yearly discount
                    else:
                        mrr += price
            
            # Plan distribution
            plan_counts: Dict[str, int] = {"free": 0, "starter": 0, "pro": 0, "enterprise": 0}
            
            # Count free users (no subscription)
            total_users_result = self.supabase.table("profiles").select("id", count="exact").execute()
            total_users = total_users_result.count or 0
            plan_counts["free"] = total_users - total
            
            for s in subscriptions:
                plan = s.get("plan_name", "free")
                if plan in plan_counts:
                    plan_counts[plan] += 1
            
            total_with_free = sum(plan_counts.values())
            plan_distribution = [
                PlanDistribution(
                    plan=plan,
                    count=count,
                    percentage=round(count * 100 / total_with_free, 2) if total_with_free > 0 else 0,
                    mrr_contribution=plan_prices.get(plan, 0) * count
                )
                for plan, count in plan_counts.items()
            ]
            
            # Recent changes (last 30 days)
            thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).isoformat()
            
            # Churn rate (simplified)
            churn_rate = round(canceled * 100 / active, 2) if active > 0 else 0
            
            return SubscriptionOverview(
                stats=SubscriptionStats(
                    total_subscriptions=total,
                    active_subscriptions=active,
                    trial_subscriptions=trial,
                    canceled_subscriptions=canceled,
                    mrr=mrr,
                    arr=mrr * 12
                ),
                plan_distribution=plan_distribution,
                recent_upgrades=0,  # Would need subscription history
                recent_downgrades=0,
                recent_cancellations=canceled,
                churn_rate=churn_rate
            )
        
        except Exception as e:
            print(f"Error getting subscription overview: {e}")
            return SubscriptionOverview(
                stats=SubscriptionStats(
                    total_subscriptions=0, active_subscriptions=0,
                    trial_subscriptions=0, canceled_subscriptions=0,
                    mrr=0, arr=0
                ),
                plan_distribution=[],
                recent_upgrades=0, recent_downgrades=0,
                recent_cancellations=0, churn_rate=0
            )
    
    # =====================================================
    # ONBOARDING ANALYTICS
    # =====================================================
    
    async def get_onboarding_analytics(self) -> OnboardingAnalytics:
        """Get onboarding funnel analytics"""
        try:
            result = self.supabase.table("onboarding_data").select("*").execute()
            onboarding_data = result.data or []
            
            # Stats
            total_started = len(onboarding_data)
            total_completed = sum(1 for o in onboarding_data if o.get("completed_at"))
            in_progress = total_started - total_completed
            completion_rate = round(total_completed * 100 / total_started, 2) if total_started > 0 else 0
            
            # Avg completion time
            completion_times = []
            for o in onboarding_data:
                if o.get("completed_at") and o.get("started_at"):
                    try:
                        start = datetime.fromisoformat(o["started_at"].replace("Z", "+00:00"))
                        end = datetime.fromisoformat(o["completed_at"].replace("Z", "+00:00"))
                        completion_times.append((end - start).total_seconds() / 60)
                    except:
                        pass
            
            avg_completion_time = sum(completion_times) / len(completion_times) if completion_times else 0
            
            # Funnel steps
            step_names = [
                "About You", "Company", "Brand Profile", 
                "Competitors", "Research Prompts", "Schedule", "Setup"
            ]
            
            funnel = []
            for step in range(7):
                reached = sum(1 for o in onboarding_data if o.get("step_completed", 0) >= step)
                completed = sum(1 for o in onboarding_data if o.get("step_completed", 0) > step)
                dropped = sum(1 for o in onboarding_data if o.get("dropped_at_step") == step)
                
                funnel.append(OnboardingFunnelStep(
                    step=step,
                    step_name=step_names[step] if step < len(step_names) else f"Step {step + 1}",
                    users_reached=reached,
                    users_completed=completed,
                    drop_off_count=dropped,
                    drop_off_rate=round(dropped * 100 / reached, 2) if reached > 0 else 0,
                    avg_time_seconds=None  # Would need per-step timing
                ))
            
            # Data insights from profiles
            profiles_result = self.supabase.table("profiles").select("country, industry, role, discovery_source").execute()
            profiles = profiles_result.data or []
            
            # Aggregate data
            countries: Dict[str, int] = {}
            industries: Dict[str, int] = {}
            roles: Dict[str, int] = {}
            sources: Dict[str, int] = {}
            
            for p in profiles:
                if p.get("country"):
                    countries[p["country"]] = countries.get(p["country"], 0) + 1
                if p.get("industry"):
                    industries[p["industry"]] = industries.get(p["industry"], 0) + 1
                if p.get("role"):
                    roles[p["role"]] = roles.get(p["role"], 0) + 1
                if p.get("discovery_source"):
                    sources[p["discovery_source"]] = sources.get(p["discovery_source"], 0) + 1
            
            data_insights = OnboardingDataAggregated(
                top_countries=[{"name": k, "count": v} for k, v in sorted(countries.items(), key=lambda x: x[1], reverse=True)[:10]],
                top_industries=[{"name": k, "count": v} for k, v in sorted(industries.items(), key=lambda x: x[1], reverse=True)[:10]],
                top_roles=[{"name": k, "count": v} for k, v in sorted(roles.items(), key=lambda x: x[1], reverse=True)[:10]],
                top_discovery_sources=[{"name": k, "count": v} for k, v in sorted(sources.items(), key=lambda x: x[1], reverse=True)[:10]],
                entity_types=[]  # Would need brand data
            )
            
            # Daily completions
            daily_completions: Dict[str, int] = {}
            for o in onboarding_data:
                if o.get("completed_at"):
                    date_str = o["completed_at"][:10]
                    daily_completions[date_str] = daily_completions.get(date_str, 0) + 1
            
            return OnboardingAnalytics(
                stats=OnboardingStats(
                    total_started=total_started,
                    total_completed=total_completed,
                    completion_rate=completion_rate,
                    avg_completion_time_minutes=round(avg_completion_time, 2),
                    in_progress=in_progress
                ),
                funnel=funnel,
                data_insights=data_insights,
                daily_completions=[{"date": k, "count": v} for k, v in sorted(daily_completions.items())[-30:]]
            )
        
        except Exception as e:
            print(f"Error getting onboarding analytics: {e}")
            return OnboardingAnalytics(
                stats=OnboardingStats(
                    total_started=0, total_completed=0,
                    completion_rate=0, avg_completion_time_minutes=0,
                    in_progress=0
                ),
                funnel=[],
                data_insights=OnboardingDataAggregated(
                    top_countries=[], top_industries=[],
                    top_roles=[], top_discovery_sources=[],
                    entity_types=[]
                ),
                daily_completions=[]
            )
    
    # =====================================================
    # PLATFORM OVERVIEW
    # =====================================================
    
    async def get_platform_overview(self) -> PlatformOverview:
        """Get complete platform overview"""
        try:
            now = datetime.utcnow()
            day_ago = now - timedelta(days=1)
            week_ago = now - timedelta(days=7)
            month_ago = now - timedelta(days=30)
            
            # Basic counts
            users = self.supabase.table("profiles").select("id", count="exact").execute()
            brands = self.supabase.table("brands").select("id", count="exact").execute()
            analyses = self.supabase.table("aeo_analyses").select("id", count="exact").execute()
            keywords = self.supabase.table("keywords").select("id", count="exact").execute()
            competitors = self.supabase.table("competitors").select("id", count="exact").execute()
            
            # Active users
            active_24h = self.supabase.table("profiles").select("id", count="exact").gte("last_login_at", day_ago.isoformat()).execute()
            active_7d = self.supabase.table("profiles").select("id", count="exact").gte("last_login_at", week_ago.isoformat()).execute()
            active_30d = self.supabase.table("profiles").select("id", count="exact").gte("last_login_at", month_ago.isoformat()).execute()
            
            stats = PlatformStats(
                total_users=users.count or 0,
                total_brands=brands.count or 0,
                total_analyses=analyses.count or 0,
                total_keywords=keywords.count or 0,
                total_competitors=competitors.count or 0,
                active_users_24h=active_24h.count or 0,
                active_users_7d=active_7d.count or 0,
                active_users_30d=active_30d.count or 0
            )
            
            # Trends (simplified - daily user registration)
            user_growth = await self.get_user_growth(30)
            
            trends = PlatformTrends(
                user_growth=[TrendPoint(date=p.date, value=p.cumulative_users) for p in user_growth.daily],
                analysis_volume=[],  # Would need historical data
                active_users=[]  # Would need historical data
            )
            
            # Health score (simplified calculation)
            health_factors = []
            if stats.total_users > 0:
                health_factors.append(min(stats.active_users_30d / stats.total_users * 100, 100))
            if stats.total_brands > 0:
                health_factors.append(min(stats.total_brands / stats.total_users * 50, 100) if stats.total_users > 0 else 0)
            
            health_score = sum(health_factors) / len(health_factors) if health_factors else 50
            
            return PlatformOverview(
                stats=stats,
                trends=trends,
                top_features=[],  # Would need feature tracking
                health_score=round(health_score, 2)
            )
        
        except Exception as e:
            print(f"Error getting platform overview: {e}")
            return PlatformOverview(
                stats=PlatformStats(
                    total_users=0, total_brands=0, total_analyses=0,
                    total_keywords=0, total_competitors=0,
                    active_users_24h=0, active_users_7d=0, active_users_30d=0
                ),
                trends=PlatformTrends(user_growth=[], analysis_volume=[], active_users=[]),
                top_features=[],
                health_score=0
            )
    
    # =====================================================
    # CATEGORIES CRUD
    # =====================================================
    
    async def get_categories(self, include_inactive: bool = False) -> List[Category]:
        """Get all categories"""
        try:
            query = self.supabase.table("categories").select("*")
            if not include_inactive:
                query = query.eq("is_active", True)
            result = query.order("sort_order").execute()
            return [Category(**c) for c in result.data] if result.data else []
        except Exception as e:
            print(f"Error getting categories: {e}")
            return []
    
    async def create_category(self, data: CategoryCreate, admin_id: str) -> Optional[Category]:
        """Create a new category"""
        try:
            result = self.supabase.table("categories").insert(data.dict()).execute()
            if result.data:
                await self.log_audit_action(
                    admin_id=admin_id,
                    action="create_category",
                    target_type="category",
                    target_id=result.data[0]["id"],
                    new_values=data.dict()
                )
                return Category(**result.data[0])
            return None
        except Exception as e:
            print(f"Error creating category: {e}")
            return None
    
    async def update_category(self, category_id: str, data: CategoryUpdate, admin_id: str) -> Optional[Category]:
        """Update a category"""
        try:
            update_data = data.dict(exclude_unset=True)
            result = self.supabase.table("categories").update(update_data).eq("id", category_id).execute()
            if result.data:
                await self.log_audit_action(
                    admin_id=admin_id,
                    action="update_category",
                    target_type="category",
                    target_id=category_id,
                    new_values=update_data
                )
                return Category(**result.data[0])
            return None
        except Exception as e:
            print(f"Error updating category: {e}")
            return None
    
    async def delete_category(self, category_id: str, admin_id: str) -> bool:
        """Delete a category"""
        try:
            self.supabase.table("categories").delete().eq("id", category_id).execute()
            await self.log_audit_action(
                admin_id=admin_id,
                action="delete_category",
                target_type="category",
                target_id=category_id
            )
            return True
        except Exception as e:
            print(f"Error deleting category: {e}")
            return False
    
    # =====================================================
    # AUDIT LOG
    # =====================================================
    
    async def log_audit_action(
        self,
        admin_id: str,
        action: str,
        target_type: Optional[str] = None,
        target_id: Optional[str] = None,
        old_values: Optional[Dict] = None,
        new_values: Optional[Dict] = None,
        ip_address: Optional[str] = None
    ):
        """Log an admin action"""
        try:
            self.supabase.table("admin_audit_log").insert({
                "admin_id": admin_id,
                "action": action,
                "target_type": target_type,
                "target_id": target_id,
                "old_values": old_values,
                "new_values": new_values,
                "ip_address": ip_address
            }).execute()
        except Exception as e:
            print(f"Error logging audit action: {e}")
    
    async def get_audit_log(self, limit: int = 100) -> List[AuditLogEntry]:
        """Get recent audit log entries"""
        try:
            result = self.supabase.table("admin_audit_log").select(
                "*, admin_users(user_id)"
            ).order("created_at", desc=True).limit(limit).execute()
            
            entries = []
            for entry in result.data or []:
                admin_email = None
                if entry.get("admin_users"):
                    # Get email from profiles
                    admin_user_id = entry["admin_users"].get("user_id")
                    if admin_user_id:
                        profile = self.supabase.table("profiles").select("email").eq("id", admin_user_id).execute()
                        if profile.data:
                            admin_email = profile.data[0].get("email")
                
                entries.append(AuditLogEntry(
                    id=entry["id"],
                    admin_id=entry["admin_id"],
                    admin_email=admin_email,
                    action=entry["action"],
                    target_type=entry.get("target_type"),
                    target_id=entry.get("target_id"),
                    old_values=entry.get("old_values"),
                    new_values=entry.get("new_values"),
                    ip_address=entry.get("ip_address"),
                    created_at=entry["created_at"]
                ))
            
            return entries
        except Exception as e:
            print(f"Error getting audit log: {e}")
            return []
