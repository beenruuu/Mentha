from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from app.api import deps
from app.services.supabase.database import SupabaseDatabaseService
from app.models.query import Query

router = APIRouter()

@router.get("/", response_model=List[Query])
async def get_queries(
    brand_id: Optional[UUID] = None,
    analysis_id: Optional[UUID] = None,
    current_user: deps.UserProfile = Depends(deps.get_current_user)
):
    """
    Get queries for a brand.
    """
    db_service = SupabaseDatabaseService("queries", Query)
    
    filters = {}
    if brand_id:
        filters["brand_id"] = str(brand_id)
    if analysis_id:
        filters["analysis_id"] = str(analysis_id)
        
    # Ensure user can only see their own data
    filters["user_id"] = current_user.id
    
    results = await db_service.list(filters=filters)
    return results

@router.get("/{query_id}", response_model=Query)
async def get_query(
    query_id: UUID,
    current_user: deps.UserProfile = Depends(deps.get_current_user)
):
    """
    Get a specific query.
    """
    db_service = SupabaseDatabaseService("queries", Query)
    query = await db_service.get(str(query_id))
    
    if not query:
        raise HTTPException(status_code=404, detail="Query not found")
        
    if query.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this query")
        
    return query
