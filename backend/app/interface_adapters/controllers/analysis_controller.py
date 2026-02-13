from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user
from app.models.auth import UserProfile
from app.application.dtos.analysis_dto import AnalysisResponseDTO, AnalysisCreateDTO
from app.application.use_cases.analysis.create_analysis_use_case import CreateAnalysisUseCase
from app.application.use_cases.analysis.create_analysis_for_brand_use_case import CreateAnalysisForBrandUseCase
from app.application.use_cases.analysis.get_analysis_use_case import GetAnalysisUseCase
from app.application.use_cases.analysis.list_analyses_use_case import ListAnalysesUseCase
from app.application.use_cases.analysis.get_analysis_status_use_case import GetAnalysisStatusUseCase
from app.tasks.analysis_tasks import run_full_analysis_task

from app.infrastructure.persistence.supabase.analysis_repository import SupabaseAnalysisRepository
from app.infrastructure.persistence.supabase.brand_repository import SupabaseBrandRepository
from app.domain.exceptions import ResourceNotFoundError, PermissionDeniedError

# Legacy dependencies for Gap/Share endpoints (Pragmatic approach)
from app.services.supabase.database import SupabaseDatabaseService
from app.models.analysis import Analysis as LegacyAnalysis
from app.models.competitor import Competitor as LegacyCompetitor

router = APIRouter()

# Dependency Injection
def get_analysis_repo():
    return SupabaseAnalysisRepository()

def get_brand_repo():
    return SupabaseBrandRepository()

def get_create_analysis_use_case(
    analysis_repo: SupabaseAnalysisRepository = Depends(get_analysis_repo),
    brand_repo: SupabaseBrandRepository = Depends(get_brand_repo)
):
    return CreateAnalysisUseCase(analysis_repo, brand_repo)

def get_create_for_brand_use_case(
    analysis_repo: SupabaseAnalysisRepository = Depends(get_analysis_repo),
    brand_repo: SupabaseBrandRepository = Depends(get_brand_repo)
):
    return CreateAnalysisForBrandUseCase(analysis_repo, brand_repo)

def get_get_analysis_use_case(
    analysis_repo: SupabaseAnalysisRepository = Depends(get_analysis_repo)
):
    return GetAnalysisUseCase(analysis_repo)

def get_list_analyses_use_case(
    analysis_repo: SupabaseAnalysisRepository = Depends(get_analysis_repo)
):
    return ListAnalysesUseCase(analysis_repo)

def get_analysis_status_use_case(
    analysis_repo: SupabaseAnalysisRepository = Depends(get_analysis_repo),
    brand_repo: SupabaseBrandRepository = Depends(get_brand_repo)
):
    return GetAnalysisStatusUseCase(analysis_repo, brand_repo)

# Legacy Services Providers
def get_legacy_analysis_service():
    return SupabaseDatabaseService("aeo_analyses", LegacyAnalysis)

def get_legacy_competitor_service():
    return SupabaseDatabaseService("competitors", LegacyCompetitor)

@router.get("/", response_model=List[AnalysisResponseDTO])
async def list_analyses(
    brand_id: Optional[UUID] = None,
    current_user: UserProfile = Depends(get_current_user),
    use_case: ListAnalysesUseCase = Depends(get_list_analyses_use_case)
):
    return await use_case.execute(user_id=current_user.id, brand_id=brand_id)

@router.post("/", response_model=AnalysisResponseDTO)
async def create_analysis(
    analysis_in: AnalysisCreateDTO,
    current_user: UserProfile = Depends(get_current_user),
    use_case: CreateAnalysisUseCase = Depends(get_create_analysis_use_case)
):
    try:
        created = await use_case.execute(user_id=current_user.id, analysis_in=analysis_in)
        # Trigger Celery worker
        run_full_analysis_task.delay(str(created.id))
        return created
    except ResourceNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/trigger/{brand_id}", response_model=AnalysisResponseDTO)
async def trigger_analysis_for_brand(
    brand_id: UUID,
    current_user: UserProfile = Depends(get_current_user),
    use_case: CreateAnalysisForBrandUseCase = Depends(get_create_for_brand_use_case)
):
    try:
        created = await use_case.execute(user_id=current_user.id, brand_id=brand_id)
        # Trigger Celery worker
        run_full_analysis_task.delay(str(created.id))
        return created
    except ResourceNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status/{brand_id}")
async def get_analysis_status(
    brand_id: UUID,
    current_user: UserProfile = Depends(get_current_user),
    use_case: GetAnalysisStatusUseCase = Depends(get_analysis_status_use_case)
):
    try:
        return await use_case.execute(brand_id=brand_id, user_id=current_user.id)
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))

