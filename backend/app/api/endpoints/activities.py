"""
Activity Logs Endpoint - Real-time activity logging for frontend.

Provides endpoints for:
- Getting recent activities
- Streaming real-time updates (SSE)
- Analysis-specific logs
- User action logging
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from typing import Dict, Any, List, Optional
from uuid import UUID
import asyncio
import json

from app.api.deps import get_current_user
from app.models.auth import UserProfile
from app.services.logging.activity_logger import (
    get_activity_logger,
    ActivityType,
    ActivityLevel,
    Activity
)

router = APIRouter()


@router.get("")
async def get_activities(
    limit: int = Query(default=50, le=500),
    brand_id: Optional[str] = None,
    analysis_id: Optional[str] = None,
    session_id: Optional[str] = None,
    activity_type: Optional[str] = None,
    min_level: Optional[str] = None,
    current_user: UserProfile = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get recent activities for the current user.
    
    Query params:
    - limit: Max activities to return (default 50, max 500)
    - brand_id: Filter by brand
    - analysis_id: Filter by analysis
    - session_id: Filter by browser session
    - activity_type: Filter by type (onboarding_start, analysis_phase, etc.)
    - min_level: Minimum level (debug, info, success, warning, error)
    """
    logger = get_activity_logger()
    
    # Parse filters
    types = None
    if activity_type:
        try:
            types = [ActivityType(activity_type)]
        except ValueError:
            pass
    
    level_min = None
    if min_level:
        try:
            level_min = ActivityLevel(min_level)
        except ValueError:
            pass
    
    activities = logger.get_recent(
        limit=limit,
        user_id=current_user.id,
        brand_id=brand_id,
        analysis_id=analysis_id,
        session_id=session_id,
        activity_types=types,
        level_min=level_min
    )
    
    return {
        "activities": [a.to_dict() for a in activities],
        "count": len(activities)
    }


@router.get("/analysis/{analysis_id}")
async def get_analysis_activities(
    analysis_id: UUID,
    current_user: UserProfile = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get all activities for a specific analysis.
    Useful for showing detailed progress of an analysis run.
    """
    logger = get_activity_logger()
    activities = logger.get_analysis_log(str(analysis_id))
    
    return {
        "analysis_id": str(analysis_id),
        "activities": [a.to_dict() for a in activities],
        "count": len(activities)
    }


@router.get("/stream")
async def stream_activities(
    session_id: Optional[str] = None,
    analysis_id: Optional[str] = None,
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Stream real-time activity updates via Server-Sent Events (SSE).
    
    Connect to receive live updates for:
    - All activities (no filter)
    - Session-specific activities (session_id)
    - Analysis-specific activities (analysis_id)
    
    Example JS client:
    ```javascript
    const eventSource = new EventSource('/api/activities/stream?session_id=xxx');
    eventSource.onmessage = (event) => {
        const activity = JSON.parse(event.data);
        console.log('New activity:', activity);
    };
    ```
    """
    logger = get_activity_logger()
    
    # Determine subscription key
    key = analysis_id or session_id or "*"
    queue = logger.subscribe(key)
    
    async def event_generator():
        try:
            # Send initial heartbeat
            yield f"data: {json.dumps({'type': 'connected', 'key': key})}\n\n"
            
            while True:
                try:
                    # Wait for activity with timeout (for keepalive)
                    activity = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield f"data: {json.dumps(activity.to_dict())}\n\n"
                except asyncio.TimeoutError:
                    # Send heartbeat to keep connection alive
                    yield f": heartbeat\n\n"
        finally:
            logger.unsubscribe(key, queue)
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable nginx buffering
        }
    )


@router.post("/log")
async def log_user_action(
    action: Dict[str, Any],
    current_user: UserProfile = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Log a user action from the frontend.
    
    Body:
    {
        "action": "button_click",
        "element": "start_analysis_button",
        "page": "/dashboard/brand/123",
        "session_id": "abc123",
        "metadata": {}
    }
    """
    logger = get_activity_logger()
    
    activity_type = ActivityType.USER_ACTION
    if action.get("action") == "button_click":
        activity_type = ActivityType.BUTTON_CLICK
    elif action.get("action") == "navigation":
        activity_type = ActivityType.NAVIGATION
    
    activity = await logger.log(
        activity_type=activity_type,
        title=action.get("element", "User Action"),
        description=f"Page: {action.get('page', 'unknown')}",
        level=ActivityLevel.DEBUG,
        user_id=current_user.id,
        brand_id=action.get("brand_id"),
        session_id=action.get("session_id"),
        metadata=action.get("metadata", {})
    )
    
    return {"logged": True, "activity_id": activity.id}


@router.post("/onboarding/step")
async def log_onboarding_step(
    step_data: Dict[str, Any],
    current_user: UserProfile = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Log an onboarding step transition.
    
    Body:
    {
        "step": 1,
        "step_name": "Brand URL",
        "action": "User entered brand URL",
        "session_id": "abc123",
        "data": {}
    }
    """
    logger = get_activity_logger()
    
    activity = await logger.log_onboarding_step(
        step=step_data.get("step", 0),
        step_name=step_data.get("step_name", "Unknown"),
        action=step_data.get("action", "Step completed"),
        user_id=current_user.id,
        session_id=step_data.get("session_id"),
        metadata=step_data.get("data", {})
    )
    
    return {"logged": True, "activity_id": activity.id}
