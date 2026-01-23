from uuid import UUID
from app.application.dtos.brand_dto import BrandResponseDTO, BrandUpdateDTO
from app.domain.interfaces.repositories.brand_repository import BrandRepository
from app.domain.exceptions import ResourceNotFoundError, PermissionDeniedError

class UpdateBrandUseCase:
    def __init__(self, brand_repository: BrandRepository):
        self.brand_repository = brand_repository

    async def execute(self, brand_id: UUID, user_id: str, update_data: BrandUpdateDTO) -> BrandResponseDTO:
        # 1. Fetch existing
        existing_brand = await self.brand_repository.get_by_id(brand_id)
        if not existing_brand:
            raise ResourceNotFoundError("Brand", str(brand_id))
            
        # 2. Check ownership (compare as strings to avoid type mismatch)
        if str(existing_brand.user_id) != str(user_id):
            raise PermissionDeniedError("You do not have permission to update this brand")
            
        # 3. Apply updates to the entity
        # Only update fields that are provided (not None)
        fields_to_update = update_data.model_dump(exclude_unset=True)
        
        for field, value in fields_to_update.items():
            if hasattr(existing_brand, field):
                setattr(existing_brand, field, value)
                
        # 4. Save
        updated_brand = await self.brand_repository.update(existing_brand)
        
        return BrandResponseDTO.model_validate(updated_brand)
