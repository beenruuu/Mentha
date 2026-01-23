"""
Middleware Module for GEO/AEO Backend.

Provides:
- AI Content Negotiation: Serve Markdown to AI bots
- Bot Detection: Identify AI crawlers
"""

from .ai_content_negotiation import (
    AIContentNegotiationMiddleware,
    is_ai_bot,
    prefers_markdown,
    set_markdown_content,
    convert_html_to_contextual_markdown,
    AI_BOT_SIGNATURES,
)

__all__ = [
    "AIContentNegotiationMiddleware",
    "is_ai_bot",
    "prefers_markdown",
    "set_markdown_content",
    "convert_html_to_contextual_markdown",
    "AI_BOT_SIGNATURES",
]
