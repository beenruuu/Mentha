"""
Prompt Tracking API Endpoints

Endpoints for managing tracked prompts - allows users to:
- Create prompts to monitor
- Check prompts across AI models
- View historical results
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID

from app.api.deps import get_current_user_id
from app.services.analysis.prompt_tracking_service import get_prompt_tracking_service

router = APIRouter(prefix="/prompts", tags=["Prompt Tracking"])


class CreatePromptRequest(BaseModel):
    prompt_text: str
    category: Optional[str] = None
    check_frequency: str = "daily"


class UpdatePromptRequest(BaseModel):
    prompt_text: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None
    check_frequency: Optional[str] = None


class CheckPromptRequest(BaseModel):
    brand_name: str
    competitors: Optional[List[str]] = None
    models: Optional[List[str]] = None


@router.get("/{brand_id}")
async def get_tracked_prompts(
    brand_id: str,
    active_only: bool = True,
    user_id: str = Depends(get_current_user_id)
):
    """Get all tracked prompts for a brand."""
    service = get_prompt_tracking_service()
    prompts = await service.get_tracked_prompts(brand_id, active_only)
    return {"prompts": prompts, "count": len(prompts)}


@router.post("/{brand_id}")
async def create_tracked_prompt(
    brand_id: str,
    request: CreatePromptRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Create a new tracked prompt for a brand."""
    service = get_prompt_tracking_service()
    result = await service.create_tracked_prompt(
        brand_id=brand_id,
        prompt_text=request.prompt_text,
        category=request.category,
        check_frequency=request.check_frequency
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to create prompt"))
    
    return result


@router.put("/{prompt_id}")
async def update_tracked_prompt(
    prompt_id: str,
    request: UpdatePromptRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Update a tracked prompt."""
    service = get_prompt_tracking_service()
    
    updates = {}
    if request.prompt_text is not None:
        updates["prompt_text"] = request.prompt_text
    if request.category is not None:
        updates["category"] = request.category
    if request.is_active is not None:
        updates["is_active"] = request.is_active
    if request.check_frequency is not None:
        updates["check_frequency"] = request.check_frequency
    
    result = await service.update_tracked_prompt(prompt_id, updates)
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to update prompt"))
    
    return result


@router.delete("/{prompt_id}")
async def delete_tracked_prompt(
    prompt_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Delete a tracked prompt."""
    service = get_prompt_tracking_service()
    success = await service.delete_tracked_prompt(prompt_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Prompt not found or could not be deleted")
    
    return {"success": True, "message": "Prompt deleted"}


@router.post("/{prompt_id}/check")
async def check_prompt(
    prompt_id: str,
    request: CheckPromptRequest,
    user_id: str = Depends(get_current_user_id)
):
    """
    Check a single prompt across AI models.
    
    This will query the AI models with the prompt and check for brand visibility.
    """
    service = get_prompt_tracking_service()
    result = await service.check_prompt(
        prompt_id=prompt_id,
        brand_name=request.brand_name,
        competitors=request.competitors,
        models=request.models
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Check failed"))
    
    return result


@router.get("/{prompt_id}/history")
async def get_prompt_history(
    prompt_id: str,
    limit: int = 50,
    user_id: str = Depends(get_current_user_id)
):
    """Get historical check results for a prompt."""
    service = get_prompt_tracking_service()
    history = await service.get_prompt_history(prompt_id, limit)
    return {"history": history, "count": len(history)}


@router.post("/{brand_id}/check-all")
async def check_all_prompts(
    brand_id: str,
    request: CheckPromptRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Check all active prompts for a brand."""
    service = get_prompt_tracking_service()
    result = await service.check_all_active_prompts(
        brand_id=brand_id,
        brand_name=request.brand_name,
        competitors=request.competitors
    )
    return result
