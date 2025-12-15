import logging

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.supabase.auth import SupabaseAuthService, get_auth_service
from app.models.auth import UserProfile
from uuid import UUID

logger = logging.getLogger(__name__)

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: SupabaseAuthService = Depends(get_auth_service)
) -> UserProfile:
    try:
        user = await auth_service.get_user(credentials.credentials)
        
        # Ensure profile exists in public.profiles (in case trigger failed)
        try:
            profile_res = auth_service.supabase.table("profiles").select("id").eq("id", user.id).execute()
            if not profile_res.data:
                profile_data = {
                    "id": user.id,
                    "email": user.email,
                    "full_name": user.user_metadata.get("full_name", "") if user.user_metadata else "",
                    "avatar_url": user.user_metadata.get("avatar_url", "") if user.user_metadata else ""
                }
                auth_service.supabase.table("profiles").insert(profile_data).execute()
        except Exception as db_error:
            logger.warning(f"Failed to ensure profile exists: {db_error}")

        return UserProfile(
            id=str(user.id), 
            email=user.email, 
            full_name=user.user_metadata.get("full_name", "") if user.user_metadata else "", 
            avatar_url=user.user_metadata.get("avatar_url", "") if user.user_metadata else ""
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user_id(user: UserProfile = Depends(get_current_user)) -> str:
    """Dependency that returns the current user's id as a string."""
    return user.id
