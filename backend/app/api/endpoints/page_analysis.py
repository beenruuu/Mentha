"""
Page Analysis Endpoints - API endpoints for SEO/AEO page analysis.
Provides single page analysis and website crawling capabilities.
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4
import asyncio
from datetime import datetime

from app.models.page_analysis import (
    PageAnalysisCreate,
    PageAnalysisResponse,
    WebsiteCrawlRequest,
    WebsiteCrawlResponse,
    PageAnalysisStatus,
    LLMAnalysisResponse,
    PageMetadata,
    ContentAnalysis,
    AEOSignals,
    LinkInfo,
    ImageInfo
)
from app.models.auth import UserProfile
from app.services.analysis.page_analyzer import PageAnalyzer, WebsiteCrawler
from app.services.analysis.llm_seo_analyzer import LLMSEOAnalyzer, analyze_page_with_llm
from app.api.deps import get_current_user
from app.services.supabase.auth import SupabaseAuthService, get_auth_service
from app.crud.crud_page_analysis import CRUDPageAnalysis

router = APIRouter(prefix="/page-analysis", tags=["page-analysis"])

# In-memory storage for crawl status (still useful for transient crawl job tracking)
_crawl_cache = {}


def get_crud_page_analysis(
    auth_service: SupabaseAuthService = Depends(get_auth_service)
) -> CRUDPageAnalysis:
    """Dependency to get CRUDPageAnalysis instance."""
    return CRUDPageAnalysis(auth_service.supabase)


@router.post("/analyze", response_model=PageAnalysisResponse)
async def analyze_page(
    request: PageAnalysisCreate,
    background_tasks: BackgroundTasks,
    current_user: UserProfile = Depends(get_current_user),
    crud: CRUDPageAnalysis = Depends(get_crud_page_analysis)
) -> PageAnalysisResponse:
    """
    Analyze a single page for SEO/AEO signals.
    
    This endpoint performs comprehensive analysis including:
    - Metadata extraction and validation
    - Content analysis (word count, readability)
    - Heading structure analysis
    - Link and image analysis
    - OpenGraph validation
    - Keyword extraction with n-grams
    - AEO-specific signal detection
    
    Optionally, run LLM analysis for deeper insights.
    """
    # Create initial pending record
    analysis_data = {
        "user_id": current_user.id,
        "url": request.url,
        "status": PageAnalysisStatus.processing,
        "created_at": datetime.utcnow().isoformat()
    }
    
    # Check if brand_id is available (could be passed in request or inferred)
    # For now we proceed without brand_id if not provided
    
    db_obj = await crud.create(analysis_data)
    if not db_obj:
        raise HTTPException(status_code=500, detail="Failed to create analysis record")
        
    analysis_id = UUID(db_obj["id"])
    
    # Run analysis in background
    background_tasks.add_task(
        _run_page_analysis,
        analysis_id=analysis_id,
        request=request,
        crud=crud
    )
    
    # Return initial response
    return PageAnalysisResponse(**db_obj)


async def _run_page_analysis(
    analysis_id: UUID,
    request: PageAnalysisCreate,
    crud: CRUDPageAnalysis
):
    """Background task to run page analysis and update DB."""
    try:
        # Perform page analysis
        analyzer = PageAnalyzer()
        result = await analyzer.analyze_page(
            url=request.url,
            analyze_headings=request.analyze_headings,
            analyze_extra_tags=request.analyze_extra_tags,
            extract_links=request.extract_links
        )
        await analyzer.close()
        
        update_data = {}
        
        if result.get("status") == "error":
            update_data["status"] = PageAnalysisStatus.failed
            update_data["error"] = result.get("error", "Unknown error")
        else:
            update_data["status"] = PageAnalysisStatus.completed
            update_data["metadata"] = result.get("metadata", {})
            update_data["content_analysis"] = result.get("content_analysis", {})
            update_data["seo_warnings"] = result.get("seo_warnings", [])
            update_data["headings"] = result.get("headings", {})
            update_data["additional_tags"] = result.get("additional_tags", {})
            update_data["links"] = result.get("links", [])
            update_data["images"] = result.get("images", [])
            update_data["keywords"] = result.get("keywords", {})
            update_data["bigrams"] = result.get("bigrams", {})
            update_data["trigrams"] = result.get("trigrams", {})
            update_data["aeo_signals"] = result.get("aeo_signals", {})
            update_data["content_hash"] = result.get("content_hash")
            
            # Run LLM analysis if requested
            if request.run_llm_analysis:
                try:
                    llm_result = await analyze_page_with_llm(
                        page_data=result,
                        provider=request.llm_provider or "openai"
                    )
                    update_data["llm_analysis"] = llm_result
                except Exception as e:
                    update_data["llm_analysis"] = {"error": str(e)}
        
        # Update DB
        await crud.update(analysis_id, update_data)
        
    except Exception as e:
        await crud.update(analysis_id, {
            "status": PageAnalysisStatus.failed,
            "error": str(e)
        })


@router.get("/analyze/{analysis_id}", response_model=PageAnalysisResponse)
async def get_page_analysis(
    analysis_id: UUID,
    current_user: UserProfile = Depends(get_current_user),
    crud: CRUDPageAnalysis = Depends(get_crud_page_analysis)
) -> PageAnalysisResponse:
    """
    Get a previously completed page analysis by ID.
    """
    result = await crud.get(analysis_id)
    if not result:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    # Verify ownership
    if result.get("user_id") != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return PageAnalysisResponse(**result)


@router.post("/crawl", response_model=WebsiteCrawlResponse)
async def crawl_website(
    request: WebsiteCrawlRequest,
    background_tasks: BackgroundTasks,
    current_user: UserProfile = Depends(get_current_user)
) -> WebsiteCrawlResponse:
    """
    Crawl a website and analyze all pages.
    
    This endpoint will:
    - Parse sitemap if provided
    - Crawl pages starting from base URL
    - Follow internal links (if enabled)
    - Analyze each page for SEO/AEO signals
    - Aggregate keywords across all pages
    - Detect duplicate content
    
    The crawl runs asynchronously. Poll the status endpoint for updates.
    """
    crawl_id = uuid4()
    
    # Initialize response
    response = WebsiteCrawlResponse(
        id=crawl_id,
        user_id=current_user.id,
        base_url=request.base_url,
        status=PageAnalysisStatus.processing
    )
    
    # Store initial state (Crawl results are complex and might need a separate table structure)
    # For now, we keep crawl state in memory but individual pages could be saved to DB if needed
    _crawl_cache[str(crawl_id)] = response
    
    # Run crawl in background
    background_tasks.add_task(
        _run_crawl,
        crawl_id=crawl_id,
        request=request,
        user_id=current_user.id
    )
    
    return response


async def _run_crawl(
    crawl_id: UUID,
    request: WebsiteCrawlRequest,
    user_id: UUID
):
    """Background task to run website crawl."""
    response = _crawl_cache.get(str(crawl_id))
    if not response:
        return
    
    try:
        crawler = WebsiteCrawler(
            max_pages=request.max_pages,
            follow_links=request.follow_links,
            concurrent_requests=5
        )
        
        result = await crawler.crawl(
            base_url=request.base_url,
            sitemap_url=request.sitemap_url
        )
        await crawler.close()
        
        # Update response
        response.status = PageAnalysisStatus.completed
        response.total_pages = result.get("total_pages", 0)
        response.pages = [
            PageAnalysisResponse(
                url=p.get("url", ""),
                status=PageAnalysisStatus.completed,
                metadata=p.get("metadata"),
                content_analysis=p.get("content_analysis"),
                seo_warnings=p.get("seo_warnings", []),
                headings=p.get("headings", {}),
                keywords=p.get("keywords", {}),
                aeo_signals=p.get("aeo_signals"),
                content_hash=p.get("content_hash")
            )
            for p in result.get("pages", [])
        ]
        response.keywords = result.get("keywords", [])
        response.duplicate_pages = result.get("duplicate_pages", [])
        response.errors = result.get("errors", [])
        
        # Run LLM analysis on aggregated data if requested
        if request.run_llm_analysis and response.pages:
            try:
                # Create summary data for LLM
                summary = {
                    "total_pages": response.total_pages,
                    "top_keywords": response.keywords[:20],
                    "duplicate_count": len(response.duplicate_pages),
                    "total_warnings": sum(len(p.seo_warnings) for p in response.pages),
                    "common_warnings": _get_common_warnings(response.pages),
                    "aeo_signals_summary": _summarize_aeo_signals(response.pages)
                }
                
                llm_analyzer = LLMSEOAnalyzer(provider=request.llm_provider or "openai")
                llm_result = await llm_analyzer.analyze_seo_data(summary)
                
                # Store LLM analysis in first page or create summary page
                if response.pages:
                    response.pages[0].llm_analysis = llm_result
            except Exception as e:
                response.errors.append(f"LLM analysis error: {e}")
        
    except Exception as e:
        response.status = PageAnalysisStatus.failed
        response.errors.append(str(e))
    
    _crawl_cache[str(crawl_id)] = response


def _get_common_warnings(pages: List[PageAnalysisResponse]) -> List[dict]:
    """Get most common warnings across pages."""
    from collections import Counter
    all_warnings = []
    for page in pages:
        all_warnings.extend(page.seo_warnings)
    
    counter = Counter(all_warnings)
    return [{"warning": w, "count": c} for w, c in counter.most_common(10)]


def _summarize_aeo_signals(pages: List[PageAnalysisResponse]) -> dict:
    """Summarize AEO signals across all pages."""
    total = len(pages)
    if total == 0:
        return {}
    
    faq_count = sum(1 for p in pages if p.aeo_signals and p.aeo_signals.has_faq_structure)
    howto_count = sum(1 for p in pages if p.aeo_signals and p.aeo_signals.has_how_to_structure)
    article_count = sum(1 for p in pages if p.aeo_signals and p.aeo_signals.has_article_structure)
    
    avg_readiness = sum(
        p.aeo_signals.conversational_readiness_score 
        for p in pages 
        if p.aeo_signals
    ) / total
    
    return {
        "pages_with_faq": faq_count,
        "pages_with_howto": howto_count,
        "pages_with_article_structure": article_count,
        "avg_conversational_readiness": round(avg_readiness, 1)
    }


@router.get("/crawl/{crawl_id}", response_model=WebsiteCrawlResponse)
async def get_crawl_status(
    crawl_id: UUID,
    current_user: UserProfile = Depends(get_current_user)
) -> WebsiteCrawlResponse:
    """
    Get the status and results of a website crawl.
    """
    result = _crawl_cache.get(str(crawl_id))
    if not result:
        raise HTTPException(status_code=404, detail="Crawl not found")
    
    # Verify ownership
    if result.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return result


@router.post("/llm-analyze", response_model=LLMAnalysisResponse)
async def run_llm_analysis(
    page_data: dict,
    provider: Optional[str] = "openai",
    current_user: UserProfile = Depends(get_current_user)
) -> LLMAnalysisResponse:
    """
    Run LLM analysis on provided page data.
    
    This endpoint performs AI-powered analysis including:
    - Entity optimization assessment
    - N-E-E-A-T credibility analysis
    - Conversational readiness evaluation
    - Cross-platform presence analysis
    - Strategic recommendations
    """
    try:
        analyzer = LLMSEOAnalyzer(provider=provider)
        result = await analyzer.analyze_seo_data(page_data)
        
        return LLMAnalysisResponse(
            entity_analysis=result.get("analysis", {}).get("entity_analysis"),
            credibility_analysis=result.get("analysis", {}).get("credibility_analysis"),
            conversation_analysis=result.get("analysis", {}).get("conversation_analysis"),
            platform_presence=result.get("analysis", {}).get("platform_presence"),
            scores=result.get("scores"),
            quick_wins=result.get("quick_wins", []),
            strategic_recommendations=result.get("strategic_recommendations", [])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/keywords/extract")
async def extract_keywords(
    url: str,
    current_user: UserProfile = Depends(get_current_user)
) -> dict:
    """
    Extract keywords from a single page.
    
    Returns keywords, bigrams, and trigrams with frequency counts.
    """
    try:
        analyzer = PageAnalyzer()
        result = await analyzer.analyze_page(
            url=url,
            analyze_headings=False,
            analyze_extra_tags=False,
            extract_links=False
        )
        await analyzer.close()
        
        if result.get("status") == "error":
            raise HTTPException(status_code=400, detail=result.get("error"))
        
        return {
            "url": url,
            "keywords": result.get("keywords", {}),
            "bigrams": result.get("bigrams", {}),
            "trigrams": result.get("trigrams", {}),
            "word_count": result.get("content_analysis", {}).get("word_count", 0)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
