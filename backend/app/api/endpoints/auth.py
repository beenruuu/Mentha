from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.services.supabase.auth import SupabaseAuthService, get_auth_service
from app.models.auth import UserProfile, TokenResponse

router = APIRouter()
security = HTTPBearer()


@router.get("/me", response_model=UserProfile)
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), auth_service: SupabaseAuthService = Depends(get_auth_service)):
    """Get the currently authenticated user profile."""
    try:
        user = await auth_service.get_user(credentials.credentials)
        return UserProfile(id=user.id, email=user.email, full_name=user.user_metadata.get("full_name", ""), avatar_url=user.user_metadata.get("avatar_url", ""))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/provider-token", response_model=TokenResponse)
async def exchange_provider_token(provider: str, token: str, auth_service: SupabaseAuthService = Depends(get_auth_service)):
    """Exchange a provider token (Google, LinkedIn) for a Supabase token."""
    try:
        supabase_token = await auth_service.sign_in_with_provider_token(provider, token)
        return TokenResponse(access_token=supabase_token, token_type="bearer")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to authenticate with provider: {str(e)}")
