from uuid import UUID
from app.application.dtos.brand_dto import BrandCreateDTO, BrandResponseDTO
from app.domain.entities.brand import Brand
from app.domain.interfaces.repositories.brand_repository import BrandRepository

class BrandAlreadyExistsError(Exception):
    pass

class CreateBrandUseCase:
    def __init__(self, brand_repository: BrandRepository):
        self.brand_repository = brand_repository

    async def execute(self, user_id: UUID, brand_in: BrandCreateDTO) -> BrandResponseDTO:
        # Check for duplicates
        existing_brands = await self.brand_repository.get_by_user_id(user_id)
        
        for existing in existing_brands:
            if existing.domain and brand_in.domain and existing.domain.lower() == brand_in.domain.lower():
                raise BrandAlreadyExistsError(f"Ya tienes una marca con el dominio '{brand_in.domain}'")
            if existing.name and brand_in.name and existing.name.lower() == brand_in.name.lower():
                raise BrandAlreadyExistsError(f"Ya tienes una marca con el nombre '{brand_in.name}'")

        # Convert DTO to Entity
        # Note: ID is None initially, DB will generate it (or we generate it here if we want UUID consistency handled by app)
        # Assuming DB handles ID or Repository handles ID generation. Supabase returns created object including ID.
        brand_entity = Brand(
            name=brand_in.name,
            domain=brand_in.domain,
            user_id=user_id,
            logo_url=brand_in.logo_url,
            description=brand_in.description,
            industry=brand_in.industry,
            discovery_prompts=brand_in.discovery_prompts or [],
            ai_providers=brand_in.ai_providers or [],
            services=brand_in.services or [],
            business_scope=brand_in.business_scope,
            city=brand_in.city,
            location=brand_in.location,
            analysis_schedule=brand_in.analysis_schedule or []
        )

        created_brand = await self.brand_repository.create(brand_entity)
        
        return BrandResponseDTO.model_validate(created_brand)
