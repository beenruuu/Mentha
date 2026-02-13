from uuid import UUID
from typing import List, Optional
from app.application.dtos.analysis_dto import AnalysisResponseDTO
from app.domain.interfaces.repositories.analysis_repository import AnalysisRepository

class ListAnalysesUseCase:
    def __init__(self, analysis_repository: AnalysisRepository):
        self.analysis_repository = analysis_repository

    async def execute(self, user_id: UUID, brand_id: Optional[UUID] = None) -> List[AnalysisResponseDTO]:
        if brand_id:
            analyses = await self.analysis_repository.get_by_brand(brand_id)
            # Filter by user_id to ensure ownership even if brand_id is guessed?
            # Ideally get_by_brand should check ownership or we trust brand logic.
            # However, for safety:
            analyses = [a for a in analyses if a.user_id == user_id]
        else:
            analyses = await self.analysis_repository.get_by_user(user_id)
            
        return [AnalysisResponseDTO.model_validate(a) for a in analyses]
