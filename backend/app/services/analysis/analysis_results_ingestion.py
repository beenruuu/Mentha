from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from app.models.analysis import Analysis
from app.models.keyword import Keyword
from app.models.crawler_log import CrawlerLog
from app.models.competitor import Competitor
from app.services.supabase.database import SupabaseDatabaseService
from app.core.logging import log_info, log_success, log_error, log_warning


class AnalysisResultsIngestionService:
    """Persists structured LLM output into the relational tables used by the UI."""

    def __init__(self) -> None:
        self.keyword_db = SupabaseDatabaseService("keywords", Keyword)
        self.crawler_log_db = SupabaseDatabaseService("crawler_logs", CrawlerLog)
        self.competitor_db = SupabaseDatabaseService("competitors", Competitor)
        # New tables for GEO/AEO data
        self.supabase_client = self.keyword_db.supabase  # Reuse supabase client

    async def ingest_results(
        self, 
        analysis: Analysis, 
        results: Dict[str, Any],
        keyword_metrics: Optional[Dict[str, Any]] = None
    ) -> None:
        if not results:
            log_warning("📦⚠️", "No results to ingest.")
            return

        try:
            # Merge real keyword metrics if provided
            keywords_data = results.get("keywords", [])
            if keyword_metrics and keyword_metrics.get("enabled") and keyword_metrics.get("keywords"):
                # Use real metrics from Google Trends/SerpAPI instead of LLM estimates
                real_keywords = keyword_metrics.get("keywords", [])
                keywords_data = self._merge_keyword_metrics(keywords_data, real_keywords)
            
            log_info("🔑📥", f"Ingesting keywords: {len(keywords_data)} found.")
            await self._ingest_keywords(analysis, keywords_data)
            
            log_info("🏢📥", f"Ingesting competitors: {len(results.get('competitors', []))} found.")
            await self._ingest_competitors(analysis, results.get("competitors"))
            
            # Note: Crawler activity data is NOT ingested from LLM results
            # Real crawler data should come from server logs or analytics integrations
            # The LLM only provides robots.txt permission analysis, not actual visit data
            
            log_info("❓📥", f"Ingesting queries: {len(results.get('queries', []))} found.")
            await self._ingest_queries(analysis, results.get("queries"))
            
        except Exception as ingestion_error:
            log_error("📦❌", f"Failed to ingest analysis results: {ingestion_error}")

    def _merge_keyword_metrics(
        self,
        llm_keywords: List[Dict[str, Any]],
        real_keywords: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Merge LLM-generated keywords with real metrics from Google Trends/SerpAPI.
        Real metrics take precedence over LLM estimates.
        """
        # Create lookup for real metrics by keyword
        real_metrics_map = {}
        for kw in real_keywords:
            keyword_text = (kw.get("keyword") or "").strip().lower()
            if keyword_text:
                real_metrics_map[keyword_text] = kw
        
        merged = []
        seen_keywords = set()
        
        # Update LLM keywords with real metrics where available
        for kw in llm_keywords:
            keyword_text = (kw.get("keyword") or "").strip()
            keyword_lower = keyword_text.lower()
            
            if keyword_lower in seen_keywords:
                continue
            seen_keywords.add(keyword_lower)
            
            if keyword_lower in real_metrics_map:
                # Use real metrics
                real_data = real_metrics_map[keyword_lower]
                merged.append({
                    "keyword": keyword_text,
                    "search_volume": real_data.get("search_volume", 0),
                    "difficulty": real_data.get("difficulty", 50),
                    "ai_visibility_score": real_data.get("ai_visibility_score", 0),
                    "trend_score": real_data.get("trend_score", 0),
                    "data_source": real_data.get("data_source", "google_trends"),
                    "tracked": True
                })
            else:
                merged.append(kw)
        
        # Add any real keywords not in LLM results
        for kw in real_keywords:
            keyword_text = (kw.get("keyword") or "").strip()
            keyword_lower = keyword_text.lower()
            
            if keyword_lower not in seen_keywords:
                seen_keywords.add(keyword_lower)
                merged.append({
                    "keyword": keyword_text,
                    "search_volume": kw.get("search_volume", 0),
                    "difficulty": kw.get("difficulty", 50),
                    "ai_visibility_score": kw.get("ai_visibility_score", 0),
                    "trend_score": kw.get("trend_score", 0),
                    "data_source": kw.get("data_source", "google_trends"),
                    "tracked": True
                })
        
        return merged

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
            log_error("🔑❌", f"Failed to clean previous keywords: {delete_error}")

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

        log_success("🔑✅", f"Hydrated {created} keywords for user {user_id}")

    async def _ingest_competitors(self, analysis: Analysis, competitors: Optional[List[Dict[str, Any]]]) -> None:
        """
        Ingest competitors - ADD new ones without deleting existing.
        Returns list of newly discovered competitors for notifications.
        """
        if not competitors or not analysis.brand_id:
            return

        user_id = str(analysis.user_id)
        brand_id = str(analysis.brand_id)

        # Get existing competitors to avoid duplicates
        existing_competitors = []
        try:
            result = self.competitor_db.supabase.table("competitors").select("domain").eq("brand_id", brand_id).execute()
            existing_competitors = [c["domain"].lower().replace("www.", "") for c in result.data if c.get("domain")]
        except Exception as e:
            log_error("🏢❌", f"Failed to fetch existing competitors: {e}")

        created = 0
        new_competitor_names = []
        
        for item in competitors:
            name = (item.get("name") or "").strip()
            domain = (item.get("domain") or "").strip()
            if not name or not domain:
                continue

            # Normalize domain for comparison
            clean_domain = domain.lower().replace("www.", "")
            if clean_domain.startswith('http'):
                from urllib.parse import urlparse
                clean_domain = urlparse(clean_domain).netloc.replace("www.", "")
            
            # Skip if already exists
            if clean_domain in existing_competitors:
                continue

            # Generate favicon URL if not provided
            favicon = item.get("favicon") or ""
            if not favicon and domain:
                favicon = f"https://www.google.com/s2/favicons?domain={clean_domain}&sz=64"

            payload = {
                "user_id": user_id,
                "brand_id": brand_id,
                "name": name,
                "domain": clean_domain,
                "visibility_score": self._to_float(item.get("visibility_score")),
                "tracked": item.get("tracked", True),
                "favicon": favicon,
                "source": item.get("source", "discovered"),  # Mark as discovered vs onboarding
                "insight": (item.get("insight") or "")[:500],
                "created_at": datetime.utcnow().isoformat() + "Z",
                "updated_at": datetime.utcnow().isoformat() + "Z",
            }
            await self.competitor_db.create(payload)
            created += 1
            new_competitor_names.append(name)
            existing_competitors.append(clean_domain)  # Add to list to avoid duplicates in same batch

        if created > 0:
            log_success("🏢✅", f"Added {created} NEW competitors for brand {brand_id}: {', '.join(new_competitor_names)}")
        else:
            log_info("🏢", f"No new competitors to add for brand {brand_id}")

    async def _ingest_crawlers(self, analysis: Analysis, crawlers: Optional[List[Dict[str, Any]]]) -> None:
        if not crawlers or not analysis.brand_id:
            return

        brand_id = str(analysis.brand_id)

        try:
            self.crawler_log_db.supabase.table("crawler_logs").delete().eq("brand_id", brand_id).execute()
        except Exception as delete_error:
            log_error("🤖❌", f"Failed to clean previous crawler logs: {delete_error}")

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

        log_success("🤖✅", f"Hydrated {created} crawler logs for brand {brand_id}")
    
    async def _ingest_queries(self, analysis: Analysis, queries: Optional[List[Dict[str, Any]]]) -> None:
        """Ingest query/prompt data."""
        if not queries or not analysis.brand_id:
            return

        user_id = str(analysis.user_id)
        brand_id = str(analysis.brand_id)
        analysis_id = str(analysis.id)

        # Delete previous queries for this brand
        try:
            self.supabase_client.table("queries").delete().eq("brand_id", brand_id).execute()
        except Exception as delete_error:
            log_error("❓❌", f"Failed to clean previous queries: {delete_error}")

        created = 0
        for query in queries:
            title = (query.get("title") or "").strip()
            question = (query.get("question") or "").strip()
            if not title or not question:
                continue

            # Map category to valid values
            category = (query.get("category") or "general").lower()
            valid_categories = ["comparison", "definition", "recommendation", "tutorial", "top_x", "review", "general"]
            if category not in valid_categories:
                category = "general"
            
            # Map priority to valid values
            priority = (query.get("priority") or "medium").lower()
            if priority not in ["low", "medium", "high"]:
                priority = "medium"
            
            # Map frequency to valid values
            frequency = (query.get("frequency") or "monthly").lower()
            if frequency not in ["daily", "weekly", "monthly"]:
                frequency = "monthly"

            payload = {
                "user_id": user_id,
                "brand_id": brand_id,
                "analysis_id": analysis_id,
                "title": title,
                "question": question,
                "answer": query.get("answer"),
                "category": category,
                "priority": priority,
                "frequency": frequency,
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
                log_error("❓❌", f"Failed to create query '{title}': {e}")

        log_success("❓✅", f"Hydrated {created} queries for brand {brand_id}")
    
    async def ingest_technical_aeo(self, analysis: Analysis, technical_aeo_data: Dict[str, Any]) -> None:
        """Ingest technical AEO audit results."""
        if not technical_aeo_data or not technical_aeo_data.get("enabled"):
            log_warning("🔧⚠️", "No technical AEO data to ingest.")
            return
        
        if not analysis.brand_id:
            log_warning("🔧⚠️", "No brand_id for technical AEO ingestion.")
            return
        
        user_id = str(analysis.user_id)
        brand_id = str(analysis.brand_id)
        domain = technical_aeo_data.get("domain", "")
        
        # Delete previous technical AEO data for this brand
        try:
            self.supabase_client.table("technical_aeo").delete().eq("brand_id", brand_id).execute()
        except Exception as delete_error:
            log_error("🔧❌", f"Failed to clean previous technical AEO data: {delete_error}")
        
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
            log_success("🔧✅", f"Saved technical AEO data for brand {brand_id} (score: {payload['aeo_readiness_score']}/100)")
        except Exception as e:
            log_error("🔧❌", f"Failed to save technical AEO data: {e}")
    
    async def ingest_web_search_results(self, analysis: Analysis, search_context: Dict[str, Any]) -> None:
        """Ingest web search results."""
        if not search_context or not search_context.get("enabled"):
            log_warning("🌐⚠️", "No web search data to ingest.")
            return
        
        if not analysis.brand_id:
            log_warning("🌐⚠️", "No brand_id for web search ingestion.")
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
                log_error("🌐❌", f"Failed to save {search_type} search results: {e}")
        
        log_success("🌐✅", f"Saved {saved} web search result sets for analysis {analysis_id}")

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
