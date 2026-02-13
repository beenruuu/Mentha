from uuid import UUID
from typing import List
from app.application.dtos.brand_dto import BrandResponseDTO
from app.domain.interfaces.repositories.brand_repository import BrandRepository

class ListBrandsUseCase:
    def __init__(self, brand_repository: BrandRepository):
        self.brand_repository = brand_repository

    async def execute(self, user_id: UUID) -> List[BrandResponseDTO]:
        brands = await self.brand_repository.get_by_user_id(user_id)
        return [BrandResponseDTO.model_validate(brand) for brand in brands]
