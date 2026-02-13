"""
Crawler Logs API Endpoint - Activity tracking for AI bot visits.

Provides endpoints for:
- Crawler activity charts (aggregated by day/week)
- Bot detection logs
- Real-time crawler monitoring data
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List
from datetime import datetime, timedelta
from collections import defaultdict

from app.api.deps import get_current_user_id
from app.core.supabase import get_supabase_client

router = APIRouter()


@router.get("/crawler-logs/{brand_id}/activity")
async def get_crawler_activity(
    brand_id: str,
    days: int = 7,
    user_id: str = Depends(get_current_user_id)
) -> Dict[str, Any]:
    """
    Get crawler activity for chart display.
    
    Returns aggregated crawler visit data by day:
    - date: Day label (Mon, Tue, etc. or date string)
    - requests: Total crawler requests that day
    - blocked: Number of blocked requests
    
    Used by CrawlActivityChart component.
    """
    supabase = get_supabase_client()
    
    try:
        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Fetch crawler logs for this brand
        response = supabase.table("crawler_logs").select(
            "id, crawler_name, pages_crawled, visit_date"
        ).eq(
            "brand_id", brand_id
        ).gte(
            "visit_date", start_date.isoformat()
        ).lte(
            "visit_date", end_date.isoformat()
        ).order(
            "visit_date", desc=False
        ).execute()
        
        logs = response.data if response.data else []
        
        # Aggregate by day
        daily_stats: Dict[str, Dict[str, int]] = defaultdict(lambda: {"requests": 0, "blocked": 0})
        
        for log in logs:
            if log.get("visit_date"):
                # Parse date
                visit_dt = datetime.fromisoformat(log["visit_date"].replace("Z", "+00:00"))
                day_key = visit_dt.strftime("%Y-%m-%d")
                
                # Count pages crawled as requests
                pages = log.get("pages_crawled", 0) or 0
                daily_stats[day_key]["requests"] += max(pages, 1)  # At least 1 request per visit
        
        # Also check for blocked crawlers from technical_aeo
        blocked_response = supabase.table("aeo_analyses").select(
            "technical_aeo, created_at"
        ).eq(
            "brand_id", brand_id
        ).gte(
            "created_at", start_date.isoformat()
        ).order(
            "created_at", desc=True
        ).limit(1).execute()
        
        blocked_crawlers = set()
        if blocked_response.data and len(blocked_response.data) > 0:
            tech_aeo = blocked_response.data[0].get("technical_aeo", {})
            if tech_aeo and "ai_crawler_permissions" in tech_aeo:
                crawlers = tech_aeo["ai_crawler_permissions"].get("crawlers", {})
                for crawler, status in crawlers.items():
                    if status in ["disallowed", "Disallowed", "blocked", "Blocked"]:
                        blocked_crawlers.add(crawler.lower())
        
        # Count blocked based on known blocked crawlers visiting
        for log in logs:
            crawler_name = (log.get("crawler_name") or "").lower()
            if crawler_name and any(blocked in crawler_name for blocked in blocked_crawlers):
                visit_dt = datetime.fromisoformat(log["visit_date"].replace("Z", "+00:00"))
                day_key = visit_dt.strftime("%Y-%m-%d")
                daily_stats[day_key]["blocked"] += 1
        
        # Build result with proper day labels
        result = []
        current = start_date
        while current <= end_date:
            day_key = current.strftime("%Y-%m-%d")
            day_label = current.strftime("%a")  # Mon, Tue, etc.
            
            stats = daily_stats.get(day_key, {"requests": 0, "blocked": 0})
            result.append({
                "date": day_label,
                "fullDate": day_key,
                "requests": stats["requests"],
                "blocked": stats["blocked"]
            })
            
            current += timedelta(days=1)
        
        return {
            "activity": result,
            "totalRequests": sum(d["requests"] for d in result),
            "totalBlocked": sum(d["blocked"] for d in result),
            "periodDays": days
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to fetch crawler activity: {str(e)}"
        )


@router.get("/crawler-logs/{brand_id}/recent")
async def get_recent_crawlers(
    brand_id: str,
    limit: int = 10,
    user_id: str = Depends(get_current_user_id)
) -> Dict[str, Any]:
    """
    Get recent crawler visits.
    
    Returns list of recent bot visits with:
    - crawler_name: Name of the bot
    - user_agent: Full user agent string  
    - pages_crawled: Number of pages visited
    - visit_date: When the visit occurred
    """
    supabase = get_supabase_client()
    
    try:
        response = supabase.table("crawler_logs").select(
            "id, crawler_name, user_agent, pages_crawled, visit_date"
        ).eq(
            "brand_id", brand_id
        ).order(
            "visit_date", desc=True
        ).limit(limit).execute()
        
        logs = response.data if response.data else []
        
        return {
            "crawlers": logs,
            "count": len(logs)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch recent crawlers: {str(e)}"
        )


@router.get("/crawler-logs/{brand_id}/summary")
async def get_crawler_summary(
    brand_id: str,
    days: int = 30,
    user_id: str = Depends(get_current_user_id)
) -> Dict[str, Any]:
    """
    Get crawler activity summary.
    
    Returns aggregated metrics:
    - Total unique crawlers
    - Most active crawler
    - Total pages crawled
    - Average daily visits
    """
    supabase = get_supabase_client()
    
    try:
        start_date = datetime.utcnow() - timedelta(days=days)
        
        response = supabase.table("crawler_logs").select(
            "crawler_name, pages_crawled, visit_date"
        ).eq(
            "brand_id", brand_id
        ).gte(
            "visit_date", start_date.isoformat()
        ).execute()
        
        logs = response.data if response.data else []
        
        if not logs:
            return {
                "uniqueCrawlers": 0,
                "mostActiveCrawler": None,
                "totalPagesCrawled": 0,
                "avgDailyVisits": 0
            }
        
        # Calculate metrics
        crawler_visits: Dict[str, int] = defaultdict(int)
        total_pages = 0
        
        for log in logs:
            crawler = log.get("crawler_name", "Unknown")
            crawler_visits[crawler] += 1
            total_pages += log.get("pages_crawled", 0) or 0
        
        most_active = max(crawler_visits.items(), key=lambda x: x[1])[0] if crawler_visits else None
        
        return {
            "uniqueCrawlers": len(crawler_visits),
            "mostActiveCrawler": most_active,
            "totalPagesCrawled": total_pages,
            "avgDailyVisits": round(len(logs) / days, 1)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch crawler summary: {str(e)}"
        )
