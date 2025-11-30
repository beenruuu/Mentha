from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import List
from uuid import UUID
from datetime import datetime

from app.api.deps import get_current_user
from app.models.auth import UserProfile
from app.models.keyword import Keyword, KeywordCreate, KeywordUpdate
from app.services.supabase.database import SupabaseDatabaseService
from app.services.analysis.ai_visibility_service import get_ai_visibility_service

router = APIRouter()

def get_keyword_service():
    return SupabaseDatabaseService("keywords", Keyword)

@router.get("/", response_model=List[Keyword])
async def list_keywords(
    brand_id: UUID = None,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_keyword_service)
):
    filters = {"user_id": current_user.id}
    if brand_id:
        filters["brand_id"] = str(brand_id)
    return await service.list(filters=filters)

@router.post("/", response_model=Keyword)
async def create_keyword(
    keyword: KeywordCreate,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_keyword_service)
):
    data = keyword.dict(exclude_unset=True)
    data["user_id"] = current_user.id
    return await service.create(data)

@router.get("/{keyword_id}", response_model=Keyword)
async def get_keyword(
    keyword_id: UUID,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_keyword_service)
):
    keyword = await service.get(str(keyword_id))
    if not keyword:
        raise HTTPException(status_code=404, detail="Keyword not found")
    if str(keyword.user_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this keyword")
    return keyword

@router.put("/{keyword_id}", response_model=Keyword)
async def update_keyword(
    keyword_id: UUID,
    keyword_update: KeywordUpdate,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_keyword_service)
):
    existing_keyword = await service.get(str(keyword_id))
    if not existing_keyword:
        raise HTTPException(status_code=404, detail="Keyword not found")
    if str(existing_keyword.user_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this keyword")
        
    return await service.update(str(keyword_id), keyword_update.dict(exclude_unset=True))

@router.delete("/{keyword_id}")
async def delete_keyword(
    keyword_id: UUID,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_keyword_service)
):
    existing_keyword = await service.get(str(keyword_id))
    if not existing_keyword:
        raise HTTPException(status_code=404, detail="Keyword not found")
    if str(existing_keyword.user_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this keyword")
        
    success = await service.delete(str(keyword_id))
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete keyword")
    return {"status": "success"}

@router.post("/{keyword_id}/check-visibility", response_model=Keyword)
async def check_keyword_visibility(
    keyword_id: UUID,
    background_tasks: BackgroundTasks,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_keyword_service)
):
    """
    Trigger a real-time AI visibility check for this keyword.
    Queries AI models to see if the brand is mentioned for this keyword.
    """
    keyword = await service.get(str(keyword_id))
    if not keyword:
        raise HTTPException(status_code=404, detail="Keyword not found")
    if str(keyword.user_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Fetch brand name (needed for visibility check)
    # Assuming brand_id is present and we can fetch the brand
    brand_res = service.supabase.table("brands").select("name, domain, industry").eq("id", str(keyword.brand_id)).execute()
    if not brand_res.data:
        raise HTTPException(status_code=400, detail="Brand not found for this keyword")
        
    brand_data = brand_res.data[0]
    
    # Run check in background
    background_tasks.add_task(
        _run_visibility_check,
        keyword_id=keyword_id,
        keyword_text=keyword.keyword,
        brand_data=brand_data,
        service=service
    )
    
    return keyword

async def _run_visibility_check(
    keyword_id: UUID,
    keyword_text: str,
    brand_data: dict,
    service: SupabaseDatabaseService
):
    """Background task to run visibility check."""
    try:
        ai_service = get_ai_visibility_service()
        
        # Measure visibility specifically for this keyword
        # We use the generic measure_visibility but focused on this keyword
        results = await ai_service.measure_visibility(
            brand_name=brand_data["name"],
            domain=brand_data["domain"],
            industry=brand_data["industry"],
            keywords=[keyword_text],
            num_queries=3 # Check 3 variations
        )
        
        # Update keyword record
        await service.update(str(keyword_id), {
            "ai_visibility_score": results.get("overall_score", 0),
            "ai_models": results.get("models", {}),
            "ai_position": int(results.get("overall_score", 0) / 10) if results.get("overall_score", 0) > 0 else 0, # Rough heuristic for position
            "last_checked_at": datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        print(f"Visibility check failed: {e}")
