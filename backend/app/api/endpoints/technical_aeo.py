from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from app.api import deps
from app.services.supabase.database import SupabaseDatabaseService
from app.models.technical_aeo import TechnicalAEO

router = APIRouter()

@router.get("/", response_model=List[TechnicalAEO])
async def get_technical_aeo_audits(
    brand_id: Optional[UUID] = None,
    analysis_id: Optional[UUID] = None,
    current_user: deps.UserProfile = Depends(deps.get_current_user)
):
    """
    Get technical AEO audits.
    """
    db_service = SupabaseDatabaseService("technical_aeo", TechnicalAEO)
    
    filters = {}
    if brand_id:
        filters["brand_id"] = str(brand_id)
    if analysis_id:
        filters["analysis_id"] = str(analysis_id)
        
    # Ensure user can only see their own data (or data for brands they own)
    # The RLS policies on Supabase handle this, but we can also filter by user_id for redundancy
    filters["user_id"] = current_user.id
    
    results = await db_service.list(filters=filters)
    return results

@router.get("/{audit_id}", response_model=TechnicalAEO)
async def get_technical_aeo_audit(
    audit_id: UUID,
    current_user: deps.UserProfile = Depends(deps.get_current_user)
):
    """
    Get a specific technical AEO audit.
    """
    db_service = SupabaseDatabaseService("technical_aeo", TechnicalAEO)
    audit = await db_service.get(str(audit_id))
    
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
        
    if audit.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this audit")
        
    return audit
