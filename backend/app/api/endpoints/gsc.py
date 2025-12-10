from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import RedirectResponse
from typing import Optional, List
from app.services.integrations.gsc_service import gsc_service
from app.core.config import settings
from supabase import create_client, Client
from app.api.deps import get_current_user
from app.models.auth import UserProfile
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/auth")
async def gsc_auth(
    user_id: str = Query(..., description="User ID to link GSC account to"),
    redirect_to: str = Query(None, description="Frontend URL to redirect after success")
):
    """
    Start the Google Search Console OAuth flow.
    """
    try:
        # Encode state with user_id and final redirect
        state = f"{user_id}|{redirect_to or ''}"
        auth_url = gsc_service.get_authorization_url(state=state)
        return {"url": auth_url}
    except Exception as e:
        logger.error(f"Failed to generate GSC auth URL: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/callback")
async def gsc_callback(
    code: str, 
    state: str,
    request: Request
):
    """
    Handle the OAuth callback from Google.
    """
    try:
        # Decode state
        parts = state.split("|")
        user_id = parts[0]
        redirect_to = parts[1] if len(parts) > 1 else settings.CORS_ORIGINS[0]
        
        # Exchange code for tokens
        tokens = await gsc_service.exchange_code_for_token(code)
        
        # Store tokens in Supabase (securely in a new table or user metadata)
        # For now, we'll store in user_metadata for simplicity, but ideally a dedicated 'integrations' table
        supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        
        # Update user metadata with GSC tokens (WARNING: Sensitive data)
        # In production this should be encrypted in a separate table
        # We assume an 'integrations' table exists properly, or use user_metadata as MVP
        
        # Checking if we have an integrations table or storing in profiles
        # Let's verify 'profiles' update via admin API
        supabase.auth.admin.update_user_by_id(
            user_id,
            {"user_metadata": {"gsc_connected": True, "gsc_tokens": tokens}}
        )
        
        return RedirectResponse(url=f"{redirect_to}?gsc_connected=true")
        
    except Exception as e:
        logger.error(f"GSC Callback failed: {e}")
        return RedirectResponse(url=f"{redirect_to}?error=gsc_failed")

@router.get("/sites", response_model=List[str])
async def get_sites(
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Get list of verified sites from Google Search Console.
    """
    try:
        supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        user_response = supabase.auth.admin.get_user_by_id(current_user.id)
        user = user_response.user
        
        if not user or not user.user_metadata or not user.user_metadata.get("gsc_tokens"):
            raise HTTPException(status_code=400, detail="GSC not connected")
            
        tokens = user.user_metadata.get("gsc_tokens")
        sites = await gsc_service.get_sites(tokens)
        return sites
    except Exception as e:
        logger.error(f"Failed to fetch GSC sites: {e}")
        raise HTTPException(status_code=500, detail=str(e))
