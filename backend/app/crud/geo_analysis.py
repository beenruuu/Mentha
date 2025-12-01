"""
CRUD operations for GEO Analysis tables.

This module provides database operations for:
- geo_analysis_results
- ai_visibility_snapshots
- citation_records
- brand_mentions
- model_rankings
- query_responses
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from supabase import Client

import logging

logger = logging.getLogger(__name__)


class GEOAnalysisCRUD:
    """CRUD operations for GEO analysis data."""
    
    def __init__(self, supabase: Client):
        self.supabase = supabase
    
    # =====================================================
    # GEO ANALYSIS RESULTS
    # =====================================================
    
    async def create_geo_analysis(
        self,
        brand_id: str,
        overall_score: float,
        grade: str,
        status: str = "processing",
        modules: Dict[str, Any] = None,
        summary: str = None,
        recommendations: List[Dict[str, str]] = None,
        metadata: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Create a new GEO analysis record."""
        try:
            data = {
                "brand_id": brand_id,
                "overall_score": overall_score,
                "grade": grade,
                "status": status,
                "modules": modules or {},
                "summary": summary,
                "recommendations": recommendations or [],
                "metadata": metadata or {}
            }
            
            result = self.supabase.table("geo_analysis_results").insert(data).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error creating GEO analysis: {e}")
            raise
    
    async def update_geo_analysis(
        self,
        analysis_id: str,
        status: str = None,
        overall_score: float = None,
        grade: str = None,
        modules: Dict[str, Any] = None,
        summary: str = None,
        recommendations: List[Dict[str, str]] = None,
        completed_at: datetime = None
    ) -> Dict[str, Any]:
        """Update an existing GEO analysis record."""
        try:
            data = {}
            if status is not None:
                data["status"] = status
            if overall_score is not None:
                data["overall_score"] = overall_score
            if grade is not None:
                data["grade"] = grade
            if modules is not None:
                data["modules"] = modules
            if summary is not None:
                data["summary"] = summary
            if recommendations is not None:
                data["recommendations"] = recommendations
            if completed_at is not None:
                data["completed_at"] = completed_at.isoformat()
            
            result = self.supabase.table("geo_analysis_results")\
                .update(data)\
                .eq("id", analysis_id)\
                .execute()
            
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error updating GEO analysis: {e}")
            raise
    
    async def get_geo_analysis_by_id(self, analysis_id: str) -> Optional[Dict[str, Any]]:
        """Get a single GEO analysis by ID."""
        try:
            result = self.supabase.table("geo_analysis_results")\
                .select("*")\
                .eq("id", analysis_id)\
                .execute()
            
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error fetching GEO analysis: {e}")
            raise
    
    async def get_latest_geo_analysis(self, brand_id: str) -> Optional[Dict[str, Any]]:
        """Get the most recent GEO analysis for a brand."""
        try:
            result = self.supabase.table("geo_analysis_results")\
                .select("*")\
                .eq("brand_id", brand_id)\
                .order("created_at", desc=True)\
                .limit(1)\
                .execute()
            
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error fetching latest GEO analysis: {e}")
            raise
    
    async def get_geo_history(
        self,
        brand_id: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get historical GEO analyses for a brand."""
        try:
            result = self.supabase.table("geo_analysis_results")\
                .select("*")\
                .eq("brand_id", brand_id)\
                .order("created_at", desc=True)\
                .limit(limit)\
                .execute()
            
            return result.data
        except Exception as e:
            logger.error(f"Error fetching GEO history: {e}")
            raise
    
    # =====================================================
    # AI VISIBILITY SNAPSHOTS
    # =====================================================
    
    async def create_visibility_snapshot(
        self,
        brand_id: str,
        ai_model: str,
        visibility_score: float,
        mention_count: int = 0,
        sentiment: str = None,
        query_count: int = 0,
        inclusion_rate: float = None,
        average_position: float = None,
        language: str = "en",
        metadata: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Save an AI visibility snapshot."""
        try:
            data = {
                "brand_id": brand_id,
                "ai_model": ai_model,
                "visibility_score": visibility_score,
                "mention_count": mention_count,
                "sentiment": sentiment,
                "query_count": query_count,
                "inclusion_rate": inclusion_rate,
                "average_position": average_position,
                "language": language,
                "metadata": metadata or {}
            }
            
            result = self.supabase.table("ai_visibility_snapshots").insert(data).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error creating visibility snapshot: {e}")
            raise
    
    async def get_visibility_history(
        self,
        brand_id: str,
        ai_model: str = None,
        limit: int = 30
    ) -> List[Dict[str, Any]]:
        """Get visibility history for a brand."""
        try:
            query = self.supabase.table("ai_visibility_snapshots")\
                .select("*")\
                .eq("brand_id", brand_id)
            
            if ai_model:
                query = query.eq("ai_model", ai_model)
            
            result = query.order("measured_at", desc=True).limit(limit).execute()
            return result.data
        except Exception as e:
            logger.error(f"Error fetching visibility history: {e}")
            raise
    
    async def get_latest_visibility_scores(self, brand_id: str) -> List[Dict[str, Any]]:
        """Get latest visibility score per model for a brand."""
        try:
            # Use the view created in migration
            result = self.supabase.table("latest_visibility_scores")\
                .select("*")\
                .eq("brand_id", brand_id)\
                .execute()
            
            return result.data
        except Exception as e:
            logger.error(f"Error fetching latest visibility scores: {e}")
            raise
    
    # =====================================================
    # CITATION RECORDS
    # =====================================================
    
    async def create_citation_record(
        self,
        brand_id: str,
        ai_model: str,
        query: str,
        context: str = None,
        source_url: str = None,
        citation_type: str = "direct",
        metadata: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Save a citation record."""
        try:
            data = {
                "brand_id": brand_id,
                "ai_model": ai_model,
                "query": query,
                "context": context,
                "source_url": source_url,
                "citation_type": citation_type,
                "metadata": metadata or {}
            }
            
            result = self.supabase.table("citation_records").insert(data).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error creating citation record: {e}")
            raise
    
    async def get_citations(
        self,
        brand_id: str,
        ai_model: str = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get citation records for a brand."""
        try:
            query = self.supabase.table("citation_records")\
                .select("*")\
                .eq("brand_id", brand_id)
            
            if ai_model:
                query = query.eq("ai_model", ai_model)
            
            result = query.order("detected_at", desc=True).limit(limit).execute()
            return result.data
        except Exception as e:
            logger.error(f"Error fetching citations: {e}")
            raise
    
    async def get_citation_rates(self, brand_id: str) -> List[Dict[str, Any]]:
        """Get citation rates per model for a brand."""
        try:
            # Use the view created in migration
            result = self.supabase.table("citation_rates")\
                .select("*")\
                .eq("brand_id", brand_id)\
                .execute()
            
            return result.data
        except Exception as e:
            logger.error(f"Error fetching citation rates: {e}")
            raise
    
    # =====================================================
    # BRAND MENTIONS
    # =====================================================
    
    async def create_brand_mention(
        self,
        brand_id: str,
        ai_model: str,
        query: str,
        mention_text: str,
        context: str = None,
        position_in_response: int = None,
        sentiment: str = "neutral",
        metadata: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Save a brand mention."""
        try:
            data = {
                "brand_id": brand_id,
                "ai_model": ai_model,
                "query": query,
                "mention_text": mention_text,
                "context": context,
                "position_in_response": position_in_response,
                "sentiment": sentiment,
                "metadata": metadata or {}
            }
            
            result = self.supabase.table("brand_mentions").insert(data).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error creating brand mention: {e}")
            raise
    
    async def get_brand_mentions(
        self,
        brand_id: str,
        ai_model: str = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get brand mentions for a brand."""
        try:
            query = self.supabase.table("brand_mentions")\
                .select("*")\
                .eq("brand_id", brand_id)
            
            if ai_model:
                query = query.eq("ai_model", ai_model)
            
            result = query.order("detected_at", desc=True).limit(limit).execute()
            return result.data
        except Exception as e:
            logger.error(f"Error fetching brand mentions: {e}")
            raise
    
    # =====================================================
    # MODEL RANKINGS
    # =====================================================
    
    async def create_model_ranking(
        self,
        brand_id: str,
        ai_model: str,
        rank_score: float,
        inclusion_rate: float = None,
        average_position: float = None,
        metadata: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Save a model ranking."""
        try:
            data = {
                "brand_id": brand_id,
                "ai_model": ai_model,
                "rank_score": rank_score,
                "inclusion_rate": inclusion_rate,
                "average_position": average_position,
                "metadata": metadata or {}
            }
            
            result = self.supabase.table("model_rankings").insert(data).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error creating model ranking: {e}")
            raise
    
    async def get_ranking_history(
        self,
        brand_id: str,
        ai_model: str = None,
        limit: int = 30
    ) -> List[Dict[str, Any]]:
        """Get ranking history for a brand."""
        try:
            query = self.supabase.table("model_rankings")\
                .select("*")\
                .eq("brand_id", brand_id)
            
            if ai_model:
                query = query.eq("ai_model", ai_model)
            
            result = query.order("checked_at", desc=True).limit(limit).execute()
            return result.data
        except Exception as e:
            logger.error(f"Error fetching ranking history: {e}")
            raise
    
    # =====================================================
    # QUERY RESPONSES
    # =====================================================
    
    async def create_query_response(
        self,
        brand_id: str,
        ai_model: str,
        query: str,
        response_text: str,
        mentioned: bool = False,
        metadata: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Save a raw AI query response."""
        try:
            data = {
                "brand_id": brand_id,
                "ai_model": ai_model,
                "query": query,
                "response_text": response_text,
                "mentioned": mentioned,
                "metadata": metadata or {}
            }
            
            result = self.supabase.table("query_responses").insert(data).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error creating query response: {e}")
            raise
    
    async def get_query_responses(
        self,
        brand_id: str,
        ai_model: str = None,
        mentioned_only: bool = False,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get query responses for a brand."""
        try:
            query = self.supabase.table("query_responses")\
                .select("*")\
                .eq("brand_id", brand_id)
            
            if ai_model:
                query = query.eq("ai_model", ai_model)
            
            if mentioned_only:
                query = query.eq("mentioned", True)
            
            result = query.order("created_at", desc=True).limit(limit).execute()
            return result.data
        except Exception as e:
            logger.error(f"Error fetching query responses: {e}")
            raise


# Helper function to get CRUD instance
def get_geo_crud(supabase: Client) -> GEOAnalysisCRUD:
    """Get GEO CRUD instance."""
    return GEOAnalysisCRUD(supabase)
