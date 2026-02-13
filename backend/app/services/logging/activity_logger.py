"""
Activity Logger Service - Centralized logging for all user actions and system events.

Provides detailed step-by-step logging for:
- Onboarding flow
- Analysis execution
- Scraping operations
- LLM interactions
- Error tracking

This enables the frontend to show real-time progress of all operations.
"""
import asyncio
import logging
from datetime import datetime
from enum import Enum
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field, asdict
from collections import deque
from uuid import uuid4, UUID
import json

logger = logging.getLogger(__name__)


class ActivityType(str, Enum):
    """Types of activities that can be logged."""
    # Onboarding
    ONBOARDING_START = "onboarding_start"
    ONBOARDING_STEP = "onboarding_step"
    ONBOARDING_BRAND_CREATED = "onboarding_brand_created"
    ONBOARDING_COMPETITOR_DISCOVERY = "onboarding_competitor_discovery"
    ONBOARDING_COMPLETE = "onboarding_complete"
    
    # Analysis
    ANALYSIS_QUEUED = "analysis_queued"
    ANALYSIS_STARTED = "analysis_started"
    ANALYSIS_PHASE = "analysis_phase"
    ANALYSIS_SCRAPING = "analysis_scraping"
    ANALYSIS_NLP = "analysis_nlp"
    ANALYSIS_LLM = "analysis_llm"
    ANALYSIS_VISIBILITY = "analysis_visibility"
    ANALYSIS_COMPLETE = "analysis_complete"
    ANALYSIS_ERROR = "analysis_error"
    
    # Scraping
    SCRAPE_START = "scrape_start"
    SCRAPE_SUCCESS = "scrape_success"
    SCRAPE_FALLBACK = "scrape_fallback"
    SCRAPE_ERROR = "scrape_error"
    
    # LLM
    LLM_REQUEST = "llm_request"
    LLM_RESPONSE = "llm_response"
    LLM_ERROR = "llm_error"
    LLM_CACHE_HIT = "llm_cache_hit"
    
    # User Actions
    USER_ACTION = "user_action"
    BUTTON_CLICK = "button_click"
    NAVIGATION = "navigation"
    
    # Errors
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"


class ActivityLevel(str, Enum):
    """Severity/importance level of activity."""
    DEBUG = "debug"
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"


@dataclass
class Activity:
    """A single logged activity."""
    id: str
    timestamp: datetime
    type: ActivityType
    level: ActivityLevel
    title: str
    description: str
    user_id: Optional[str] = None
    brand_id: Optional[str] = None
    analysis_id: Optional[str] = None
    session_id: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    duration_ms: Optional[int] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat(),
            "type": self.type.value,
            "level": self.level.value,
            "title": self.title,
            "description": self.description,
            "user_id": self.user_id,
            "brand_id": self.brand_id,
            "analysis_id": self.analysis_id,
            "session_id": self.session_id,
            "metadata": self.metadata,
            "duration_ms": self.duration_ms
        }


