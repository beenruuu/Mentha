"""
Agent Analytics API Endpoints - Real-time AI Crawler Metrics.

Provides endpoints for:
- Real-time crawler metrics (from middleware)
- Bot registry information
- IP verification status
- Cache statistics
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List
from datetime import datetime, timedelta

from app.api.deps import get_current_user_id
from app.middleware.agent_analytics import get_agent_analytics_middleware, AI_BOT_REGISTRY
from app.services.monitoring.ip_verification_service import get_ip_verification_service
from app.services.llm.semantic_cache_service import get_semantic_cache_service

router = APIRouter()


@router.get("/agent-analytics/metrics")
async def get_realtime_metrics(
    user_id: str = Depends(get_current_user_id)
) -> Dict[str, Any]:
    """
    Get real-time agent analytics metrics.
    
    Returns in-memory metrics from the AgentAnalyticsMiddleware:
    - Total bot requests since server start
    - Requests by bot name
    - Buffer status
    
    Note: These metrics reset on server restart.
    For persistent metrics, use /crawler-logs endpoints.
    """
    middleware = get_agent_analytics_middleware()
    
    if not middleware:
        return {
            "enabled": False,
            "message": "Agent Analytics middleware not initialized",
            "metrics": {}
        }
    
    metrics = middleware.get_metrics()
    
    return {
        "enabled": True,
        "timestamp": datetime.utcnow().isoformat(),
        "metrics": metrics
    }


@router.get("/agent-analytics/bots")
async def get_known_bots(
    user_id: str = Depends(get_current_user_id)
) -> Dict[str, Any]:
    """
    Get registry of known AI bots.
    
    Returns information about all AI crawlers that Mentha can detect:
    - Bot name and provider
    - Purpose (training, retrieval, etc.)
    - IP verification availability
    """
    bots = []
    
    for signature, metadata in AI_BOT_REGISTRY.items():
        bots.append({
            "signature": signature,
            "name": metadata.get("name"),
            "provider": metadata.get("provider"),
            "purpose": metadata.get("purpose"),
            "has_ip_verification": bool(metadata.get("ip_ranges_url")),
            "documentation": metadata.get("documentation")
        })
    
    # Get IP verification status
    ip_service = get_ip_verification_service()
    verifiable_bots = ip_service.get_supported_bots()
    
    return {
        "total_bots": len(bots),
        "bots": bots,
        "ip_verification": verifiable_bots
    }


@router.post("/agent-analytics/verify-ip")
async def verify_bot_ip(
    bot_name: str,
    ip_address: str,
    user_id: str = Depends(get_current_user_id)
) -> Dict[str, Any]:
    """
    Verify if an IP address belongs to a known bot.
    
    Checks the IP against known CIDR ranges published by bot operators.
    
    Returns:
    - verified: True if IP matches official ranges
    - verified: False if IP doesn't match (potential spoofing)
    - verified: null if cannot verify (no ranges available)
    """
    ip_service = get_ip_verification_service()
    
    result = await ip_service.verify_bot_ip(bot_name, ip_address)
    
    return {
        "bot_name": bot_name,
        "ip_address": ip_address,
        "verified": result,
        "verification_available": result is not None,
        "message": (
            "IP verified as legitimate" if result is True
            else "IP does not match known ranges - potential spoofing" if result is False
            else "Cannot verify - no IP ranges available for this bot"
        )
    }


@router.post("/agent-analytics/refresh-ip-ranges")
async def refresh_ip_ranges(
    bot_name: str = None,
    user_id: str = Depends(get_current_user_id)
) -> Dict[str, Any]:
    """
    Refresh IP ranges for bots.
    
    Fetches latest CIDR ranges from bot operator endpoints.
    
    Args:
        bot_name: Specific bot to refresh (optional, refreshes all if not specified)
    """
    ip_service = get_ip_verification_service()
    
    if bot_name:
        cache = await ip_service.refresh_bot_ranges(bot_name)
        return {
            "refreshed": [bot_name] if cache else [],
            "failed": [] if cache else [bot_name]
        }
    else:
        results = await ip_service.refresh_all_ranges()
        refreshed = [name for name, success in results.items() if success]
        failed = [name for name, success in results.items() if not success]
        
        return {
            "refreshed": refreshed,
            "failed": failed,
            "total": len(results)
        }


@router.get("/agent-analytics/cache-stats")
async def get_cache_stats(
    user_id: str = Depends(get_current_user_id)
) -> Dict[str, Any]:
    """
    Get semantic cache statistics.
    
    Shows cache performance metrics for LLM response caching:
    - Hit rate
    - Tokens saved
    - Estimated cost savings
    """
    cache_service = get_semantic_cache_service()
    stats = cache_service.get_stats()
    
    return {
        "semantic_cache": stats.to_dict(),
        "recommendations": _get_cache_recommendations(stats)
    }


def _get_cache_recommendations(stats) -> List[str]:
    """Generate recommendations based on cache stats."""
    recommendations = []
    
    if stats.hit_rate < 0.1 and stats.total_requests > 100:
        recommendations.append(
            "Low cache hit rate. Consider lowering similarity threshold from 0.95 to 0.90."
        )
    
    if stats.cache_hits > 1000 and stats.estimated_cost_saved > 10:
        recommendations.append(
            f"Cache is saving ~${stats.estimated_cost_saved:.2f}. Consider increasing TTL for more savings."
        )
    
    if stats.total_entries > 10000:
        recommendations.append(
            "Large cache size. Consider implementing cache eviction for older entries."
        )
    
    return recommendations


@router.delete("/agent-analytics/cache")
async def clear_cache(
    pattern: str = None,
    user_id: str = Depends(get_current_user_id)
) -> Dict[str, Any]:
    """
    Clear semantic cache.
    
    Args:
        pattern: Optional pattern to match (clears matching entries only)
                 If not specified, clears entire cache.
    """
    cache_service = get_semantic_cache_service()
    
    if pattern:
        count = await cache_service.invalidate_by_pattern(pattern)
        return {
            "cleared": count,
            "pattern": pattern
        }
    else:
        count = await cache_service.clear()
        return {
            "cleared": count,
            "message": "Entire cache cleared"
        }
