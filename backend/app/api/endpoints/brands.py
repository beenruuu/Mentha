from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID

from app.api.deps import get_current_user
from app.models.auth import UserProfile
from app.models.brand import Brand, BrandCreate, BrandUpdate
from app.services.supabase.database import SupabaseDatabaseService
from app.services.supabase.auth import SupabaseAuthService, get_auth_service

router = APIRouter()

def get_brand_service():
    return SupabaseDatabaseService("brands", Brand)

@router.get("/", response_model=List[Brand])
async def list_brands(
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_brand_service)
):
    return await service.list(filters={"user_id": current_user.id})

@router.post("/", response_model=Brand)
async def create_brand(
    brand: BrandCreate,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_brand_service),
    auth_service: SupabaseAuthService = Depends(get_auth_service)
):
    # Check for duplicate brand (same name or domain for this user)
    existing_brands = await service.list(filters={"user_id": current_user.id})
    for existing in existing_brands:
        if existing.domain and brand.domain and existing.domain.lower() == brand.domain.lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Ya tienes una marca con el dominio '{brand.domain}'"
            )
        if existing.name and brand.name and existing.name.lower() == brand.name.lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Ya tienes una marca con el nombre '{brand.name}'"
            )
    
    # Create brand data
    data = brand.model_dump(exclude_unset=True)
    data["user_id"] = current_user.id
    created_brand = await service.create(data)

    # Note: Analysis is NOT triggered here anymore.
    # Use POST /analysis/trigger/{brand_id} to start the analysis after onboarding.

    return created_brand

@router.get("/{brand_id}", response_model=Brand)
async def get_brand(
    brand_id: UUID,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_brand_service)
):
    brand = await service.get(str(brand_id))
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    if str(brand.user_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this brand")
    return brand

@router.put("/{brand_id}", response_model=Brand)
async def update_brand(
    brand_id: UUID,
    brand_update: BrandUpdate,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_brand_service)
):
    # Check ownership first
    existing_brand = await service.get(str(brand_id))
    if not existing_brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    if str(existing_brand.user_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this brand")
        
    return await service.update(str(brand_id), brand_update.dict(exclude_unset=True))

@router.delete("/{brand_id}")
async def delete_brand(
    brand_id: UUID,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_brand_service)
):
    # Check ownership first
    existing_brand = await service.get(str(brand_id))
    if not existing_brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    if str(existing_brand.user_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this brand")
        
    success = await service.delete(str(brand_id))
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete brand")
    return {"status": "success"}
