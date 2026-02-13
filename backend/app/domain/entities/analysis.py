from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, Any, Optional
from uuid import UUID
from enum import Enum

class AnalysisType(str, Enum):
    DOMAIN = 'domain'
    CONTENT = 'content'
    KEYWORD = 'keyword'
    COMPETITOR = 'competitor'

class AIModel(str, Enum):
    CHATGPT = 'chatgpt'
    CLAUDE = 'claude'
    PERPLEXITY = 'perplexity'
    GEMINI = 'gemini'
    OPENROUTER = 'openrouter'

class AnalysisStatus(str, Enum):
    PENDING = 'pending'
    PROCESSING = 'processing'
    COMPLETED = 'completed'
    FAILED = 'failed'

@dataclass
class Analysis:
    id: UUID
    user_id: UUID
    brand_id: Optional[UUID]
    analysis_type: AnalysisType
    input_data: Dict[str, Any]
    status: AnalysisStatus
    created_at: datetime
    ai_model: Optional[AIModel] = None
    model_name: Optional[str] = None
    results: Dict[str, Any] = field(default_factory=dict)
    score: Optional[float] = None
    error_message: Optional[str] = None
    completed_at: Optional[datetime] = None

    def mark_completed(self, results: Dict[str, Any], score: Optional[float] = None):
        self.status = AnalysisStatus.COMPLETED
        self.results = results
        self.score = score
        self.completed_at = datetime.utcnow()

    def mark_failed(self, error: str):
        self.status = AnalysisStatus.FAILED
        self.error_message = error
        self.completed_at = datetime.utcnow()

    def mark_processing(self):
        self.status = AnalysisStatus.PROCESSING
