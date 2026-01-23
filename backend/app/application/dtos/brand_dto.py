from pydantic import BaseModel
from typing import Optional, List, Literal
from uuid import UUID
from datetime import datetime

class BrandBase(BaseModel):
    name: str
    domain: str
    logo_url: Optional[str] = None
    description: Optional[str] = None
    industry: Optional[str] = None

class BrandCreateDTO(BrandBase):
    discovery_prompts: Optional[List[str]] = None
    ai_providers: Optional[List[str]] = None
    services: Optional[List[str]] = None
    business_scope: Optional[Literal['local', 'regional', 'national', 'international']] = 'national'
    city: Optional[str] = None
    location: Optional[str] = None
    analysis_schedule: Optional[List[str]] = None

class BrandUpdateDTO(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    logo_url: Optional[str] = None
    description: Optional[str] = None
    industry: Optional[str] = None
    discovery_prompts: Optional[List[str]] = None
    ai_providers: Optional[List[str]] = None
    business_scope: Optional[Literal['local', 'regional', 'national', 'international']] = None
    city: Optional[str] = None
    location: Optional[str] = None
    analysis_schedule: Optional[List[str]] = None

class BrandResponseDTO(BrandBase):
    id: UUID
    user_id: UUID
    discovery_prompts: Optional[List[str]] = None
    ai_providers: Optional[List[str]] = None
    services: Optional[List[str]] = None
    entity_type: Optional[str] = None
    business_scope: Optional[str] = 'national'
    city: Optional[str] = None
    location: Optional[str] = None
    analysis_schedule: Optional[List[str]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
