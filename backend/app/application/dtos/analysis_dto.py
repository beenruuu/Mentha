from pydantic import BaseModel, computed_field
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime
from app.domain.entities.analysis import AnalysisType, AIModel, AnalysisStatus

class AnalysisBase(BaseModel):
    analysis_type: AnalysisType
    input_data: Dict[str, Any]
    ai_model: Optional[AIModel] = None
    model_name: Optional[str] = None

class AnalysisCreateDTO(AnalysisBase):
    brand_id: Optional[UUID] = None

class AnalysisResponseDTO(AnalysisBase):
    id: UUID
    user_id: UUID
    brand_id: Optional[UUID]
    status: AnalysisStatus
    results: Dict[str, Any]
    score: Optional[float]
    error_message: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]

    @computed_field
    def avg_position(self) -> float:
        if not self.results:
            return 0.0
        # Check various locations where this might be stored
        findings = self.results.get('visibility_findings', {})
        if isinstance(findings, dict):
            return float(findings.get('average_position', 0.0))
        return 0.0

    @computed_field
    def inclusion_rate(self) -> float:
        if not self.results:
            return 0.0
        findings = self.results.get('visibility_findings', {})
        if isinstance(findings, dict):
             return float(findings.get('inclusion_rate', 0.0))
        return 0.0

    class Config:
        from_attributes = True
        use_enum_values = True
