from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_user
from app.models.auth import UserProfile
from app.models.notification import (
    Notification,
    NotificationStatus,
    NotificationUpdate,
)
from app.services.supabase.database import SupabaseDatabaseService

router = APIRouter()


def get_notification_service():
    return SupabaseDatabaseService("notifications", Notification)


@router.get("/", response_model=List[Notification])
async def list_notifications(
    status: Optional[NotificationStatus] = None,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_notification_service),
):
    filters = {"user_id": current_user.id}
    if status:
        filters["status"] = status.value
    return await service.list(filters=filters)


@router.put("/{notification_id}", response_model=Notification)
async def update_notification(
    notification_id: UUID,
    notification_update: NotificationUpdate,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_notification_service),
):
    notification = await service.get(str(notification_id))
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    if str(notification.user_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this notification")

    data = notification_update.dict(exclude_unset=True)
    if notification_update.status == NotificationStatus.read and "read_at" not in data:
        from datetime import datetime

        data["read_at"] = f"{datetime.utcnow().isoformat()}Z"

    return await service.update(str(notification_id), data)


@router.post("/mark-all-read")
async def mark_all_read(
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_notification_service),
):
    from datetime import datetime

    data = {"status": NotificationStatus.read.value, "read_at": f"{datetime.utcnow().isoformat()}Z"}
    # Supabase python client lacks bulk update, so list + update sequentially
    notifications = await service.list(filters={"user_id": current_user.id, "status": NotificationStatus.unread.value})
    for notification in notifications:
        await service.update(str(notification.id), data)
    return {"updated": len(notifications)}
