from typing import Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

class Query(BaseModel):
    id: Optional[UUID] = None
    brand_id: UUID
    user_id: UUID
    analysis_id: Optional[UUID] = None
    title: str
    question: str
    answer: Optional[str] = None
    category: Optional[str] = "general"
    priority: Optional[str] = "medium"
    frequency: Optional[str] = "monthly"
    estimated_volume: Optional[int] = 0
    ai_models: Optional[List[str]] = None
    tracked: Optional[bool] = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
