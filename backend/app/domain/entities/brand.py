from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional
from uuid import UUID

@dataclass
class Brand:
    name: str
    domain: str
    user_id: UUID
    id: Optional[UUID] = None
    logo_url: Optional[str] = None
    description: Optional[str] = None
    industry: Optional[str] = None
    discovery_prompts: List[str] = field(default_factory=list)
    ai_providers: List[str] = field(default_factory=list)
    services: List[str] = field(default_factory=list)
    entity_type: Optional[str] = None
    business_scope: str = 'national'
    city: Optional[str] = None
    location: Optional[str] = None
    analysis_schedule: List[str] = field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
