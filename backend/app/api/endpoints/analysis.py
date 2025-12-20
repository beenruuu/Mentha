from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import List
from uuid import UUID

from app.api.deps import get_current_user
from app.models.auth import UserProfile
from app.models.analysis import Analysis, AnalysisCreate, AnalysisUpdate, AnalysisStatus, AnalysisType, AIModel
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


@router.get("/status/{brand_id}")
async def get_analysis_status(
    brand_id: UUID,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_analysis_service)
):
    """
    Get the status of the latest analysis for a brand.
    Used by frontend to show progress notification and auto-refresh data.
    
    Returns:
    - status: pending | processing | completed | failed
    - progress: 0-100 (estimated progress percentage)
    - phase: current phase name
    - started_at: when analysis started
    - completed_at: when analysis completed (if done)
    - has_data: whether there's any completed analysis data
    """
    from datetime import datetime, timedelta
    
    # Get the latest analysis for this brand
    analyses = await service.list(
        filters={"brand_id": str(brand_id)},
        order_by="created_at",
        order_desc=True,
        limit=1
    )
    
    if not analyses:
        return {
            "status": "none",
            "progress": 0,
            "phase": None,
            "started_at": None,
            "completed_at": None,
            "has_data": False,
            "message": "No hay análisis programados"
        }
    
    analysis = analyses[0]
    
    # Verify ownership
    if str(analysis.user_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Calculate estimated progress based on time elapsed (analysis typically takes 2-3 min)
    progress = 0
    phase = "Iniciando..."
    
    if analysis.status == AnalysisStatus.pending:
        progress = 5
        phase = "En cola..."
    elif analysis.status == AnalysisStatus.processing:
        # Estimate progress based on time elapsed
        created_at = analysis.created_at
        if created_at:
            elapsed = (datetime.utcnow() - created_at.replace(tzinfo=None)).total_seconds()
            # Assume average analysis takes ~120 seconds
            estimated_duration = 120
            progress = min(int((elapsed / estimated_duration) * 100), 95)
            
            # Determine phase based on progress
            if progress < 15:
                phase = "Resolviendo entidad..."
            elif progress < 35:
                phase = "Recopilando datos web..."
            elif progress < 55:
                phase = "Midiendo visibilidad IA..."
            elif progress < 75:
                phase = "Analizando contenido..."
            elif progress < 90:
                phase = "Generando insights..."
            else:
                phase = "Finalizando..."
        else:
            progress = 50
            phase = "Procesando..."
    elif analysis.status == AnalysisStatus.completed:
        progress = 100
        phase = "Completado"
    elif analysis.status == AnalysisStatus.failed:
        progress = 0
        phase = "Error"
    
    # Check if there's any completed analysis for this brand
    completed_analyses = await service.list(
        filters={"brand_id": str(brand_id), "status": "completed"},
        limit=1
    )
    has_data = len(completed_analyses) > 0
    
    return {
        "status": analysis.status.value if hasattr(analysis.status, 'value') else str(analysis.status),
        "progress": progress,
        "phase": phase,
        "started_at": analysis.created_at.isoformat() if analysis.created_at else None,
        "completed_at": analysis.completed_at.isoformat() if analysis.completed_at else None,
        "has_data": has_data,
        "analysis_id": str(analysis.id),
        "error_message": analysis.error_message if analysis.status == AnalysisStatus.failed else None
    }


@router.post("/trigger/{brand_id}", response_model=Analysis)
async def trigger_analysis_for_brand(
    brand_id: UUID,
    background_tasks: BackgroundTasks,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_analysis_service)
):
    """
    Trigger a new analysis for a specific brand.
    Creates an analysis record and runs the analysis in the background.
    
    The analysis uses input_data populated from the brand's stored data,
    including discovery_prompts configured during onboarding.
    """
    # Import Brand model and service
    from app.models.brand import Brand
    brand_service = SupabaseDatabaseService("brands", Brand)
    
    # Fetch brand data to populate input_data
    brand = await brand_service.get(str(brand_id))
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    # Verify ownership
    if str(brand.user_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to analyze this brand")
    
    # Build input_data from brand information collected during onboarding
    input_data = {
        "brand": {
            "name": brand.name,
            "domain": brand.domain,
            "industry": brand.industry or "",
            "description": brand.description or "",
            "entity_type": brand.entity_type or "business",
            "business_scope": brand.business_scope or "national",
            "city": brand.city or "",
        },
        "objectives": {
            "key_terms": ", ".join(brand.services or []),
        },
        # Include discovery prompts configured during onboarding
        "discovery_prompts": brand.discovery_prompts or [],
        # Include AI providers selected during onboarding
        "ai_providers": brand.ai_providers or [],
        # User's preferred language (default Spanish)
        "preferred_language": "es",
        "user_country": "ES",
    }
    
    # Determine AI model from brand's configured providers
    ai_model = None
    if brand.ai_providers:
        # Use first enabled provider
        first_provider = brand.ai_providers[0] if brand.ai_providers else "chatgpt"
        if first_provider in ["chatgpt", "claude", "perplexity", "gemini"]:
            ai_model = AIModel(first_provider)
    
    # Create analysis record with populated input_data
    data = {
        "user_id": str(current_user.id),
        "brand_id": str(brand_id),
        "status": AnalysisStatus.pending,
        "analysis_type": AnalysisType.domain,
        "input_data": input_data,
    }
    
    if ai_model:
        data["ai_model"] = ai_model
    
    created_analysis = await service.create(data)
    
    # Trigger background task for analysis
    background_tasks.add_task(run_analysis_task, created_analysis.id)
    
    return created_analysis


@router.get("/gap/{brand_id}")
async def get_gap_analysis(
    brand_id: UUID,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_analysis_service)
):
    """
    Calculate content gap analysis between brand and its competitors.
    Aggregates data from all competitors to find missing topics.
    """
    # 1. Get Brand's latest analysis
    brand_analyses = await service.list(
        filters={"brand_id": str(brand_id), "status": "completed"},
        order_by="created_at",
        order_desc=True,
        limit=1
    )
    
    brand_keywords = {}
    if brand_analyses:
        # Extract keywords from the latest analysis
        # Structure depends on how analysis result is stored. 
        # Assuming result['page_analysis']['keywords'] based on PageAnalyzer
        result = brand_analyses[0].result
        if result and 'page_analysis' in result:
            brand_keywords = result['page_analysis'].get('keywords', {})
    
    # 2. Get Competitors
    # We need to access the competitors table. 
    # Since we are in analysis endpoint, we create a new service instance for competitors
    comp_service = SupabaseDatabaseService("competitors", None) # Model not strictly needed for raw queries
    competitors = await comp_service.list(filters={"brand_id": str(brand_id)})
    
    if not competitors:
        return {
            "brand_coverage": {},
            "competitor_avg": {},
            "gaps": [],
            "winning_topics": []
        }
    
    # 3. Aggregate Competitor Data
    all_comp_keywords = {} # kw -> [frequencies]
    
    for comp in competitors:
        # Competitor analysis data is stored in 'analysis_data' column
        # Structure: analysis_data['keyword_gaps'] is a list of gaps, but we need raw keywords
        # The CompetitorAnalyzerService stores full page analysis in comp_page variable but 
        # currently _run_competitor_analysis only stores 'analysis_data' which contains 'keyword_gaps'.
        # We might need to adjust what's stored or work with what we have.
        
        # Checking CompetitorAnalyzerService.analyze_competitor return structure:
        # It returns 'keyword_gaps', 'technical_comparison', 'content_comparison'.
        # It DOES NOT currently return the full keyword list of the competitor.
        # This is a limitation. For now, we will use the 'keyword_gaps' which lists keywords the competitor has.
        
        analysis_data = comp.analysis_data or {}
        gaps = analysis_data.get('keyword_gaps', [])
        
        for gap in gaps:
            kw = gap.get('keyword')
            freq = gap.get('competitor_frequency', 0)
            if kw:
                if kw not in all_comp_keywords:
                    all_comp_keywords[kw] = []
                all_comp_keywords[kw].append(freq)
                
    # 4. Calculate Averages and Gaps
    gap_results = []
    winning_topics = []
    
    # Topics to check (union of brand and competitor keywords)
    all_topics = set(brand_keywords.keys()) | set(all_comp_keywords.keys())
    
    # Categorize topics for the UI (Mock categories for now, or simple heuristics)
    # In a real scenario, we'd use NLP to categorize 'pricing', 'api', etc.
    # For now, we'll just return the raw keywords as topics.
    
    for topic in all_topics:
        brand_freq = brand_keywords.get(topic, 0)
        
        comp_freqs = all_comp_keywords.get(topic, [])
        # Average frequency among competitors who have this keyword
        # Or average among ALL competitors (treating missing as 0)?
        # Let's use average among all competitors to show true "industry standard"
        comp_avg = sum(comp_freqs) / len(competitors) if competitors else 0
        
        diff = brand_freq - comp_avg
        
        item = {
            "topic": topic,
            "brand_score": brand_freq,
            "competitor_avg": comp_avg,
            "diff": diff
        }
        
        if diff < -1: # Brand is missing this significantly
            gap_results.append(item)
        elif diff > 1: # Brand is winning
            winning_topics.append(item)
            
    # Sort by biggest gaps
    gap_results.sort(key=lambda x: x['diff']) # Most negative first
    winning_topics.sort(key=lambda x: x['diff'], reverse=True) # Most positive first
    
    return {
        "critical_gaps": gap_results[:10],
        "winning_topics": winning_topics[:10],
        "competitor_count": len(competitors)
    }

