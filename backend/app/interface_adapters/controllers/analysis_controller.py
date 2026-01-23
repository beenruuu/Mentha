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
    analysis_service: SupabaseDatabaseService = Depends(get_legacy_analysis_service),
    comp_service: SupabaseDatabaseService = Depends(get_legacy_competitor_service)
):
    """
    Legacy implementation ported to new controller.
    """
    brand_analyses = await analysis_service.list(
        filters={"brand_id": str(brand_id), "status": "completed"},
        order_by="created_at",
        order_desc=True,
        limit=1
    )
    brand_keywords = {}
    if brand_analyses:
        result = brand_analyses[0].results # Legacy model uses .results
        if result and 'content_analysis' in result:
             brand_keywords = result['content_analysis'].get('keywords', {})
        elif result and 'page_analysis' in result:
             brand_keywords = result['page_analysis'].get('keywords', {})

    competitors = await comp_service.list(filters={"brand_id": str(brand_id)})
    if not competitors:
        return {"critical_gaps": [], "winning_topics": [], "competitor_count": 0}

    all_comp_keywords = {} 
    for comp in competitors:
        # Pydantic model access
        analysis_data = comp.analysis_data or {}
        gaps = analysis_data.get('keyword_gaps', [])
        for gap in gaps:
            kw = gap.get('keyword')
            freq = gap.get('competitor_frequency', 0)
            if kw:
                if kw not in all_comp_keywords:
                    all_comp_keywords[kw] = []
                all_comp_keywords[kw].append(freq)
    
    gap_results = []
    winning_topics = []
    all_topics = set(brand_keywords.keys()) | set(all_comp_keywords.keys())
    
    for topic in all_topics:
        brand_freq = brand_keywords.get(topic, 0)
        comp_freqs = all_comp_keywords.get(topic, [])
        comp_avg = sum(comp_freqs) / len(competitors) if competitors else 0
        diff = brand_freq - comp_avg
        item = {"topic": topic, "brand_score": brand_freq, "competitor_avg": comp_avg, "diff": diff}
        if diff < -1: gap_results.append(item)
        elif diff > 1: winning_topics.append(item)
            
    gap_results.sort(key=lambda x: x['diff'])
    winning_topics.sort(key=lambda x: x['diff'], reverse=True)
    return {"critical_gaps": gap_results[:10], "winning_topics": winning_topics[:10], "competitor_count": len(competitors)}

@router.get("/share_of_model/{brand_id}")
async def get_share_of_model(
    brand_id: UUID,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_legacy_analysis_service)
):
    brand_analyses = await service.list(
        filters={"brand_id": str(brand_id), "status": "completed"},
        order_by="created_at",
        order_desc=True,
        limit=2
    )
    if not brand_analyses:
        return {"brand_mentions": 0, "competitor_mentions": {}, "total_mentions": 0, "share_of_voice": 0, "trend": "stable"}
        
    analysis = brand_analyses[0]
    results = analysis.results or {}
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
    if len(brand_analyses) > 1:
        prev_analysis = brand_analyses[1]
        prev_results = prev_analysis.results or {}
        prev_sov = prev_results.get("share_of_model", {}).get("share_of_voice", 
                   prev_results.get("visibility_findings", {}).get("share_of_voice", 0))
        if sov > prev_sov + 2: trend = "up"
        elif sov < prev_sov - 2: trend = "down"
    
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

