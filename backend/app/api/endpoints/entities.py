"""
Entity Tracking API Endpoints.

Endpoints for tracking individual entities (products, services, people)
within a brand's ecosystem across AI models.
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.models.auth import UserProfile
from app.services.analysis.entity_tracking_service import get_entity_tracking_service


router = APIRouter(prefix="/entities", tags=["Entity Tracking"])


class EntityItem(BaseModel):
    name: str
    type: str  # product, service, person, feature
    description: Optional[str] = None


class EntityTrackRequest(BaseModel):
    brand_name: str
    entities: List[EntityItem]
    models: Optional[List[str]] = None


class EntityDiscoverRequest(BaseModel):
    brand_name: str
    domain: str


@router.post("/track")
async def track_entities(
    request: EntityTrackRequest,
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Track visibility of specific entities across AI models.
    
    Entities can be products, services, people, or features.
    Returns visibility metrics for each entity.
    """
    service = get_entity_tracking_service()
    
    try:
        entities = [e.dict() for e in request.entities]
        results = await service.track_entities(
            brand_name=request.brand_name,
            entities=entities,
            models=request.models
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/discover")
async def discover_entities(
    request: EntityDiscoverRequest,
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Automatically discover entities from a brand's website.
    
    Uses AI to analyze the website and extract:
    - Products
    - Services
    - Key people
    - Features
    """
    service = get_entity_tracking_service()
    
    try:
        results = await service.discover_entities(
            brand_name=request.brand_name,
            domain=request.domain
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/track/{brand_id}")
async def track_entities_for_brand(
    brand_id: UUID,
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Track entities for an existing brand by ID.
    
    Auto-discovers entities and tracks their visibility.
    """
    from supabase import create_client
    from app.core.config import settings
    
    try:
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        
        # Get brand
        brand_result = supabase.table("brands").select("*").eq("id", str(brand_id)).single().execute()
        
        if not brand_result.data:
            raise HTTPException(status_code=404, detail="Brand not found")
        
        brand = brand_result.data
        service = get_entity_tracking_service()
        
        # First discover entities
        discovered = await service.discover_entities(
            brand_name=brand["name"],
            domain=brand["domain"]
        )
        
        # Convert to entity list
        entities = []
        for product in discovered.get("products", []):
            entities.append({"name": product, "type": "product"})
        for service_name in discovered.get("services", []):
            entities.append({"name": service_name, "type": "service"})
        for person in discovered.get("people", []):
            entities.append({"name": person, "type": "person"})
        
        if not entities:
            return {
                "brand_name": brand["name"],
                "message": "No entities discovered",
                "discovered": discovered,
                "tracking": None
            }
        
        # Track discovered entities
        tracking = await service.track_entities(
            brand_name=brand["name"],
            entities=entities[:10]  # Limit to 10
        )
        
        return {
            "brand_name": brand["name"],
            "discovered": discovered,
            "tracking": tracking
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
