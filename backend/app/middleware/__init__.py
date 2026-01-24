"""
Middleware Module for GEO/AEO Backend.

Provides:
- AI Content Negotiation: Serve Markdown to AI bots
- Bot Detection: Identify AI crawlers
- Agent Analytics: Track AI crawler visits server-side
"""

from .ai_content_negotiation import (
    AIContentNegotiationMiddleware,
    is_ai_bot,
    prefers_markdown,
    set_markdown_content,
    convert_html_to_contextual_markdown,
    AI_BOT_SIGNATURES,
)

from .agent_analytics import (
    AgentAnalyticsMiddleware,
    CrawlerEvent,
    BotDetector,
    AI_BOT_REGISTRY,
    get_agent_analytics_middleware,
    set_agent_analytics_middleware,
)

__all__ = [
    # AI Content Negotiation
    "AIContentNegotiationMiddleware",
    "is_ai_bot",
    "prefers_markdown",
    "set_markdown_content",
    "convert_html_to_contextual_markdown",
    "AI_BOT_SIGNATURES",
    # Agent Analytics
    "AgentAnalyticsMiddleware",
    "CrawlerEvent",
    "BotDetector",
    "AI_BOT_REGISTRY",
    "get_agent_analytics_middleware",
    "set_agent_analytics_middleware",
]
