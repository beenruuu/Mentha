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
        # New tables for GEO/AEO data
        self.supabase_client = self.keyword_db.supabase  # Reuse supabase client

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
            
            print(f"Ingesting queries: {len(results.get('queries', []))} found.")
            await self._ingest_queries(analysis, results.get("queries"))
            
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
    
    async def _ingest_queries(self, analysis: Analysis, queries: Optional[List[Dict[str, Any]]]) -> None:
        """Ingest query/prompt data."""
        if not queries or not analysis.brand_id:
            return

        user_id = str(analysis.user_id)
        brand_id = str(analysis.brand_id)

        # Delete previous queries for this brand
        try:
            self.supabase_client.table("queries").delete().eq("brand_id", brand_id).execute()
        except Exception as delete_error:
            print(f"Failed to clean previous queries: {delete_error}")

        created = 0
        for query in queries:
            title = (query.get("title") or "").strip()
            question = (query.get("question") or "").strip()
            if not title or not question:
                continue

            payload = {
                "user_id": user_id,
                "brand_id": brand_id,
                "title": title,
                "question": question,
                "answer": query.get("answer"),
                "estimated_volume": self._to_int(query.get("estimated_volume")),
                "ai_models": query.get("ai_models", []),
                "tracked": query.get("tracked", True),
                "created_at": datetime.utcnow().isoformat() + "Z",
                "updated_at": datetime.utcnow().isoformat() + "Z",
            }
            
            try:
                self.supabase_client.table("queries").insert(payload).execute()
                created += 1
            except Exception as e:
                print(f"Failed to create query '{title}': {e}")

        print(f"Hydrated {created} queries for brand {brand_id}")
    
    async def ingest_technical_aeo(self, analysis: Analysis, technical_aeo_data: Dict[str, Any]) -> None:
        """Ingest technical AEO audit results."""
        if not technical_aeo_data or not technical_aeo_data.get("enabled"):
            print("No technical AEO data to ingest.")
            return
        
        if not analysis.brand_id:
            print("No brand_id for technical AEO ingestion.")
            return
        
        user_id = str(analysis.user_id)
        brand_id = str(analysis.brand_id)
        domain = technical_aeo_data.get("domain", "")
        
        # Delete previous technical AEO data for this brand
        try:
            self.supabase_client.table("technical_aeo").delete().eq("brand_id", brand_id).execute()
        except Exception as delete_error:
            print(f"Failed to clean previous technical AEO data: {delete_error}")
        
        # Extract structured data info
        schemas = technical_aeo_data.get("structured_data", {})
        
        payload = {
            "user_id": user_id,
            "brand_id": brand_id,
            "domain": domain,
            "ai_crawler_permissions": technical_aeo_data.get("ai_crawler_permissions"),
            "schema_types": schemas.get("schema_types", []),
            "total_schemas": schemas.get("total_schemas", 0),
            "has_faq": schemas.get("has_faq", False),
            "has_howto": schemas.get("has_howto", False),
            "has_article": schemas.get("has_article", False),
            "has_rss": technical_aeo_data.get("technical_signals", {}).get("has_rss_feed", False),
            "has_api": technical_aeo_data.get("technical_signals", {}).get("potential_api", False),
            "mobile_responsive": technical_aeo_data.get("technical_signals", {}).get("has_viewport", False),
            "https_enabled": technical_aeo_data.get("technical_signals", {}).get("https", False),
            "response_time_ms": technical_aeo_data.get("technical_signals", {}).get("response_time_ms"),
            "aeo_readiness_score": technical_aeo_data.get("aeo_readiness_score"),
            "recommendations": technical_aeo_data.get("recommendations", []),
            "last_audit": datetime.utcnow().isoformat() + "Z",
            "created_at": datetime.utcnow().isoformat() + "Z",
        }
        
        try:
            self.supabase_client.table("technical_aeo").insert(payload).execute()
            print(f"Saved technical AEO data for brand {brand_id} (score: {payload['aeo_readiness_score']}/100)")
        except Exception as e:
            print(f"Failed to save technical AEO data: {e}")
    
    async def ingest_web_search_results(self, analysis: Analysis, search_context: Dict[str, Any]) -> None:
        """Ingest web search results."""
        if not search_context or not search_context.get("enabled"):
            print("No web search data to ingest.")
            return
        
        if not analysis.brand_id:
            print("No brand_id for web search ingestion.")
            return
        
        user_id = str(analysis.user_id)
        brand_id = str(analysis.brand_id)
        analysis_id = str(analysis.id)
        
        # Store each type of search results
        search_types = [
            ("keyword", search_context.get("keyword_results", [])),
            ("competitor", search_context.get("competitor_results", [])),
            ("mention", search_context.get("mention_results", [])),
            ("industry", search_context.get("industry_results", []))
        ]
        
        saved = 0
        for search_type, results in search_types:
            if not results:
                continue
            
            payload = {
                "user_id": user_id,
                "brand_id": brand_id,
                "analysis_id": analysis_id,
                "search_type": search_type,
                "query": f"{search_type} search",
                "results": results,
                "total_results": len(results),
                "searched_at": datetime.utcnow().isoformat() + "Z",
            }
            
            try:
                self.supabase_client.table("web_search_results").insert(payload).execute()
                saved += 1
            except Exception as e:
                print(f"Failed to save {search_type} search results: {e}")
        
        print(f"Saved {saved} web search result sets for analysis {analysis_id}")

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
