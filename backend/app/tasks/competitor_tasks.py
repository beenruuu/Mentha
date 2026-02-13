from typing import Dict, Any, List
from uuid import UUID
from datetime import datetime
from app.core.celery_app import celery_app
from app.core.async_utils import async_to_sync
import logging

logger = logging.getLogger(__name__)

@celery_app.task(name="analyze_competitor")
def analyze_competitor_task(competitor_id: str, brand_id: str, competitor_url: str):
    """
    Execute detailed competitor analysis (crawling and comparison).
    """
    logger.info(f"Starting analysis for competitor {competitor_id} (Brand: {brand_id})")
    
    async def _process():
        # Avoid circular imports
        from app.services.analysis.competitor_analyzer import CompetitorAnalyzerService
        from app.services.supabase.database import SupabaseDatabaseService
        from app.models.competitor import Competitor
        
        service = SupabaseDatabaseService("competitors", Competitor)
        analyzer = CompetitorAnalyzerService()
        
        try:
            # Fetch brand URL to compare against
            # We use the generic supabase client from the service
            brand_res = service.supabase.table("brands").select("domain").eq("id", str(brand_id)).execute()
            
            if not brand_res.data:
                logger.error(f"Brand {brand_id} not found for competitor analysis")
                return
                
            brand_url = brand_res.data[0]["domain"]
            
            # Run heavy analysis
            results = await analyzer.analyze_competitor(brand_url, competitor_url)
            await analyzer.close()
            
            # Update competitor record with results
            await service.update(str(competitor_id), {
                "analysis_data": results,
                "visibility_score": results.get("visibility_score"),
                "last_analyzed_at": datetime.utcnow().isoformat()
            })
            
            logger.info(f"Competitor {competitor_id} analysis completed successfully")
            
        except Exception as e:
            logger.error(f"Competitor analysis failed: {e}", exc_info=True)
            await analyzer.close()

    return async_to_sync(_process())
