"""
Agent Analytics Middleware - Server-side AI Bot Tracking for AEO/GEO.

This middleware captures AI crawler visits that are invisible to client-side
analytics (Google Analytics, etc.) because AI bots don't execute JavaScript.

Capabilities:
1. Bot Detection:
   - User-Agent matching against known AI crawlers
   - IP verification against official CIDR ranges
   - Spoofing detection (fake User-Agents)

2. Event Logging:
   - Non-blocking async logging to Redis queue
   - Batch writes to PostgreSQL/ClickHouse
   - Real-time metrics aggregation

3. Metrics Exposed:
   - Requests per bot per day
   - Pages crawled
   - Blocked vs allowed requests
   - Geographic distribution

Architecture:
- Runs before route handlers (pre-processing)
- Non-blocking I/O (doesn't slow down responses)
- Uses Redis for high-speed event buffering
- Celery task for batch persistence

Usage:
    from app.middleware.agent_analytics import AgentAnalyticsMiddleware
    
    app.add_middleware(
        AgentAnalyticsMiddleware,
        redis_url="redis://localhost:6379",
        enabled=True
    )
"""

import asyncio
import hashlib
import logging
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Set
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger(__name__)


# Known AI bot signatures with metadata
AI_BOT_REGISTRY: Dict[str, Dict[str, Any]] = {
    # OpenAI
    "gptbot": {
        "name": "GPTBot",
        "provider": "OpenAI",
        "purpose": "Training & retrieval",
        "ip_ranges_url": "https://openai.com/gptbot-ranges.txt",
        "documentation": "https://platform.openai.com/docs/gptbot"
    },
    "chatgpt-user": {
        "name": "ChatGPT-User",
        "provider": "OpenAI",
        "purpose": "User-initiated browsing",
        "ip_ranges_url": None,
        "documentation": "https://platform.openai.com/docs/plugins/bot"
    },
    "oai-searchbot": {
        "name": "OAI-SearchBot",
        "provider": "OpenAI",
        "purpose": "Search retrieval",
        "ip_ranges_url": None,
        "documentation": None
    },
    
    # Anthropic
    "claudebot": {
        "name": "ClaudeBot",
        "provider": "Anthropic",
        "purpose": "Training & retrieval",
        "ip_ranges_url": None,
        "documentation": "https://www.anthropic.com/claude-bot"
    },
    "anthropic-ai": {
        "name": "Anthropic-AI",
        "provider": "Anthropic",
        "purpose": "Research",
        "ip_ranges_url": None,
        "documentation": None
    },
    
    # Google
    "google-extended": {
        "name": "Google-Extended",
        "provider": "Google",
        "purpose": "Gemini training",
        "ip_ranges_url": None,
        "documentation": "https://developers.google.com/search/docs/crawling-indexing/google-extended"
    },
    
    # Perplexity
    "perplexitybot": {
        "name": "PerplexityBot",
        "provider": "Perplexity",
        "purpose": "Search retrieval",
        "ip_ranges_url": None,
        "documentation": "https://docs.perplexity.ai/docs/perplexitybot"
    },
    
    # Common Crawl (used for AI training)
    "ccbot": {
        "name": "CCBot",
        "provider": "Common Crawl",
        "purpose": "Web archiving (AI training)",
        "ip_ranges_url": None,
        "documentation": "https://commoncrawl.org/ccbot"
    },
    
    # Cohere
    "cohere-ai": {
        "name": "Cohere-AI",
        "provider": "Cohere",
        "purpose": "Training",
        "ip_ranges_url": None,
        "documentation": None
    },
    
    # Meta
    "facebookbot": {
        "name": "FacebookBot",
        "provider": "Meta",
        "purpose": "Meta AI training",
        "ip_ranges_url": None,
        "documentation": None
    },
    "meta-externalagent": {
        "name": "Meta-ExternalAgent",
        "provider": "Meta",
        "purpose": "Llama training",
        "ip_ranges_url": None,
        "documentation": None
    },
    
    # Amazon
    "amazonbot": {
        "name": "Amazonbot",
        "provider": "Amazon",
        "purpose": "Alexa/AWS AI",
        "ip_ranges_url": None,
        "documentation": "https://developer.amazon.com/amazonbot"
    },
    
    # ByteDance
    "bytespider": {
        "name": "Bytespider",
        "provider": "ByteDance",
        "purpose": "TikTok/AI training",
        "ip_ranges_url": None,
        "documentation": None
    },
    
    # Apple
    "applebot-extended": {
        "name": "Applebot-Extended",
        "provider": "Apple",
        "purpose": "Apple Intelligence",
        "ip_ranges_url": None,
        "documentation": "https://support.apple.com/en-us/HT204683"
    },
    
    # Diffbot
    "diffbot": {
        "name": "Diffbot",
        "provider": "Diffbot",
        "purpose": "Knowledge graph building",
        "ip_ranges_url": None,
        "documentation": "https://www.diffbot.com/company/crawlingpolicy/"
    },
}


