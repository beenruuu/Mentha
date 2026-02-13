from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime


class TechnicalAEOBase(BaseModel):
    brand_id: Optional[UUID] = None
    domain: str
    ai_crawler_permissions: Optional[Dict[str, Any]] = None
    schema_types: Optional[List[str]] = None
    schema_completeness: Optional[float] = None
    total_schemas: Optional[int] = 0
    has_faq: bool = False
    has_howto: bool = False
    has_article: bool = False
    has_rss: bool = False
    has_api: bool = False
    mobile_responsive: bool = False
    https_enabled: bool = False
    https_score: float = 0.0
    response_time_ms: Optional[int] = None
    aeo_readiness_score: float = 0.0
    voice_readiness_score: float = 0.0
    recommendations: Optional[List[Dict[str, Any]]] = None


class TechnicalAEOCreate(TechnicalAEOBase):
    pass


class TechnicalAEOUpdate(BaseModel):
    ai_crawler_permissions: Optional[Dict[str, Any]] = None
    schema_types: Optional[List[str]] = None
    schema_completeness: Optional[float] = None
    has_rss: Optional[bool] = None
    has_api: Optional[bool] = None
    mobile_responsive: Optional[bool] = None
    https_score: Optional[float] = None
    aeo_readiness_score: Optional[float] = None
    voice_readiness_score: Optional[float] = None
    recommendations: Optional[List[Dict[str, Any]]] = None


class TechnicalAEO(TechnicalAEOBase):
    id: UUID
    user_id: UUID
    last_audit: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
