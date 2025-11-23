from pydantic import BaseModel
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime


class TechnicalAEOBase(BaseModel):
    brand_id: Optional[UUID] = None
    domain: str
    ai_crawler_permissions: Optional[Dict[str, Any]] = None
    schema_types: Optional[list] = None
    schema_completeness: Optional[float] = None
    has_rss: bool = False
    has_api: bool = False
    mobile_responsive: bool = False
    https_score: float = 0.0
    aeo_readiness_score: float = 0.0


class TechnicalAEOCreate(TechnicalAEOBase):
    pass


class TechnicalAEOUpdate(BaseModel):
    ai_crawler_permissions: Optional[Dict[str, Any]] = None
    schema_types: Optional[list] = None
    schema_completeness: Optional[float] = None
    has_rss: Optional[bool] = None
    has_api: Optional[bool] = None
    mobile_responsive: Optional[bool] = None
    https_score: Optional[float] = None
    aeo_readiness_score: Optional[float] = None


class TechnicalAEO(TechnicalAEOBase):
    id: UUID
    user_id: UUID
    last_audit: datetime

    class Config:
        from_attributes = True
