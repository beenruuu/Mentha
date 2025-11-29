"""
AI Search Simulator Service - Simulate and analyze brand presence across AI search engines.

This service runs comprehensive queries across multiple AI platforms to understand
how your brand appears when users ask AI assistants about your industry, products,
or services.

Key Features:
- Multi-platform simulation (ChatGPT, Claude, Perplexity, Gemini)
- Competitive analysis in AI responses
- Query variation testing
- Response pattern analysis
- Market positioning insights
"""

import asyncio
import re
from typing import Dict, Any, List, Optional
from datetime import datetime
from collections import Counter
import httpx

from app.core.config import settings

import logging

logger = logging.getLogger(__name__)


class AISearchSimulatorService:
    """
    Comprehensive AI search simulation service.
    
    Simulates real user queries across AI platforms to understand
    how brands appear in AI-generated responses.
    """
    
    # Query categories for comprehensive testing
    QUERY_CATEGORIES = {
        "informational": [
            "What is {brand_name}?",
            "Tell me about {brand_name}",
            "What does {brand_name} do?",
            "Explain {brand_name}'s services",
        ],
        "comparison": [
            "Compare {brand_name} with competitors",
            "What are alternatives to {brand_name}?",
            "Is {brand_name} better than {competitor}?",
            "{brand_name} vs {competitor}",
        ],
        "recommendation": [
            "What's the best {industry} company?",
            "Can you recommend a good {industry} service?",
            "What {industry} solution should I use?",
            "Top {industry} providers",
        ],
        "problem_solving": [
            "How can I solve {problem} in {industry}?",
            "Best tools for {problem}",
            "What service helps with {problem}?",
        ],
        "review": [
            "What do people think about {brand_name}?",
            "Is {brand_name} good?",
            "{brand_name} reviews",
            "Pros and cons of {brand_name}",
        ],
        "purchase_intent": [
            "Should I buy from {brand_name}?",
            "Is {brand_name} worth it?",
            "{brand_name} pricing",
            "Best deal for {industry} services",
        ]
    }
    
    def __init__(self):
        self.openai_key = settings.OPENAI_API_KEY
        self.anthropic_key = settings.ANTHROPIC_API_KEY
        self.perplexity_key = getattr(settings, 'PERPLEXITY_API_KEY', '')
    
    async def simulate_search(
        self,
        brand_name: str,
        domain: str = "",
        industry: str = "",
        competitors: List[str] = None,
        problems: List[str] = None,
        query_categories: List[str] = None
    ) -> Dict[str, Any]:
        """
        Run comprehensive AI search simulation.
        
        Args:
            brand_name: Brand to analyze
            domain: Brand's domain
            industry: Industry context
            competitors: Competitor brands for comparison
            problems: Problems/pain points the brand solves
            query_categories: Specific categories to test (default: all)
            
        Returns:
            Comprehensive simulation results
        """
        logger.info(f"[AI-SIM] Starting AI search simulation for brand: {brand_name}")
        logger.info(f"[AI-SIM] Domain: {domain}, Industry: {industry}")
        logger.info(f"[AI-SIM] Competitors: {competitors}, Problems: {problems}")
        
        results = {
            "brand_name": brand_name,
            "domain": domain,
            "simulated_at": datetime.utcnow().isoformat() + "Z",
            "platforms": {},
            "query_results": {
                "by_category": {},
                "total_queries": 0,
                "mentions_found": 0
            },
            "competitive_analysis": {},
            "positioning": {
                "sentiment": "neutral",
                "key_associations": [],
                "recommended_frequency": 0
            },
            "insights": [],
            "overall_score": 0
        }
        
        competitors = competitors or []
        problems = problems or [f"{industry} challenges"]
        categories = query_categories or list(self.QUERY_CATEGORIES.keys())
        
        # Generate all queries
        all_queries = self._generate_queries(
            brand_name, industry, competitors, problems, categories
        )
        logger.info(f"[AI-SIM] Generated {len(all_queries)} queries across {len(categories)} categories")
        
        # Run simulations on each platform
        tasks = []
        
        if self.openai_key:
            tasks.append(self._simulate_openai(brand_name, domain, all_queries))
        
        if self.anthropic_key:
            tasks.append(self._simulate_anthropic(brand_name, domain, all_queries))
        
        if self.perplexity_key:
            tasks.append(self._simulate_perplexity(brand_name, domain, all_queries))
        
        if not tasks:
            logger.warning("[AI-SIM] No API keys configured for AI search simulation")
            return {"error": "No API keys configured", "enabled": False}
        
        logger.info(f"[AI-SIM] Running simulations on {len(tasks)} platforms")
        platform_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        total_mentions = 0
        total_queries = 0
        all_responses = []
        
        for result in platform_results:
            if isinstance(result, Exception):
                logger.error(f"[AI-SIM] Platform simulation failed: {result}")
                continue
            if not result:
                logger.warning("[AI-SIM] Empty result from platform")
                continue
            
            platform = result.get("platform", "unknown")
            results["platforms"][platform] = result
            
            total_mentions += result.get("mentions", 0)
            total_queries += result.get("queries_run", 0)
            all_responses.extend(result.get("responses", []))
        
        results["query_results"]["total_queries"] = total_queries
        results["query_results"]["mentions_found"] = total_mentions
        
        # Analyze responses by category
        results["query_results"]["by_category"] = self._analyze_by_category(all_responses)
        
        # Competitive analysis
        if competitors:
            results["competitive_analysis"] = self._analyze_competitive_position(
                all_responses, brand_name, competitors
            )
        
        # Extract positioning insights
        results["positioning"] = self._analyze_positioning(all_responses, brand_name)
        
        # Generate actionable insights
        results["insights"] = self._generate_insights(results)
        
        # Calculate overall score
        results["overall_score"] = self._calculate_score(results)
        
        logger.info(f"[AI-SIM] Simulation complete. Total queries: {total_queries}, Mentions: {total_mentions}")
        logger.info(f"[AI-SIM] Overall score: {results['overall_score']}")
        
        return results
    
    def _generate_queries(
        self,
        brand_name: str,
        industry: str,
        competitors: List[str],
        problems: List[str],
        categories: List[str]
    ) -> List[Dict[str, str]]:
        """Generate test queries for simulation."""
        queries = []
        
        for category in categories:
            if category not in self.QUERY_CATEGORIES:
                continue
            
            templates = self.QUERY_CATEGORIES[category]
            
            for template in templates[:2]:  # Limit per category
                query_text = template.format(
                    brand_name=brand_name,
                    industry=industry or "technology",
                    competitor=competitors[0] if competitors else "competitors",
                    problem=problems[0] if problems else "common challenges"
                )
                queries.append({
                    "text": query_text,
                    "category": category,
                    "template": template
                })
        
        return queries
    
    async def _simulate_openai(
        self,
        brand_name: str,
        domain: str,
        queries: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """Run simulation on OpenAI GPT."""
        if not self.openai_key:
            return {"platform": "openai", "enabled": False}
        
        result = {
            "platform": "openai",
            "enabled": True,
            "mentions": 0,
            "queries_run": 0,
            "responses": [],
            "mention_rate": 0,
            "positioning_words": []
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                headers = {
                    "Authorization": f"Bearer {self.openai_key}",
                    "Content-Type": "application/json"
                }
                
                for query in queries[:8]:  # Limit queries
                    try:
                        response = await client.post(
                            "https://api.openai.com/v1/chat/completions",
                            headers=headers,
                            json={
                                "model": "gpt-3.5-turbo",
                                "messages": [{"role": "user", "content": query["text"]}],
                                "max_tokens": 500,
                                "temperature": 0.7
                            }
                        )
                        
                        if response.status_code == 200:
                            data = response.json()
                            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                            
                            result["queries_run"] += 1
                            
                            mentioned = self._check_mention(content, brand_name, domain)
                            if mentioned:
                                result["mentions"] += 1
                            
                            result["responses"].append({
                                "query": query["text"],
                                "category": query["category"],
                                "response": content,
                                "mentioned": mentioned,
                                "platform": "openai"
                            })
                            
                    except Exception as e:
                        print(f"OpenAI query error: {e}")
                        continue
                
                if result["queries_run"] > 0:
                    result["mention_rate"] = round(
                        (result["mentions"] / result["queries_run"]) * 100, 1
                    )
                    result["positioning_words"] = self._extract_positioning_words(
                        [r["response"] for r in result["responses"] if r["mentioned"]]
                    )
                    
        except Exception as e:
            result["error"] = str(e)
        
        return result
    
    async def _simulate_anthropic(
        self,
        brand_name: str,
        domain: str,
        queries: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """Run simulation on Anthropic Claude."""
        if not self.anthropic_key:
            return {"platform": "anthropic", "enabled": False}
        
        result = {
            "platform": "anthropic",
            "enabled": True,
            "mentions": 0,
            "queries_run": 0,
            "responses": [],
            "mention_rate": 0,
            "positioning_words": []
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                headers = {
                    "x-api-key": self.anthropic_key,
                    "Content-Type": "application/json",
                    "anthropic-version": "2023-06-01"
                }
                
                for query in queries[:8]:
                    try:
                        response = await client.post(
                            "https://api.anthropic.com/v1/messages",
                            headers=headers,
                            json={
                                "model": "claude-3-haiku-20240307",
                                "max_tokens": 500,
                                "messages": [{"role": "user", "content": query["text"]}]
                            }
                        )
                        
                        if response.status_code == 200:
                            data = response.json()
                            content = ""
                            for block in data.get("content", []):
                                if block.get("type") == "text":
                                    content += block.get("text", "")
                            
                            result["queries_run"] += 1
                            
                            mentioned = self._check_mention(content, brand_name, domain)
                            if mentioned:
                                result["mentions"] += 1
                            
                            result["responses"].append({
                                "query": query["text"],
                                "category": query["category"],
                                "response": content,
                                "mentioned": mentioned,
                                "platform": "anthropic"
                            })
                            
                    except Exception as e:
                        print(f"Anthropic query error: {e}")
                        continue
                
                if result["queries_run"] > 0:
                    result["mention_rate"] = round(
                        (result["mentions"] / result["queries_run"]) * 100, 1
                    )
                    result["positioning_words"] = self._extract_positioning_words(
                        [r["response"] for r in result["responses"] if r["mentioned"]]
                    )
                    
        except Exception as e:
            result["error"] = str(e)
        
        return result
    
    async def _simulate_perplexity(
        self,
        brand_name: str,
        domain: str,
        queries: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """Run simulation on Perplexity AI."""
        if not self.perplexity_key:
            return {"platform": "perplexity", "enabled": False}
        
        result = {
            "platform": "perplexity",
            "enabled": True,
            "mentions": 0,
            "queries_run": 0,
            "responses": [],
            "mention_rate": 0,
            "positioning_words": [],
            "citations": []
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                headers = {
                    "Authorization": f"Bearer {self.perplexity_key}",
                    "Content-Type": "application/json"
                }
                
                for query in queries[:6]:  # Perplexity can be slower
                    try:
                        response = await client.post(
                            "https://api.perplexity.ai/chat/completions",
                            headers=headers,
                            json={
                                "model": "llama-3.1-sonar-small-128k-online",
                                "messages": [{"role": "user", "content": query["text"]}],
                                "max_tokens": 500
                            }
                        )
                        
                        if response.status_code == 200:
                            data = response.json()
                            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                            citations = data.get("citations", [])
                            
                            result["queries_run"] += 1
                            
                            mentioned = self._check_mention(content, brand_name, domain)
                            
                            # Also check citations for domain
                            domain_in_citations = any(
                                domain.lower().replace('https://', '').replace('http://', '') in c.lower()
                                for c in citations
                            ) if domain else False
                            
                            if mentioned or domain_in_citations:
                                result["mentions"] += 1
                            
                            result["responses"].append({
                                "query": query["text"],
                                "category": query["category"],
                                "response": content,
                                "mentioned": mentioned or domain_in_citations,
                                "platform": "perplexity",
                                "citations": citations
                            })
                            
                            result["citations"].extend(citations)
                            
                    except Exception as e:
                        print(f"Perplexity query error: {e}")
                        continue
                
                if result["queries_run"] > 0:
                    result["mention_rate"] = round(
                        (result["mentions"] / result["queries_run"]) * 100, 1
                    )
                    result["positioning_words"] = self._extract_positioning_words(
                        [r["response"] for r in result["responses"] if r["mentioned"]]
                    )
                    
        except Exception as e:
            result["error"] = str(e)
        
        return result
    
    def _check_mention(self, text: str, brand_name: str, domain: str = "") -> bool:
        """Check if brand or domain is mentioned in text."""
        text_lower = text.lower()
        
        if brand_name.lower() in text_lower:
            return True
        
        if domain:
            domain_clean = domain.lower().replace('https://', '').replace('http://', '').replace('www.', '')
            if domain_clean in text_lower:
                return True
        
        return False
    
    def _extract_positioning_words(self, texts: List[str]) -> List[str]:
        """Extract words used to describe the brand."""
        if not texts:
            return []
        
        positioning_patterns = [
            r"(leading|top|best|innovative|trusted|reliable|popular|emerging|established)",
            r"(known for|famous for|recognized for|specializes in)",
            r"(offers|provides|delivers|features)",
        ]
        
        words = []
        combined_text = " ".join(texts).lower()
        
        for pattern in positioning_patterns:
            matches = re.findall(pattern, combined_text)
            words.extend(matches)
        
        return list(set(words))[:10]
    
    def _analyze_by_category(self, responses: List[Dict]) -> Dict[str, Dict]:
        """Analyze results by query category."""
        categories = {}
        
        for resp in responses:
            cat = resp.get("category", "unknown")
            if cat not in categories:
                categories[cat] = {
                    "total": 0,
                    "mentioned": 0,
                    "mention_rate": 0
                }
            
            categories[cat]["total"] += 1
            if resp.get("mentioned"):
                categories[cat]["mentioned"] += 1
        
        for cat in categories:
            if categories[cat]["total"] > 0:
                categories[cat]["mention_rate"] = round(
                    (categories[cat]["mentioned"] / categories[cat]["total"]) * 100, 1
                )
        
        return categories
    
    def _analyze_competitive_position(
        self,
        responses: List[Dict],
        brand_name: str,
        competitors: List[str]
    ) -> Dict[str, Any]:
        """Analyze competitive positioning in AI responses."""
        analysis = {
            "brand_mentions": 0,
            "competitor_mentions": {},
            "co_mentioned_with": [],
            "recommended_over": [],
            "not_mentioned_when_competitors_are": 0
        }
        
        for competitor in competitors:
            analysis["competitor_mentions"][competitor] = 0
        
        for resp in responses:
            text = resp.get("response", "").lower()
            brand_mentioned = brand_name.lower() in text
            
            if brand_mentioned:
                analysis["brand_mentions"] += 1
            
            competitors_in_response = []
            for competitor in competitors:
                if competitor.lower() in text:
                    analysis["competitor_mentions"][competitor] += 1
                    competitors_in_response.append(competitor)
            
            # Track co-mentions
            if brand_mentioned and competitors_in_response:
                analysis["co_mentioned_with"].extend(competitors_in_response)
            
            # Track when competitors are mentioned but brand is not
            if competitors_in_response and not brand_mentioned:
                analysis["not_mentioned_when_competitors_are"] += 1
        
        # Remove duplicates from co-mentions
        analysis["co_mentioned_with"] = list(set(analysis["co_mentioned_with"]))
        
        return analysis
    
    def _analyze_positioning(
        self,
        responses: List[Dict],
        brand_name: str
    ) -> Dict[str, Any]:
        """Analyze brand positioning in AI responses."""
        positioning = {
            "sentiment": "neutral",
            "key_associations": [],
            "recommended_frequency": 0,
            "description_themes": []
        }
        
        positive_count = 0
        negative_count = 0
        recommendations = 0
        
        positive_words = ["best", "excellent", "great", "leading", "top", "recommended", "trusted"]
        negative_words = ["issues", "problems", "concerns", "avoid", "poor", "limited"]
        recommendation_phrases = ["recommend", "suggest", "try", "consider", "use"]
        
        associations = Counter()
        
        for resp in responses:
            if not resp.get("mentioned"):
                continue
            
            text = resp.get("response", "").lower()
            
            # Sentiment
            for word in positive_words:
                if word in text:
                    positive_count += 1
            
            for word in negative_words:
                if word in text:
                    negative_count += 1
            
            # Recommendations
            for phrase in recommendation_phrases:
                if phrase in text and brand_name.lower() in text:
                    recommendations += 1
                    break
            
            # Extract associations (words near brand name)
            brand_idx = text.find(brand_name.lower())
            if brand_idx != -1:
                context = text[max(0, brand_idx-50):brand_idx+len(brand_name)+50]
                words = re.findall(r'\b\w+\b', context)
                for word in words:
                    if len(word) > 4 and word != brand_name.lower():
                        associations[word] += 1
        
        # Calculate sentiment
        if positive_count > negative_count + 2:
            positioning["sentiment"] = "positive"
        elif negative_count > positive_count + 2:
            positioning["sentiment"] = "negative"
        
        positioning["recommended_frequency"] = recommendations
        positioning["key_associations"] = [w for w, c in associations.most_common(5)]
        
        return positioning
    
    def _generate_insights(self, results: Dict[str, Any]) -> List[Dict[str, str]]:
        """Generate actionable insights from simulation results."""
        insights = []
        
        # Overall visibility insight
        mention_rate = 0
        if results["query_results"]["total_queries"] > 0:
            mention_rate = (results["query_results"]["mentions_found"] / 
                          results["query_results"]["total_queries"]) * 100
        
        if mention_rate < 20:
            insights.append({
                "type": "warning",
                "title": "Low AI Visibility",
                "description": f"Brand appears in only {mention_rate:.0f}% of AI responses. Consider improving online presence and content authority."
            })
        elif mention_rate > 60:
            insights.append({
                "type": "success",
                "title": "Strong AI Visibility",
                "description": f"Brand appears in {mention_rate:.0f}% of AI responses. Maintain content quality and authority."
            })
        
        # Category-specific insights
        by_category = results["query_results"].get("by_category", {})
        
        if by_category.get("recommendation", {}).get("mention_rate", 0) < 30:
            insights.append({
                "type": "action",
                "title": "Improve Recommendation Presence",
                "description": "Brand is rarely recommended by AI. Focus on building authority through reviews, case studies, and industry recognition."
            })
        
        if by_category.get("informational", {}).get("mention_rate", 0) < 50:
            insights.append({
                "type": "action",
                "title": "Enhance Brand Information",
                "description": "AI has limited knowledge about your brand. Ensure your website has clear, comprehensive information about what you do."
            })
        
        # Competitive insights
        comp = results.get("competitive_analysis", {})
        if comp.get("not_mentioned_when_competitors_are", 0) > 3:
            insights.append({
                "type": "warning",
                "title": "Missing from Competitive Discussions",
                "description": "Competitors are mentioned in contexts where your brand is not. Consider strengthening competitive positioning content."
            })
        
        # Platform-specific insights
        platforms = results.get("platforms", {})
        perplexity = platforms.get("perplexity", {})
        if perplexity.get("enabled") and perplexity.get("mention_rate", 0) < 20:
            insights.append({
                "type": "action",
                "title": "Low Perplexity Visibility",
                "description": "Perplexity AI doesn't cite your content. Ensure your website has quality, factual content that can be cited as a source."
            })
        
        return insights
    
    def _calculate_score(self, results: Dict[str, Any]) -> float:
        """Calculate overall AI search visibility score."""
        score = 0.0
        
        # Base score from mention rate (50 points max)
        total = results["query_results"]["total_queries"]
        mentions = results["query_results"]["mentions_found"]
        
        if total > 0:
            mention_rate = mentions / total
            score += mention_rate * 50
        
        # Category coverage (20 points max)
        categories = results["query_results"].get("by_category", {})
        categories_with_mentions = sum(
            1 for c in categories.values() if c.get("mentioned", 0) > 0
        )
        if categories:
            score += (categories_with_mentions / len(categories)) * 20
        
        # Platform coverage (15 points max)
        platforms = results.get("platforms", {})
        active_platforms = sum(1 for p in platforms.values() if p.get("enabled") and p.get("mentions", 0) > 0)
        score += (active_platforms / max(len(platforms), 1)) * 15
        
        # Positioning bonus (15 points max)
        positioning = results.get("positioning", {})
        if positioning.get("sentiment") == "positive":
            score += 10
        if positioning.get("recommended_frequency", 0) > 2:
            score += 5
        
        return round(min(score, 100), 1)


# Singleton instance
_search_simulator: Optional[AISearchSimulatorService] = None

def get_ai_search_simulator() -> AISearchSimulatorService:
    """Get singleton instance of AISearchSimulatorService."""
    global _search_simulator
    if _search_simulator is None:
        _search_simulator = AISearchSimulatorService()
    return _search_simulator
