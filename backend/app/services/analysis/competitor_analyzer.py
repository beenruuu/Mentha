import asyncio
import re
import json
import httpx
from typing import Dict, Any, List, Optional, Set
from datetime import datetime
from uuid import UUID

from app.services.analysis.content_structure_analyzer_service import ContentStructureAnalyzerService
from app.services.ai_client_service import AIClientService, get_ai_client
from app.core.config import settings


class CompetitorAnalyzerService:
    """
    Service for analyzing competitors using LLM knowledge and real-time crawling.
    
    Features:
    - Automatic competitor discovery via LLM knowledge
    - Uses Mentha's AIClientService (OpenAI, Anthropic, Perplexity, Gemini)
    - Website content fetching for context
    - Parallel prompts for diversity (established, emerging, niche)
    - Semantic deduplication of competitor names
    - Technical AEO comparison
    """
    
    # Common variations to normalize
    COMPANY_SUFFIXES = ['inc', 'inc.', 'llc', 'ltd', 'corp', 'corporation', 'company', 'co', 'co.']
    
    def __init__(self):
        self.content_analyzer = ContentStructureAnalyzerService()
        self._ai_client: Optional[AIClientService] = None
    
    def _get_ai_client(self) -> Optional[AIClientService]:
        """Get Mentha's unified AI client (supports OpenAI, Anthropic, Perplexity, Gemini)."""
        if self._ai_client:
            return self._ai_client
        
        try:
            self._ai_client = get_ai_client()
            available = self._ai_client.available_providers
            if available:
                print(f"AI Client ready with providers: {available}")
                return self._ai_client
        except Exception as e:
            print(f"Failed to initialize AI client: {e}")
        
        return None
    
    # ========================================================================
    # AUTOMATIC COMPETITOR DISCOVERY (LLM Knowledge-Based)
    # Uses Mentha's AIClientService (OpenAI, Anthropic, Perplexity, Gemini)
    # ========================================================================
    
    async def discover_competitors(
        self,
        brand_name: str,
        industry: str,
        domain: str = "",
        description: str = "",
        max_competitors: int = 10
    ) -> Dict[str, Any]:
        """
        Automatically discover competitors using LLM knowledge from ALL providers.
        
        Queries OpenAI, Anthropic, and Perplexity in parallel to get diverse results.
        Each AI has different knowledge and may find different competitors.
        
        Args:
            brand_name: Name of the brand
            industry: Industry/sector
            domain: Optional website domain for context
            description: Optional brand description
            max_competitors: Maximum competitors to return
        
        Returns:
            Dict with discovered competitors aggregated from all providers
        """
        ai_client = self._get_ai_client()
        if not ai_client:
            return {
                "brand_name": brand_name,
                "industry": industry,
                "discovered_at": datetime.utcnow().isoformat(),
                "competitors": [],
                "total_found": 0,
                "error": "No AI provider configured (need OpenAI, Anthropic, or Perplexity)"
            }
        
        available_providers = ai_client.available_providers
        if not available_providers:
            return {
                "brand_name": brand_name,
                "industry": industry,
                "discovered_at": datetime.utcnow().isoformat(),
                "competitors": [],
                "total_found": 0,
                "error": "No AI providers available"
            }
        
        # Step 1: Fetch website content for context (optional)
        website_context = ""
        if domain:
            website_context = await self._fetch_website_context(domain)
        
        # Step 2: Build prompts
        prompts = self._build_discovery_prompts(brand_name, industry, description, website_context)
        
        # Step 3: Query ALL providers in parallel
        all_competitors = []
        providers_used = []
        
        # Create tasks for all providers × all prompts
        tasks = []
        task_info = []  # Track which provider each task belongs to
        
        for provider in available_providers:
            for prompt in prompts:
                tasks.append(self._call_ai_for_competitors(ai_client, prompt, provider))
                task_info.append(provider)
        
        # Run all in parallel
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Aggregate results
        for i, result in enumerate(results):
            provider = task_info[i]
            if isinstance(result, list) and result:
                for comp in result:
                    comp["source_provider"] = provider  # Track which AI found this
                all_competitors.extend(result)
                if provider not in providers_used:
                    providers_used.append(provider)
            elif isinstance(result, Exception):
                print(f"Provider {provider} failed: {result}")
        
        # Step 4: Deduplicate and normalize (keeps first occurrence, notes duplicates)
        unique_competitors = self._deduplicate_competitors(all_competitors, brand_name)
        
        # Limit to max_competitors
        final_competitors = unique_competitors[:max_competitors]
        
        return {
            "brand_name": brand_name,
            "industry": industry,
            "discovered_at": datetime.utcnow().isoformat(),
            "competitors": final_competitors,
            "total_found": len(final_competitors),
            "method": "multi_provider_llm",
            "providers_used": providers_used,
            "providers_available": available_providers
        }
    
    async def _fetch_website_context(self, domain: str) -> str:
        """Fetch website content for context (simplified version)."""
        url = domain if domain.startswith(('http://', 'https://')) else f'https://{domain}'
        
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(url, follow_redirects=True)
                if response.status_code == 200:
                    html = response.text
                    # Remove scripts and styles
                    html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
                    html = re.sub(r'<style[^>]*>.*?</style>', '', html, flags=re.DOTALL)
                    # Remove tags
                    text = re.sub(r'<[^>]+>', ' ', html)
                    # Clean up whitespace
                    text = re.sub(r'\s+', ' ', text).strip()
                    return text[:3000]
        except Exception as e:
            print(f"Failed to fetch website: {e}")
        
        return ""
    
    def _build_discovery_prompts(
        self,
        brand_name: str,
        industry: str,
        description: str,
        website_context: str
    ) -> List[str]:
        """Build 3 different prompts for diverse competitor discovery."""
        
        context_section = ""
        if website_context:
            context_section = f"\n\nWebsite Content Summary:\n{website_context[:1500]}"
        
        base_context = f"""Brand: {brand_name}
Industry: {industry}
Description: {description or 'Not provided'}{context_section}"""

        prompts = [
            # Prompt 1: Well-known, established competitors
            f"""{base_context}

Find 3-4 well-known, ESTABLISHED direct competitors for {brand_name}.

Return ONLY a JSON array with this exact format:
[{{"name": "Competitor Name", "domain": "competitor.com", "category": "direct", "reason": "Why they compete"}}]

Be specific and return real companies only.""",
            
            # Prompt 2: Newer, emerging competitors
            f"""{base_context}

Find 3-4 NEWER or EMERGING direct competitors for {brand_name}.

Return ONLY a JSON array with this exact format:
[{{"name": "Competitor Name", "domain": "competitor.com", "category": "direct", "reason": "Why they compete"}}]

Focus on startups or newer players gaining market share.""",
            
            # Prompt 3: Niche/indirect competitors
            f"""{base_context}

Find 3-4 INDIRECT or NICHE competitors for {brand_name} (companies that solve similar problems differently).

Return ONLY a JSON array with this exact format:
[{{"name": "Competitor Name", "domain": "competitor.com", "category": "indirect", "reason": "Why they compete"}}]"""
        ]
        
        return prompts
    
    async def _call_ai_for_competitors(
        self,
        ai_client: AIClientService,
        prompt: str,
        provider: str = "openai"
    ) -> List[Dict[str, Any]]:
        """Call AI to extract competitors using Mentha's AIClientService."""
        try:
            response = await ai_client.query(
                prompt=prompt,
                provider=provider,
                max_tokens=600,
                temperature=0.4
            )
            
            content = response.get("content", "")
            
            # Parse JSON
            try:
                competitors = json.loads(content)
                if isinstance(competitors, list):
                    return [c for c in competitors if isinstance(c, dict) and c.get("name")]
            except json.JSONDecodeError:
                # Try to extract array from text
                match = re.search(r'\[.*?\]', content, re.DOTALL)
                if match:
                    try:
                        return json.loads(match.group())
                    except:
                        pass
        except Exception as e:
            print(f"AI competitor call failed: {e}")
        
        return []
    
    def _deduplicate_competitors(
        self,
        competitors: List[Dict[str, Any]],
        brand_name: str
    ) -> List[Dict[str, Any]]:
        """Deduplicate competitors by name similarity."""
        if not competitors:
            return []
        
        brand_lower = brand_name.lower()
        seen_names = set()
        unique = []
        
        for comp in competitors:
            name = comp.get("name", "").strip()
            if not name:
                continue
            
            name_lower = name.lower()
            
            # Skip if it's the brand itself
            if brand_lower in name_lower or name_lower in brand_lower:
                continue
            
            # Normalize for dedup
            normalized = re.sub(r'[^a-z0-9]', '', name_lower)
            
            # Check similarity with existing
            is_duplicate = False
            for seen in seen_names:
                if normalized in seen or seen in normalized:
                    is_duplicate = True
                    break
                if len(normalized) > 4 and len(seen) > 4:
                    if normalized[:5] == seen[:5]:
                        is_duplicate = True
                        break
            
            if not is_duplicate:
                seen_names.add(normalized)
                unique.append({
                    "name": name,
                    "domain": comp.get("domain", ""),
                    "category": comp.get("category", "direct"),
                    "reason": comp.get("reason", ""),
                    "confidence": 0.85
                })
        
        return unique
    
    # ========================================================================
    # EXISTING COMPETITOR ANALYSIS (unchanged logic)
    # ========================================================================

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
            "competitor_has_faq": comp_analysis.get("faq_analysis", {}).get("has_faq_section", False),
            "aeo_signals": {
                "brand": brand_analysis.get("aeo_signals", {}),
                "competitor": comp_analysis.get("aeo_signals", {}),
                "direct_answer_gap": comp_analysis.get("aeo_signals", {}).get("direct_answer_score", 0) - brand_analysis.get("aeo_signals", {}).get("direct_answer_score", 0),
                "density_gap": comp_analysis.get("aeo_signals", {}).get("information_density_score", 0) - brand_analysis.get("aeo_signals", {}).get("information_density_score", 0)
            }
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

