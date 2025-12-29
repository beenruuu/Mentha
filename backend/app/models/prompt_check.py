from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

class PromptCheck(BaseModel):
    id: UUID
    brand_id: UUID
    prompt: str
    providers: List[str]
    results: List[Dict[str, Any]]
    user_id: UUID
    created_at: datetime

    class Config:
        orm_mode = True

class PromptCheckCreate(BaseModel):
    brand_id: UUID
    prompt: str
    providers: List[str]
    results: List[Dict[str, Any]]
    user_id: UUID
