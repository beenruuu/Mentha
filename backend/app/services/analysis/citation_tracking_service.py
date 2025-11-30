"""
Citation Tracking Service - Monitor brand citations in AI-generated responses.

This service queries multiple AI models and search engines to track
when and how a brand is being cited as a source of information.

Key Features:
- Track citations across ChatGPT, Claude, Perplexity, Gemini
- Monitor citation frequency and context
- Compare citation rates with competitors
- Track citation trends over time
"""

import asyncio
import re
from typing import Dict, Any, List, Optional
from datetime import datetime
import httpx

from app.core.config import settings


import logging

logger = logging.getLogger(__name__)


class CitationTrackingService:
    """
    Service to track and monitor brand citations in AI-generated content.
    
    Citations are more valuable than mentions because they indicate
    the AI considers your content authoritative enough to reference.
    """
    
    # Query templates designed to elicit source citations
    CITATION_QUERIES = [
        "What are the most authoritative sources for {topic}?",
        "Where can I find reliable information about {topic}?",
        "What do experts say about {topic}? Please cite your sources.",
        "Summarize what {brand_name} says about {topic}",
        "Who are the thought leaders in {industry}?",
        "What are the best resources to learn about {topic}?",
        "Compare different expert opinions on {topic}",
    ]
    
    # Perplexity-specific queries (Perplexity always cites sources)
    PERPLEXITY_QUERIES = [
        "What is {brand_name} and what do they do?",
        "What does {brand_name} offer in {industry}?",
        "Reviews and opinions about {brand_name}",
        "Latest news about {brand_name}",
    ]
    
    def __init__(self):
        self.openai_key = settings.OPENAI_API_KEY
        self.anthropic_key = settings.ANTHROPIC_API_KEY
        self.perplexity_key = getattr(settings, 'PERPLEXITY_API_KEY', '')
        
    async def track_citations(
        self,
        brand_name: str,
        domain: str,
        industry: str = "",
        topics: List[str] = None,
        competitors: List[str] = None
    ) -> Dict[str, Any]:
        """
        Track brand citations across AI platforms.
        
        Args:
            brand_name: Brand to track citations for
            domain: Brand's domain (to identify citations by URL)
            industry: Industry context
            topics: Specific topics to query about
            competitors: Competitor brands to compare citation rates
            
        Returns:
            Citation tracking results with metrics and details
        """
        logger.info(f"[CITATION] Starting citation tracking for brand: {brand_name}, domain: {domain}")
        logger.info(f"[CITATION] Industry: {industry}, Topics: {topics}, Competitors: {competitors}")
        
        results = {
            "brand_name": brand_name,
            "domain": domain,
            "tracked_at": datetime.utcnow().isoformat() + "Z",
            "citations": {
                "total_found": 0,
                "by_platform": {},
                "by_topic": {},
                "contexts": []
            },
            "competitor_comparison": {},
            "citation_score": 0,
            "trends": {
                "sentiment": "neutral",
                "authority_signals": []
            }
        }
        
        topics = topics or [industry] if industry else ["technology"]
        
        # Track citations on each platform
        tasks = []
        
        if self.perplexity_key:
            # Perplexity is best for citation tracking (always cites sources)
            tasks.append(self._track_perplexity_citations(brand_name, domain, topics))
        
        if self.openai_key:
            tasks.append(self._track_openai_citations(brand_name, domain, topics, industry))
        
        if self.anthropic_key:
            tasks.append(self._track_anthropic_citations(brand_name, domain, topics, industry))
        
        # Web search as baseline (free)
        tasks.append(self._track_web_citations(brand_name, domain, industry))
        
        if not tasks:
            logger.warning("[CITATION] No API keys configured for citation tracking")
            return {"error": "No API keys configured", "enabled": False}
        
        logger.info(f"[CITATION] Running {len(tasks)} platform checks in parallel")
        platform_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        total_citations = 0
        all_contexts = []
        
        for result in platform_results:
            if isinstance(result, Exception):
                logger.error(f"[CITATION] Platform check failed with exception: {result}")
                continue
            if not result:
                logger.warning(f"[CITATION] Empty result from platform")
                continue
                
            platform = result.get("platform", "unknown")
            results["citations"]["by_platform"][platform] = {
                "citations_found": result.get("citation_count", 0),
                "queries_run": result.get("queries_run", 0),
                "citation_rate": result.get("citation_rate", 0),
                "sources_mentioned": result.get("sources", [])
            }
            
            total_citations += result.get("citation_count", 0)
            all_contexts.extend(result.get("contexts", []))
        
        results["citations"]["total_found"] = total_citations
        results["citations"]["contexts"] = all_contexts[:10]  # Top 10 contexts
        
        logger.info(f"[CITATION] Total citations found: {total_citations}")
        
        # Calculate citation score (0-100)
        results["citation_score"] = self._calculate_citation_score(results)
        logger.info(f"[CITATION] Citation score calculated: {results['citation_score']}")
        
        # Track competitor citations if provided
        if competitors:
            results["competitor_comparison"] = await self._compare_with_competitors(
                brand_name, competitors, domain, industry, topics
            )
        
        # Analyze authority signals
        results["trends"]["authority_signals"] = self._extract_authority_signals(all_contexts)
        results["trends"]["sentiment"] = self._analyze_citation_sentiment(all_contexts)
        
        return results
    
    async def _track_perplexity_citations(
        self,
        brand_name: str,
        domain: str,
        topics: List[str]
    ) -> Dict[str, Any]:
        """
        Track citations in Perplexity responses.
        Perplexity always provides source citations, making it ideal for this.
        """
        if not self.perplexity_key:
            return {"platform": "perplexity", "enabled": False}
        
        result = {
            "platform": "perplexity",
            "enabled": True,
            "citation_count": 0,
            "queries_run": 0,
            "citation_rate": 0,
            "sources": [],
            "contexts": []
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                headers = {
                    "Authorization": f"Bearer {self.perplexity_key}",
                    "Content-Type": "application/json"
                }
                
                queries = [q.format(brand_name=brand_name, topic=t, industry=topics[0] if topics else "")
                          for q in self.PERPLEXITY_QUERIES[:3]
                          for t in topics[:2]]
                
                for query in queries[:4]:  # Limit to control cost
                    try:
                        response = await client.post(
                            "https://api.perplexity.ai/chat/completions",
                            headers=headers,
                            json={
                                "model": "llama-3.1-sonar-small-128k-online",
                                "messages": [{"role": "user", "content": query}],
                                "max_tokens": 500
                            }
                        )
                        
                        if response.status_code == 200:
                            data = response.json()
                            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                            citations = data.get("citations", [])
                            
                            result["queries_run"] += 1
                            
                            # Check if our domain is in citations
                            domain_clean = domain.lower().replace('https://', '').replace('http://', '').replace('www.', '')
                            
                            for cite in citations:
                                if domain_clean in cite.lower():
                                    result["citation_count"] += 1
                                    result["sources"].append(cite)
                                    
                                    # Extract context around citation
                                    context = self._extract_citation_context(content, brand_name, domain)
                                    if context:
                                        result["contexts"].append({
                                            "query": query,
                                            "context": context,
                                            "source_url": cite
                                        })
                            
                    except Exception as e:
                        print(f"Perplexity query error: {e}")
                        continue
                
                if result["queries_run"] > 0:
                    result["citation_rate"] = round(
                        (result["citation_count"] / result["queries_run"]) * 100, 1
                    )
                    
        except Exception as e:
            result["error"] = str(e)
        
        return result
    
    async def _track_openai_citations(
        self,
        brand_name: str,
        domain: str,
        topics: List[str],
        industry: str
    ) -> Dict[str, Any]:
        """
        Track citations in OpenAI responses.
        GPT doesn't always cite sources but may reference websites.
        """
        if not self.openai_key:
            return {"platform": "openai", "enabled": False}
        
        result = {
            "platform": "openai",
            "enabled": True,
            "citation_count": 0,
            "queries_run": 0,
            "citation_rate": 0,
            "sources": [],
            "contexts": []
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                headers = {
                    "Authorization": f"Bearer {self.openai_key}",
                    "Content-Type": "application/json"
                }
                
                queries = [
                    q.format(brand_name=brand_name, topic=t, industry=industry)
                    for q in self.CITATION_QUERIES[:3]
                    for t in topics[:2]
                ]
                
                for query in queries[:3]:
                    try:
                        response = await client.post(
                            "https://api.openai.com/v1/chat/completions",
                            headers=headers,
                            json={
                                "model": "gpt-3.5-turbo",
                                "messages": [{"role": "user", "content": query}],
                                "max_tokens": 500
                            }
                        )
                        
                        if response.status_code == 200:
                            data = response.json()
                            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                            
                            result["queries_run"] += 1
                            
                            # Check for domain/brand mentions as citations
                            if self._is_cited_as_source(content, brand_name, domain):
                                result["citation_count"] += 1
                                
                                context = self._extract_citation_context(content, brand_name, domain)
                                if context:
                                    result["contexts"].append({
                                        "query": query,
                                        "context": context
                                    })
                    except Exception as e:
                        print(f"OpenAI query error: {e}")
                        continue
                
                if result["queries_run"] > 0:
                    result["citation_rate"] = round(
                        (result["citation_count"] / result["queries_run"]) * 100, 1
                    )
                    
        except Exception as e:
            result["error"] = str(e)
        
        return result
    
    async def _track_anthropic_citations(
        self,
        brand_name: str,
        domain: str,
        topics: List[str],
        industry: str
    ) -> Dict[str, Any]:
        """Track citations in Anthropic Claude responses."""
        if not self.anthropic_key:
            return {"platform": "anthropic", "enabled": False}
        
        result = {
            "platform": "anthropic",
            "enabled": True,
            "citation_count": 0,
            "queries_run": 0,
            "citation_rate": 0,
            "sources": [],
            "contexts": []
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                headers = {
                    "x-api-key": self.anthropic_key,
                    "Content-Type": "application/json",
                    "anthropic-version": "2023-06-01"
                }
                
                queries = [
                    q.format(brand_name=brand_name, topic=t, industry=industry)
                    for q in self.CITATION_QUERIES[:3]
                    for t in topics[:2]
                ]
                
                for query in queries[:3]:
                    try:
                        response = await client.post(
                            "https://api.anthropic.com/v1/messages",
                            headers=headers,
                            json={
                                "model": "claude-3-haiku-20240307",
                                "max_tokens": 500,
                                "messages": [{"role": "user", "content": query}]
                            }
                        )
                        
                        if response.status_code == 200:
                            data = response.json()
                            content = ""
                            for block in data.get("content", []):
                                if block.get("type") == "text":
                                    content += block.get("text", "")
                            
                            result["queries_run"] += 1
                            
                            if self._is_cited_as_source(content, brand_name, domain):
                                result["citation_count"] += 1
                                
                                context = self._extract_citation_context(content, brand_name, domain)
                                if context:
                                    result["contexts"].append({
                                        "query": query,
                                        "context": context
                                    })
                    except Exception as e:
                        print(f"Anthropic query error: {e}")
                        continue
                
                if result["queries_run"] > 0:
                    result["citation_rate"] = round(
                        (result["citation_count"] / result["queries_run"]) * 100, 1
                    )
                    
        except Exception as e:
            result["error"] = str(e)
        
        return result
    
    async def _track_web_citations(
        self,
        brand_name: str,
        domain: str,
        industry: str
    ) -> Dict[str, Any]:
        """
        Track web citations via search engines.
        Look for pages that link to or cite the brand.
        """
        result = {
            "platform": "web_search",
            "enabled": True,
            "citation_count": 0,
            "queries_run": 0,
            "citation_rate": 0,
            "sources": [],
            "contexts": []
        }
        
        try:
            from duckduckgo_search import DDGS
            
            domain_clean = domain.replace('https://', '').replace('http://', '').replace('www.', '')
            
            # Search for pages that cite/link to the domain
            queries = [
                f'link:{domain_clean}',
                f'"{brand_name}" source',
                f'"{brand_name}" according to',
                f'"{domain_clean}" citation',
            ]
            
            with DDGS() as ddgs:
                for query in queries[:3]:
                    try:
                        search_results = list(ddgs.text(query, max_results=10))
                        result["queries_run"] += 1
                        
                        for res in search_results:
                            # Count as citation if it's not our own domain
                            url = res.get('href', '').lower()
                            if domain_clean not in url:
                                title = res.get('title', '').lower()
                                body = res.get('body', '').lower()
                                
                                if brand_name.lower() in title or brand_name.lower() in body:
                                    result["citation_count"] += 1
                                    result["sources"].append(res.get('href', ''))
                                    result["contexts"].append({
                                        "query": query,
                                        "context": res.get('body', '')[:200],
                                        "source_url": res.get('href', '')
                                    })
                                    
                    except Exception as e:
                        print(f"Web search error: {e}")
                        continue
            
            if result["queries_run"] > 0:
                result["citation_rate"] = round(
                    (result["citation_count"] / (result["queries_run"] * 10)) * 100, 1
                )
                
        except ImportError:
            result["error"] = "duckduckgo_search not installed"
        except Exception as e:
            result["error"] = str(e)
        
        return result
    
    def _is_cited_as_source(self, text: str, brand_name: str, domain: str) -> bool:
        """
        Check if brand/domain is cited as an authoritative source.
        Look for citation patterns, not just mentions.
        """
        text_lower = text.lower()
        brand_lower = brand_name.lower()
        domain_lower = domain.lower().replace('https://', '').replace('http://', '').replace('www.', '')
        
        # Citation indicator phrases
        citation_phrases = [
            f"according to {brand_lower}",
            f"as {brand_lower} states",
            f"as reported by {brand_lower}",
            f"{brand_lower} recommends",
            f"{brand_lower} suggests",
            f"source: {brand_lower}",
            f"reference: {brand_lower}",
            f"{brand_lower}'s research",
            f"{brand_lower}'s study",
            f"per {brand_lower}",
            f"from {brand_lower}",
            domain_lower,
        ]
        
        return any(phrase in text_lower for phrase in citation_phrases)
    
    def _extract_citation_context(
        self,
        text: str,
        brand_name: str,
        domain: str,
        context_length: int = 150
    ) -> Optional[str]:
        """Extract context around where brand is cited."""
        text_lower = text.lower()
        brand_lower = brand_name.lower()
        
        idx = text_lower.find(brand_lower)
        if idx == -1:
            domain_clean = domain.lower().replace('https://', '').replace('http://', '').replace('www.', '')
            idx = text_lower.find(domain_clean)
        
        if idx == -1:
            return None
        
        start = max(0, idx - context_length)
        end = min(len(text), idx + len(brand_name) + context_length)
        
        snippet = text[start:end].strip()
        if start > 0:
            snippet = "..." + snippet
        if end < len(text):
            snippet = snippet + "..."
        
        return snippet
    
    def _calculate_citation_score(self, results: Dict[str, Any]) -> float:
        """
        Calculate overall citation score (0-100).
        
        Scoring:
        - Perplexity citations: High value (they're real URL citations)
        - OpenAI/Claude citations: Medium value (mentions as source)
        - Web citations: Base value (third-party references)
        """
        score = 0.0
        
        platforms = results["citations"]["by_platform"]
        
        # Perplexity (40 points max - most valuable)
        if "perplexity" in platforms and platforms["perplexity"].get("citations_found", 0) > 0:
            perplexity_score = min(platforms["perplexity"]["citation_rate"] * 0.4, 40)
            score += perplexity_score
        
        # OpenAI (25 points max)
        if "openai" in platforms and platforms["openai"].get("citations_found", 0) > 0:
            openai_score = min(platforms["openai"]["citation_rate"] * 0.25, 25)
            score += openai_score
        
        # Anthropic (25 points max)
        if "anthropic" in platforms and platforms["anthropic"].get("citations_found", 0) > 0:
            anthropic_score = min(platforms["anthropic"]["citation_rate"] * 0.25, 25)
            score += anthropic_score
        
        # Web search (10 points max)
        if "web_search" in platforms and platforms["web_search"].get("citations_found", 0) > 0:
            web_score = min(platforms["web_search"]["citation_rate"] * 0.1, 10)
            score += web_score
        
        return round(min(score, 100), 1)
    
    async def _compare_with_competitors(
        self,
        brand_name: str,
        competitors: List[str],
        domain: str,
        industry: str,
        topics: List[str]
    ) -> Dict[str, Any]:
        """Compare citation rates with competitors."""
        comparison = {
            "brand": {"name": brand_name, "citation_count": 0},
            "competitors": []
        }
        
        # This would run citation tracking for each competitor
        # Simplified for now - in production, you'd want to batch this
        
        for competitor in competitors[:3]:  # Limit to 3 competitors
            comparison["competitors"].append({
                "name": competitor,
                "citation_count": 0,  # Would need actual tracking
                "note": "Full competitor tracking requires additional API calls"
            })
        
        return comparison
    
    def _extract_authority_signals(self, contexts: List[Dict]) -> List[str]:
        """Extract authority indicator phrases from citation contexts."""
        authority_words = [
            "expert", "authority", "leading", "trusted", "authoritative",
            "reliable", "respected", "renowned", "established", "official"
        ]
        
        signals = []
        
        for ctx in contexts:
            context_text = ctx.get("context", "").lower()
            for word in authority_words:
                if word in context_text:
                    signals.append(word)
        
        return list(set(signals))
    
    def _analyze_citation_sentiment(self, contexts: List[Dict]) -> str:
        """Analyze sentiment of citation contexts."""
        if not contexts:
            return "neutral"
        
        positive = ["best", "excellent", "great", "trusted", "reliable", "leading", "top"]
        negative = ["issues", "problems", "concerns", "avoid", "poor", "bad"]
        
        pos_count = 0
        neg_count = 0
        
        for ctx in contexts:
            text = ctx.get("context", "").lower()
            pos_count += sum(1 for w in positive if w in text)
            neg_count += sum(1 for w in negative if w in text)
        
        if pos_count > neg_count + 2:
            return "positive"
        elif neg_count > pos_count + 2:
            return "negative"
        return "neutral"


# Singleton instance
_citation_service: Optional[CitationTrackingService] = None

def get_citation_tracking_service() -> CitationTrackingService:
    """Get singleton instance of CitationTrackingService."""
    global _citation_service
    if _citation_service is None:
        _citation_service = CitationTrackingService()
    return _citation_service
