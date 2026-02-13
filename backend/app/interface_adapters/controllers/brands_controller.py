from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_user
from app.models.auth import UserProfile
from app.application.dtos.brand_dto import BrandCreateDTO, BrandUpdateDTO, BrandResponseDTO
from app.application.use_cases.brand.create_brand_use_case import CreateBrandUseCase, BrandAlreadyExistsError
from app.application.use_cases.brand.list_brands_use_case import ListBrandsUseCase
from app.application.use_cases.brand.get_brand_use_case import GetBrandUseCase
from app.application.use_cases.brand.update_brand_use_case import UpdateBrandUseCase
from app.application.use_cases.brand.delete_brand_use_case import DeleteBrandUseCase
from app.domain.exceptions import ResourceNotFoundError, PermissionDeniedError
from app.infrastructure.persistence.supabase.brand_repository import SupabaseBrandRepository

router = APIRouter()

def get_repository():
    return SupabaseBrandRepository()

def get_create_brand_use_case(repo: SupabaseBrandRepository = Depends(get_repository)):
    return CreateBrandUseCase(repo)

def get_list_brands_use_case(repo: SupabaseBrandRepository = Depends(get_repository)):
    return ListBrandsUseCase(repo)

def get_get_brand_use_case(repo: SupabaseBrandRepository = Depends(get_repository)):
    return GetBrandUseCase(repo)

def get_update_brand_use_case(repo: SupabaseBrandRepository = Depends(get_repository)):
    return UpdateBrandUseCase(repo)

def get_delete_brand_use_case(repo: SupabaseBrandRepository = Depends(get_repository)):
    return DeleteBrandUseCase(repo)

@router.get("/", response_model=List[BrandResponseDTO])
async def list_brands(
    current_user: UserProfile = Depends(get_current_user),
    use_case: ListBrandsUseCase = Depends(get_list_brands_use_case)
):
    return await use_case.execute(user_id=current_user.id)

@router.post("/", response_model=BrandResponseDTO)
async def create_brand(
    brand_in: BrandCreateDTO,
    current_user: UserProfile = Depends(get_current_user),
    use_case: CreateBrandUseCase = Depends(get_create_brand_use_case)
):
    try:
        return await use_case.execute(user_id=current_user.id, brand_in=brand_in)
    except BrandAlreadyExistsError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/{brand_id}", response_model=BrandResponseDTO)
async def get_brand(
    brand_id: UUID,
    current_user: UserProfile = Depends(get_current_user),
    use_case: GetBrandUseCase = Depends(get_get_brand_use_case)
):
    try:
        return await use_case.execute(brand_id=brand_id, user_id=current_user.id)
    except ResourceNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))

@router.put("/{brand_id}", response_model=BrandResponseDTO)
async def update_brand(
    brand_id: UUID,
    brand_update: BrandUpdateDTO,
    current_user: UserProfile = Depends(get_current_user),
    use_case: UpdateBrandUseCase = Depends(get_update_brand_use_case)
):
    try:
        return await use_case.execute(brand_id=brand_id, user_id=current_user.id, update_data=brand_update)
    except ResourceNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{brand_id}")
async def delete_brand(
    brand_id: UUID,
    current_user: UserProfile = Depends(get_current_user),
    use_case: DeleteBrandUseCase = Depends(get_delete_brand_use_case)
):
    try:
        await use_case.execute(brand_id=brand_id, user_id=current_user.id)
        return {"status": "success"}
    except ResourceNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))

