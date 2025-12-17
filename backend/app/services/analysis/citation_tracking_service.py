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
                                            "source_url": cite,
                                            "model": "perplexity"
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
            from ddgs import DDGS
            
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
    
    def classify_citation_type(
        self,
        ai_response: str,
        original_content: str,
        brand_name: str
    ) -> Dict[str, Any]:
        """
        Classify citation type: exact_quote, paraphrase, or mention.
        
        Args:
            ai_response: The AI model's response containing the citation
            original_content: The original content from the brand's website
            brand_name: Brand name
            
        Returns:
            Dict with citation_type, similarity_score, matched_text
        """
        from difflib import SequenceMatcher
        
        ai_lower = ai_response.lower()
        brand_lower = brand_name.lower()
        
        # Find where brand is mentioned
        brand_idx = ai_lower.find(brand_lower)
        if brand_idx == -1:
            return {
                "citation_type": "none",
                "similarity_score": 0,
                "matched_text": None,
                "explanation": "Brand not found in response"
            }
        
        # Get the sentence containing the brand mention
        start = ai_response.rfind('.', 0, brand_idx) + 1
        end = ai_response.find('.', brand_idx)
        if end == -1:
            end = len(ai_response)
        
        citation_sentence = ai_response[start:end].strip()
        
        if not original_content:
            return {
                "citation_type": "mention",
                "similarity_score": 0,
                "matched_text": citation_sentence,
                "explanation": "No original content to compare"
            }
        
        # Split original content into sentences for comparison
        original_sentences = [s.strip() for s in original_content.split('.') if len(s.strip()) > 20]
        
        best_match = {
            "similarity": 0,
            "original_sentence": "",
            "type": "mention"
        }
        
        for orig_sentence in original_sentences:
            # Calculate similarity
            similarity = SequenceMatcher(
                None, 
                citation_sentence.lower(), 
                orig_sentence.lower()
            ).ratio()
            
            if similarity > best_match["similarity"]:
                best_match["similarity"] = similarity
                best_match["original_sentence"] = orig_sentence
                
                # Classify based on similarity
                if similarity > 0.9:
                    best_match["type"] = "exact_quote"
                elif similarity > 0.5:
                    best_match["type"] = "paraphrase"
                else:
                    best_match["type"] = "mention"
        
        return {
            "citation_type": best_match["type"],
            "similarity_score": round(best_match["similarity"] * 100, 1),
            "matched_text": citation_sentence,
            "original_text": best_match["original_sentence"][:200] if best_match["original_sentence"] else None,
            "explanation": self._get_citation_type_explanation(best_match["type"], best_match["similarity"])
        }
    
    def _get_citation_type_explanation(self, citation_type: str, similarity: float) -> str:
        """Get human-readable explanation for citation type."""
        if citation_type == "exact_quote":
            return f"Cita textual ({similarity*100:.0f}% similitud) - El contenido se repite casi literalmente"
        elif citation_type == "paraphrase":
            return f"Paráfrasis ({similarity*100:.0f}% similitud) - La IA reformuló tu contenido"
        else:
            return "Mención simple - Solo nombra la marca sin citar contenido"
    
    async def analyze_citation_types(
        self,
        brand_name: str,
        domain: str,
        original_content: str = None
    ) -> Dict[str, Any]:
        """
        Analyze what types of citations (exact/paraphrase/mention) AIs use for a brand.
        
        Returns breakdown of citation types across AI models.
        """
        results = {
            "brand_name": brand_name,
            "analyzed_at": datetime.utcnow().isoformat() + "Z",
            "citation_breakdown": {
                "exact_quotes": 0,
                "paraphrases": 0,
                "mentions": 0
            },
            "by_model": {},
            "examples": []
        }
        
        # Fetch original content if not provided
        if not original_content:
            try:
                async with httpx.AsyncClient(timeout=20.0) as client:
                    url = f"https://{domain}" if not domain.startswith("http") else domain
                    response = await client.get(url, follow_redirects=True)
                    if response.status_code == 200:
                        original_content = response.text[:10000]  # First 10k chars
            except Exception as e:
                logger.warning(f"Could not fetch original content: {e}")
                original_content = ""
        
        # Query AIs and analyze citation types
        queries = [
            f"What does {brand_name} do?",
            f"Summarize {brand_name}'s main services",
        ]
        
        for query in queries:
            # Query OpenAI
            if self.openai_key:
                try:
                    async with httpx.AsyncClient(timeout=30.0) as client:
                        response = await client.post(
                            "https://api.openai.com/v1/chat/completions",
                            headers={
                                "Authorization": f"Bearer {self.openai_key}",
                                "Content-Type": "application/json"
                            },
                            json={
                                "model": "gpt-3.5-turbo",
                                "messages": [{"role": "user", "content": query}],
                                "max_tokens": 300
                            }
                        )
                        
                        if response.status_code == 200:
                            data = response.json()
                            content = data["choices"][0]["message"]["content"]
                            
                            classification = self.classify_citation_type(
                                content, original_content, brand_name
                            )
                            
                            # Update counts
                            ct = classification["citation_type"]
                            if ct == "exact_quote":
                                results["citation_breakdown"]["exact_quotes"] += 1
                            elif ct == "paraphrase":
                                results["citation_breakdown"]["paraphrases"] += 1
                            else:
                                results["citation_breakdown"]["mentions"] += 1
                            
                            results["examples"].append({
                                "model": "openai",
                                "query": query,
                                **classification
                            })
                            
                except Exception as e:
                    logger.warning(f"OpenAI citation type analysis failed: {e}")
        
        return results
    
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
    
    async def check_authority_sources(self, brand_name: str, domain: str, known_urls: List[str] = None) -> List[Dict[str, Any]]:
        """
        Check for brand presence on specific high-authority domains.
        """
        authority_sources = [
            {"name": "Wikipedia", "domain": "wikipedia.org", "type": "Encyclopedia", "impact": "high"},
            {"name": "G2", "domain": "g2.com", "type": "Review Platform", "impact": "medium"},
            {"name": "Capterra", "domain": "capterra.com", "type": "Review Platform", "impact": "medium"},
            {"name": "TechCrunch", "domain": "techcrunch.com", "type": "News", "impact": "high"},
            {"name": "Forbes", "domain": "forbes.com", "type": "News", "impact": "high"},
            {"name": "Medium", "domain": "medium.com", "type": "Blog", "impact": "low"},
            {"name": "ProductHunt", "domain": "producthunt.com", "type": "Community", "impact": "medium"},
            {"name": "Trustpilot", "domain": "trustpilot.com", "type": "Review Platform", "impact": "medium"},
            {"name": "LinkedIn", "domain": "linkedin.com", "type": "Social", "impact": "low"},
            {"name": "Reddit", "domain": "reddit.com", "type": "Community", "impact": "high"},
            {"name": "Quora", "domain": "quora.com", "type": "Community", "impact": "high"},
        ]
        
        results = []
        known_urls = known_urls or []
        
        try:
            from ddgs import DDGS
            
            with DDGS() as ddgs:
                for source in authority_sources:
                    # Check if we already found this source in known_urls
                    found_url = next((url for url in known_urls if source["domain"] in url.lower()), None)
                    
                    if found_url:
                        results.append({
                            "source": source["name"],
                            "type": source["type"],
                            "authority": 90 if source["impact"] == "high" else 80 if source["impact"] == "medium" else 70,
                            "status": "present",
                            "impact": source["impact"],
                            "url": found_url
                        })
                        continue

                    # Otherwise search for it
                    query = f'site:{source["domain"]} "{brand_name}"'
                    try:
                        # Quick check - just need 1 result
                        search_results = list(ddgs.text(query, max_results=1))
                        is_present = len(search_results) > 0
                        
                        results.append({
                            "source": source["name"],
                            "type": source["type"],
                            "authority": 90 if source["impact"] == "high" else 80 if source["impact"] == "medium" else 70, # Mock DA for now
                            "status": "present" if is_present else "missing",
                            "impact": source["impact"],
                            "url": search_results[0]['href'] if is_present else None
                        })
                        
                        # Sleep briefly to avoid rate limits
                        await asyncio.sleep(0.5)
                        
                    except Exception as e:
                        logger.error(f"Error checking {source['name']}: {e}")
                        results.append({
                            "source": source["name"],
                            "type": source["type"],
                            "authority": 0,
                            "status": "error",
                            "impact": source["impact"]
                        })
                        
        except ImportError:
            logger.error("duckduckgo_search not installed")
            return []
        except Exception as e:
            logger.error(f"Error in check_authority_sources: {e}")
            return []
            
        return results

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
