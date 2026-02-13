from typing import Dict, Any
from app.core.celery_app import celery_app
from app.core.async_utils import async_to_sync
import logging

logger = logging.getLogger(__name__)

@celery_app.task(name="run_full_analysis")
def run_full_analysis_task(analysis_id: str):
    """
    Execute full AEO analysis workflow for a given analysis ID.
    This replaces the direct AnalysisService.run_analysis call in endpoints.
    """
    logger.info(f"Received analysis request: {analysis_id}")
    
    async def _process():
        try:
            from app.services.analysis.analysis_service import AnalysisService
            
            service = AnalysisService()
            # This is the heavy lifting
            await service.run_analysis(analysis_id)
            
            logger.info(f"Analysis {analysis_id} completed successfully")
            return {"status": "success", "analysis_id": analysis_id}
            
        except Exception as e:
            logger.error(f"Analysis {analysis_id} failed: {e}", exc_info=True)
            # You might want to update status to FAILED in DB here if not handled inside service
            return {"status": "error", "message": str(e)}

    return async_to_sync(_process())
