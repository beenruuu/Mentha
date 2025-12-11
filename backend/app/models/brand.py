from pydantic import BaseModel, HttpUrl
from typing import Optional, List, Literal
from uuid import UUID
from datetime import datetime

class BrandBase(BaseModel):
    name: str
    domain: str
    logo_url: Optional[str] = None
    description: Optional[str] = None
    industry: Optional[str] = None

class BrandCreate(BrandBase):
    # Additional fields for onboarding analysis
    discovery_prompts: Optional[List[str]] = None
    ai_providers: Optional[List[str]] = None
    services: Optional[List[str]] = None
    # Scope-aware fields for competitor discovery
    business_scope: Optional[Literal['local', 'regional', 'national', 'international']] = 'national'
    city: Optional[str] = None

class BrandUpdate(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    logo_url: Optional[str] = None
    description: Optional[str] = None
    industry: Optional[str] = None
    discovery_prompts: Optional[List[str]] = None
    ai_providers: Optional[List[str]] = None
    business_scope: Optional[Literal['local', 'regional', 'national', 'international']] = None
    city: Optional[str] = None

class Brand(BrandBase):
    id: UUID
    user_id: UUID
    organization_id: Optional[UUID] = None
    discovery_prompts: Optional[List[str]] = None
    ai_providers: Optional[List[str]] = None
    services: Optional[List[str]] = None
    entity_type: Optional[str] = None
    business_scope: Optional[str] = 'national'
    city: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

