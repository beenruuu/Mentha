from pydantic import BaseModel
from typing import Optional, List

class ContentGenerationRequest(BaseModel):
    topic: str
    context: Optional[str] = None
    keywords: Optional[List[str]] = None
    target_audience: Optional[str] = None
