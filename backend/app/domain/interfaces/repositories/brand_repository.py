from abc import ABC, abstractmethod
from typing import List, Optional
from uuid import UUID

from app.domain.entities.brand import Brand

class BrandRepository(ABC):
    
    @abstractmethod
    async def get_by_id(self, brand_id: UUID) -> Optional[Brand]:
        pass

    @abstractmethod
    async def get_by_user_id(self, user_id: UUID) -> List[Brand]:
        pass

    @abstractmethod
    async def create(self, brand: Brand) -> Brand:
        pass

    @abstractmethod
    async def update(self, brand: Brand) -> Brand:
        pass

    @abstractmethod
    async def delete(self, brand_id: UUID) -> bool:
        pass
