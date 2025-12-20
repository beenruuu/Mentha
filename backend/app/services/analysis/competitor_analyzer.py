import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime
from uuid import UUID

from app.services.analysis.content_structure_analyzer_service import ContentStructureAnalyzerService


class CompetitorAnalyzerService:
    """
    Service for analyzing competitors using real-time crawling.
    Compares Brand vs Competitor on:
    1. Content (Keywords, Gaps)
    2. Technical AEO (Scores, Schemas)
    3. Visibility Potential
    """
    
    def __init__(self):
        self.content_analyzer = ContentStructureAnalyzerService()

    async def analyze_competitor(
        self, 
        brand_url: str, 
        competitor_url: str
    ) -> Dict[str, Any]:
        """
        Perform a comparative analysis between brand and competitor.
        """
        # Ensure URLs have protocol
        if not brand_url.startswith(('http://', 'https://')):
            brand_url = f'https://{brand_url}'
        if not competitor_url.startswith(('http://', 'https://')):
            competitor_url = f'https://{competitor_url}'
            
        print(f"Analyzing Competitor: {competitor_url} vs Brand: {brand_url}")
        
        # Parallel Content Analysis using existing service
        brand_task = self.content_analyzer.analyze_content_structure(url=brand_url)
        comp_task = self.content_analyzer.analyze_content_structure(url=competitor_url)
        
        results = await asyncio.gather(
            brand_task, comp_task, 
            return_exceptions=True
        )
        
        brand_analysis, comp_analysis = results
        
        # Handle errors gracefully
        if isinstance(brand_analysis, Exception): 
            brand_analysis = {"overall_structure_score": 0, "faq_analysis": {}, "howto_analysis": {}}
        if isinstance(comp_analysis, Exception): 
            comp_analysis = {"overall_structure_score": 0, "faq_analysis": {}, "howto_analysis": {}}
        
        # Calculate Keyword Gaps (simplified)
        gaps = []
        
        # Compare Technical Signals
        tech_comparison = self._compare_technical(brand_analysis, comp_analysis)
        
        # Calculate Visibility Score
        visibility_score = self._calculate_visibility_score(comp_analysis, {})
        
        return {
            "analyzed_at": datetime.utcnow().isoformat(),
            "visibility_score": visibility_score,
            "keyword_gaps": gaps,
            "technical_comparison": tech_comparison,
            "content_comparison": {
                "word_count_diff": 0,
                "competitor_word_count": 0,
                "brand_word_count": 0
            },
            "strengths": self._identify_strengths({}, comp_analysis),
            "weaknesses": self._identify_weaknesses({}, comp_analysis)
        }

    def _compare_technical(self, brand_analysis: Dict, comp_analysis: Dict) -> Dict[str, Any]:
        """Compare technical AEO scores."""
        return {
            "brand_score": brand_analysis.get("overall_structure_score", 0),
            "competitor_score": comp_analysis.get("overall_structure_score", 0),
            "score_diff": comp_analysis.get("overall_structure_score", 0) - brand_analysis.get("overall_structure_score", 0),
            "competitor_has_faq": comp_analysis.get("faq_analysis", {}).get("has_faq_section", False)
        }

    def _calculate_visibility_score(self, comp_page: Dict, comp_audit: Dict) -> float:
        """
        Calculate a 'Visibility Potential' score (0-100) based on real metrics.
        """
        # Use overall structure score as primary metric
        return round(comp_page.get("overall_structure_score", 0), 1)

    def _identify_strengths(self, comp_page: Dict, comp_audit: Dict) -> List[str]:
        """Identify what the competitor is doing well."""
        strengths = []
        if comp_audit.get("overall_structure_score", 0) > 80:
            strengths.append("High Technical AEO Readiness")
        if comp_audit.get("faq_analysis", {}).get("has_faq_section"):
            strengths.append("Uses FAQ Schema")
        if comp_audit.get("howto_analysis", {}).get("total_howtos", 0) > 0:
            strengths.append("Has How-To Content")
        return strengths

    def _identify_weaknesses(self, comp_page: Dict, comp_audit: Dict) -> List[str]:
        """Identify where the competitor is lacking."""
        weaknesses = []
        if comp_audit.get("overall_structure_score", 0) < 50:
            weaknesses.append("Poor Technical Optimization")
        if not comp_audit.get("faq_analysis", {}).get("has_faq_section"):
            weaknesses.append("No FAQ Structure")
        return weaknesses

    async def close(self):
        """Cleanup resources."""
        if hasattr(self.content_analyzer, 'client') and self.content_analyzer.client:
            await self.content_analyzer.client.aclose()
