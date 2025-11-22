from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class KeywordBase(BaseModel):
    keyword: str
    brand_id: Optional[UUID] = None
    search_volume: Optional[int] = None
    difficulty: Optional[float] = None
    ai_visibility_score: Optional[float] = None
    tracked: bool = True

class KeywordCreate(KeywordBase):
    pass

class KeywordUpdate(BaseModel):
    keyword: Optional[str] = None
    search_volume: Optional[int] = None
    difficulty: Optional[float] = None
    ai_visibility_score: Optional[float] = None
    tracked: Optional[bool] = None

class Keyword(KeywordBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
