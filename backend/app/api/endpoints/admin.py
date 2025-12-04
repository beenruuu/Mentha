"""
Admin Panel API Endpoints
Provides endpoints for admin dashboard functionality
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from supabase import create_client

from app.core.config import settings
from app.services.supabase.auth import SupabaseAuthService, get_auth_service
from app.crud.admin import AdminCRUD
from app.models.admin import (
    UserAnalytics, PaginatedUsers, UserFilters, UserDetail, UserUpdate,
    SubscriptionOverview, OnboardingAnalytics, PlatformOverview,
    Category, CategoryCreate, CategoryUpdate, AuditLogEntry,
    AdminUser, AdminUserCreate
)

router = APIRouter()
security = HTTPBearer()

# Parse allowed admin emails from environment
ALLOWED_ADMIN_EMAILS = [
    email.strip().lower() 
    for email in settings.ADMIN_EMAILS.split(",") 
    if email.strip()
]


def get_supabase_client():
    """Get Supabase client instance"""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)


async def get_admin_crud():
    """Get admin CRUD instance"""
    supabase = get_supabase_client()
    return AdminCRUD(supabase)


async def verify_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: SupabaseAuthService = Depends(get_auth_service),
    admin_crud: AdminCRUD = Depends(get_admin_crud)
) -> str:
    """Verify the user is an admin and return admin user id"""
    try:
        user = await auth_service.get_user(credentials.credentials)
        user_email = user.email.lower() if user.email else ""
        
        # Check email whitelist first (environment-based access control)
        if ALLOWED_ADMIN_EMAILS and user_email not in ALLOWED_ADMIN_EMAILS:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required. Your email is not in the admin whitelist."
            )
        
        # If whitelist is empty, fall back to database check
        if not ALLOWED_ADMIN_EMAILS:
            is_admin = await admin_crud.is_admin(user.id)
            if not is_admin:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Admin access required"
                )
        
        # Get admin user for audit logging (or use user.id if not in admin_users table)
        admin = await admin_crud.get_admin(user.id)
        return admin.id if admin else user.id
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )


# =====================================================
# PLATFORM OVERVIEW
# =====================================================

@router.get("/overview", response_model=PlatformOverview)
async def get_platform_overview(
    admin_id: str = Depends(verify_admin),
    admin_crud: AdminCRUD = Depends(get_admin_crud)
):
    """Get platform-wide overview and statistics"""
    return await admin_crud.get_platform_overview()


# =====================================================
# USER ANALYTICS
# =====================================================

@router.get("/analytics/users", response_model=UserAnalytics)
async def get_user_analytics(
    admin_id: str = Depends(verify_admin),
    admin_crud: AdminCRUD = Depends(get_admin_crud)
):
    """Get comprehensive user analytics"""
    return await admin_crud.get_user_analytics()


# =====================================================
# SUBSCRIPTION ANALYTICS
# =====================================================

@router.get("/analytics/subscriptions", response_model=SubscriptionOverview)
async def get_subscription_analytics(
    admin_id: str = Depends(verify_admin),
    admin_crud: AdminCRUD = Depends(get_admin_crud)
):
    """Get subscription analytics and revenue metrics"""
    return await admin_crud.get_subscription_overview()


# =====================================================
# ONBOARDING ANALYTICS
# =====================================================

@router.get("/analytics/onboarding", response_model=OnboardingAnalytics)
async def get_onboarding_analytics(
    admin_id: str = Depends(verify_admin),
    admin_crud: AdminCRUD = Depends(get_admin_crud)
):
    """Get onboarding funnel analytics"""
    return await admin_crud.get_onboarding_analytics()


# =====================================================
# USER MANAGEMENT
# =====================================================

@router.get("/users", response_model=PaginatedUsers)
async def get_users(
    search: Optional[str] = None,
    plan: Optional[str] = None,
    country: Optional[str] = None,
    industry: Optional[str] = None,
    is_suspended: Optional[bool] = None,
    page: int = 1,
    limit: int = 20,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    admin_id: str = Depends(verify_admin),
    admin_crud: AdminCRUD = Depends(get_admin_crud)
):
    """Get paginated list of users with filters"""
    filters = UserFilters(
        search=search,
        plan=plan,
        country=country,
        industry=industry,
        is_suspended=is_suspended,
        page=page,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order
    )
    return await admin_crud.get_users(filters)


@router.get("/users/{user_id}", response_model=UserDetail)
async def get_user_detail(
    user_id: str,
    admin_id: str = Depends(verify_admin),
    admin_crud: AdminCRUD = Depends(get_admin_crud)
):
    """Get detailed information about a specific user"""
    user = await admin_crud.get_user_detail(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.patch("/users/{user_id}")
async def update_user(
    user_id: str,
    update: UserUpdate,
    admin_id: str = Depends(verify_admin),
    admin_crud: AdminCRUD = Depends(get_admin_crud)
):
    """Update a user's profile"""
    success = await admin_crud.update_user(
        user_id=user_id,
        update_data=update.dict(exclude_unset=True),
        admin_id=admin_id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update user"
        )
    return {"message": "User updated successfully"}