@router.get("/gap/{brand_id}")
async def get_gap_analysis(
    brand_id: UUID,
    current_user: UserProfile = Depends(get_current_user),
    analysis_repo: SupabaseAnalysisRepository = Depends(get_analysis_repo),
    # analysis_service is legacy, we'll use repository pattern
):
    """
    Get Text/Entity Gap Analysis.
    Prefers the new 'Entity Gap' result from enhanced_geo pipeline.
    Falls back to legacy keyword gaps if not available.
    """
    # 1. Try to get latest analysis from repo
    # using get_latest_by_brand from repository
    analysis = await analysis_repo.get_latest_by_brand(brand_id)
    
    if not analysis:
        return {"gaps": [], "scores": {"entity_coverage": 0, "topic_diversity": 0}, "entity_comparison": {}}

    results = analysis.results or {}
    
    # 2. Check for Enhanced GEO Entity Gaps (The new standard)
    if results.get("enhanced_geo") and results["enhanced_geo"].get("entity_gaps"):
        return results["enhanced_geo"]["entity_gaps"]
    
    # 3. Fallback: Legacy Keyword Gap Logic (if enhanced_geo missing)
    # Convert legacy structure to match EntityGapData interface
    brand_keywords = {}
    if 'content_analysis' in results:
         brand_keywords = results['content_analysis'].get('keywords', {})
    elif 'page_analysis' in results:
         brand_keywords = results['page_analysis'].get('keywords', {})

    # We need competitors to calculate gaps in legacy mode.
    # Since we don't have easy access to competitor service here without circular imports or huge refactor,
    # we rely on the competitor data embedded in the analysis result if available.
    competitors_data = results.get("competitors", [])
    
    if not competitors_data and not brand_keywords:
         return {"gaps": [], "scores": {"entity_coverage": 0, "topic_diversity": 0}, "entity_comparison": {}}

    # ... (Simplified Legacy Logic to return empty structure if we can't compute) ...
    # Since legacy logic was broken anyway (keywords missing), 
    # we return a safe empty structure to prevent frontend crash.
    
    return {
        "gaps": [], 
        "scores": {
            "entity_coverage": 0, 
            "topic_diversity": 0
        }, 
        "entity_comparison": {
            "exclusive_to_brand": [],
            "shared_entities": [],
            "competitor_only": []
        }
    }

@router.get("/share_of_model/{brand_id}")
async def get_share_of_model(
    brand_id: UUID,
    current_user: UserProfile = Depends(get_current_user),
    analysis_repo: SupabaseAnalysisRepository = Depends(get_analysis_repo)
    # Service dependencies removed as we use repo directly
):
    # 1. Get latest analysis
    analysis = await analysis_repo.get_latest_by_brand(brand_id)
    if not analysis:
        return {"brand_mentions": 0, "competitor_mentions": {}, "total_mentions": 0, "share_of_voice": 0, "trend": "stable"}
    
    results = analysis.results or {}
    
    # 2. Check for Enhanced GEO SSoV (The new standard)
    if results.get("enhanced_geo") and results["enhanced_geo"].get("ssov"):
        ssov_data = results["enhanced_geo"]["ssov"]
        
        # Extract metrics from new structure
        brand_mentions = ssov_data.get("mentions", {}).get("brand", 0)
        total_mentions = ssov_data.get("mentions", {}).get("total", 0)
        sov_score = ssov_data.get("ssov", {}).get("score", 0)
        
        # Construct competitor breakdown
        comp_breakdown = {}
        for comp in ssov_data.get("competitor_comparisons", []):
            comp_breakdown[comp["competitor"]] = comp.get("competitor_mentions", 0)
            
        trend = ssov_data.get("trend", {}).get("direction", "stable")
        
        return {
            "brand_mentions": brand_mentions,
            "competitor_mentions": comp_breakdown,
            "total_mentions": total_mentions,
            "share_of_voice": sov_score,
            "trend": trend
        }

    # 3. Fallback: Legacy Logic
    # ... (existing fallback logic) ...
    visibility = results.get("visibility_findings", {})
    
    brand_mentions = visibility.get("mention_count", 0)
    share_of_model_data = results.get("share_of_model", {})
    
    if not share_of_model_data:
        sov = visibility.get("share_of_voice", 0)
        competitor_mentions = visibility.get("competitor_mentions", {})
    else:
        sov = share_of_model_data.get("share_of_voice", 0)
        brand_mentions = share_of_model_data.get("brand_mentions", brand_mentions)
        competitor_mentions = share_of_model_data.get("competitor_mentions", visibility.get("competitor_mentions", {}))

    total_mentions_count = brand_mentions + sum(competitor_mentions.values())
    if sov == 0 and total_mentions_count > 0:
        sov = round((brand_mentions / total_mentions_count) * 100, 1)

    trend = "stable"
    # Logic to compare with previous analysis removed for simplicity in fallback, 
    # relying on single analysis snapshot or whatever was implemented.
    
    return {
        "brand_mentions": brand_mentions,
        "competitor_mentions": competitor_mentions,
        "total_mentions": brand_mentions + sum(competitor_mentions.values()),
        "share_of_voice": sov,
        "trend": trend
    }

@router.get("/{analysis_id}", response_model=AnalysisResponseDTO)
async def get_analysis(
    analysis_id: UUID,
    current_user: UserProfile = Depends(get_current_user),
    use_case: GetAnalysisUseCase = Depends(get_get_analysis_use_case)
):
    try:
        return await use_case.execute(analysis_id=analysis_id, user_id=current_user.id)
    except ResourceNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))

