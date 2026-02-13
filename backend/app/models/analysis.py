from pydantic import BaseModel, Json
from typing import Optional, Any, Dict
from uuid import UUID
from datetime import datetime
from enum import Enum

class AnalysisType(str, Enum):
    domain = 'domain'
    content = 'content'
    keyword = 'keyword'
    competitor = 'competitor'

class AIModel(str, Enum):
    chatgpt = 'chatgpt'
    claude = 'claude'
    perplexity = 'perplexity'
    gemini = 'gemini'
    openrouter = 'openrouter'

class AnalysisStatus(str, Enum):
    pending = 'pending'
    processing = 'processing'
    completed = 'completed'
    failed = 'failed'

class AnalysisBase(BaseModel):
    brand_id: Optional[UUID] = None
    analysis_type: AnalysisType
    input_data: Dict[str, Any]
    ai_model: Optional[AIModel] = None
    model_name: Optional[str] = None # e.g. "gpt-4", "anthropic/claude-3-opus"

class AnalysisCreate(AnalysisBase):
    pass

class AnalysisUpdate(BaseModel):
    results: Optional[Dict[str, Any]] = None
    score: Optional[float] = None
    status: Optional[AnalysisStatus] = None
    error_message: Optional[str] = None
    completed_at: Optional[datetime] = None

class Analysis(AnalysisBase):
    id: UUID
    user_id: UUID
    results: Optional[Dict[str, Any]] = None
    score: Optional[float] = None
    status: AnalysisStatus
    error_message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
