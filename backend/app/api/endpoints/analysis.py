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
        limit=1
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
    competitor_mentions = visibility.get("competitor_mentions", {})
    
    # Calculate total mentions (Brand + All Competitors)
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
