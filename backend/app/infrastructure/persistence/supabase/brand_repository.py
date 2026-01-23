from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.core.supabase import get_supabase_client
from app.domain.entities.brand import Brand
from app.domain.interfaces.repositories.brand_repository import BrandRepository

class SupabaseBrandRepository(BrandRepository):
    def __init__(self):
        self.supabase = get_supabase_client()
        self.table_name = "brands"

    def _to_entity(self, data: dict) -> Brand:
        return Brand(
            id=UUID(data['id']),
            user_id=UUID(data['user_id']),
            name=data['name'],
            domain=data['domain'],
            logo_url=data.get('logo_url'),
            description=data.get('description'),
            industry=data.get('industry'),
            discovery_prompts=data.get('discovery_prompts') or [],
            ai_providers=data.get('ai_providers') or [],
            services=data.get('services') or [],
            entity_type=data.get('entity_type'),
            business_scope=data.get('business_scope', 'national'),
            city=data.get('city'),
            location=data.get('location'),
            analysis_schedule=data.get('analysis_schedule') or [],
            created_at=datetime.fromisoformat(data['created_at']) if isinstance(data['created_at'], str) else data['created_at'],
            updated_at=datetime.fromisoformat(data['updated_at']) if isinstance(data['updated_at'], str) else data['updated_at']
        )

    def _to_dict(self, brand: Brand) -> dict:
        data = {
            "name": brand.name,
            "domain": brand.domain,
            "user_id": str(brand.user_id),
            "logo_url": brand.logo_url,
            "description": brand.description,
            "industry": brand.industry,
            "discovery_prompts": brand.discovery_prompts,
            "ai_providers": brand.ai_providers,
            "services": brand.services,
            "entity_type": brand.entity_type,
            "business_scope": brand.business_scope,
            "city": brand.city,
            "location": brand.location,
            "analysis_schedule": brand.analysis_schedule,
        }
        # Only include ID if it is set (for updates)
        if brand.id:
            data['id'] = str(brand.id)
            
        return data

    async def get_by_id(self, brand_id: UUID) -> Optional[Brand]:
        response = self.supabase.table(self.table_name).select("*").eq("id", str(brand_id)).execute()
        if not response.data:
            return None
        return self._to_entity(response.data[0])

    async def get_by_user_id(self, user_id: UUID) -> List[Brand]:
        response = self.supabase.table(self.table_name).select("*").eq("user_id", str(user_id)).execute()
        return [self._to_entity(item) for item in response.data]

    async def create(self, brand: Brand) -> Brand:
        data = self._to_dict(brand)
        # Remove ID if None to let DB handle it
        if "id" in data and not data["id"]:
            del data["id"]
            
        response = self.supabase.table(self.table_name).insert(data).execute()
        if not response.data:
            raise ValueError("Failed to create brand")
        return self._to_entity(response.data[0])

    async def update(self, brand: Brand) -> Brand:
        if not brand.id:
            raise ValueError("Brand ID is required for update")
        
        data = self._to_dict(brand)
        response = self.supabase.table(self.table_name).update(data).eq("id", str(brand.id)).execute()
        
        if not response.data:
             raise ValueError("Failed to update brand")
             
        return self._to_entity(response.data[0])

    async def delete(self, brand_id: UUID) -> bool:
        response = self.supabase.table(self.table_name).delete().eq("id", str(brand_id)).execute()
        return bool(response.data)