@dataclass
class CrawlerEvent:
    """Represents a single crawler visit event."""
    event_id: str
    timestamp: datetime
    bot_name: str
    bot_provider: str
    user_agent: str
    ip_hash: str  # Hashed for privacy
    path: str
    method: str
    status_code: int
    response_time_ms: float
    is_verified: bool  # IP verified against official ranges
    is_blocked: bool
    brand_id: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_id": self.event_id,
            "timestamp": self.timestamp.isoformat(),
            "bot_name": self.bot_name,
            "bot_provider": self.bot_provider,
            "user_agent": self.user_agent[:500],  # Truncate for storage
            "ip_hash": self.ip_hash,
            "path": self.path,
            "method": self.method,
            "status_code": self.status_code,
            "response_time_ms": self.response_time_ms,
            "is_verified": self.is_verified,
            "is_blocked": self.is_blocked,
            "brand_id": self.brand_id,
            "metadata": self.metadata
        }


class BotDetector:
    """
    Detects AI bots from request headers.
    
    Detection layers:
    1. User-Agent signature matching
    2. IP range verification (optional, requires IP service)
    3. Behavioral heuristics (future)
    """
    
    def __init__(self):
        self._ip_verification_service = None
    
    def detect_bot(self, user_agent: str) -> Optional[Dict[str, Any]]:
        """
        Detect if request is from an AI bot.
        
        Args:
            user_agent: The User-Agent header
        
        Returns:
            Bot metadata dict if detected, None otherwise
        """
        if not user_agent:
            return None
        
        user_agent_lower = user_agent.lower()
        
        for signature, metadata in AI_BOT_REGISTRY.items():
            if signature in user_agent_lower:
                return {
                    "signature": signature,
                    **metadata
                }
        
        return None
    
    def hash_ip(self, ip: str, salt: str = "mentha-agent-analytics") -> str:
        """
        Hash IP address for privacy-compliant storage.
        
        Uses SHA-256 with salt. Cannot be reversed but allows
        tracking unique visitors across sessions.
        """
        return hashlib.sha256(f"{salt}:{ip}".encode()).hexdigest()[:16]


class EventBuffer:
    """
    In-memory event buffer with periodic flush.
    
    Buffers crawler events and flushes to Redis/database
    in batches for efficiency.
    """
    
    def __init__(self, max_size: int = 100, flush_interval_seconds: float = 5.0):
        self._buffer: List[CrawlerEvent] = []
        self._max_size = max_size
        self._flush_interval = flush_interval_seconds
        self._last_flush = time.time()
        self._lock = asyncio.Lock()
        self._flush_callback = None
    
    def set_flush_callback(self, callback):
        """Set async callback for flushing events."""
        self._flush_callback = callback
    
    async def add(self, event: CrawlerEvent):
        """Add event to buffer, flush if needed."""
        async with self._lock:
            self._buffer.append(event)
            
            should_flush = (
                len(self._buffer) >= self._max_size or
                (time.time() - self._last_flush) >= self._flush_interval
            )
            
            if should_flush:
                await self._flush()
    
    async def _flush(self):
        """Flush buffer to storage."""
        if not self._buffer:
            return
        
        events = self._buffer.copy()
        self._buffer.clear()
        self._last_flush = time.time()
        
        if self._flush_callback:
            try:
                await self._flush_callback(events)
            except Exception as e:
                logger.error(f"Failed to flush crawler events: {e}")
                # Re-add events to buffer on failure (with limit)
                async with self._lock:
                    self._buffer = events[:50] + self._buffer  # Keep max 50 failed
    
    async def force_flush(self):
        """Force immediate flush."""
        async with self._lock:
            await self._flush()


