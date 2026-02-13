from uuid import UUID
from app.application.dtos.analysis_dto import AnalysisResponseDTO
from app.domain.interfaces.repositories.analysis_repository import AnalysisRepository
from app.domain.exceptions import ResourceNotFoundError, PermissionDeniedError

class GetAnalysisUseCase:
    def __init__(self, analysis_repository: AnalysisRepository):
        self.analysis_repository = analysis_repository

    async def execute(self, analysis_id: UUID, user_id: str) -> AnalysisResponseDTO:
        analysis = await self.analysis_repository.get_by_id(analysis_id)
        if not analysis:
            raise ResourceNotFoundError("Analysis", str(analysis_id))
            
        if str(analysis.user_id) != str(user_id):
            raise PermissionDeniedError("You do not have permission to view this analysis")
            
        return AnalysisResponseDTO.model_validate(analysis)
