from pydantic import BaseModel
from typing import Optional
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

class CompetitorCreate(CompetitorBase):
    pass

class CompetitorUpdate(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    visibility_score: Optional[float] = None
    tracked: Optional[bool] = None
    favicon: Optional[str] = None
    insight: Optional[str] = None

class Competitor(CompetitorBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
