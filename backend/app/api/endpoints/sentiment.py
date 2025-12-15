"""
Sentiment Analysis API Endpoints

Endpoints for enhanced sentiment analysis.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional

from app.api.deps import get_current_user_id
from app.services.analysis.sentiment_analysis_service import get_sentiment_analysis_service

router = APIRouter(prefix="/sentiment", tags=["Sentiment Analysis"])


class AnalyzeSentimentRequest(BaseModel):
    brand_name: str
    context_snippets: List[str]
    language: str = "en"


class BrandSentimentRequest(BaseModel):
    brand_name: str
    language: str = "en"


@router.post("/analyze")
async def analyze_sentiment(
    request: AnalyzeSentimentRequest,
    user_id: str = Depends(get_current_user_id)
):
    """
    Analyze sentiment from provided text snippets.
    
    Performs deep sentiment analysis using LLM to classify and score sentiment.
    """
    service = get_sentiment_analysis_service()
    result = await service.analyze_sentiment(
        brand_name=request.brand_name,
        context_snippets=request.context_snippets,
        language=request.language
    )
    return result


@router.post("/{brand_id}/analyze")
async def analyze_brand_sentiment(
    brand_id: str,
    request: BrandSentimentRequest,
    user_id: str = Depends(get_current_user_id)
):
    """
    Analyze sentiment for a brand using existing mentions from database.
    
    Fetches recent brand mentions and performs sentiment analysis.
    """
    service = get_sentiment_analysis_service()
    result = await service.analyze_sentiment_for_brand(
        brand_id=brand_id,
        brand_name=request.brand_name,
        language=request.language
    )
    return result


@router.get("/{brand_id}/history")
async def get_sentiment_history(
    brand_id: str,
    limit: int = 30,
    user_id: str = Depends(get_current_user_id)
):
    """Get historical sentiment analysis for a brand."""
    try:
        from supabase import create_client
        from app.core.config import settings
        
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        
        result = supabase.table("sentiment_analysis").select("*").eq(
            "brand_id", brand_id
        ).order("analyzed_at", desc=True).limit(limit).execute()
        
        return {
            "history": result.data or [],
            "count": len(result.data or [])
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{brand_id}/latest")
async def get_latest_sentiment(
    brand_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Get the latest sentiment analysis for a brand."""
    try:
        from supabase import create_client
        from app.core.config import settings
        
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        
        result = supabase.table("sentiment_analysis").select("*").eq(
            "brand_id", brand_id
        ).order("analyzed_at", desc=True).limit(1).execute()
        
        if result.data:
            return result.data[0]
        
        return {
            "overall_sentiment": "neutral",
            "sentiment_score": 50,
            "message": "No sentiment analysis available yet"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{brand_id}/summary")
async def get_sentiment_summary(
    brand_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Get a summary of sentiment analysis including trends."""
    try:
        from supabase import create_client
        from app.core.config import settings
        
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        
        # Get recent sentiment data
        result = supabase.table("sentiment_analysis").select("*").eq(
            "brand_id", brand_id
        ).order("analyzed_at", desc=True).limit(10).execute()
        
        analyses = result.data or []
        
        if not analyses:
            return {
                "overall_sentiment": "neutral",
                "sentiment_score": 50,
                "trend": "stable",
                "sample_count": 0,
                "message": "No sentiment data available"
            }
        
        # Calculate averages
        avg_score = sum(a.get("sentiment_score", 50) for a in analyses) / len(analyses)
        
        # Determine trend
        service = get_sentiment_analysis_service()
        trend = service.calculate_sentiment_trend(analyses)
        
        # Get latest positive and negative aspects
        latest = analyses[0]
        
        return {
            "overall_sentiment": latest.get("overall_sentiment", "neutral"),
            "sentiment_score": round(avg_score, 1),
            "trend": trend,
            "sample_count": len(analyses),
            "positive_aspects": latest.get("positive_aspects", []),
            "negative_aspects": latest.get("negative_aspects", []),
            "last_analyzed": latest.get("analyzed_at")
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
