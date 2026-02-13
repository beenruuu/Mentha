"""
Insights Service - Generate dynamic insights from visibility data.

Provides dynamic insights:
- Consecutive trend detection (improved X days in a row)
- Leading AI model identification
- New competitor detection
- Score change analysis
- Overall assessment
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from app.services.supabase.database import SupabaseDatabaseService
from app.models.brand import Brand
from app.models.competitor import Competitor
import logging

logger = logging.getLogger(__name__)


class InsightsService:
    """Generate dynamic insights from visibility data."""
    
    def __init__(self):
        self.brand_db = SupabaseDatabaseService("brands", Brand)
        self.competitor_db = SupabaseDatabaseService("competitors", Competitor)
    
    async def get_brand_insights(self, brand_id: str, days: int = 30) -> Dict[str, Any]:
        """
        Analyze historical data and generate dynamic insights.
        
        Returns insights like:
        - "La puntuación mejoró 3 días consecutivos"
        - "Google Gemini lidera con 29/100"
        - "5 nuevos competidores en los últimos 15 días"
        - "Top competidores: 80-100/100"
        - "Puntuación bajó 3 puntos a 17/100"
        """
        try:
            from supabase import create_client
            from app.core.config import settings
            
            supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
            
            # Get visibility snapshots for the last N days
            cutoff_date = (datetime.utcnow() - timedelta(days=days)).isoformat()
            
            snapshots_response = supabase.table("ai_visibility_snapshots") \
                .select("*") \
                .eq("brand_id", brand_id) \
                .gte("measured_at", cutoff_date) \
                .order("measured_at", desc=True) \
                .execute()
            
            snapshots = snapshots_response.data or []
            
            # Get competitors
            competitors = await self.competitor_db.list(filters={"brand_id": brand_id})
            
            # Generate insights
            insights = {
                "brand_id": brand_id,
                "generated_at": datetime.utcnow().isoformat() + "Z",
                "insights": []
            }
            
            if not snapshots:
                insights["insights"].append({
                    "type": "no_data",
                    "icon": "📊",
                    "title": "Sin datos históricos",
                    "description": "Aún no hay suficientes datos para generar insights.",
                    "priority": "low"
                })
                return insights
            
            # 1. Consecutive trend detection
            trend_insight = self._analyze_consecutive_trend(snapshots)
            if trend_insight:
                insights["insights"].append(trend_insight)
            
            # 2. Leading AI model
            model_insight = self._find_leading_model(snapshots)
            if model_insight:
                insights["insights"].append(model_insight)
            
            # 3. Score change (compare to previous period)
            change_insight = self._analyze_score_change(snapshots, days)
            if change_insight:
                insights["insights"].append(change_insight)
            
            # 4. New competitors detected
            competitor_insight = self._analyze_competitors(competitors)
            if competitor_insight:
                insights["insights"].append(competitor_insight)
            
            # 5. Top competitor range
            top_range_insight = self._analyze_top_competitor_range(competitors)
            if top_range_insight:
                insights["insights"].append(top_range_insight)
            
            # 6. Overall assessment
            overall_insight = self._overall_assessment(snapshots)
            if overall_insight:
                insights["insights"].append(overall_insight)
            
            return insights
            
        except Exception as e:
            logger.error(f"Failed to generate insights for brand {brand_id}: {e}")
            return {
                "brand_id": brand_id,
                "generated_at": datetime.utcnow().isoformat() + "Z",
                "error": str(e),
                "insights": []
            }
    
    def _analyze_consecutive_trend(self, snapshots: List[Dict]) -> Optional[Dict]:
        """Detect consecutive days of improvement or decline."""
        if len(snapshots) < 2:
            return None
        
        # Group snapshots by day and calculate daily average
        daily_scores = {}
        for snap in snapshots:
            date_str = snap.get("measured_at", "")[:10]  # YYYY-MM-DD
            score = snap.get("visibility_score", 0)
            if date_str not in daily_scores:
                daily_scores[date_str] = []
            daily_scores[date_str].append(score)
        
        # Calculate daily averages
        daily_averages = {
            date: sum(scores) / len(scores) 
            for date, scores in daily_scores.items()
        }
        
        # Sort by date descending
        sorted_dates = sorted(daily_averages.keys(), reverse=True)
        
        if len(sorted_dates) < 2:
            return None
        
        # Detect consecutive trend
        consecutive_up = 0
        consecutive_down = 0
        
        for i in range(len(sorted_dates) - 1):
            current = daily_averages[sorted_dates[i]]
            previous = daily_averages[sorted_dates[i + 1]]
            
            if current > previous:
                if consecutive_down > 0:
                    break
                consecutive_up += 1
            elif current < previous:
                if consecutive_up > 0:
                    break
                consecutive_down += 1
            else:
                break
        
        if consecutive_up >= 2:
            return {
                "type": "consecutive_improvement",
                "icon": "📈",
                "title": f"Tendencia positiva",
                "description": f"La puntuación mejoró {consecutive_up} días consecutivos",
                "priority": "high",
                "data": {"days": consecutive_up, "direction": "up"}
            }
        elif consecutive_down >= 2:
            return {
                "type": "consecutive_decline",
                "icon": "📉",
                "title": f"Tendencia negativa",
                "description": f"La puntuación bajó {consecutive_down} días consecutivos",
                "priority": "high",
                "data": {"days": consecutive_down, "direction": "down"}
            }
        
        return None
    
    def _find_leading_model(self, snapshots: List[Dict]) -> Optional[Dict]:
        """Find the AI model with highest visibility score."""
        # Get latest scores by model - only count models with actual scores > 0
        model_scores = {}
        for snap in snapshots:
            model = snap.get("ai_model", "unknown")
            score = snap.get("visibility_score", 0)
            # Skip models with 0 or very low scores (no real data)
            if score < 1:
                continue
            # Only keep the latest (first in desc order)
            if model not in model_scores:
                model_scores[model] = score
        
        if not model_scores:
            return None
        
        # Filter out google_search (not a user-facing model)
        valid_models = {"openai", "anthropic", "perplexity", "gemini"}
        model_scores = {k: v for k, v in model_scores.items() if k in valid_models}
        
        if not model_scores:
            return None
        
        # Find leading model
        leading_model = max(model_scores, key=model_scores.get)
        leading_score = model_scores[leading_model]
        
        # Only show if score is meaningful (> 5)
        if leading_score < 5:
            return None
        
        # Map model names to display names
        model_display_names = {
            "openai": "ChatGPT",
            "anthropic": "Claude",
            "perplexity": "Perplexity",
            "gemini": "Google Gemini"
        }
        
        display_name = model_display_names.get(leading_model, leading_model)
        
        return {
            "type": "leading_model",
            "icon": "🏆",
            "title": f"{display_name} lidera",
            "description": f"{display_name} lidera con una puntuación de {int(leading_score)}/100",
            "priority": "medium",
            "data": {"model": leading_model, "score": leading_score}
        }
    
    def _analyze_score_change(self, snapshots: List[Dict], days: int) -> Optional[Dict]:
        """Analyze score change compared to previous period."""
        if len(snapshots) < 2:
            return None
        
        # Calculate current average (last 7 days)
        recent_cutoff = datetime.utcnow() - timedelta(days=7)
        older_cutoff = datetime.utcnow() - timedelta(days=days)
        
        recent_scores = []
        older_scores = []
        
        for snap in snapshots:
            measured_at = snap.get("measured_at", "")
            score = snap.get("visibility_score", 0)
            
            try:
                snap_date = datetime.fromisoformat(measured_at.replace("Z", "+00:00"))
                if snap_date.replace(tzinfo=None) >= recent_cutoff:
                    recent_scores.append(score)
                else:
                    older_scores.append(score)
            except:
                continue
        
        if not recent_scores or not older_scores:
            return None
        
        current_avg = sum(recent_scores) / len(recent_scores)
        previous_avg = sum(older_scores) / len(older_scores)
        
        change = current_avg - previous_avg
        
        if abs(change) < 1:
            return None  # Insignificant change
        
        if change > 0:
            return {
                "type": "score_increase",
                "icon": "⬆️",
                "title": "Puntuación subió",
                "description": f"La puntuación subió {abs(int(change))} puntos a {int(current_avg)}/100",
                "priority": "high",
                "data": {"change": change, "current": current_avg}
            }
        else:
            return {
                "type": "score_decrease",
                "icon": "⬇️",
                "title": "Puntuación bajó",
                "description": f"La puntuación bajó {abs(int(change))} puntos a {int(current_avg)}/100",
                "priority": "high",
                "data": {"change": change, "current": current_avg}
            }
    
    def _analyze_competitors(self, competitors: List[Competitor]) -> Optional[Dict]:
        """Analyze recently added competitors."""
        if not competitors:
            return None
        
        # Count competitors added in last 15 days
        cutoff = datetime.utcnow() - timedelta(days=15)
        new_count = 0
        
        for comp in competitors:
            created_at = getattr(comp, 'created_at', None)
            if created_at:
                try:
                    if isinstance(created_at, str):
                        comp_date = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                    else:
                        comp_date = created_at
                    if comp_date.replace(tzinfo=None) >= cutoff:
                        new_count += 1
                except:
                    continue
        
        if new_count > 0:
            return {
                "type": "new_competitors",
                "icon": "👥",
                "title": "Nuevos competidores",
                "description": f"{new_count} nuevos competidores en los últimos 15 días",
                "priority": "medium",
                "data": {"count": new_count, "period_days": 15}
            }
        
        return None
    
    def _analyze_top_competitor_range(self, competitors: List[Competitor]) -> Optional[Dict]:
        """Analyze top competitor score range."""
        if not competitors:
            return None
        
        scores = [
            getattr(comp, 'visibility_score', 0) or 0 
            for comp in competitors
        ]
        scores = [s for s in scores if s > 0]
        
        if not scores:
            return None
        
        min_score = min(scores)
        max_score = max(scores)
        
        if max_score >= 70:
            return {
                "type": "top_competitor_range",
                "icon": "🎯",
                "title": "Competidores destacados",
                "description": f"Los mejores competidores obtienen {int(min_score)}-{int(max_score)}/100",
                "priority": "low",
                "data": {"min": min_score, "max": max_score}
            }
        
        return None
    
    def _overall_assessment(self, snapshots: List[Dict]) -> Optional[Dict]:
        """Generate overall score assessment."""
        if not snapshots:
            return None
        
        # Calculate average of latest scores per model
        model_scores = {}
        for snap in snapshots:
            model = snap.get("ai_model", "unknown")
            score = snap.get("visibility_score", 0)
            if model not in model_scores:
                model_scores[model] = score
        
        if not model_scores:
            return None
        
        overall_avg = sum(model_scores.values()) / len(model_scores)
        
        if overall_avg < 30:
            return {
                "type": "overall_low",
                "icon": "⚠️",
                "title": "Puntuación general baja",
                "description": f"Tu puntuación promedio es {int(overall_avg)}/100. Hay margen de mejora.",
                "priority": "high",
                "data": {"score": overall_avg, "status": "low"}
            }
        elif overall_avg < 60:
            return {
                "type": "overall_medium",
                "icon": "📊",
                "title": "Puntuación moderada",
                "description": f"Tu puntuación promedio es {int(overall_avg)}/100. Vas por buen camino.",
                "priority": "medium",
                "data": {"score": overall_avg, "status": "medium"}
            }
        else:
            return {
                "type": "overall_high",
                "icon": "🌟",
                "title": "Excelente visibilidad",
                "description": f"Tu puntuación promedio es {int(overall_avg)}/100. ¡Sigue así!",
                "priority": "low",
                "data": {"score": overall_avg, "status": "high"}
            }

    async def get_language_comparison(self, brand_id: str, days: int = 30) -> Dict[str, Any]:
        """
        Get visibility comparison by language.
        
        Aggregates visibility scores grouped by language from snapshots.
        """
        try:
            from supabase import create_client
            from app.core.config import settings
            
            supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
            
            cutoff_date = (datetime.utcnow() - timedelta(days=days)).isoformat()
            
            snapshots_response = supabase.table("ai_visibility_snapshots") \
                .select("language, visibility_score, mention_count") \
                .eq("brand_id", brand_id) \
                .gte("measured_at", cutoff_date) \
                .execute()
            
            snapshots = snapshots_response.data or []
            
            # Aggregate by language
            language_data: Dict[str, Dict[str, Any]] = {}
            for snap in snapshots:
                lang = snap.get("language", "en") or "en"
                score = snap.get("visibility_score", 0) or 0
                mentions = snap.get("mention_count", 0) or 0
                
                if lang not in language_data:
                    language_data[lang] = {"scores": [], "mentions": 0}
                
                language_data[lang]["scores"].append(score)
                language_data[lang]["mentions"] += mentions
            
            # Calculate averages
            languages = []
            for lang, data in language_data.items():
                avg_score = sum(data["scores"]) / len(data["scores"]) if data["scores"] else 0
                languages.append({
                    "language": lang,
                    "score": round(avg_score, 1),
                    "mention_count": data["mentions"]
                })
            
            # Determine primary language (highest score)
            primary = max(languages, key=lambda x: x["score"])["language"] if languages else "en"
            
            return {
                "brand_id": brand_id,
                "languages": languages,
                "primary_language": primary,
                "generated_at": datetime.utcnow().isoformat() + "Z"
            }
            
        except Exception as e:
            logger.error(f"Failed to get language comparison for brand {brand_id}: {e}")
            return {
                "brand_id": brand_id,
                "languages": [],
                "primary_language": "en",
                "generated_at": datetime.utcnow().isoformat() + "Z",
                "error": str(e)
            }

    async def get_regional_comparison(self, brand_id: str, days: int = 30) -> Dict[str, Any]:
        """
        Get visibility comparison by region/country.
        
        For local/regional businesses, returns only the primary location.
        For national/international, aggregates from actual location data in snapshots.
        """
        try:
            from supabase import create_client
            from app.core.config import settings
            
            supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
            
            # First, get the brand's business_scope and location
            brand_response = supabase.table("brands") \
                .select("business_scope, location, city") \
                .eq("id", brand_id) \
                .single() \
                .execute()
            
            brand_data = brand_response.data or {}
            business_scope = brand_data.get("business_scope", "national")
            brand_location = brand_data.get("location", "ES")
            brand_city = brand_data.get("city", "")
            
            cutoff_date = (datetime.utcnow() - timedelta(days=days)).isoformat()
            
            snapshots_response = supabase.table("ai_visibility_snapshots") \
                .select("language, visibility_score, mention_count, location") \
                .eq("brand_id", brand_id) \
                .gte("measured_at", cutoff_date) \
                .execute()
            
            snapshots = snapshots_response.data or []
            
            # For local/regional businesses, only show their primary market
            if business_scope in ["local", "regional"]:
                # Calculate average score from all snapshots (they should all be for the same location)
                all_scores = [snap.get("visibility_score", 0) or 0 for snap in snapshots]
                avg_score = sum(all_scores) / len(all_scores) if all_scores else 0
                total_mentions = sum(snap.get("mention_count", 0) or 0 for snap in snapshots)
                
                region_label = brand_location
                if business_scope == "local" and brand_city:
                    region_label = f"{brand_city} ({brand_location})"
                
                return {
                    "brand_id": brand_id,
                    "business_scope": business_scope,
                    "regions": [{
                        "region": region_label,
                        "score": round(avg_score, 1),
                        "mention_count": total_mentions
                    }],
                    "primary_region": brand_location,
                    "generated_at": datetime.utcnow().isoformat() + "Z",
                    "message": "Negocio local/regional - solo se mide tu mercado principal"
                }
            
            # For national/international businesses, aggregate by location
            # Use location field if available, otherwise infer from language
            LANG_TO_REGION = {
                "es": "ES", "en": "US", "fr": "FR", "de": "DE",
                "it": "IT", "pt": "PT", "nl": "NL", "pl": "PL",
                "ru": "RU", "ja": "JP", "ko": "KR", "zh": "CN",
            }
            
            region_data: Dict[str, Dict[str, Any]] = {}
            for snap in snapshots:
                # Prefer explicit location field, fallback to language inference
                region = snap.get("location") or LANG_TO_REGION.get(snap.get("language", "en"), "US")
                score = snap.get("visibility_score", 0) or 0
                mentions = snap.get("mention_count", 0) or 0
                
                if region not in region_data:
                    region_data[region] = {"scores": [], "mentions": 0}
                
                region_data[region]["scores"].append(score)
                region_data[region]["mentions"] += mentions
            
            # Calculate averages
            regions = []
            for region, data in region_data.items():
                avg_score = sum(data["scores"]) / len(data["scores"]) if data["scores"] else 0
                regions.append({
                    "region": region,
                    "score": round(avg_score, 1),
                    "mention_count": data["mentions"]
                })
            
            # Determine primary region (highest score)
            primary = max(regions, key=lambda x: x["score"])["region"] if regions else brand_location
            
            return {
                "brand_id": brand_id,
                "business_scope": business_scope,
                "regions": regions,
                "primary_region": primary,
                "generated_at": datetime.utcnow().isoformat() + "Z"
            }
            
        except Exception as e:
            logger.error(f"Failed to get regional comparison for brand {brand_id}: {e}")
            return {
                "brand_id": brand_id,
                "regions": [],
                "primary_region": "US",
                "generated_at": datetime.utcnow().isoformat() + "Z",
                "error": str(e)
            }

    async def get_industry_comparison(self, brand_id: str, days: int = 30) -> Dict[str, Any]:
        """
        Compare brand's visibility against industry benchmarks.
        
        Aggregates visibility scores from all brands in the same industry
        to calculate:
        - Industry average score
        - Brand's percentile within industry
        - Top performers in industry
        """
        try:
            from supabase import create_client
            from app.core.config import settings
            
            supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
            
            # Get the brand's industry
            brand_response = supabase.table("brands") \
                .select("id, name, industry") \
                .eq("id", brand_id) \
                .single() \
                .execute()
            
            brand = brand_response.data
            if not brand or not brand.get("industry"):
                return {
                    "brand_id": brand_id,
                    "industry": None,
                    "brand_score": 0,
                    "industry_average": 0,
                    "percentile": 0,
                    "rank": 0,
                    "total_brands": 0,
                    "top_performers": [],
                    "generated_at": datetime.utcnow().isoformat() + "Z",
                    "message": "No industry set for this brand"
                }
            
            industry = brand["industry"]
            
            # Get all brands in the same industry
            cutoff_date = (datetime.utcnow() - timedelta(days=days)).isoformat()
            
            industry_brands_response = supabase.table("brands") \
                .select("id, name") \
                .eq("industry", industry) \
                .execute()
            
            industry_brands = industry_brands_response.data or []
            
            if len(industry_brands) < 2:
                return {
                    "brand_id": brand_id,
                    "industry": industry,
                    "brand_score": 0,
                    "industry_average": 0,
                    "percentile": 100,
                    "rank": 1,
                    "total_brands": 1,
                    "top_performers": [],
                    "generated_at": datetime.utcnow().isoformat() + "Z",
                    "message": "Not enough brands in industry for comparison"
                }
            
            # Get visibility scores for all brands in industry
            brand_ids = [b["id"] for b in industry_brands]
            brand_names = {b["id"]: b["name"] for b in industry_brands}
            
            snapshots_response = supabase.table("ai_visibility_snapshots") \
                .select("brand_id, visibility_score") \
                .in_("brand_id", brand_ids) \
                .gte("measured_at", cutoff_date) \
                .execute()
            
            snapshots = snapshots_response.data or []
            
            # Calculate average score per brand
            brand_scores: Dict[str, list] = {}
            for snap in snapshots:
                bid = snap.get("brand_id")
                score = snap.get("visibility_score", 0) or 0
                if bid not in brand_scores:
                    brand_scores[bid] = []
                brand_scores[bid].append(score)
            
            # Calculate averages
            brand_averages = []
            for bid, scores in brand_scores.items():
                avg = sum(scores) / len(scores) if scores else 0
                brand_averages.append({
                    "brand_id": bid,
                    "name": brand_names.get(bid, "Unknown"),
                    "score": round(avg, 1)
                })
            
            # Sort by score descending
            brand_averages.sort(key=lambda x: x["score"], reverse=True)
            
            # Find current brand's position
            current_brand_score = 0
            current_brand_rank = 0
            for i, b in enumerate(brand_averages):
                if b["brand_id"] == brand_id:
                    current_brand_score = b["score"]
                    current_brand_rank = i + 1
                    break
            
            # Calculate industry average
            all_scores = [b["score"] for b in brand_averages]
            industry_average = sum(all_scores) / len(all_scores) if all_scores else 0
            
            # Calculate percentile (percentage of brands the current brand beats)
            if len(brand_averages) > 1:
                brands_below = len([b for b in brand_averages if b["score"] < current_brand_score])
                percentile = round((brands_below / (len(brand_averages) - 1)) * 100)
            else:
                percentile = 100
            
            # Get top 3 performers (excluding current brand if in top 3)
            top_performers = []
            for b in brand_averages[:5]:
                if b["brand_id"] != brand_id:
                    top_performers.append({
                        "name": b["name"],
                        "score": b["score"]
                    })
                if len(top_performers) >= 3:
                    break
            
            return {
                "brand_id": brand_id,
                "industry": industry,
                "brand_score": current_brand_score,
                "industry_average": round(industry_average, 1),
                "percentile": percentile,
                "rank": current_brand_rank,
                "total_brands": len(brand_averages),
                "top_performers": top_performers,
                "generated_at": datetime.utcnow().isoformat() + "Z"
            }
            
        except Exception as e:
            logger.error(f"Failed to get industry comparison for brand {brand_id}: {e}")
            return {
                "brand_id": brand_id,
                "industry": None,
                "brand_score": 0,
                "industry_average": 0,
                "percentile": 0,
                "rank": 0,
                "total_brands": 0,
                "top_performers": [],
                "generated_at": datetime.utcnow().isoformat() + "Z",
                "error": str(e)
            }

    async def get_local_market_insights(self, brand_id: str, days: int = 30) -> Dict[str, Any]:
        """
        Get local market dominance insights for local/regional businesses.
        
        This is a professional alternative to language/region comparison
        for businesses that operate in a specific local market.
        
        Returns:
        - market_dominance: Brand's visibility score relative to local competitors
        - local_mentions: Number of times brand mentioned in local context
        - competitor_count: Number of tracked competitors
        - top_queries: Most common local search queries where brand appears
        """
        try:
            from supabase import create_client
            from app.core.config import settings
            
            supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
            
            # Get brand details
            brand_response = supabase.table("brands") \
                .select("business_scope, location, city, name") \
                .eq("id", brand_id) \
                .single() \
                .execute()
            
            brand_data = brand_response.data or {}
            brand_location = brand_data.get("location", "ES")
            brand_city = brand_data.get("city", "")
            brand_name = brand_data.get("name", "")
            
            cutoff_date = (datetime.utcnow() - timedelta(days=days)).isoformat()
            
            # Get visibility snapshots
            snapshots_response = supabase.table("ai_visibility_snapshots") \
                .select("visibility_score, mention_count, metadata") \
                .eq("brand_id", brand_id) \
                .gte("measured_at", cutoff_date) \
                .execute()
            
            snapshots = snapshots_response.data or []
            
            # Calculate market dominance (average visibility score)
            scores = [s.get("visibility_score", 0) or 0 for s in snapshots]
            market_dominance = round(sum(scores) / len(scores), 1) if scores else 0
            
            # Count total mentions
            local_mentions = sum(s.get("mention_count", 0) or 0 for s in snapshots)
            
            # Get competitor count
            competitors_response = supabase.table("competitors") \
                .select("id") \
                .eq("brand_id", brand_id) \
                .execute()
            
            competitor_count = len(competitors_response.data or [])
            
            # Extract top queries from metadata
            top_queries = []
            for snap in snapshots:
                metadata = snap.get("metadata", {}) or {}
                if isinstance(metadata, dict):
                    snippets = metadata.get("context_snippets", [])
                    for snippet in snippets[:2]:
                        if snippet and len(snippet) < 100:
                            top_queries.append(snippet[:50])
            
            # Deduplicate and limit
            top_queries = list(set(top_queries))[:5]
            
            # Generate local-specific queries based on city/location
            if not top_queries and brand_city:
                top_queries = [
                    f"mejor {brand_data.get('industry', 'servicio')} en {brand_city}",
                    f"{brand_data.get('industry', 'empresas')} {brand_city}",
                    f"recomendación {brand_data.get('industry', '')} {brand_city}"
                ]
            
            return {
                "brand_id": brand_id,
                "market_dominance": market_dominance,
                "local_mentions": local_mentions,
                "competitor_count": competitor_count,
                "top_queries": top_queries[:3],
                "location": brand_location,
                "city": brand_city,
                "generated_at": datetime.utcnow().isoformat() + "Z"
            }
            
        except Exception as e:
            logger.error(f"Failed to get local market insights for brand {brand_id}: {e}")
            return {
                "brand_id": brand_id,
                "market_dominance": 0,
                "local_mentions": 0,
                "competitor_count": 0,
                "top_queries": [],
                "location": "ES",
                "city": "",
                "generated_at": datetime.utcnow().isoformat() + "Z",
                "error": str(e)
            }


# Singleton
_insights_service = InsightsService()


def get_insights_service() -> InsightsService:
    return _insights_service


