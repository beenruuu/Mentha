import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime
from uuid import UUID

from app.services.analysis.page_analyzer import PageAnalyzer
from app.services.analysis.technical_aeo_service import TechnicalAEOService

class CompetitorAnalyzerService:
    """
    Service for analyzing competitors using real-time crawling.
    Compares Brand vs Competitor on:
    1. Content (Keywords, Gaps)
    2. Technical AEO (Scores, Schemas)
    3. Visibility Potential
    """
    
    def __init__(self):
        self.page_analyzer = PageAnalyzer()
        self.aeo_service = TechnicalAEOService()

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
        
        # 1. Parallel Page Analysis (Content & Keywords)
        brand_task = self.page_analyzer.analyze_page(brand_url)
        comp_task = self.page_analyzer.analyze_page(competitor_url)
        
        # 2. Parallel Technical Audit
        brand_audit_task = self.aeo_service.audit_domain(brand_url.split('//')[1].split('/')[0])
        comp_audit_task = self.aeo_service.audit_domain(competitor_url.split('//')[1].split('/')[0])
        
        results = await asyncio.gather(
            brand_task, comp_task, brand_audit_task, comp_audit_task, 
            return_exceptions=True
        )
        
        brand_page, comp_page, brand_audit, comp_audit = results
        
        # Handle errors gracefully
        if isinstance(brand_page, Exception): brand_page = {}
        if isinstance(comp_page, Exception): comp_page = {}
        if isinstance(brand_audit, Exception): brand_audit = {}
        if isinstance(comp_audit, Exception): comp_audit = {}
        
        # 3. Calculate Keyword Gaps
        gaps = self._calculate_keyword_gaps(brand_page, comp_page)
        
        # 4. Compare Technical Signals
        tech_comparison = self._compare_technical(brand_audit, comp_audit)
        
        # 5. Calculate Visibility Score (Relative to Brand)
        visibility_score = self._calculate_visibility_score(comp_page, comp_audit)
        
        return {
            "analyzed_at": datetime.utcnow().isoformat(),
            "visibility_score": visibility_score,
            "keyword_gaps": gaps,
            "technical_comparison": tech_comparison,
            "content_comparison": {
                "word_count_diff": (comp_page.get("content_analysis", {}).get("word_count", 0) - 
                                  brand_page.get("content_analysis", {}).get("word_count", 0)),
                "competitor_word_count": comp_page.get("content_analysis", {}).get("word_count", 0),
                "brand_word_count": brand_page.get("content_analysis", {}).get("word_count", 0)
            },
            "strengths": self._identify_strengths(comp_page, comp_audit),
            "weaknesses": self._identify_weaknesses(comp_page, comp_audit)
        }

    def _calculate_keyword_gaps(self, brand_page: Dict, comp_page: Dict) -> List[Dict[str, Any]]:
        """Identify keywords present in competitor but missing in brand."""
        brand_kws = set(brand_page.get("keywords", {}).keys())
        comp_kws = comp_page.get("keywords", {})
        
        gaps = []
        for kw, count in comp_kws.items():
            if kw not in brand_kws and len(kw) > 3: # Filter short noise
                gaps.append({
                    "keyword": kw,
                    "competitor_frequency": count,
                    "opportunity_score": min(count * 10, 100) # Simple heuristic
                })
        
        # Sort by frequency
        return sorted(gaps, key=lambda x: x["competitor_frequency"], reverse=True)[:10]

    def _compare_technical(self, brand_audit: Dict, comp_audit: Dict) -> Dict[str, Any]:
        """Compare technical AEO scores."""
        return {
            "brand_score": brand_audit.get("aeo_readiness_score", 0),
            "competitor_score": comp_audit.get("aeo_readiness_score", 0),
            "score_diff": comp_audit.get("aeo_readiness_score", 0) - brand_audit.get("aeo_readiness_score", 0),
            "competitor_schemas": comp_audit.get("structured_data", {}).get("schema_types", [])
        }

    def _calculate_visibility_score(self, comp_page: Dict, comp_audit: Dict) -> float:
        """
        Calculate a 'Visibility Potential' score (0-100) based on real metrics.
        This replaces the 'estimated traffic' which we can't get without paid APIs.
        """
        score = 0.0
        
        # Technical Foundation (40%)
        score += comp_audit.get("aeo_readiness_score", 0) * 0.4
        
        # Content Depth (30%)
        word_count = comp_page.get("content_analysis", {}).get("word_count", 0)
        # Cap at 2000 words for max score
        content_score = min(word_count / 2000, 1.0) * 100
        score += content_score * 0.3
        
        # Keyword Richness (30%)
        unique_kws = len(comp_page.get("keywords", {}))
        # Cap at 50 keywords for max score
        kw_score = min(unique_kws / 50, 1.0) * 100
        score += kw_score * 0.3
        
        return round(score, 1)

    def _identify_strengths(self, comp_page: Dict, comp_audit: Dict) -> List[str]:
        """Identify what the competitor is doing well."""
        strengths = []
        if comp_audit.get("aeo_readiness_score", 0) > 80:
            strengths.append("High Technical AEO Readiness")
        if comp_page.get("content_analysis", {}).get("word_count", 0) > 1500:
            strengths.append("In-depth Content")
        if comp_audit.get("structured_data", {}).get("has_faq"):
            strengths.append("Uses FAQ Schema")
        return strengths

    def _identify_weaknesses(self, comp_page: Dict, comp_audit: Dict) -> List[str]:
        """Identify where the competitor is lacking."""
        weaknesses = []
        if comp_audit.get("aeo_readiness_score", 0) < 50:
            weaknesses.append("Poor Technical Optimization")
        if not comp_audit.get("structured_data", {}).get("total_schemas"):
            weaknesses.append("No Structured Data")
        if comp_page.get("content_analysis", {}).get("word_count", 0) < 300:
            weaknesses.append("Thin Content")
        return weaknesses

    async def close(self):
        await self.page_analyzer.close()
        await self.aeo_service.close()
