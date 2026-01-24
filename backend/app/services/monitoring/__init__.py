"""
Monitoring Module - AI Visibility Monitoring for GEO/AEO.

Provides:
- Browser-based visibility probing with Playwright
- Share of Model metrics calculation
- LLM-as-a-Judge evaluation
- Bot IP verification against CIDR ranges
"""

from .playwright_visibility_service import (
    PlaywrightVisibilityService,
    get_playwright_visibility_service,
    VisibilityProbe,
    ProbeResult,
    ShareOfModelMetrics,
)

from .ip_verification_service import (
    BotIPVerificationService,
    get_ip_verification_service,
    IPRangeCache,
    BOT_IP_SOURCES,
)

__all__ = [
    # Playwright Visibility
    "PlaywrightVisibilityService",
    "get_playwright_visibility_service",
    "VisibilityProbe",
    "ProbeResult",
    "ShareOfModelMetrics",
    # IP Verification
    "BotIPVerificationService",
    "get_ip_verification_service",
    "IPRangeCache",
    "BOT_IP_SOURCES",
]
