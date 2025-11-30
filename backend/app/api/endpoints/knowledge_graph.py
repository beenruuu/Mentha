"""
Knowledge Graph API Endpoints - Monitor brand presence in knowledge graphs.
"""

import logging
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel, Field

from app.models.auth import UserProfile
from app.api.deps import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/knowledge-graph", tags=["knowledge-graph"])


class KnowledgeGraphMonitorRequest(BaseModel):
    """Request model for knowledge graph monitoring."""
    brand_name: str = Field(..., description="Brand name to monitor")
    domain: str = Field(default="", description="Brand's domain")
    aliases: List[str] = Field(default=[], description="Alternative brand names/spellings")


@router.post("/monitor")
async def monitor_knowledge_presence(
    request: KnowledgeGraphMonitorRequest,
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Monitor brand presence in knowledge graphs.
    
    Checks Wikidata, Wikipedia, Google Knowledge Panel, and
    LLM entity recognition for the brand.
    """
    logger.info(f"[API] Knowledge graph monitor request for: {request.brand_name}")
    
    try:
        from app.services.analysis.knowledge_graph_service import get_knowledge_graph_monitor
        service = get_knowledge_graph_monitor()
        
        result = await service.monitor_knowledge_presence(
            brand_name=request.brand_name,
            domain=request.domain,
            aliases=request.aliases
        )
        
        logger.info(f"[API] Knowledge graph monitoring complete for: {request.brand_name}")
        return result
        
    except Exception as e:
        logger.error(f"[API] Knowledge graph monitoring failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/check")
async def quick_knowledge_check(
    brand_name: str,
    current_user: UserProfile = Depends(get_current_user)
):
    """Quick check if brand exists in major knowledge bases."""
    logger.info(f"[API] Quick knowledge check for: {brand_name}")
    
    try:
        from app.services.analysis.knowledge_graph_service import get_knowledge_graph_monitor
        service = get_knowledge_graph_monitor()
        
        # Run a quick Wikipedia check only
        wikipedia_result = await service._check_wikipedia(brand_name)
        
        return {
            "brand_name": brand_name,
            "wikipedia": wikipedia_result,
            "message": "Use /monitor for full knowledge graph analysis"
        }
        
    except Exception as e:
        logger.error(f"[API] Quick knowledge check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