@router.get("/share_of_model/{brand_id}")
async def get_share_of_model(
    brand_id: UUID,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_analysis_service)
):
    """
    Get Share of Model data (Brand vs Competitor mentions in AI responses).
    """
    # Get Brand's latest completed analysis
    brand_analyses = await service.list(
        filters={"brand_id": str(brand_id), "status": "completed"},
        order_by="created_at",
        order_desc=True,
        limit=2
    )
    
    if not brand_analyses:
        return {
            "brand_mentions": 0,
            "competitor_mentions": {},
            "total_mentions": 0,
            "share_of_voice": 0
        }
        
    analysis = brand_analyses[0]
    results = analysis.results or {}
    visibility = results.get("visibility_findings", {})
    
    brand_mentions = visibility.get("mention_count", 0)
    
    # Calculate global mention counts (brand + all competitors)
    # This logic seems to need adjustment as 'visibility' structure might not have competitor info directly.
    # Usually Share of Model is calculated during analysis generation.
    # Check AnalysisService.run_analysis -> generates result structure.
    # Assuming 'share_of_model' is directly in results or derived.
    
    # If share_of_model is pre-calculated in analysis.results
    share_of_model_data = results.get("share_of_model", {})
    if not share_of_model_data:
        # Fallback to visibility data
        sov = visibility.get("share_of_voice", 0)
        competitor_mentions = visibility.get("competitor_mentions", {})
    else:
        sov = share_of_model_data.get("share_of_voice", 0)
        brand_mentions = share_of_model_data.get("brand_mentions", brand_mentions)
        competitor_mentions = share_of_model_data.get("competitor_mentions", visibility.get("competitor_mentions", {}))

    # Fallback Calculation: If SOV is 0 but we have mentions, calculate it dynamically
    # This fixes the issue where dashboard shows 0% even with data
    total_mentions_count = brand_mentions + sum(competitor_mentions.values())
    if sov == 0 and total_mentions_count > 0:
        sov = round((brand_mentions / total_mentions_count) * 100, 1)

    # Calculate Trend
    trend = "stable"
    if len(brand_analyses) > 1:
        prev_analysis = brand_analyses[1]
        prev_results = prev_analysis.results or {}
        prev_sov = prev_results.get("share_of_model", {}).get("share_of_voice", 
                   prev_results.get("visibility_findings", {}).get("share_of_voice", 0))
        
        if sov > prev_sov + 2: # 2% threshold
            trend = "up"
        elif sov < prev_sov - 2:
            trend = "down"
    
    return {
        "brand_mentions": brand_mentions,
        "competitor_mentions": competitor_mentions,
        "total_mentions": brand_mentions + sum(competitor_mentions.values()),
        "share_of_voice": sov,
        "trend": trend
    }
    total_comp_mentions = sum(competitor_mentions.values())
    total_mentions = brand_mentions + total_comp_mentions
    
    share_of_voice = 0
    if total_mentions > 0:
        share_of_voice = round((brand_mentions / total_mentions) * 100, 1)
        
    return {
        "brand_mentions": brand_mentions,
        "competitor_mentions": competitor_mentions,
        "total_mentions": total_mentions,
        "share_of_voice": share_of_voice,
        "last_updated": analysis.completed_at
    }
