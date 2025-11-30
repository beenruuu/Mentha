from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime

class CompetitorBase(BaseModel):
    name: str
    domain: str
    brand_id: Optional[UUID] = None
    visibility_score: Optional[float] = None
    tracked: bool = True
    favicon: Optional[str] = None
    insight: Optional[str] = None
    analysis_data: Optional[Dict[str, Any]] = Field(default_factory=dict)
    last_analyzed_at: Optional[datetime] = None

class CompetitorCreate(CompetitorBase):
    pass

class CompetitorUpdate(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    visibility_score: Optional[float] = None
    tracked: Optional[bool] = None
    favicon: Optional[str] = None
    insight: Optional[str] = None
    analysis_data: Optional[Dict[str, Any]] = None
    last_analyzed_at: Optional[datetime] = None

class Competitor(CompetitorBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
