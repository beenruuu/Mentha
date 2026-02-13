from enum import Enum
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


class NotificationType(str, Enum):
    analysis_complete = "analysis_complete"
    analysis_failed = "analysis_failed"
    system = "system"
    reminder = "reminder"


class NotificationStatus(str, Enum):
    unread = "unread"
    read = "read"


class NotificationBase(BaseModel):
    title: str
    message: str
    type: NotificationType
    brand_id: Optional[UUID] = None
    status: NotificationStatus = NotificationStatus.unread
    metadata: Optional[Dict[str, Any]] = None


class NotificationCreate(NotificationBase):
    pass


class NotificationUpdate(BaseModel):
    status: Optional[NotificationStatus] = None
    read_at: Optional[datetime] = None


class Notification(NotificationBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    read_at: Optional[datetime] = None

    class Config:
        from_attributes = True
