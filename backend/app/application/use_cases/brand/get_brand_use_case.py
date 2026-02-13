from uuid import UUID
from app.application.dtos.brand_dto import BrandResponseDTO
from app.domain.interfaces.repositories.brand_repository import BrandRepository
from app.domain.exceptions import ResourceNotFoundError, PermissionDeniedError

class GetBrandUseCase:
    def __init__(self, brand_repository: BrandRepository):
        self.brand_repository = brand_repository

    async def execute(self, brand_id: UUID, user_id: str) -> BrandResponseDTO:
        brand = await self.brand_repository.get_by_id(brand_id)
        
        if not brand:
            raise ResourceNotFoundError("Brand", str(brand_id))
            
        if str(brand.user_id) != str(user_id):
            raise PermissionDeniedError("You do not have permission to access this brand")
            
        return BrandResponseDTO.model_validate(brand)
