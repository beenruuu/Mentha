from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class CrawlerLogBase(BaseModel):
    brand_id: Optional[UUID] = None
    crawler_name: str
    user_agent: Optional[str] = None
    pages_crawled: Optional[int] = 0
    visit_date: Optional[datetime] = None


class CrawlerLog(CrawlerLogBase):
    id: UUID

    class Config:
        from_attributes = True
