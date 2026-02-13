from uuid import UUID
from app.domain.interfaces.repositories.brand_repository import BrandRepository
from app.domain.exceptions import ResourceNotFoundError, PermissionDeniedError

class DeleteBrandUseCase:
    def __init__(self, brand_repository: BrandRepository):
        self.brand_repository = brand_repository

    async def execute(self, brand_id: UUID, user_id: str) -> bool:
        # 1. Fetch existing
        existing_brand = await self.brand_repository.get_by_id(brand_id)
        if not existing_brand:
            raise ResourceNotFoundError("Brand", str(brand_id))
            
        # 2. Check ownership (compare as strings to avoid type mismatch)
        if str(existing_brand.user_id) != str(user_id):
            raise PermissionDeniedError("You do not have permission to delete this brand")
            
        # 3. Delete
        return await self.brand_repository.delete(brand_id)
