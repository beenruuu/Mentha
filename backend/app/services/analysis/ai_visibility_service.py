"""
AI Visibility Service - Real measurement of brand visibility in AI responses.

This service queries actual AI models (ChatGPT, Claude, Perplexity) to measure
how often and how prominently a brand is mentioned in AI-generated responses.

Data Sources:
- OpenAI API (GPT-4/GPT-3.5) - Direct queries about brand/keywords
- Anthropic API (Claude) - Direct queries about brand/keywords
- Perplexity API (if configured) - For web-augmented AI responses
- DuckDuckGo (as fallback) - For general web visibility baseline

IMPORTANT: This service makes REAL API calls to measure actual AI visibility.
"""

import asyncio
import re
from typing import Dict, Any, List, Optional
from datetime import datetime

import httpx

from app.core.config import settings


class AIVisibilityService:
    """
    Service to measure actual brand visibility across AI models.
    
    Instead of LLM-generated fictional scores, this service:
    1. Sends test queries to AI models about specific topics
    2. Analyzes responses to detect brand mentions
    3. Calculates real visibility scores based on actual mention frequency
    """
    
    # Test query templates for measuring brand visibility (by language)
    VISIBILITY_QUERIES = {
        "en": [
            "What are the best {industry} companies?",
            "Can you recommend a good {industry} service?",
            "Who are the top players in {industry}?",
            "What is {brand_name}?",
            "Tell me about {brand_name} in {industry}",
            "Compare {brand_name} with competitors",
            "Is {brand_name} a good choice for {industry}?",
        ],
        "es": [
            "¿Cuáles son las mejores empresas de {industry}?",
            "¿Puedes recomendar un buen servicio de {industry}?",
            "¿Quiénes son los principales actores en {industry}?",
            "¿Qué es {brand_name}?",
            "Háblame sobre {brand_name} en {industry}",
            "Compara {brand_name} con sus competidores",
            "¿Es {brand_name} una buena opción para {industry}?",
        ],
        "fr": [
            "Quelles sont les meilleures entreprises de {industry}?",
            "Pouvez-vous recommander un bon service de {industry}?",
            "Qui sont les principaux acteurs dans {industry}?",
            "Qu'est-ce que {brand_name}?",
            "Parlez-moi de {brand_name} dans {industry}",
            "Comparez {brand_name} avec ses concurrents",
            "Est-ce que {brand_name} est un bon choix pour {industry}?",
        ],
        "de": [
            "Was sind die besten {industry} Unternehmen?",
            "Können Sie einen guten {industry} Service empfehlen?",
            "Wer sind die Top-Player in {industry}?",
            "Was ist {brand_name}?",
            "Erzählen Sie mir über {brand_name} in {industry}",
            "Vergleichen Sie {brand_name} mit Wettbewerbern",
            "Ist {brand_name} eine gute Wahl für {industry}?",
        ],
        "it": [
            "Quali sono le migliori aziende di {industry}?",
            "Puoi raccomandare un buon servizio di {industry}?",
            "Chi sono i principali attori in {industry}?",
            "Cos'è {brand_name}?",
            "Parlami di {brand_name} in {industry}",
            "Confronta {brand_name} con i concorrenti",
            "È {brand_name} una buona scelta per {industry}?",
        ]
    }
    
    # Weight for each AI model in the overall score
    MODEL_WEIGHTS = {
        "openai": 0.35,
        "anthropic": 0.30,
        "perplexity": 0.25,
        "baseline": 0.10
    }
    
    def __init__(self):
        self.openai_key = settings.OPENAI_API_KEY
        self.anthropic_key = settings.ANTHROPIC_API_KEY
        self.perplexity_key = getattr(settings, 'PERPLEXITY_API_KEY', '')
        
    async def measure_visibility(
        self,
        brand_name: str,
        domain: str = "",
        industry: str = "",
        keywords: List[str] = None,
        num_queries: int = 3,
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Measure actual AI visibility for a brand across multiple models.
        
        Args:
            brand_name: The brand name to check for
            domain: The brand's domain (for context)
            industry: The industry for contextual queries
            keywords: Related keywords to include in queries
            num_queries: Number of test queries per model
            
        Returns:
            Dict with visibility scores and detailed findings
        """
        results = {
            "brand_name": brand_name,
            "domain": domain,
            "industry": industry,
            "language": language,
            "measured_at": datetime.utcnow().isoformat() + "Z",
            "models": {},
            "overall_score": 0,
            "mention_count": 0,
            "sentiment": "neutral",
            "enabled": True
        }
        
        # Generate test queries in the user's preferred language
        test_queries = self._generate_test_queries(brand_name, industry, keywords, num_queries, language)
        
        # Query each available model
        tasks = []
        
        if self.openai_key:
            tasks.append(self._measure_openai_visibility(brand_name, domain, test_queries))
        
        if self.anthropic_key:
            tasks.append(self._measure_anthropic_visibility(brand_name, domain, test_queries))
        
        if self.perplexity_key:
            tasks.append(self._measure_perplexity_visibility(brand_name, domain, test_queries))
        
        # Always run baseline (free)
        tasks.append(self._measure_baseline_visibility(brand_name, domain, industry))
        
        if not tasks:
            return {"enabled": False, "error": "No AI APIs configured"}
        
        # Run all visibility checks in parallel
        try:
            model_results = await asyncio.gather(*tasks, return_exceptions=True)
        except Exception as e:
            print(f"Error in visibility measurement: {e}")
            return {"enabled": False, "error": str(e)}
        
        # Process results
        total_weighted_score = 0
        total_weight = 0
        total_mentions = 0
        
        for result in model_results:
            if isinstance(result, Exception):
                print(f"Model query failed: {result}")
                continue
            
            if not result or not result.get("enabled"):
                continue
            
            model_name = result.get("model", "unknown")
            results["models"][model_name] = result
            
            weight = self.MODEL_WEIGHTS.get(model_name, 0.1)
            score = result.get("visibility_score", 0)
            mentions = result.get("mention_count", 0)
            
            total_weighted_score += score * weight
            total_weight += weight
            total_mentions += mentions
        
        # Calculate overall score
        if total_weight > 0:
            results["overall_score"] = round(total_weighted_score / total_weight, 1)
        
        results["mention_count"] = total_mentions
        
        # Determine overall sentiment
        results["sentiment"] = self._aggregate_sentiment(results["models"])
        
        return results
    
    def _generate_test_queries(
        self,
        brand_name: str,
        industry: str,
        keywords: List[str] = None,
        num_queries: int = 3,
        language: str = "en"
    ) -> List[str]:
        """Generate test queries for visibility measurement in the user's language."""
        queries = []
        
        # Get templates for the selected language, fallback to English
        templates = self.VISIBILITY_QUERIES.get(language, self.VISIBILITY_QUERIES.get("en", []))
        
        # Default industry translation for common languages
        default_industry = {
            "en": "technology",
            "es": "tecnología",
            "fr": "technologie",
            "de": "Technologie",
            "it": "tecnologia"
        }.get(language, "technology")
        
        for template in templates[:num_queries]:
            query = template.format(
                brand_name=brand_name,
                industry=industry or default_industry
            )
            queries.append(query)
        
        # Add keyword-based queries if provided (in the appropriate language)
        keyword_templates = {
            "en": "What is the best solution for {kw}?",
            "es": "¿Cuál es la mejor solución para {kw}?",
            "fr": "Quelle est la meilleure solution pour {kw}?",
            "de": "Was ist die beste Lösung für {kw}?",
            "it": "Qual è la migliore soluzione per {kw}?"
        }
        kw_template = keyword_templates.get(language, keyword_templates["en"])
        
        if keywords:
            for kw in keywords[:2]:
                queries.append(kw_template.format(kw=kw))
        
        return queries
    
    async def _measure_openai_visibility(
        self,
        brand_name: str,
        domain: str,
        test_queries: List[str]
    ) -> Dict[str, Any]:
        """Query OpenAI models and analyze brand mentions."""
        if not self.openai_key:
            return {"enabled": False, "model": "openai"}
        
        result = {
            "enabled": True,
            "model": "openai",
            "visibility_score": 0,
            "mention_count": 0,
            "responses_analyzed": 0,
            "mention_positions": [],
            "sentiment": "neutral",
            "context_snippets": []
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                headers = {
                    "Authorization": f"Bearer {self.openai_key}",
                    "Content-Type": "application/json"
                }
                
                mention_count = 0
                responses_with_mentions = 0
                snippets = []
                
                for query in test_queries[:3]:  # Limit queries to control cost
                    try:
                        response = await client.post(
                            "https://api.openai.com/v1/chat/completions",
                            headers=headers,
                            json={
                                "model": "gpt-3.5-turbo",  # Use cheaper model for testing
                                "messages": [{"role": "user", "content": query}],
                                "max_tokens": 500,
                                "temperature": 0.7
                            }
                        )
                        
                        if response.status_code == 200:
                            data = response.json()
                            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                            
                            # Analyze for brand mentions
                            mentions = self._count_brand_mentions(content, brand_name, domain)
                            mention_count += mentions
                            
                            if mentions > 0:
                                responses_with_mentions += 1
                                # Extract context snippet
                                snippet = self._extract_mention_context(content, brand_name)
                                if snippet:
                                    snippets.append(snippet)
                            
                            result["responses_analyzed"] += 1
                            
                    except Exception as query_error:
                        print(f"OpenAI query error: {query_error}")
                        continue
                
                # Calculate score based on mentions
                if result["responses_analyzed"] > 0:
                    mention_rate = responses_with_mentions / result["responses_analyzed"]
                    result["visibility_score"] = round(mention_rate * 100, 1)
                    result["mention_count"] = mention_count
                    result["context_snippets"] = snippets[:3]
                    result["sentiment"] = self._analyze_sentiment(snippets)
                    
        except Exception as e:
            print(f"OpenAI visibility measurement failed: {e}")
            result["enabled"] = False
            result["error"] = str(e)
        
        return result
    
    async def _measure_anthropic_visibility(
        self,
        brand_name: str,
        domain: str,
        test_queries: List[str]
    ) -> Dict[str, Any]:
        """Query Anthropic Claude and analyze brand mentions."""
        if not self.anthropic_key:
            return {"enabled": False, "model": "anthropic"}
        
        result = {
            "enabled": True,
            "model": "anthropic",
            "visibility_score": 0,
            "mention_count": 0,
            "responses_analyzed": 0,
            "sentiment": "neutral",
            "context_snippets": []
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                headers = {
                    "x-api-key": self.anthropic_key,
                    "Content-Type": "application/json",
                    "anthropic-version": "2023-06-01"
                }
                
                mention_count = 0
                responses_with_mentions = 0
                snippets = []
                
                for query in test_queries[:3]:
                    try:
                        response = await client.post(
                            "https://api.anthropic.com/v1/messages",
                            headers=headers,
                            json={
                                "model": "claude-3-haiku-20240307",  # Use cheaper model
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
                            
                            mentions = self._count_brand_mentions(content, brand_name, domain)
                            mention_count += mentions
                            
                            if mentions > 0:
                                responses_with_mentions += 1
                                snippet = self._extract_mention_context(content, brand_name)
                                if snippet:
                                    snippets.append(snippet)
                            
                            result["responses_analyzed"] += 1
                            
                    except Exception as query_error:
                        print(f"Anthropic query error: {query_error}")
                        continue
                
                if result["responses_analyzed"] > 0:
                    mention_rate = responses_with_mentions / result["responses_analyzed"]
                    result["visibility_score"] = round(mention_rate * 100, 1)
                    result["mention_count"] = mention_count
                    result["context_snippets"] = snippets[:3]
                    result["sentiment"] = self._analyze_sentiment(snippets)
                    
        except Exception as e:
            print(f"Anthropic visibility measurement failed: {e}")
            result["enabled"] = False
            result["error"] = str(e)
        
        return result
    
    async def _measure_perplexity_visibility(
        self,
        brand_name: str,
        domain: str,
        test_queries: List[str]
    ) -> Dict[str, Any]:
        """Query Perplexity API for web-augmented visibility."""
        if not self.perplexity_key:
            return {"enabled": False, "model": "perplexity"}
        
        result = {
            "enabled": True,
            "model": "perplexity",
            "visibility_score": 0,
            "mention_count": 0,
            "responses_analyzed": 0,
            "sentiment": "neutral",
            "context_snippets": [],
            "sources": []
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                headers = {
                    "Authorization": f"Bearer {self.perplexity_key}",
                    "Content-Type": "application/json"
                }
                
                mention_count = 0
                responses_with_mentions = 0
                snippets = []
                sources = []
                
                for query in test_queries[:2]:  # Perplexity can be slower
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
                            
                            mentions = self._count_brand_mentions(content, brand_name, domain)
                            mention_count += mentions
                            
                            if mentions > 0:
                                responses_with_mentions += 1
                                snippet = self._extract_mention_context(content, brand_name)
                                if snippet:
                                    snippets.append(snippet)
                            
                            # Extract sources if available
                            citations = data.get("citations", [])
                            sources.extend(citations[:3])
                            
                            result["responses_analyzed"] += 1
                            
                    except Exception as query_error:
                        print(f"Perplexity query error: {query_error}")
                        continue
                
                if result["responses_analyzed"] > 0:
                    mention_rate = responses_with_mentions / result["responses_analyzed"]
                    result["visibility_score"] = round(mention_rate * 100, 1)
                    result["mention_count"] = mention_count
                    result["context_snippets"] = snippets[:3]
                    result["sources"] = sources[:5]
                    result["sentiment"] = self._analyze_sentiment(snippets)
                    
        except Exception as e:
            print(f"Perplexity visibility measurement failed: {e}")
            result["enabled"] = False
            result["error"] = str(e)
        
        return result
    
    async def _measure_baseline_visibility(
        self,
        brand_name: str,
        domain: str,
        industry: str
    ) -> Dict[str, Any]:
        """Get baseline visibility from web search (free, no API key needed)."""
        result = {
            "enabled": True,
            "model": "baseline",
            "visibility_score": 0,
            "mention_count": 0,
            "source": "web_search"
        }
        
        try:
            from duckduckgo_search import DDGS
            
            with DDGS() as ddgs:
                # Search for brand mentions
                query = f'"{brand_name}" {industry}'
                search_results = list(ddgs.text(query, max_results=10))
                
                mention_count = 0
                for res in search_results:
                    title = res.get('title', '').lower()
                    body = res.get('body', '').lower()
                    brand_lower = brand_name.lower()
                    
                    if brand_lower in title or brand_lower in body:
                        mention_count += 1
                
                # Score based on presence in top search results
                if len(search_results) > 0:
                    result["visibility_score"] = round((mention_count / len(search_results)) * 100, 1)
                    result["mention_count"] = mention_count
                    
        except Exception as e:
            print(f"Baseline visibility check failed: {e}")
            result["enabled"] = False
            result["error"] = str(e)
        
        return result
    
    def _count_brand_mentions(self, text: str, brand_name: str, domain: str = "") -> int:
        """Count occurrences of brand name and domain in text."""
        if not text:
            return 0
        
        text_lower = text.lower()
        brand_lower = brand_name.lower()
        
        # Count brand name mentions
        count = len(re.findall(r'\b' + re.escape(brand_lower) + r'\b', text_lower))
        
        # Also count domain mentions if provided
        if domain:
            domain_lower = domain.lower().replace('https://', '').replace('http://', '').replace('www.', '')
            count += text_lower.count(domain_lower)
        
        return count
    
    def _extract_mention_context(self, text: str, brand_name: str, context_length: int = 100) -> Optional[str]:
        """Extract a snippet of text around a brand mention."""
        if not text or not brand_name:
            return None
        
        text_lower = text.lower()
        brand_lower = brand_name.lower()
        
        idx = text_lower.find(brand_lower)
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
    
    def _analyze_sentiment(self, snippets: List[str]) -> str:
        """Simple sentiment analysis based on keyword presence."""
        if not snippets:
            return "neutral"
        
        positive_words = ['best', 'great', 'excellent', 'top', 'leading', 'innovative', 'trusted', 'popular', 'recommended']
        negative_words = ['bad', 'poor', 'worst', 'avoid', 'issues', 'problems', 'complaints', 'negative']
        
        text = ' '.join(snippets).lower()
        
        positive_count = sum(1 for word in positive_words if word in text)
        negative_count = sum(1 for word in negative_words if word in text)
        
        if positive_count > negative_count + 1:
            return "positive"
        elif negative_count > positive_count + 1:
            return "negative"
        return "neutral"
    
    def _aggregate_sentiment(self, models: Dict[str, Any]) -> str:
        """Aggregate sentiment across all models."""
        sentiments = [m.get("sentiment", "neutral") for m in models.values() if m.get("enabled")]
        
        if not sentiments:
            return "neutral"
        
        positive = sentiments.count("positive")
        negative = sentiments.count("negative")
        
        if positive > negative:
            return "positive"
        elif negative > positive:
            return "negative"
        return "neutral"
    
    async def measure_keyword_visibility(
        self,
        keyword: str,
        brand_name: str,
        num_queries: int = 2
    ) -> Dict[str, Any]:
        """
        Measure visibility for a specific keyword.
        
        Queries AI models about the keyword and checks if brand is mentioned.
        """
        queries = [
            f"What are the best options for {keyword}?",
            f"Can you recommend a good {keyword} solution?",
            f"Who are the top providers of {keyword}?"
        ]
        
        result = {
            "keyword": keyword,
            "brand_name": brand_name,
            "visibility_score": 0,
            "mentioned": False,
            "model_results": {}
        }
        
        total_mentions = 0
        total_queries = 0
        
        # Quick check with available models
        if self.openai_key:
            try:
                async with httpx.AsyncClient(timeout=20.0) as client:
                    for query in queries[:num_queries]:
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
                            content = response.json().get("choices", [{}])[0].get("message", {}).get("content", "")
                            if brand_name.lower() in content.lower():
                                total_mentions += 1
                            total_queries += 1
            except Exception as e:
                print(f"Keyword visibility check error: {e}")
        
        if total_queries > 0:
            result["visibility_score"] = round((total_mentions / total_queries) * 100, 1)
            result["mentioned"] = total_mentions > 0
        
        return result


# Singleton instance
_ai_visibility_service: Optional[AIVisibilityService] = None

def get_ai_visibility_service() -> AIVisibilityService:
    """Get singleton instance of AIVisibilityService."""
    global _ai_visibility_service
    if _ai_visibility_service is None:
        _ai_visibility_service = AIVisibilityService()
    return _ai_visibility_service
