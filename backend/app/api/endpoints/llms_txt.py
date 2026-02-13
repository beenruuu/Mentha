"""
llms.txt API Endpoint - Generate llms.txt files for AI crawlers.

Provides both:
- POST endpoints for generating llms.txt with custom data
- GET endpoints for public access by AI crawlers (dynamic from database)
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from typing import List, Dict, Optional

from app.services.generation.llms_txt_service import get_llms_txt_service
from app.api import deps


router = APIRouter(prefix="/llms-txt", tags=["llms.txt"])


# ==============================================================================
# PUBLIC GET ENDPOINTS - For AI Crawlers (No Auth Required)
# ==============================================================================

@router.get("/public/{brand_id}", response_class=PlainTextResponse)
async def get_llms_txt_public(brand_id: str):
    """
    GET /llms-txt/public/{brand_id}
    
    Public endpoint for AI crawlers to fetch llms.txt dynamically.
    Content is generated from the Knowledge Graph with PageRank ordering.
    
    No authentication required - designed for GPTBot, ClaudeBot, etc.
    """
    service = get_llms_txt_service()
    
    try:
        content = await service.generate_llms_txt_from_database(
            brand_id=brand_id,
            limit=100
        )
        
        return PlainTextResponse(
            content=content,
            media_type="text/plain; charset=utf-8",
            headers={
                "Cache-Control": "public, max-age=3600",  # Cache 1 hour
                "X-Content-Type-Options": "nosniff",
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate llms.txt: {str(e)}")


@router.get("/public/{brand_id}/full", response_class=PlainTextResponse)
async def get_llms_full_txt_public(brand_id: str):
    """
    GET /llms-txt/public/{brand_id}/full
    
    Public endpoint for AI crawlers to fetch extended llms-full.txt.
    Includes FAQs, team info, and additional content.
    
    No authentication required.
    """
    service = get_llms_txt_service()
    
    try:
        content = await service.generate_llms_full_txt_from_database(
            brand_id=brand_id
        )
        
        return PlainTextResponse(
            content=content,
            media_type="text/plain; charset=utf-8",
            headers={
                "Cache-Control": "public, max-age=3600",
                "X-Content-Type-Options": "nosniff",
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate llms-full.txt: {str(e)}")


class LLMSTxtRequest(BaseModel):
    """Request body for llms.txt generation."""
    brand_name: str
    domain: str
    description: Optional[str] = ""
    industry: Optional[str] = ""
    services: Optional[List[str]] = None
    key_pages: Optional[List[Dict[str, str]]] = None
    contact_info: Optional[Dict[str, str]] = None
    # Extended fields for llms-full.txt
    faqs: Optional[List[Dict[str, str]]] = None
    team: Optional[List[Dict[str, str]]] = None
    testimonials: Optional[List[Dict[str, str]]] = None
    case_studies: Optional[List[Dict[str, str]]] = None


@router.post("", response_class=PlainTextResponse)
async def generate_llms_txt(
    request: LLMSTxtRequest,
    current_user = Depends(deps.get_current_user)
):
    """
    Generate llms.txt content for a brand.
    
    Returns plain text llms.txt content.
    """
    service = get_llms_txt_service()
    
    content = service.generate_llms_txt(
        brand_name=request.brand_name,
        domain=request.domain,
        description=request.description,
        industry=request.industry,
        services=request.services,
        key_pages=request.key_pages,
        contact_info=request.contact_info,
    )
    
    return PlainTextResponse(
        content=content,
        media_type="text/plain",
        headers={"Content-Disposition": f'attachment; filename="llms.txt"'}
    )


@router.post("/full", response_class=PlainTextResponse)
async def generate_llms_full_txt(
    request: LLMSTxtRequest,
    current_user = Depends(deps.get_current_user)
):
    """
    Generate extended llms-full.txt with complete documentation.
    
    Returns plain text llms-full.txt content.
    """
    service = get_llms_txt_service()
    
    content = service.generate_llms_full_txt(
        brand_name=request.brand_name,
        domain=request.domain,
        description=request.description,
        industry=request.industry,
        services=request.services,
        key_pages=request.key_pages,
        faqs=request.faqs,
        team=request.team,
        testimonials=request.testimonials,
        case_studies=request.case_studies,
        contact_info=request.contact_info,
    )
    
    return PlainTextResponse(
        content=content,
        media_type="text/plain",
        headers={"Content-Disposition": f'attachment; filename="llms-full.txt"'}
    )