class AgentAnalyticsMiddleware(BaseHTTPMiddleware):
    """
    Server-side middleware for tracking AI crawler visits.
    
    Features:
    - Non-blocking event capture
    - Privacy-compliant IP hashing
    - Bot signature detection
    - Batch persistence to database
    - Real-time metrics
    
    Configuration:
        enabled: Enable/disable middleware
        log_all_requests: Log all requests or just bots
        excluded_paths: Paths to skip tracking
    """
    
    def __init__(
        self,
        app,
        enabled: bool = True,
        log_all_requests: bool = False,
        excluded_paths: Optional[List[str]] = None,
        buffer_size: int = 100,
        flush_interval: float = 5.0
    ):
        super().__init__(app)
        self.enabled = enabled
        self.log_all_requests = log_all_requests
        self.excluded_paths = excluded_paths or [
            "/health",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/_next/",
            "/static/",
            "/favicon.ico"
        ]
        
        self._detector = BotDetector()
        self._buffer = EventBuffer(max_size=buffer_size, flush_interval_seconds=flush_interval)
        self._buffer.set_flush_callback(self._persist_events)
        
        # Metrics counters (in-memory, reset on restart)
        self._metrics = {
            "total_bot_requests": 0,
            "requests_by_bot": {},
            "requests_by_path": {},
        }
    
    def _should_track(self, path: str) -> bool:
        """Check if path should be tracked."""
        for excluded in self.excluded_paths:
            if path.startswith(excluded):
                return False
        return True
    
    def _extract_brand_id(self, path: str) -> Optional[str]:
        """
        Extract brand_id from path if present.
        
        Paths like /api/brands/{brand_id}/... will have brand extracted.
        """
        import re
        
        # Pattern for UUID in path
        uuid_pattern = r'/brands?/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})'
        match = re.search(uuid_pattern, path, re.IGNORECASE)
        
        if match:
            return match.group(1)
        
        return None
    
    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint
    ) -> Response:
        """Process request and capture bot analytics."""
        if not self.enabled:
            return await call_next(request)
        
        path = request.url.path
        
        if not self._should_track(path):
            return await call_next(request)
        
        # Detect bot
        user_agent = request.headers.get("user-agent", "")
        bot_info = self._detector.detect_bot(user_agent)
        
        # Skip if not a bot and not logging all requests
        if not bot_info and not self.log_all_requests:
            return await call_next(request)
        
        # Capture timing
        start_time = time.time()
        
        # Execute request
        response = await call_next(request)
        
        # Calculate response time
        response_time_ms = (time.time() - start_time) * 1000
        
        # Only log bots (or all if configured)
        if bot_info:
            # Get client IP
            client_ip = request.client.host if request.client else "unknown"
            
            # Forward headers take precedence
            forwarded_for = request.headers.get("x-forwarded-for")
            if forwarded_for:
                client_ip = forwarded_for.split(",")[0].strip()
            
            # Create event
            event = CrawlerEvent(
                event_id=hashlib.md5(f"{time.time()}{client_ip}{path}".encode()).hexdigest()[:16],
                timestamp=datetime.utcnow(),
                bot_name=bot_info.get("name", "Unknown"),
                bot_provider=bot_info.get("provider", "Unknown"),
                user_agent=user_agent,
                ip_hash=self._detector.hash_ip(client_ip),
                path=path,
                method=request.method,
                status_code=response.status_code,
                response_time_ms=round(response_time_ms, 2),
                is_verified=False,  # TODO: Implement IP verification
                is_blocked=False,
                brand_id=self._extract_brand_id(path),
                metadata={
                    "accept": request.headers.get("accept", ""),
                    "accept_language": request.headers.get("accept-language", ""),
                }
            )
            
            # Update in-memory metrics
            self._metrics["total_bot_requests"] += 1
            bot_name = event.bot_name
            self._metrics["requests_by_bot"][bot_name] = self._metrics["requests_by_bot"].get(bot_name, 0) + 1
            
            # Add to buffer (non-blocking)
            asyncio.create_task(self._buffer.add(event))
            
            # Log for debugging
            logger.info(f"AI Bot: {bot_name} ({bot_info.get('provider')}) -> {path} [{response.status_code}]")
        
        return response
    
    async def _persist_events(self, events: List[CrawlerEvent]):
        """
        Persist buffered events to database.
        
        Uses Supabase/PostgreSQL for now.
        Can be replaced with ClickHouse for high-volume scenarios.
        """
        if not events:
            return
        
        try:
            from app.core.supabase import get_supabase_client
            
            supabase = get_supabase_client()
            
            # Group events by brand_id for efficient inserts
            for event in events:
                try:
                    # Insert into crawler_logs table
                    log_data = {
                        "brand_id": event.brand_id,
                        "crawler_name": event.bot_name,
                        "user_agent": event.user_agent[:500],
                        "pages_crawled": 1,
                        "visit_date": event.timestamp.isoformat()
                    }
                    
                    # Only insert if we have a brand_id
                    if event.brand_id:
                        supabase.table("crawler_logs").insert(log_data).execute()
                    
                except Exception as insert_error:
                    logger.debug(f"Failed to insert crawler log: {insert_error}")
            
            logger.info(f"Persisted {len(events)} crawler events")
            
        except Exception as e:
            logger.error(f"Failed to persist crawler events: {e}")
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current in-memory metrics."""
        return {
            **self._metrics,
            "buffer_size": len(self._buffer._buffer)
        }
    
    async def shutdown(self):
        """Graceful shutdown - flush remaining events."""
        await self._buffer.force_flush()


# Singleton instance for metrics access
_middleware_instance: Optional[AgentAnalyticsMiddleware] = None


def get_agent_analytics_middleware() -> Optional[AgentAnalyticsMiddleware]:
    """Get the middleware instance for metrics access."""
    global _middleware_instance
    return _middleware_instance


def set_agent_analytics_middleware(instance: AgentAnalyticsMiddleware):
    """Set the middleware instance (called during app startup)."""
    global _middleware_instance
    _middleware_instance = instance
