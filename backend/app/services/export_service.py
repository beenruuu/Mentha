"""
Export Service - CSV export functionality for Mentha data.

This service provides export capabilities for:
- Keywords with metrics
- Competitors
- Visibility history
- Brand mentions
- Sentiment analysis
- All data as ZIP
"""

import io
import csv
import zipfile
from typing import Dict, Any, List, Optional
from datetime import datetime

from app.core.config import settings


class ExportService:
    """
    Service to export Mentha data in CSV format.
    """
    
    def __init__(self):
        pass
    
    async def export_keywords(
        self,
        brand_id: str,
        include_history: bool = False
    ) -> str:
        """Export keywords data as CSV string."""
        try:
            from supabase import create_client
            
            supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
            
            # Get keywords
            result = supabase.table("keywords").select("*").eq("brand_id", brand_id).execute()
            keywords = result.data or []
            
            # Create CSV
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Header
            headers = [
                "Keyword",
                "Search Volume",
                "Difficulty",
                "AI Visibility Score",
                "Tracked",
                "Created At",
                "Updated At"
            ]
            writer.writerow(headers)
            
            # Data rows
            for kw in keywords:
                row = [
                    kw.get("keyword", ""),
                    kw.get("search_volume", ""),
                    kw.get("difficulty", ""),
                    kw.get("ai_visibility_score", ""),
                    "Yes" if kw.get("tracked") else "No",
                    kw.get("created_at", ""),
                    kw.get("updated_at", "")
                ]
                writer.writerow(row)
            
            return output.getvalue()
            
        except Exception as e:
            print(f"Failed to export keywords: {e}")
            return ""
    
    async def export_competitors(self, brand_id: str) -> str:
        """Export competitors data as CSV string."""
        try:
            from supabase import create_client
            
            supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
            
            result = supabase.table("competitors").select("*").eq("brand_id", brand_id).execute()
            competitors = result.data or []
            
            output = io.StringIO()
            writer = csv.writer(output)
            
            headers = [
                "Name",
                "Domain",
                "Visibility Score",
                "Similarity Score",
                "Source",
                "Confidence",
                "Tracked",
                "Created At"
            ]
            writer.writerow(headers)
            
            for comp in competitors:
                row = [
                    comp.get("name", ""),
                    comp.get("domain", ""),
                    comp.get("visibility_score", ""),
                    comp.get("similarity_score", ""),
                    comp.get("source", "manual"),
                    comp.get("confidence", "medium"),
                    "Yes" if comp.get("tracked") else "No",
                    comp.get("created_at", "")
                ]
                writer.writerow(row)
            
            return output.getvalue()
            
        except Exception as e:
            print(f"Failed to export competitors: {e}")
            return ""
    
    async def export_visibility_history(
        self,
        brand_id: str,
        days: int = 90
    ) -> str:
        """Export AI visibility history as CSV string."""
        try:
            from supabase import create_client
            from datetime import timedelta
            
            supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
            
            # Calculate date range
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days)
            
            result = supabase.table("ai_visibility_snapshots").select("*").eq(
                "brand_id", brand_id
            ).gte(
                "measured_at", start_date.isoformat()
            ).order("measured_at", desc=True).execute()
            
            snapshots = result.data or []
            
            output = io.StringIO()
            writer = csv.writer(output)
            
            headers = [
                "Date",
                "AI Model",
                "Visibility Score",
                "Mention Count",
                "Sentiment",
                "Query Count",
                "Inclusion Rate",
                "Average Position",
                "Language"
            ]
            writer.writerow(headers)
            
            for snapshot in snapshots:
                row = [
                    snapshot.get("measured_at", ""),
                    snapshot.get("ai_model", ""),
                    snapshot.get("visibility_score", ""),
                    snapshot.get("mention_count", ""),
                    snapshot.get("sentiment", ""),
                    snapshot.get("query_count", ""),
                    snapshot.get("inclusion_rate", ""),
                    snapshot.get("average_position", ""),
                    snapshot.get("language", "")
                ]
                writer.writerow(row)
            
            return output.getvalue()
            
        except Exception as e:
            print(f"Failed to export visibility history: {e}")
            return ""
    
    async def export_mentions(
        self,
        brand_id: str,
        days: int = 90
    ) -> str:
        """Export brand mentions as CSV string."""
        try:
            from supabase import create_client
            from datetime import timedelta
            
            supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
            
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days)
            
            result = supabase.table("brand_mentions").select("*").eq(
                "brand_id", brand_id
            ).gte(
                "detected_at", start_date.isoformat()
            ).order("detected_at", desc=True).execute()
            
            mentions = result.data or []
            
            output = io.StringIO()
            writer = csv.writer(output)
            
            headers = [
                "Date",
                "AI Model",
                "Query",
                "Mention Text",
                "Context",
                "Position in Response",
                "Sentiment"
            ]
            writer.writerow(headers)
            
            for mention in mentions:
                row = [
                    mention.get("detected_at", ""),
                    mention.get("ai_model", ""),
                    mention.get("query", ""),
                    mention.get("mention_text", "")[:200],  # Truncate long texts
                    mention.get("context", "")[:300],
                    mention.get("position_in_response", ""),
                    mention.get("sentiment", "")
                ]
                writer.writerow(row)
            
            return output.getvalue()
            
        except Exception as e:
            print(f"Failed to export mentions: {e}")
            return ""
    
    async def export_prompt_tracking(self, brand_id: str) -> str:
        """Export tracked prompts and their results as CSV."""
        try:
            from supabase import create_client
            
            supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
            
            # Get tracked prompts
            prompts_result = supabase.table("tracked_prompts").select("*").eq(
                "brand_id", brand_id
            ).execute()
            prompts = prompts_result.data or []
            
            output = io.StringIO()
            writer = csv.writer(output)
            
            headers = [
                "Prompt Text",
                "Category",
                "Is Active",
                "Check Frequency",
                "Last Checked",
                "Created At"
            ]
            writer.writerow(headers)
            
            for prompt in prompts:
                row = [
                    prompt.get("prompt_text", ""),
                    prompt.get("category", ""),
                    "Yes" if prompt.get("is_active") else "No",
                    prompt.get("check_frequency", "daily"),
                    prompt.get("last_checked_at", ""),
                    prompt.get("created_at", "")
                ]
                writer.writerow(row)
            
            return output.getvalue()
            
        except Exception as e:
            print(f"Failed to export prompt tracking: {e}")
            return ""
    
    async def export_sentiment_analysis(self, brand_id: str) -> str:
        """Export sentiment analysis history as CSV."""
        try:
            from supabase import create_client
            
            supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
            
            result = supabase.table("sentiment_analysis").select("*").eq(
                "brand_id", brand_id
            ).order("analyzed_at", desc=True).limit(100).execute()
            
            analyses = result.data or []
            
            output = io.StringIO()
            writer = csv.writer(output)
            
            headers = [
                "Date",
                "AI Model",
                "Overall Sentiment",
                "Sentiment Score",
                "Trend",
                "Positive Aspects",
                "Negative Aspects"
            ]
            writer.writerow(headers)
            
            for analysis in analyses:
                positive = ", ".join(analysis.get("positive_aspects", [])[:5])
                negative = ", ".join(analysis.get("negative_aspects", [])[:5])
                
                row = [
                    analysis.get("analyzed_at", ""),
                    analysis.get("ai_model", ""),
                    analysis.get("overall_sentiment", ""),
                    analysis.get("sentiment_score", ""),
                    analysis.get("trend", ""),
                    positive,
                    negative
                ]
                writer.writerow(row)
            
            return output.getvalue()
            
        except Exception as e:
            print(f"Failed to export sentiment analysis: {e}")
            return ""
    
    async def export_all_as_zip(self, brand_id: str) -> bytes:
        """Export all data as a ZIP file containing multiple CSVs."""
        try:
            # Get brand name for the filename
            from supabase import create_client
            
            supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
            
            brand_result = supabase.table("brands").select("name").eq("id", brand_id).single().execute()
            brand_name = brand_result.data.get("name", "brand") if brand_result.data else "brand"
            brand_name_safe = "".join(c for c in brand_name if c.isalnum() or c in (' ', '-', '_')).strip()
            
            # Generate all CSVs
            keywords_csv = await self.export_keywords(brand_id)
            competitors_csv = await self.export_competitors(brand_id)
            visibility_csv = await self.export_visibility_history(brand_id)
            mentions_csv = await self.export_mentions(brand_id)
            prompts_csv = await self.export_prompt_tracking(brand_id)
            sentiment_csv = await self.export_sentiment_analysis(brand_id)
            
            # Create ZIP file in memory
            zip_buffer = io.BytesIO()
            
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                date_str = datetime.utcnow().strftime("%Y%m%d")
                
                if keywords_csv:
                    zip_file.writestr(f"{brand_name_safe}_keywords_{date_str}.csv", keywords_csv)
                
                if competitors_csv:
                    zip_file.writestr(f"{brand_name_safe}_competitors_{date_str}.csv", competitors_csv)
                
                if visibility_csv:
                    zip_file.writestr(f"{brand_name_safe}_visibility_{date_str}.csv", visibility_csv)
                
                if mentions_csv:
                    zip_file.writestr(f"{brand_name_safe}_mentions_{date_str}.csv", mentions_csv)
                
                if prompts_csv:
                    zip_file.writestr(f"{brand_name_safe}_prompts_{date_str}.csv", prompts_csv)
                
                if sentiment_csv:
                    zip_file.writestr(f"{brand_name_safe}_sentiment_{date_str}.csv", sentiment_csv)
                
                # Add a README
                readme_content = f"""Mentha Data Export
==================

Brand: {brand_name}
Export Date: {datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")} UTC

Files included:
- {brand_name_safe}_keywords_{date_str}.csv - Tracked keywords and their metrics
- {brand_name_safe}_competitors_{date_str}.csv - Competitor information
- {brand_name_safe}_visibility_{date_str}.csv - AI visibility history (last 90 days)
- {brand_name_safe}_mentions_{date_str}.csv - Brand mentions in AI responses (last 90 days)
- {brand_name_safe}_prompts_{date_str}.csv - Tracked prompts configuration
- {brand_name_safe}_sentiment_{date_str}.csv - Sentiment analysis history

For more information, visit: https://mentha.app
"""
                zip_file.writestr("README.txt", readme_content)
            
            zip_buffer.seek(0)
            return zip_buffer.getvalue()
            
        except Exception as e:
            print(f"Failed to create ZIP export: {e}")
            import traceback
            traceback.print_exc()
            return b""
    
    def generate_csv_response_headers(self, filename: str) -> Dict[str, str]:
        """Generate HTTP headers for CSV download."""
        return {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    
    def generate_zip_response_headers(self, filename: str) -> Dict[str, str]:
        """Generate HTTP headers for ZIP download."""
        return {
            "Content-Type": "application/zip",
            "Content-Disposition": f'attachment; filename="{filename}"'
        }


# Singleton instance
_export_service: Optional[ExportService] = None

def get_export_service() -> ExportService:
    """Get singleton instance of ExportService."""
    global _export_service
    if _export_service is None:
        _export_service = ExportService()
    return _export_service
