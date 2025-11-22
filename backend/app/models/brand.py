from pydantic import BaseModel, HttpUrl
from typing import Optional
from uuid import UUID
from datetime import datetime

class BrandBase(BaseModel):
    name: str
    domain: str
    logo_url: Optional[str] = None
    description: Optional[str] = None
    industry: Optional[str] = None

class BrandCreate(BrandBase):
    pass

class BrandUpdate(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    logo_url: Optional[str] = None
    description: Optional[str] = None
    industry: Optional[str] = None

class Brand(BrandBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