class ActivityLogger:
    """
    Centralized activity logger for the application.
    
    Features:
    - In-memory circular buffer for recent activities
    - Filtering by user/brand/session
    - Real-time streaming support (SSE/WebSocket ready)
    - Detailed step tracking for complex operations
    """
    
    # Singleton pattern
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
            
        # Circular buffer for recent activities (max 10000)
        self._activities: deque = deque(maxlen=10000)
        
        # Per-session buffers for real-time updates
        self._session_buffers: Dict[str, deque] = {}
        
        # Per-analysis buffers for progress tracking
        self._analysis_buffers: Dict[str, List[Activity]] = {}
        
        # Subscribers for real-time updates
        self._subscribers: Dict[str, List[asyncio.Queue]] = {}
        
        self._initialized = True
        logger.info("[ActivityLogger] 🚀 Initialized")
    
    def _create_activity(
        self,
        activity_type: ActivityType,
        level: ActivityLevel,
        title: str,
        description: str,
        user_id: Optional[str] = None,
        brand_id: Optional[str] = None,
        analysis_id: Optional[str] = None,
        session_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        duration_ms: Optional[int] = None
    ) -> Activity:
        """Create a new activity record."""
        return Activity(
            id=str(uuid4()),
            timestamp=datetime.utcnow(),
            type=activity_type,
            level=level,
            title=title,
            description=description,
            user_id=user_id,
            brand_id=brand_id,
            analysis_id=analysis_id,
            session_id=session_id,
            metadata=metadata or {},
            duration_ms=duration_ms
        )
    
    async def log(
        self,
        activity_type: ActivityType,
        title: str,
        description: str,
        level: ActivityLevel = ActivityLevel.INFO,
        user_id: Optional[str] = None,
        brand_id: Optional[str] = None,
        analysis_id: Optional[str] = None,
        session_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        duration_ms: Optional[int] = None
    ) -> Activity:
        """
        Log an activity.
        
        Args:
            activity_type: Type of activity
            title: Short title for display
            description: Detailed description
            level: Severity level
            user_id: Associated user
            brand_id: Associated brand
            analysis_id: Associated analysis
            session_id: Browser session
            metadata: Additional context
            duration_ms: Operation duration
            
        Returns:
            The created Activity
        """
        activity = self._create_activity(
            activity_type, level, title, description,
            user_id, brand_id, analysis_id, session_id,
            metadata, duration_ms
        )
        
        # Add to main buffer
        self._activities.append(activity)
        
        # Add to session buffer if applicable
        if session_id:
            if session_id not in self._session_buffers:
                self._session_buffers[session_id] = deque(maxlen=500)
            self._session_buffers[session_id].append(activity)
        
        # Add to analysis buffer if applicable
        if analysis_id:
            if analysis_id not in self._analysis_buffers:
                self._analysis_buffers[analysis_id] = []
            self._analysis_buffers[analysis_id].append(activity)
        
        # Notify subscribers
        await self._notify_subscribers(activity)
        
        # Also log to standard logger
        log_level = {
            ActivityLevel.DEBUG: logging.DEBUG,
            ActivityLevel.INFO: logging.INFO,
            ActivityLevel.SUCCESS: logging.INFO,
            ActivityLevel.WARNING: logging.WARNING,
            ActivityLevel.ERROR: logging.ERROR
        }.get(level, logging.INFO)
        
        emoji = {
            ActivityLevel.DEBUG: "🔍",
            ActivityLevel.INFO: "ℹ️",
            ActivityLevel.SUCCESS: "✅",
            ActivityLevel.WARNING: "⚠️",
            ActivityLevel.ERROR: "❌"
        }.get(level, "📝")
        
        logger.log(log_level, f"[{activity_type.value}] {emoji} {title}: {description}")
        
        return activity
    
    async def _notify_subscribers(self, activity: Activity):
        """Notify all relevant subscribers of a new activity."""
        # Notify general subscribers
        if "*" in self._subscribers:
            for queue in self._subscribers["*"]:
                await queue.put(activity)
        
        # Notify session-specific subscribers
        if activity.session_id and activity.session_id in self._subscribers:
            for queue in self._subscribers[activity.session_id]:
                await queue.put(activity)
        
        # Notify analysis-specific subscribers
        if activity.analysis_id and activity.analysis_id in self._subscribers:
            for queue in self._subscribers[activity.analysis_id]:
                await queue.put(activity)
    
    def subscribe(self, key: str = "*") -> asyncio.Queue:
        """
        Subscribe to activity updates.
        
        Args:
            key: Filter key ("*" for all, session_id, or analysis_id)
            
        Returns:
            Queue that will receive Activity objects
        """
        if key not in self._subscribers:
            self._subscribers[key] = []
        queue = asyncio.Queue()
        self._subscribers[key].append(queue)
        return queue
    
    def unsubscribe(self, key: str, queue: asyncio.Queue):
        """Unsubscribe from activity updates."""
        if key in self._subscribers and queue in self._subscribers[key]:
            self._subscribers[key].remove(queue)
    
    def get_recent(
        self,
        limit: int = 100,
        user_id: Optional[str] = None,
        brand_id: Optional[str] = None,
        analysis_id: Optional[str] = None,
        session_id: Optional[str] = None,
        activity_types: Optional[List[ActivityType]] = None,
        level_min: Optional[ActivityLevel] = None
    ) -> List[Activity]:
        """Get recent activities with optional filtering."""
        activities = list(self._activities)
        
        # Filter
        if user_id:
            activities = [a for a in activities if a.user_id == user_id]
        if brand_id:
            activities = [a for a in activities if a.brand_id == brand_id]
        if analysis_id:
            activities = [a for a in activities if a.analysis_id == analysis_id]
        if session_id:
            activities = [a for a in activities if a.session_id == session_id]
        if activity_types:
            activities = [a for a in activities if a.type in activity_types]
        if level_min:
            level_order = [ActivityLevel.DEBUG, ActivityLevel.INFO, ActivityLevel.SUCCESS, ActivityLevel.WARNING, ActivityLevel.ERROR]
            min_idx = level_order.index(level_min)
            activities = [a for a in activities if level_order.index(a.level) >= min_idx]
        
        # Return most recent first
        return sorted(activities, key=lambda a: a.timestamp, reverse=True)[:limit]
    
    def get_analysis_log(self, analysis_id: str) -> List[Activity]:
        """Get all activities for a specific analysis."""
        return self._analysis_buffers.get(analysis_id, [])
    
    def clear_session(self, session_id: str):
        """Clear activities for a session."""
        if session_id in self._session_buffers:
            del self._session_buffers[session_id]
    
    def clear_analysis(self, analysis_id: str):
        """Clear activities for an analysis."""
        if analysis_id in self._analysis_buffers:
            del self._analysis_buffers[analysis_id]
    
    # Convenience methods for common log types
    async def info(self, title: str, description: str, **kwargs):
        return await self.log(ActivityType.INFO, title, description, ActivityLevel.INFO, **kwargs)
    
    async def success(self, title: str, description: str, **kwargs):
        return await self.log(ActivityType.INFO, title, description, ActivityLevel.SUCCESS, **kwargs)
    
    async def warning(self, title: str, description: str, **kwargs):
        return await self.log(ActivityType.WARNING, title, description, ActivityLevel.WARNING, **kwargs)
    
    async def error(self, title: str, description: str, **kwargs):
        return await self.log(ActivityType.ERROR, title, description, ActivityLevel.ERROR, **kwargs)
    
    # Onboarding-specific logging
    async def log_onboarding_step(
        self,
        step: int,
        step_name: str,
        action: str,
        user_id: str,
        session_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Log an onboarding step transition."""
        return await self.log(
            ActivityType.ONBOARDING_STEP,
            f"Onboarding Step {step}: {step_name}",
            action,
            ActivityLevel.INFO,
            user_id=user_id,
            session_id=session_id,
            metadata={"step": step, "step_name": step_name, **(metadata or {})}
        )
    
    # Analysis-specific logging
    async def log_analysis_phase(
        self,
        analysis_id: str,
        phase: str,
        description: str,
        progress: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Log an analysis phase."""
        meta = {"phase": phase, **(metadata or {})}
        if progress is not None:
            meta["progress"] = progress
        
        return await self.log(
            ActivityType.ANALYSIS_PHASE,
            f"Phase: {phase}",
            description,
            ActivityLevel.INFO,
            analysis_id=analysis_id,
            metadata=meta
        )
    
    # Scraping-specific logging
    async def log_scrape(
        self,
        url: str,
        backend: str,
        success: bool,
        duration_ms: Optional[int] = None,
        error: Optional[str] = None,
        analysis_id: Optional[str] = None
    ):
        """Log a scraping operation."""
        if success:
            return await self.log(
                ActivityType.SCRAPE_SUCCESS,
                f"Scraped: {url[:50]}...",
                f"Backend: {backend}",
                ActivityLevel.SUCCESS,
                analysis_id=analysis_id,
                duration_ms=duration_ms,
                metadata={"url": url, "backend": backend}
            )
        else:
            return await self.log(
                ActivityType.SCRAPE_ERROR,
                f"Scrape failed: {url[:50]}...",
                error or "Unknown error",
                ActivityLevel.ERROR,
                analysis_id=analysis_id,
                metadata={"url": url, "backend": backend, "error": error}
            )


# Singleton instance
_activity_logger: Optional[ActivityLogger] = None


def get_activity_logger() -> ActivityLogger:
    """Get singleton instance of ActivityLogger."""
    global _activity_logger
    if _activity_logger is None:
        _activity_logger = ActivityLogger()
    return _activity_logger
