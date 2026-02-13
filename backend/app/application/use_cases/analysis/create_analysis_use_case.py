from uuid import UUID
from datetime import datetime
from app.application.dtos.analysis_dto import AnalysisCreateDTO, AnalysisResponseDTO
from app.domain.entities.analysis import Analysis, AnalysisStatus
from app.domain.interfaces.repositories.analysis_repository import AnalysisRepository
from app.domain.interfaces.repositories.brand_repository import BrandRepository
from app.domain.exceptions import ResourceNotFoundError, PermissionDeniedError

class CreateAnalysisUseCase:
    def __init__(self, analysis_repository: AnalysisRepository, brand_repository: BrandRepository):
        self.analysis_repository = analysis_repository
        self.brand_repository = brand_repository

    async def execute(self, user_id: UUID, analysis_in: AnalysisCreateDTO) -> AnalysisResponseDTO:
        # 1. Verify Brand Ownership if brand_id provided
        if analysis_in.brand_id:
            brand = await self.brand_repository.get_by_id(analysis_in.brand_id)
            if not brand:
                raise ResourceNotFoundError("Brand", str(analysis_in.brand_id))
            if brand.user_id != user_id:
                raise PermissionDeniedError("You do not have permission to analyze this brand")
        
        # 2. Create Analysis Entity
        analysis_entity = Analysis(
            id=None, # DB generated
            user_id=user_id,
            brand_id=analysis_in.brand_id,
            analysis_type=analysis_in.analysis_type,
            status=AnalysisStatus.PENDING,
            input_data=analysis_in.input_data,
            ai_model=analysis_in.ai_model,
            model_name=analysis_in.model_name or "gpt-4o",
            created_at=datetime.utcnow(),
            results={}
        )

        # 3. Save
        created_analysis = await self.analysis_repository.create(analysis_entity)
        
        return AnalysisResponseDTO.model_validate(created_analysis)
