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
from app.services.supabase.database import SupabaseDatabaseService
from app.models.brand import Brand

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


class PromptDiscoverRequest(BaseModel):
    brand_name: str
    industry: Optional[str] = ""
    products: Optional[List[str]] = None
    services: Optional[List[str]] = None
    test_count: int = 10


class PromptSuggestRequest(BaseModel):
    brand_name: str
    industry: Optional[str] = ""
    existing_prompts: Optional[List[str]] = None


class DebugQueryRequest(BaseModel):
    brand_id: UUID
    prompt: str
    providers: Optional[List[str]] = ["openai", "anthropic", "perplexity"]


@router.get("/debug-ping")
async def debug_ping():
    return {"status": "pong", "message": "Backend is reachable and code is updated"}


@router.post("/debug-query")
async def query_ai_providers(
    debug_request: DebugQueryRequest,
    # user_id: str = Depends(get_current_user_id)
):
    """
    Query multiple AI providers with a prompt and check for brand mentions.
    
    Returns responses from each selected provider with mention detection.
    """
    # Get brand info for mention detection
    print(f"DEBUG PAYLOAD: brand_id={debug_request.brand_id}, prompt={debug_request.prompt}, providers={debug_request.providers}")
    
    if not debug_request.brand_id:
        return {"responses": [], "error": "Missing brand_id"}
        
    if not debug_request.prompt:
        return {"responses": [], "error": "Missing prompt"}
        
    from app.services.ai_client_service import get_ai_client
    import asyncio
    
    # Get brand info for mention detection
    brand_service = SupabaseDatabaseService("brands", Brand)
    brand = await brand_service.get(str(debug_request.brand_id))
    brand_name = brand.name if brand else ""
    
    ai_client = get_ai_client()
    
    async def query_provider(provider: str):
        try:
            print(f"Querying {provider}...") # Debug log
            response = await ai_client.query(
                prompt=debug_request.prompt,
                provider=provider,
                max_tokens=800,
                temperature=0.7
            )
            
            if not response.get("success"):
                print(f"Error from {provider}: {response.get('error')}") # Debug log
                return {
                    "provider": provider,
                    "content": "",
                    "mentioned": False,
                    "error": response.get("error", "Unknown error")
                }
                
            content = response.get("content", "")
            
            # Check if brand is mentioned
            mentioned = brand_name.lower() in content.lower() if brand_name else False
            
            return {
                "provider": provider,
                "content": content,
                "mentioned": mentioned
            }
        except Exception as e:
            print(f"Exception querying {provider}: {str(e)}") # Debug log
            import traceback
            traceback.print_exc()
            return {
                "provider": provider,
                "content": "",
                "mentioned": False,
                "error": str(e)
            }
    
    # Query all selected providers in parallel
    valid_providers = [p for p in debug_request.providers if p in ai_client.available_providers]
    
    if not valid_providers:
        return {
            "responses": [],
            "error": "No valid providers available"
        }
    
    tasks = [query_provider(p) for p in valid_providers]
    responses = await asyncio.gather(*tasks)
    
    return {"responses": responses}


@router.post("/discover")
async def discover_effective_prompts(
    request: PromptDiscoverRequest,
    user_id: str = Depends(get_current_user_id)
):
    """
    Discover which prompts trigger brand mentions.
    
    Tests various prompt patterns against AI models and identifies
    which ones result in brand visibility.
    """
    service = get_prompt_tracking_service()
    result = await service.discover_effective_prompts(
        brand_name=request.brand_name,
        industry=request.industry,
        products=request.products,
        services=request.services,
        test_count=request.test_count
    )
    return result


@router.post("/suggest")
async def suggest_prompts(
    request: PromptSuggestRequest,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get AI-powered suggestions for prompts to track.
    
    Returns strategic prompt suggestions based on brand and industry.
    """
    service = get_prompt_tracking_service()
    suggestions = await service.suggest_prompts_for_tracking(
        brand_name=request.brand_name,
        industry=request.industry,
        existing_prompts=request.existing_prompts
    )
    return {"suggestions": suggestions, "count": len(suggestions)}


@router.get("/{brand_id}")
async def get_tracked_prompts(
    brand_id: UUID,
    active_only: bool = True,
    user_id: str = Depends(get_current_user_id)
):
    """Get all tracked prompts for a brand."""
    service = get_prompt_tracking_service()
    prompts = await service.get_tracked_prompts(str(brand_id), active_only)
    return {"prompts": prompts, "count": len(prompts)}


@router.post("/{brand_id}")
async def create_tracked_prompt(
    brand_id: UUID,
    request: CreatePromptRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Create a new tracked prompt for a brand."""
    service = get_prompt_tracking_service()
    result = await service.create_tracked_prompt(
        brand_id=str(brand_id),
        prompt_text=request.prompt_text,
        category=request.category,
        check_frequency=request.check_frequency
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to create prompt"))
    
    return result


@router.put("/{prompt_id}")
async def update_tracked_prompt(
    prompt_id: UUID,
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
    
    result = await service.update_tracked_prompt(str(prompt_id), updates)
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to update prompt"))
    
    return result


@router.delete("/{prompt_id}")
async def delete_tracked_prompt(
    prompt_id: UUID,
    user_id: str = Depends(get_current_user_id)
):
    """Delete a tracked prompt."""
    service = get_prompt_tracking_service()
    success = await service.delete_tracked_prompt(str(prompt_id))
    
    if not success:
        raise HTTPException(status_code=404, detail="Prompt not found or could not be deleted")
    
    return {"success": True, "message": "Prompt deleted"}


@router.post("/{prompt_id}/check")
async def check_prompt(
    prompt_id: UUID,
    request: CheckPromptRequest,
    user_id: str = Depends(get_current_user_id)
):
    """
    Check a single prompt across AI models.
    
    This will query the AI models with the prompt and check for brand visibility.
    """
    service = get_prompt_tracking_service()
    result = await service.check_prompt(
        prompt_id=str(prompt_id),
        brand_name=request.brand_name,
        competitors=request.competitors,
        models=request.models
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Check failed"))
    
    return result


@router.get("/{prompt_id}/history")
async def get_prompt_history(
    prompt_id: UUID,
    limit: int = 50,
    user_id: str = Depends(get_current_user_id)
):
    """Get historical check results for a prompt."""
    service = get_prompt_tracking_service()
    history = await service.get_prompt_history(str(prompt_id), limit)
    return {"history": history, "count": len(history)}


@router.post("/{brand_id}/check-all")
async def check_all_prompts(
    brand_id: UUID,
    request: CheckPromptRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Check all active prompts for a brand."""
    service = get_prompt_tracking_service()
    result = await service.check_all_active_prompts(
        brand_id=str(brand_id),
        brand_name=request.brand_name,
        competitors=request.competitors
    )
    return result

