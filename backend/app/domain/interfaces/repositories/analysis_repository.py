from abc import ABC, abstractmethod
from typing import List, Optional
from uuid import UUID

from app.domain.entities.analysis import Analysis, AnalysisStatus

class AnalysisRepository(ABC):
    
    @abstractmethod
    async def get_by_id(self, analysis_id: UUID) -> Optional[Analysis]:
        pass

    @abstractmethod
    async def get_by_brand(self, brand_id: UUID) -> List[Analysis]:
        pass

    @abstractmethod
    async def get_latest_by_brand(self, brand_id: UUID) -> Optional[Analysis]:
        pass

    @abstractmethod
    async def get_by_user(self, user_id: UUID) -> List[Analysis]:
        pass

    @abstractmethod
    async def create(self, analysis: Analysis) -> Analysis:
        pass

    @abstractmethod
    async def update(self, analysis: Analysis) -> Analysis:
        pass

    @abstractmethod
    async def list_pending(self) -> List[Analysis]:
        pass
