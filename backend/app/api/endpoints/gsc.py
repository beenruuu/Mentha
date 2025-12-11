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


@router.post("/sync/{brand_id}")
async def sync_gsc_data(
    brand_id: str,
    site_url: str = Query(..., description="The GSC site URL to sync"),
    days_back: int = Query(30, description="Number of days to sync"),
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Sync GSC performance data for a brand.
    Fetches data from Google Search Console and stores it in the database.
    """
    try:
        supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        
        # Verify user owns the brand
        brand_response = supabase.table("brands").select("*").eq("id", brand_id).eq("user_id", current_user.id).execute()
        if not brand_response.data:
            raise HTTPException(status_code=403, detail="Not authorized to access this brand")
        
        # Get GSC tokens
        user_response = supabase.auth.admin.get_user_by_id(current_user.id)
        user = user_response.user
        
        if not user or not user.user_metadata or not user.user_metadata.get("gsc_tokens"):
            raise HTTPException(status_code=400, detail="GSC not connected. Please connect Google Search Console first.")
        
        tokens = user.user_metadata.get("gsc_tokens")
        
        # Sync data
        result = await gsc_service.sync_performance_data(
            credentials_json=tokens,
            brand_id=brand_id,
            site_url=site_url,
            days_back=days_back
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to sync GSC data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/performance/{brand_id}")
async def get_gsc_performance(
    brand_id: str,
    days_back: int = Query(30, description="Number of days to fetch"),
    limit: int = Query(50, description="Max number of queries to return"),
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Get aggregated GSC performance data for a brand from the database.
    """
    try:
        supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        
        # Verify user owns the brand
        brand_response = supabase.table("brands").select("*").eq("id", brand_id).eq("user_id", current_user.id).execute()
        if not brand_response.data:
            raise HTTPException(status_code=403, detail="Not authorized to access this brand")
        
        brand = brand_response.data[0]
        
        # Check if GSC is connected
        if not brand.get("gsc_connected"):
            return {
                "connected": False,
                "message": "Google Search Console not connected",
                "data": []
            }
        
        # Fetch from gsc_top_queries view
        result = supabase.table("gsc_top_queries").select("*").eq("brand_id", brand_id).limit(limit).execute()
        
        return {
            "connected": True,
            "site_url": brand.get("gsc_site_url"),
            "last_sync": brand.get("gsc_last_sync"),
            "data": result.data or []
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch GSC performance: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{brand_id}")
async def get_gsc_status(
    brand_id: str,
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Get GSC connection status for a brand.
    """
    try:
        supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        
        # Verify user owns the brand
        brand_response = supabase.table("brands").select("gsc_connected, gsc_site_url, gsc_last_sync").eq("id", brand_id).eq("user_id", current_user.id).execute()
        if not brand_response.data:
            raise HTTPException(status_code=403, detail="Not authorized to access this brand")
        
        brand = brand_response.data[0]
        
        # Check if user has GSC tokens
        user_response = supabase.auth.admin.get_user_by_id(current_user.id)
        user = user_response.user
        has_tokens = bool(user and user.user_metadata and user.user_metadata.get("gsc_tokens"))
        
        return {
            "has_tokens": has_tokens,
            "connected": brand.get("gsc_connected", False),
            "site_url": brand.get("gsc_site_url"),
            "last_sync": brand.get("gsc_last_sync")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get GSC status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

