from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.services.supabase.auth import SupabaseAuthService, get_auth_service
from app.models.auth import UserProfile, UserProfileUpdate, TokenResponse

router = APIRouter()
security = HTTPBearer()


@router.get("/me", response_model=UserProfile)
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), auth_service: SupabaseAuthService = Depends(get_auth_service)):
    """Get the currently authenticated user profile."""
    try:
        user = await auth_service.get_user(credentials.credentials)
        
        # Fetch additional profile data from public.profiles
        profile_res = auth_service.supabase.table("profiles").select("*").eq("id", user.id).execute()
        profile_data = profile_res.data[0] if profile_res.data else {}
        
        return UserProfile(
            id=user.id, 
            email=user.email, 
            full_name=profile_data.get("full_name") or user.user_metadata.get("full_name", ""), 
            avatar_url=profile_data.get("avatar_url") or user.user_metadata.get("avatar_url", ""),
            country=profile_data.get("country"),
            industry=profile_data.get("industry"),
            role=profile_data.get("role"),
            company_name=profile_data.get("company_name"),
            discovery_source=profile_data.get("discovery_source")
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.put("/me", response_model=UserProfile)
async def update_current_user(
    profile_update: UserProfileUpdate,
    credentials: HTTPAuthorizationCredentials = Depends(security), 
    auth_service: SupabaseAuthService = Depends(get_auth_service)
):
    """Update the currently authenticated user profile."""
    try:
        user = await auth_service.get_user(credentials.credentials)
        
        data = profile_update.dict(exclude_unset=True)
        
        # Update public.profiles
        auth_service.supabase.table("profiles").update(data).eq("id", user.id).execute()
        
        # Fetch updated profile
        profile_res = auth_service.supabase.table("profiles").select("*").eq("id", user.id).execute()
        profile_data = profile_res.data[0] if profile_res.data else {}
        
        return UserProfile(
            id=user.id, 
            email=user.email, 
            full_name=profile_data.get("full_name") or user.user_metadata.get("full_name", ""), 
            avatar_url=profile_data.get("avatar_url") or user.user_metadata.get("avatar_url", ""),
            country=profile_data.get("country"),
            industry=profile_data.get("industry"),
            role=profile_data.get("role"),
            company_name=profile_data.get("company_name"),
            discovery_source=profile_data.get("discovery_source")
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update profile: {str(e)}",
        )


@router.post("/provider-token", response_model=TokenResponse)
async def exchange_provider_token(provider: str, token: str, auth_service: SupabaseAuthService = Depends(get_auth_service)):
    """Exchange a provider token (Google, LinkedIn) for a Supabase token."""
    try:
        supabase_token = await auth_service.sign_in_with_provider_token(provider, token)
        return TokenResponse(access_token=supabase_token, token_type="bearer")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to authenticate with provider: {str(e)}")
