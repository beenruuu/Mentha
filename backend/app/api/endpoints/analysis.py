from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import List
from uuid import UUID

from app.api.deps import get_current_user
from app.models.auth import UserProfile
from app.models.analysis import Analysis, AnalysisCreate, AnalysisUpdate, AnalysisStatus
from app.services.supabase.database import SupabaseDatabaseService

from app.services.analysis.analysis_service import AnalysisService

router = APIRouter()

def get_analysis_service():
    return SupabaseDatabaseService("aeo_analyses", Analysis)

async def run_analysis_task(analysis_id: UUID):
    service = AnalysisService()
    await service.run_analysis(analysis_id)

@router.get("/", response_model=List[Analysis])
async def list_analyses(
    brand_id: UUID = None,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_analysis_service)
):
    filters = {"user_id": current_user.id}
    if brand_id:
        filters["brand_id"] = str(brand_id)
    return await service.list(filters=filters)

@router.post("/", response_model=Analysis)
async def create_analysis(
    analysis: AnalysisCreate,
    background_tasks: BackgroundTasks,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_analysis_service)
):
    data = analysis.dict(exclude_unset=True)
    # Supabase client can't serialize UUID objects, so cast ids to strings early
    data["user_id"] = str(current_user.id)
    if data.get("brand_id"):
        data["brand_id"] = str(data["brand_id"])
    data["status"] = AnalysisStatus.pending
    
    created_analysis = await service.create(data)
    
    # Trigger background task for analysis
    background_tasks.add_task(run_analysis_task, created_analysis.id)
    
    return created_analysis

@router.get("/{analysis_id}", response_model=Analysis)
async def get_analysis(
    analysis_id: UUID,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_analysis_service)
):
    analysis = await service.get(str(analysis_id))
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    if str(analysis.user_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this analysis")
    return analysis

@router.put("/{analysis_id}", response_model=Analysis)
async def update_analysis(
    analysis_id: UUID,
    analysis_update: AnalysisUpdate,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_analysis_service)
):
    existing_analysis = await service.get(str(analysis_id))
    if not existing_analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    if str(existing_analysis.user_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this analysis")
        
    return await service.update(str(analysis_id), analysis_update.dict(exclude_unset=True))