@router.post("/users/{user_id}/suspend")
async def suspend_user(
    user_id: str,
    reason: str,
    admin_id: str = Depends(verify_admin),
    admin_crud: AdminCRUD = Depends(get_admin_crud)
):
    """Suspend a user account"""
    success = await admin_crud.suspend_user(
        user_id=user_id,
        reason=reason,
        admin_id=admin_id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to suspend user"
        )
    return {"message": "User suspended successfully"}


@router.post("/users/{user_id}/unsuspend")
async def unsuspend_user(
    user_id: str,
    admin_id: str = Depends(verify_admin),
    admin_crud: AdminCRUD = Depends(get_admin_crud)
):
    """Unsuspend a user account"""
    success = await admin_crud.unsuspend_user(
        user_id=user_id,
        admin_id=admin_id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to unsuspend user"
        )
    return {"message": "User unsuspended successfully"}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    admin_id: str = Depends(verify_admin),
    admin_crud: AdminCRUD = Depends(get_admin_crud)
):
    """Delete a user account permanently"""
    success = await admin_crud.delete_user(
        user_id=user_id,
        admin_id=admin_id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to delete user"
        )
    return {"message": "User deleted successfully"}


# =====================================================
# CATEGORIES MANAGEMENT
# =====================================================

@router.get("/categories", response_model=list[Category])
async def get_categories(
    include_inactive: bool = False,
    admin_id: str = Depends(verify_admin),
    admin_crud: AdminCRUD = Depends(get_admin_crud)
):
    """Get all categories"""
    return await admin_crud.get_categories(include_inactive)


@router.post("/categories", response_model=Category)
async def create_category(
    data: CategoryCreate,
    admin_id: str = Depends(verify_admin),
    admin_crud: AdminCRUD = Depends(get_admin_crud)
):
    """Create a new category"""
    category = await admin_crud.create_category(data, admin_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create category"
        )
    return category


@router.patch("/categories/{category_id}", response_model=Category)
async def update_category(
    category_id: str,
    data: CategoryUpdate,
    admin_id: str = Depends(verify_admin),
    admin_crud: AdminCRUD = Depends(get_admin_crud)
):
    """Update a category"""
    category = await admin_crud.update_category(category_id, data, admin_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update category"
        )
    return category


@router.delete("/categories/{category_id}")
async def delete_category(
    category_id: str,
    admin_id: str = Depends(verify_admin),
    admin_crud: AdminCRUD = Depends(get_admin_crud)
):
    """Delete a category"""
    success = await admin_crud.delete_category(category_id, admin_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to delete category"
        )
    return {"message": "Category deleted successfully"}


# =====================================================
# AUDIT LOG
# =====================================================

@router.get("/audit-log", response_model=list[AuditLogEntry])
async def get_audit_log(
    limit: int = 100,
    admin_id: str = Depends(verify_admin),
    admin_crud: AdminCRUD = Depends(get_admin_crud)
):
    """Get admin audit log"""
    return await admin_crud.get_audit_log(limit)


# =====================================================
# ADMIN MANAGEMENT (Super Admin only)
# =====================================================

@router.post("/admins", response_model=AdminUser)
async def create_admin(
    data: AdminUserCreate,
    admin_id: str = Depends(verify_admin),
    admin_crud: AdminCRUD = Depends(get_admin_crud)
):
    """Create a new admin user (Super Admin only)"""
    # Verify super admin
    admin = await admin_crud.get_admin(admin_id)
    if not admin or admin.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    
    new_admin = await admin_crud.create_admin(data)
    if not new_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create admin"
        )
    return new_admin


@router.get("/me")
async def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: SupabaseAuthService = Depends(get_auth_service),
    admin_crud: AdminCRUD = Depends(get_admin_crud)
):
    """Get current admin user info"""
    try:
        user = await auth_service.get_user(credentials.credentials)
        user_email = user.email.lower() if user.email else ""
        
        # Check if user is in whitelist
        is_whitelisted = ALLOWED_ADMIN_EMAILS and user_email in ALLOWED_ADMIN_EMAILS
        
        # Try to get from database first
        admin = await admin_crud.get_admin(user.id)
        
        if admin:
            return admin
        
        # If whitelisted but not in admin_users table, return a virtual admin object
        if is_whitelisted:
            return {
                "id": user.id,
                "user_id": user.id,
                "role": "super_admin",  # Whitelisted emails get super_admin
                "permissions": ["*"],
                "is_active": True,
                "created_at": user.created_at if hasattr(user, 'created_at') else None,
                "updated_at": None
            }
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not an admin"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )
