from pydantic import BaseModel
from typing import Optional, Literal
from uuid import UUID
from datetime import datetime

# Valid data sources for keyword metrics
DataSource = Literal["google_trends", "serpapi", "estimated", "llm_estimated", "manual"]
TrendDirection = Literal["rising", "stable", "falling"]

class KeywordBase(BaseModel):
    keyword: str
    brand_id: Optional[UUID] = None
    search_volume: Optional[int] = None
    difficulty: Optional[float] = None
    ai_visibility_score: Optional[float] = None
    tracked: bool = True
    # Real metrics fields
    trend_score: Optional[int] = None
    trend_direction: Optional[TrendDirection] = None
    data_source: Optional[DataSource] = "llm_estimated"

class KeywordCreate(KeywordBase):
    pass

class KeywordUpdate(BaseModel):
    keyword: Optional[str] = None
    search_volume: Optional[int] = None
    difficulty: Optional[float] = None
    ai_visibility_score: Optional[float] = None
    tracked: Optional[bool] = None
    trend_score: Optional[int] = None
    trend_direction: Optional[TrendDirection] = None
    data_source: Optional[DataSource] = None

class Keyword(KeywordBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
