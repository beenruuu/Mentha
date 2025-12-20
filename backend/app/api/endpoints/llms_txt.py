"""
llms.txt API Endpoint - Generate llms.txt files for AI crawlers.
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from typing import List, Dict, Optional

from app.services.generation.llms_txt_service import get_llms_txt_service
from app.api import deps


router = APIRouter(prefix="/llms-txt", tags=["llms.txt"])


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
