from typing import Optional
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
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
