from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import List
from uuid import UUID

from app.api.deps import get_current_user
from app.models.auth import UserProfile
from app.models.brand import Brand, BrandCreate, BrandUpdate
from app.models.analysis import Analysis, AnalysisType, AnalysisStatus, AIModel
from app.services.supabase.database import SupabaseDatabaseService
from app.services.supabase.auth import SupabaseAuthService, get_auth_service
from app.services.analysis_service import AnalysisService

router = APIRouter()

def get_brand_service():
    return SupabaseDatabaseService("brands", Brand)

async def run_initial_analysis(analysis_id: UUID):
    service = AnalysisService()
    await service.run_analysis(analysis_id)

@router.get("/", response_model=List[Brand])
async def list_brands(
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_brand_service)
):
    return await service.list(filters={"user_id": current_user.id})

@router.post("/", response_model=Brand)
async def create_brand(
    brand: BrandCreate,
    background_tasks: BackgroundTasks,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_brand_service),
    auth_service: SupabaseAuthService = Depends(get_auth_service)
):
    # Extract analysis-specific fields before creating brand
    discovery_prompts = brand.discovery_prompts or []
    ai_providers = brand.ai_providers or []
    services = brand.services or []
    
    # Create brand data (exclude analysis fields)
    data = brand.model_dump(exclude={'discovery_prompts', 'ai_providers', 'services'}, exclude_unset=True)
    data["user_id"] = current_user.id
    created_brand = await service.create(data)

    # Fetch user's preferred language from profile
    try:
        profile_res = auth_service.supabase.table("profiles").select("preferred_language, country").eq("id", current_user.id).execute()
        profile_data = profile_res.data[0] if profile_res.data else {}
        preferred_language = profile_data.get("preferred_language", "en")
        user_country = profile_data.get("country")
    except Exception:
        preferred_language = "en"
        user_country = None

    # Trigger initial analysis with user's preferred language and discovery prompts
    try:
        analysis_db = SupabaseDatabaseService("aeo_analyses", Analysis)
        
        # Build comprehensive input data
        input_data = {
            "brand": data,
            "objectives": {
                "target_audience": "General",
                "ai_goals": ["Visibility", "Authority", "Engagement"]
            },
            "preferred_language": preferred_language,
            "user_country": user_country,
            "source": "brand_creation"
        }
        
        # Include discovery prompts if provided
        if discovery_prompts:
            input_data["prompts"] = discovery_prompts
            input_data["objectives"]["key_terms"] = ", ".join(discovery_prompts)
        
        # Include AI providers if provided
        if ai_providers:
            input_data["providers"] = ai_providers
        
        # Include services for better competitor search
        if services:
            input_data["services"] = services
        
        analysis_data = {
            "user_id": str(current_user.id),
            "brand_id": str(created_brand.id),
            "analysis_type": AnalysisType.domain,
            "status": AnalysisStatus.pending,
            "ai_model": AIModel.chatgpt,
            "input_data": input_data
        }
        created_analysis = await analysis_db.create(analysis_data)
        background_tasks.add_task(run_initial_analysis, created_analysis.id)
    except Exception as e:
        print(f"Failed to trigger initial analysis: {e}")

    return created_brand

@router.get("/{brand_id}", response_model=Brand)
async def get_brand(
    brand_id: UUID,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_brand_service)
):
    brand = await service.get(str(brand_id))
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    if str(brand.user_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this brand")
    return brand

@router.put("/{brand_id}", response_model=Brand)
async def update_brand(
    brand_id: UUID,
    brand_update: BrandUpdate,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_brand_service)
):
    # Check ownership first
    existing_brand = await service.get(str(brand_id))
    if not existing_brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    if str(existing_brand.user_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this brand")
        
    return await service.update(str(brand_id), brand_update.dict(exclude_unset=True))

@router.delete("/{brand_id}")
async def delete_brand(
    brand_id: UUID,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_brand_service)
):
    # Check ownership first
    existing_brand = await service.get(str(brand_id))
    if not existing_brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    if str(existing_brand.user_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this brand")
        
    success = await service.delete(str(brand_id))
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete brand")
    return {"status": "success"}
