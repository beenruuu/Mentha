from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime
from enum import Enum

class Priority(str, Enum):
    low = 'low'
    medium = 'medium'
    high = 'high'
    critical = 'critical'

class Category(str, Enum):
    content = 'content'
    technical = 'technical'
    keywords = 'keywords'
    competitors = 'competitors'
    visibility = 'visibility'

class Effort(str, Enum):
    low = 'low'
    medium = 'medium'
    high = 'high'

class Impact(str, Enum):
    low = 'low'
    medium = 'medium'
    high = 'high'

class Status(str, Enum):
    pending = 'pending'
    in_progress = 'in_progress'
    completed = 'completed'
    dismissed = 'dismissed'

class RecommendationBase(BaseModel):
    analysis_id: Optional[UUID] = None
    brand_id: Optional[UUID] = None
    title: str
    description: str
    priority: Priority
    category: Category
    implementation_effort: Optional[Effort] = None
    expected_impact: Optional[Impact] = None
    status: Status = Status.pending

class RecommendationCreate(RecommendationBase):
    pass

class RecommendationUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[Priority] = None
    category: Optional[Category] = None
    implementation_effort: Optional[Effort] = None
    expected_impact: Optional[Impact] = None
    status: Optional[Status] = None

class Recommendation(RecommendationBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
