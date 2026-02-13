from uuid import UUID
from datetime import datetime
from typing import Dict, Any, List

from app.application.dtos.analysis_dto import AnalysisResponseDTO
from app.domain.entities.analysis import Analysis, AnalysisStatus, AnalysisType, AIModel
from app.domain.interfaces.repositories.analysis_repository import AnalysisRepository
from app.domain.interfaces.repositories.brand_repository import BrandRepository
from app.domain.exceptions import ResourceNotFoundError, PermissionDeniedError

class CreateAnalysisForBrandUseCase:
    def __init__(self, analysis_repository: AnalysisRepository, brand_repository: BrandRepository):
        self.analysis_repository = analysis_repository
        self.brand_repository = brand_repository

    async def execute(self, user_id: UUID, brand_id: UUID) -> AnalysisResponseDTO:
        # 1. Fetch Brand
        brand = await self.brand_repository.get_by_id(brand_id)
        if not brand:
            raise ResourceNotFoundError("Brand", str(brand_id))
        
        # 2. Verify Ownership
        if brand.user_id != user_id:
            raise PermissionDeniedError("You do not have permission to analyze this brand")
            
        # 3. Construct Input Data (Business Logic)
        input_data = {
            "brand": {
                "name": brand.name,
                "domain": brand.domain,
                "industry": brand.industry or "",
                "description": brand.description or "",
                "entity_type": brand.entity_type or "business",
                "business_scope": brand.business_scope or "national",
                "city": brand.city or "",
            },
            "objectives": {
                "key_terms": ", ".join(brand.services or []),
            },
            "discovery_prompts": brand.discovery_prompts or [],
            "ai_providers": brand.ai_providers or [],
            "preferred_language": "es",
            "user_country": "ES",
        }
        
        # 4. Determine AI Model
        ai_model = None
        if brand.ai_providers:
            provider_str = brand.ai_providers[0]
            # Simple mapping, should be robust
            try:
                ai_model = AIModel(provider_str)
            except ValueError:
                pass # Default or None

        # 5. Create Entity
        analysis_entity = Analysis(
            id=None,
            user_id=user_id,
            brand_id=brand_id,
            analysis_type=AnalysisType.DOMAIN,
            status=AnalysisStatus.PENDING,
            input_data=input_data,
            ai_model=ai_model,
            created_at=datetime.utcnow(),
            results={}
        )
        
        # 6. Save
        created_analysis = await self.analysis_repository.create(analysis_entity)
        
        return AnalysisResponseDTO.model_validate(created_analysis)
