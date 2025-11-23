from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from app.models.analysis import Analysis
from app.models.keyword import Keyword
from app.models.crawler_log import CrawlerLog
from app.models.competitor import Competitor
from app.services.supabase.database import SupabaseDatabaseService


class AnalysisResultsIngestionService:
    """Persists structured LLM output into the relational tables used by the UI."""

    def __init__(self) -> None:
        self.keyword_db = SupabaseDatabaseService("keywords", Keyword)
        self.crawler_log_db = SupabaseDatabaseService("crawler_logs", CrawlerLog)
        self.competitor_db = SupabaseDatabaseService("competitors", Competitor)

    async def ingest_results(self, analysis: Analysis, results: Dict[str, Any]) -> None:
        if not results:
            print("No results to ingest.")
            return

        try:
            print(f"Ingesting keywords: {len(results.get('keywords', []))} found.")
            await self._ingest_keywords(analysis, results.get("keywords"))
            
            print(f"Ingesting competitors: {len(results.get('competitors', []))} found.")
            await self._ingest_competitors(analysis, results.get("competitors"))
            
            print(f"Ingesting crawlers: {len(results.get('crawlers', []))} found.")
            await self._ingest_crawlers(analysis, results.get("crawlers"))
        except Exception as ingestion_error:
            print(f"Failed to ingest analysis results: {ingestion_error}")

    async def _ingest_keywords(self, analysis: Analysis, keywords: Optional[List[Dict[str, Any]]]) -> None:
        if not keywords:
            return

        user_id = str(analysis.user_id)
        brand_id = str(analysis.brand_id) if analysis.brand_id else None

        try:
            delete_query = self.keyword_db.supabase.table("keywords").delete().eq("user_id", user_id)
            if brand_id:
                delete_query = delete_query.eq("brand_id", brand_id)
            delete_query.execute()
        except Exception as delete_error:
            print(f"Failed to clean previous keywords: {delete_error}")

        created = 0
        for item in keywords:
            keyword_text = (item.get("keyword") or "").strip()
            if not keyword_text:
                continue

            payload = {
                "user_id": user_id,
                "brand_id": brand_id,
                "keyword": keyword_text,
                "search_volume": self._to_int(item.get("search_volume")),
                "difficulty": self._to_float(item.get("difficulty")),
                "ai_visibility_score": self._to_float(item.get("ai_visibility_score")),
                "tracked": item.get("tracked", True),
                "created_at": datetime.utcnow().isoformat() + "Z",
                "updated_at": datetime.utcnow().isoformat() + "Z",
            }
            await self.keyword_db.create(payload)
            created += 1

        print(f"Hydrated {created} keywords for user {user_id}")

    async def _ingest_competitors(self, analysis: Analysis, competitors: Optional[List[Dict[str, Any]]]) -> None:
        if not competitors or not analysis.brand_id:
            return

        user_id = str(analysis.user_id)
        brand_id = str(analysis.brand_id)

        try:
            self.competitor_db.supabase.table("competitors").delete().eq("brand_id", brand_id).execute()
        except Exception as delete_error:
            print(f"Failed to clean previous competitors: {delete_error}")

        created = 0
        for item in competitors:
            name = (item.get("name") or "").strip()
            domain = (item.get("domain") or "").strip()
            if not name or not domain:
                continue

            payload = {
                "user_id": user_id,
                "brand_id": brand_id,
                "name": name,
                "domain": domain,
                "visibility_score": self._to_float(item.get("visibility_score")),
                "tracked": item.get("tracked", True),
                "created_at": datetime.utcnow().isoformat() + "Z",
                "updated_at": datetime.utcnow().isoformat() + "Z",
            }
            await self.competitor_db.create(payload)
            created += 1

        print(f"Hydrated {created} competitors for brand {brand_id}")

    async def _ingest_crawlers(self, analysis: Analysis, crawlers: Optional[List[Dict[str, Any]]]) -> None:
        if not crawlers or not analysis.brand_id:
            return

        brand_id = str(analysis.brand_id)

        try:
            self.crawler_log_db.supabase.table("crawler_logs").delete().eq("brand_id", brand_id).execute()
        except Exception as delete_error:
            print(f"Failed to clean previous crawler logs: {delete_error}")

        now = datetime.utcnow()

        created = 0
        for crawler in crawlers:
            name = (crawler.get("name") or "").strip()
            if not name:
                continue

            last_visit_hours = crawler.get("last_visit_hours")
            visit_date = now
            if isinstance(last_visit_hours, (int, float)):
                visit_date = now - timedelta(hours=float(last_visit_hours))

            payload = {
                "brand_id": brand_id,
                "crawler_name": name,
                "user_agent": crawler.get("model"),
                "pages_crawled": self._to_int(crawler.get("pages_visited")),
                "visit_date": visit_date.isoformat() + "Z",
            }
            await self.crawler_log_db.create(payload)
            created += 1

        print(f"Hydrated {created} crawler logs for brand {brand_id}")

    @staticmethod
    def _to_int(value: Any, default: int = 0) -> int:
        try:
            if value is None:
                return default
            if isinstance(value, str):
                # Handle "1,000" or "1k" roughly if needed, or just strip non-digits
                import re
                digits = re.sub(r'[^\d]', '', value)
                if not digits:
                    return default
                return int(digits)
            return int(float(value))
        except (TypeError, ValueError):
            return default

    @staticmethod
    def _to_float(value: Any, default: float = 0.0) -> float:
        try:
            if value is None:
                return default
            if isinstance(value, str):
                import re
                # Extract first float-like number
                match = re.search(r"[-+]?\d*\.\d+|\d+", value)
                if match:
                    return float(match.group())
                return default
            return float(value)
        except (TypeError, ValueError):
            return default
