"""
AI Visibility Service - Real measurement of brand visibility in AI responses.

This service queries actual AI models (ChatGPT, Claude, Perplexity) to measure
how often and how prominently a brand is mentioned in AI-generated responses.

NOTE: Now uses unified AIClientService for API calls (P1 consolidation).
"""

import asyncio
import re
from typing import Dict, Any, List, Optional
from datetime import datetime
import httpx

from app.core.config import settings
from app.services.ai_client_service import get_ai_client


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
        self.ai_client = get_ai_client()
        # Keep keys for backward compatibility checks
        self.openai_key = settings.OPENAI_API_KEY
        self.anthropic_key = settings.ANTHROPIC_API_KEY
        self.perplexity_key = getattr(settings, 'PERPLEXITY_API_KEY', '')
        
    async def measure_visibility(
        self,
        brand_name: str,
        domain: str = "",
        industry: str = "",
        keywords: List[str] = None,
        competitors: List[str] = None,
        num_queries: int = 3,
        language: str = "en",
        business_scope: str = "national",
        city: str = "",
        location: str = ""
    ) -> Dict[str, Any]:
        """
        Measure actual AI visibility for a brand across multiple models.
        
        Args:
            brand_name: The brand name to check for
            domain: The brand's domain (for context)
            industry: The industry for contextual queries
            keywords: Related keywords to include in queries
            competitors: List of competitor names to check for
            num_queries: Number of test queries per model
            language: Language for queries
            business_scope: Geographic scope (local, regional, national, international)
            city: City for local/regional businesses
            location: Country code (ES, US, etc.)
            
        Returns:
            Dict with visibility scores and detailed findings
        """
        results = {
            "brand_name": brand_name,
            "domain": domain,
            "industry": industry,
            "language": language,
            "business_scope": business_scope,
            "city": city,
            "location": location,
            "measured_at": datetime.utcnow().isoformat() + "Z",
            "models": {},
            "overall_score": 0,
            "overall_geo_score": 0,  # NEW: Aggregated GEO score across all models
            "mention_count": 0,
            "competitor_mentions": {comp: 0 for comp in (competitors or [])},
            "sentiment": "neutral",
            "enabled": True
        }
        
        # Generate test queries in the user's preferred language, considering business scope
        test_queries = self._generate_test_queries(
            brand_name, industry, keywords, num_queries, language, 
            business_scope, city, location
        )
        
        # Query each available model
        tasks = []
        
        if self.openai_key:
            tasks.append(self._measure_openai_visibility(brand_name, domain, test_queries, competitors))
        
        if self.anthropic_key:
            tasks.append(self._measure_anthropic_visibility(brand_name, domain, test_queries, competitors))
        
        if self.perplexity_key:
            tasks.append(self._measure_perplexity_visibility(brand_name, domain, test_queries, competitors))
        
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
            
            # Aggregate competitor mentions
            comp_mentions = result.get("competitor_mentions", {})
            for comp, count in comp_mentions.items():
                if comp in results["competitor_mentions"]:
                    results["competitor_mentions"][comp] += count
            
            total_weighted_score += score * weight
            total_weight += weight
            total_mentions += mentions
        
            total_mentions += mentions
        
        # Calculate scores for competitor breakdown
        # results["competitor_breakdown"] is a dict: {comp_name: {model_name: count}}
        # We need to convert counts to scores (mention rate %)
        results["competitor_models"] = {}
        competitor_list = competitors or []
        
        for comp in competitor_list:
            results["competitor_models"][comp] = {}
            for model_name, model_data in results["models"].items():
                if not model_data or not model_data.get("enabled"):
                    continue
                
                # Get mentions for this competitor in this model
                comp_mentions = model_data.get("competitor_mentions", {}).get(comp, 0)
                responses_analyzed = model_data.get("responses_analyzed", 0)
                
                # Calculate score
                if responses_analyzed > 0:
                    score = round((comp_mentions / responses_analyzed) * 100, 1)
                    # Limit to 100% just in case
                    score = min(score, 100.0)
                else:
                    score = 0
                    
                results["competitor_models"][comp][model_name] = score

        # Calculate overall score
        if total_weight > 0:
            results["overall_score"] = round(total_weighted_score / total_weight, 1)
        
        results["mention_count"] = total_mentions
        
        # NEW: Calculate overall GEO score (weighted average across models)
        total_weighted_geo = 0
        geo_weight = 0
        for model_name, model_data in results["models"].items():
            if model_data.get("enabled") and model_data.get("geo_score"):
                weight = self.MODEL_WEIGHTS.get(model_name, 0.1)
                total_weighted_geo += model_data["geo_score"] * weight
                geo_weight += weight
        
        if geo_weight > 0:
            results["overall_geo_score"] = round(total_weighted_geo / geo_weight, 1)
        
        # Determine overall sentiment
        results["sentiment"] = self._aggregate_sentiment(results["models"])
        
        return results
    
    def _generate_test_queries(
        self,
        brand_name: str,
        industry: str,
        keywords: List[str] = None,
        num_queries: int = 3,
        language: str = "en",
        business_scope: str = "national",
        city: str = "",
        location: str = ""
    ) -> List[str]:
        """Generate test queries for visibility measurement in the user's language, 
        considering geographic scope."""
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
        
        # Map country codes to full names
        country_names = {
            "ES": {"en": "Spain", "es": "España"},
            "US": {"en": "United States", "es": "Estados Unidos"},
            "MX": {"en": "Mexico", "es": "México"},
            "CO": {"en": "Colombia", "es": "Colombia"},
            "AR": {"en": "Argentina", "es": "Argentina"},
            "UK": {"en": "United Kingdom", "es": "Reino Unido"},
            "FR": {"en": "France", "es": "Francia"},
            "DE": {"en": "Germany", "es": "Alemania"},
        }
        country_name = country_names.get(location, {}).get(language, location)
        
        # Build location suffix based on business scope
        location_suffix = ""
        if business_scope == "local" and city:
            location_suffix = f" en {city}" if language == "es" else f" in {city}"
        elif business_scope == "regional" and city:
            location_suffix = f" en la región de {city}" if language == "es" else f" in the {city} region"
        elif business_scope == "national" and location:
            location_suffix = f" en {country_name}" if language == "es" else f" in {country_name}"
        # For international, no location suffix
        
        for template in templates[:num_queries]:
            query = template.format(
                brand_name=brand_name,
                industry=industry or default_industry
            )
            # Add location context for non-brand-specific queries
            if "{brand_name}" not in template and location_suffix:
                query = query.rstrip("?") + location_suffix + "?"
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
                kw_query = kw_template.format(kw=kw)
                # Add location for local/regional/national scopes
                if location_suffix:
                    kw_query = kw_query.rstrip("?") + location_suffix + "?"
                queries.append(kw_query)
        
        return queries
    
    async def _measure_openai_visibility(
        self,
        brand_name: str,
        domain: str,
        test_queries: List[str],
        competitors: List[str] = None
    ) -> Dict[str, Any]:
        """Query OpenAI models and analyze brand mentions with GEO scoring."""
        if not self.openai_key:
            return {"enabled": False, "model": "openai"}
        
        result = {
            "enabled": True,
            "model": "openai",
            "visibility_score": 0,
            "geo_score": 0,  # NEW: GEO Score
            "mention_count": 0,
            "competitor_mentions": {comp: 0 for comp in (competitors or [])},
            "responses_analyzed": 0,
            "mention_positions": [],
            "sentiment": "neutral",
            "context_snippets": [],
            "geo_details": {}  # NEW: GEO breakdown
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
                geo_scores = []  # Collect GEO scores from each response
                
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
                            
                            # Calculate GEO Score for this response
                            geo_result = self.calculate_geo_score(content, brand_name, domain)
                            geo_scores.append(geo_result["geo_score"])
                            
                            # Analyze for competitor mentions
                            if competitors:
                                for comp in competitors:
                                    comp_mentions = self._count_brand_mentions(content, comp)
                                    result["competitor_mentions"][comp] += comp_mentions
                            
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
                
                # Calculate scores based on mentions
                if result["responses_analyzed"] > 0:
                    mention_rate = responses_with_mentions / result["responses_analyzed"]
                    result["visibility_score"] = round(mention_rate * 100, 1)
                    result["mention_count"] = mention_count
                    result["context_snippets"] = snippets[:3]
                    result["sentiment"] = self._analyze_sentiment(snippets)
                    
                    # NEW: Aggregate GEO Score (average of all responses)
                    if geo_scores:
                        result["geo_score"] = round(sum(geo_scores) / len(geo_scores), 1)
                        result["geo_details"] = {
                            "responses_scored": len(geo_scores),
                            "max_score": round(max(geo_scores), 1),
                            "min_score": round(min(geo_scores), 1)
                        }
                    
        except Exception as e:
            print(f"OpenAI visibility measurement failed: {e}")
            result["enabled"] = False
            result["error"] = str(e)
        
        return result
    
    async def _measure_anthropic_visibility(
        self,
        brand_name: str,
        domain: str,
        test_queries: List[str],
        competitors: List[str] = None
    ) -> Dict[str, Any]:
        """Query Anthropic Claude and analyze brand mentions."""
        if not self.anthropic_key:
            return {"enabled": False, "model": "anthropic"}
        
        result = {
            "enabled": True,
            "model": "anthropic",
            "visibility_score": 0,
            "geo_score": 0,  # NEW: GEO Score
            "mention_count": 0,
            "competitor_mentions": {comp: 0 for comp in (competitors or [])},
            "responses_analyzed": 0,
            "sentiment": "neutral",
            "context_snippets": [],
            "geo_details": {}  # NEW: GEO breakdown
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
                geo_scores = []  # Collect GEO scores
                
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
                            
                            # Calculate GEO Score for this response
                            geo_result = self.calculate_geo_score(content, brand_name, domain)
                            geo_scores.append(geo_result["geo_score"])
                            
                            # Analyze for competitor mentions
                            if competitors:
                                for comp in competitors:
                                    comp_mentions = self._count_brand_mentions(content, comp)
                                    result["competitor_mentions"][comp] += comp_mentions
                            
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
                    
                    # Aggregate GEO Score
                    if geo_scores:
                        result["geo_score"] = round(sum(geo_scores) / len(geo_scores), 1)
                        result["geo_details"] = {
                            "responses_scored": len(geo_scores),
                            "max_score": round(max(geo_scores), 1),
                            "min_score": round(min(geo_scores), 1)
                        }
                    
        except Exception as e:
            print(f"Anthropic visibility measurement failed: {e}")
            result["enabled"] = False
            result["error"] = str(e)
        
        return result
    
    async def _measure_perplexity_visibility(
        self,
        brand_name: str,
        domain: str,
        test_queries: List[str],
        competitors: List[str] = None
    ) -> Dict[str, Any]:
        """Query Perplexity API for web-augmented visibility."""
        if not self.perplexity_key:
            return {"enabled": False, "model": "perplexity"}
        
        result = {
            "enabled": True,
            "model": "perplexity",
            "visibility_score": 0,
            "geo_score": 0,  # NEW: GEO Score
            "mention_count": 0,
            "competitor_mentions": {comp: 0 for comp in (competitors or [])},
            "responses_analyzed": 0,
            "sentiment": "neutral",
            "context_snippets": [],
            "sources": [],
            "geo_details": {}  # NEW: GEO breakdown
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
                geo_scores = []  # Collect GEO scores
                
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
                            
                            # Calculate GEO Score for this response
                            geo_result = self.calculate_geo_score(content, brand_name, domain)
                            geo_scores.append(geo_result["geo_score"])
                            
                            # Analyze for competitor mentions
                            if competitors:
                                for comp in competitors:
                                    comp_mentions = self._count_brand_mentions(content, comp)
                                    result["competitor_mentions"][comp] += comp_mentions
                            
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
                    
                    # Aggregate GEO Score
                    if geo_scores:
                        result["geo_score"] = round(sum(geo_scores) / len(geo_scores), 1)
                        result["geo_details"] = {
                            "responses_scored": len(geo_scores),
                            "max_score": round(max(geo_scores), 1),
                            "min_score": round(min(geo_scores), 1)
                        }
                    
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
        """Get baseline visibility from web search (free, no API key needed).

        NOTE: This baseline signal is *internal only* and should NOT surface
        as an extra model in the frontend (no fake Google/Gemini provider).
        Downstream code must either skip or merge it into existing providers.
        """
        result = {
            "enabled": True,
            # Keep a separate internal id so we can treat this as a signal,
            # but never as a standalone provider in the UI.
            "model": "baseline",
            "visibility_score": 0,
            "mention_count": 0,
            "source": "web_search"
        }
        
        try:
            from ddgs import DDGS
            
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

    async def persist_visibility_snapshot(
        self,
        brand_id: str,
        visibility_data: Dict[str, Any]
    ) -> bool:
        """
        Persist visibility measurement to database for historical tracking.
        
        Saves a snapshot to ai_visibility_snapshots table for each AI model.
        This enables historical charts in the dashboard.
        """
        try:
            from app.services.supabase.database import SupabaseDatabaseService
            
            # We'll create a simple model-less service for raw inserts
            from supabase import create_client
            from app.core.config import settings
            
            supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
            
            models_data = visibility_data.get("models", {})
            overall_score = visibility_data.get("overall_score", 0)
            language = visibility_data.get("language", "es")
            sentiment = visibility_data.get("sentiment", "neutral")
            # Extract location and business_scope from visibility data
            location = visibility_data.get("location", "ES")
            business_scope = visibility_data.get("business_scope", "national")
            
            snapshots_created = 0
            
            # Create snapshot for each REAL model (skip internal/baseline helpers)
            for model_name, model_data in models_data.items():
                if not model_data.get("enabled"):
                    continue
                
                # Map model names to database enum values
                model_mapping = {
                    "openai": "openai",
                    "anthropic": "anthropic",
                    "perplexity": "perplexity",
                    # Baseline/web-search is always internal-only:
                    # do not persist it as a separate AI provider so the
                    # frontend never sees a fake Gemini/Google bar.
                }
                
                db_model = model_mapping.get(model_name)
                # Skip unknown/internal models (e.g. "baseline")
                if not db_model:
                    continue
                
                snapshot_data = {
                    "brand_id": brand_id,
                    "ai_model": db_model,
                    "visibility_score": model_data.get("visibility_score", 0),
                    "mention_count": model_data.get("mention_count", 0),
                    "sentiment": model_data.get("sentiment", sentiment),
                    "query_count": model_data.get("responses_analyzed", 0),
                    "inclusion_rate": model_data.get("visibility_score", 0),  # Same as visibility for now
                    "language": language,
                    "location": location,  # NEW: Store country/region code
                    "business_scope": business_scope,  # NEW: Store business scope
                    "metadata": {
                        "context_snippets": model_data.get("context_snippets", [])[:3],
                        "competitor_mentions": model_data.get("competitor_mentions", {}),
                    }
                }
                
                # Insert into database
                result = supabase.table("ai_visibility_snapshots").insert(snapshot_data).execute()
                
                if result.data:
                    snapshots_created += 1
                    print(f"Created visibility snapshot for {model_name}: {model_data.get('visibility_score', 0)}%")
            
            # Also save the overall score as a separate entry (using openai as the primary)
            if overall_score > 0 and "openai" not in models_data:
                overall_snapshot = {
                    "brand_id": brand_id,
                    "ai_model": "openai",
                    "visibility_score": overall_score,
                    "mention_count": visibility_data.get("mention_count", 0),
                    "sentiment": sentiment,
                    "language": language,
                    "location": location,
                    "business_scope": business_scope,
                    "metadata": {"source": "overall_aggregate"}
                }
                supabase.table("ai_visibility_snapshots").insert(overall_snapshot).execute()
            
            print(f"Persisted {snapshots_created} visibility snapshots for brand {brand_id}")
            return True
            
        except Exception as e:
            print(f"Failed to persist visibility snapshot: {e}")
            import traceback
            traceback.print_exc()
            return False

    # ========================================================================
    # GEO/GEU Scoring System - Based on AutoGEO Research Methodology
    # ========================================================================
    
    def calculate_geo_score(
        self,
        ai_response: str,
        brand_name: str,
        domain: str = ""
    ) -> Dict[str, Any]:
        """
        Calculate GEO Score (Generative Engine Optimization Score).
        
        Measures VISIBILITY in AI responses based on:
        - Position: Where brand appears in response (earlier = better)
        - Frequency: How many times brand is mentioned
        - Token Ratio: What % of response discusses the brand
        
        Based on: AutoGEO research methodology
        
        Returns:
            Dict with geo_score (0-100) and breakdown
        """
        if not ai_response or not brand_name:
            return {"geo_score": 0, "details": {}}
        
        text_lower = ai_response.lower()
        brand_lower = brand_name.lower()
        
        # 1. Position Score (0-40 points) - Earlier mentions are more valuable
        first_position = text_lower.find(brand_lower)
        if first_position == -1:
            position_score = 0
        else:
            # Normalize: position 0 = 40 points, position at end = 0 points
            response_length = len(ai_response)
            position_ratio = 1 - (first_position / response_length)
            position_score = position_ratio * 40
        
        # 2. Frequency Score (0-30 points) - More mentions = better, capped at 5
        mention_count = self._count_brand_mentions(ai_response, brand_name, domain)
        frequency_score = min(mention_count, 5) / 5 * 30
        
        # 3. Token Ratio Score (0-30 points) - How much of response is about brand
        context_snippets = []
        idx = 0
        while True:
            idx = text_lower.find(brand_lower, idx)
            if idx == -1:
                break
            start = max(0, idx - 50)
            end = min(len(ai_response), idx + len(brand_name) + 50)
            context_snippets.append(ai_response[start:end])
            idx += 1
        
        total_context_chars = sum(len(s) for s in context_snippets)
        token_ratio = min(total_context_chars / len(ai_response), 1.0) if ai_response else 0
        token_ratio_score = token_ratio * 30
        
        # Combined GEO Score
        geo_score = position_score + frequency_score + token_ratio_score
        
        return {
            "geo_score": round(geo_score, 1),
            "details": {
                "position_score": round(position_score, 1),
                "frequency_score": round(frequency_score, 1),
                "token_ratio_score": round(token_ratio_score, 1),
                "first_position": first_position,
                "mention_count": mention_count,
                "token_ratio": round(token_ratio, 3)
            }
        }
    
    def _classify_citation_type(
        self,
        ai_response: str,
        original_content: str,
        brand_name: str
    ) -> Dict[str, Any]:
        """
        Classify how the AI uses brand content.
        
        Types:
        - exact_quote: AI quotes original content verbatim (best)
        - paraphrase: AI rephrases original content (good)
        - mention: AI just mentions brand name (basic)
        - none: Brand not mentioned
        
        Returns:
            Dict with citation_type and similarity_score
        """
        if not ai_response or not brand_name:
            return {"citation_type": "none", "similarity_score": 0}
        
        brand_lower = brand_name.lower()
        response_lower = ai_response.lower()
        
        # Check if brand is mentioned at all
        if brand_lower not in response_lower:
            return {"citation_type": "none", "similarity_score": 0}
        
        # If no original content, we can only detect mention
        if not original_content:
            return {"citation_type": "mention", "similarity_score": 0.3}
        
        # Check for exact quotes (look for matching phrases of 10+ words)
        original_sentences = [s.strip() for s in original_content.split('.') if len(s.strip()) > 30]
        
        for sentence in original_sentences[:10]:  # Check first 10 sentences
            # Look for substantial overlap (10+ consecutive words matching)
            words = sentence.split()
            for i in range(len(words) - 9):
                phrase = ' '.join(words[i:i+10]).lower()
                if phrase in response_lower:
                    return {"citation_type": "exact_quote", "similarity_score": 0.95}
        
        # Check for paraphrase (similar concepts, different words)
        # Use keyword overlap as a proxy for paraphrase detection
        original_words = set(original_content.lower().split())
        response_words = set(ai_response.lower().split())
        
        # Filter common words
        stopwords = {'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 
                     'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 
                     'would', 'could', 'should', 'may', 'might', 'must', 'shall',
                     'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
                     'and', 'or', 'but', 'if', 'then', 'than', 'so', 'as', 'that',
                     'this', 'it', 'its', 'their', 'they', 'them', 'we', 'our', 'you'}
        
        original_keywords = original_words - stopwords
        response_keywords = response_words - stopwords
        
        if not original_keywords:
            return {"citation_type": "mention", "similarity_score": 0.3}
        
        overlap = len(original_keywords & response_keywords)
        overlap_ratio = overlap / len(original_keywords)
        
        if overlap_ratio > 0.3:
            return {"citation_type": "paraphrase", "similarity_score": round(0.5 + overlap_ratio * 0.3, 2)}
        
        return {"citation_type": "mention", "similarity_score": 0.3}
    
    def calculate_geu_score(
        self,
        ai_response: str,
        original_content: str,
        brand_name: str
    ) -> Dict[str, Any]:
        """
        Calculate GEU Score (Generative Engine Utility Score).
        
        Measures HOW WELL the AI uses your content:
        - Citation Quality: exact_quote (100%) > paraphrase (70%) > mention (30%)
        - Keypoint Coverage: How many of your key points are reflected
        
        Based on: AutoGEO research methodology (GEU metric)
        
        Returns:
            Dict with geu_score (0-100), citation_type, and details
        """
        if not ai_response or not brand_name:
            return {"geu_score": 0, "citation_type": "none", "details": {}}
        
        # Get citation classification
        citation_result = self._classify_citation_type(ai_response, original_content, brand_name)
        citation_type = citation_result["citation_type"]
        similarity_score = citation_result["similarity_score"]
        
        # Citation quality weights (based on AutoGEO research)
        citation_weights = {
            "exact_quote": 1.0,    # Best: AI quotes you directly
            "paraphrase": 0.7,     # Good: AI rephrases your content
            "mention": 0.3,        # Basic: AI just mentions you
            "none": 0.0            # No mention
        }
        
        citation_quality_score = citation_weights.get(citation_type, 0) * 60  # Max 60 points
        
        # Keypoint coverage (simplified) - based on similarity score
        keypoint_coverage_score = similarity_score * 40  # Max 40 points
        
        geu_score = citation_quality_score + keypoint_coverage_score
        
        return {
            "geu_score": round(geu_score, 1),
            "citation_type": citation_type,
            "details": {
                "citation_quality_score": round(citation_quality_score, 1),
                "keypoint_coverage_score": round(keypoint_coverage_score, 1),
                "similarity_score": similarity_score
            }
        }
    
    def calculate_combined_aeo_score(
        self,
        ai_response: str,
        brand_name: str,
        domain: str = "",
        original_content: str = None
    ) -> Dict[str, Any]:
        """
        Calculate combined AEO/GEO score using both GEO and GEU metrics.
        
        Formula: Combined = (GEO * 0.6) + (GEU * 0.4)
        - GEO weighted higher because visibility is primary goal
        - GEU provides quality dimension
        
        Returns:
            Dict with combined_score, geo_score, geu_score, and breakdown
        """
        geo_result = self.calculate_geo_score(ai_response, brand_name, domain)
        geu_result = self.calculate_geu_score(ai_response, original_content or "", brand_name)
        
        geo_score = geo_result["geo_score"]
        geu_score = geu_result["geu_score"]
        
        # Weighted combination
        combined_score = (geo_score * 0.6) + (geu_score * 0.4)
        
        return {
            "combined_score": round(combined_score, 1),
            "geo_score": geo_score,
            "geu_score": geu_score,
            "citation_type": geu_result["citation_type"],
            "geo_details": geo_result["details"],
            "geu_details": geu_result["details"]
        }


# Singleton instance
_ai_visibility_service: Optional[AIVisibilityService] = None

def get_ai_visibility_service() -> AIVisibilityService:
    """Get singleton instance of AIVisibilityService."""
    global _ai_visibility_service
    if _ai_visibility_service is None:
        _ai_visibility_service = AIVisibilityService()
    return _ai_visibility_service

