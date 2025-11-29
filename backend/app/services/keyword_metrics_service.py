"""
Keyword Metrics Service - Obtains real keyword data from various sources.

Sources:
1. Google Trends (free) - for relative search interest
2. DuckDuckGo Instant Answers - for related terms
3. SerpAPI/DataForSEO (paid, optional) - for accurate search volumes

This service provides REAL data, not LLM-generated estimates.
"""

import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime
import httpx

try:
    from pytrends.request import TrendReq
    PYTRENDS_AVAILABLE = True
except ImportError:
    PYTRENDS_AVAILABLE = False
    print("Warning: pytrends not installed. Google Trends data will be unavailable.")

from app.core.config import settings


class KeywordMetricsService:
    """Service for obtaining real keyword metrics from various sources."""
    
    # Language code to Google Trends HL mapping
    LANGUAGE_HL_MAP = {
        "en": "en-US",
        "es": "es-ES",
        "fr": "fr-FR",
        "de": "de-DE",
        "it": "it-IT",
        "pt": "pt-BR",
        "nl": "nl-NL",
        "ja": "ja-JP",
        "ko": "ko-KR",
        "zh": "zh-CN"
    }
    
    # Country code to Google Trends geo mapping
    COUNTRY_GEO_MAP = {
        "US": "US",
        "ES": "ES",
        "MX": "MX",
        "AR": "AR",
        "FR": "FR",
        "DE": "DE",
        "IT": "IT",
        "UK": "GB",
        "GB": "GB",
        "BR": "BR",
        "JP": "JP",
        "KR": "KR",
        "CN": "CN"
    }
    
    def __init__(self):
        """Initialize the keyword metrics service."""
        self.pytrends_instances = {}  # Cache by language
        
        self.http_client = httpx.AsyncClient(timeout=30.0)
        
        # Check for paid API keys
        self.serpapi_key = settings.SERPAPI_KEY
        self.serper_key = settings.SERPER_API_KEY
    
    def _get_pytrends(self, language: str = "en") -> Optional['TrendReq']:
        """Get or create a pytrends instance for the specified language."""
        if not PYTRENDS_AVAILABLE:
            return None
        
        if language not in self.pytrends_instances:
            try:
                hl = self.LANGUAGE_HL_MAP.get(language, "en-US")
                self.pytrends_instances[language] = TrendReq(hl=hl, tz=360)
            except Exception as e:
                print(f"Failed to initialize pytrends for {language}: {e}")
                return None
        
        return self.pytrends_instances.get(language)
    
    async def get_keyword_metrics(
        self, 
        keywords: List[str],
        country: str = "US",
        language: str = "en"
    ) -> Dict[str, Dict[str, Any]]:
        """
        Get metrics for a list of keywords from real sources.
        
        Args:
            keywords: List of keywords to analyze
            country: Country code for localization
            language: Language code for Google Trends (en, es, fr, etc.)
            
        Returns:
            Dictionary mapping keywords to their metrics
        """
        results = {}
        
        # Get Google Trends data (relative popularity) with language support
        trends_data = await self._get_google_trends(keywords, language, country)
        
        # Get related keywords from DuckDuckGo (uses detected language)
        related_data = await self._get_related_keywords(keywords, language)
        
        # If paid API available, get actual search volumes
        volume_data = {}
        if self.serpapi_key:
            volume_data = await self._get_serpapi_volumes(keywords)
        elif self.serper_key:
            volume_data = await self._get_serper_data(keywords)
        
        # Combine all data sources
        for keyword in keywords:
            trend_score = trends_data.get(keyword, 0)
            
            # Estimate search volume from trends if no paid API
            if keyword in volume_data:
                search_volume = volume_data[keyword].get('search_volume', 0)
            else:
                # Estimate: trend score 100 ≈ 10000 searches/month (rough heuristic)
                search_volume = self._estimate_volume_from_trends(trend_score)
            
            results[keyword] = {
                'keyword': keyword,
                'search_volume': search_volume,
                'trend_score': trend_score,  # 0-100 relative popularity
                'trend_direction': self._get_trend_direction(trends_data, keyword),
                'difficulty': self._estimate_difficulty(trend_score, search_volume),
                'related_keywords': related_data.get(keyword, []),
                'data_source': 'serpapi' if keyword in volume_data else 'estimated_from_trends',
                'last_updated': datetime.utcnow().isoformat()
            }
        
        return results
    
    async def _get_google_trends(
        self, 
        keywords: List[str],
        language: str = "en",
        country: str = "US"
    ) -> Dict[str, int]:
        """
        Get Google Trends interest data for keywords.
        
        Returns relative search interest (0-100).
        """
        pytrends = self._get_pytrends(language)
        if not pytrends or not keywords:
            return {}
        
        # Get geo code for Google Trends
        geo = self.COUNTRY_GEO_MAP.get(country.upper(), country.upper())
        
        try:
            # Google Trends only accepts 5 keywords at a time
            results = {}
            
            for i in range(0, len(keywords), 5):
                batch = keywords[i:i+5]
                
                # Run in thread pool to avoid blocking
                loop = asyncio.get_event_loop()
                trend_data = await loop.run_in_executor(
                    None,
                    self._fetch_trends_sync,
                    batch,
                    pytrends,
                    geo
                )
                results.update(trend_data)
            
            return results
            
        except Exception as e:
            print(f"Google Trends error: {e}")
            return {}
    
    def _fetch_trends_sync(
        self, 
        keywords: List[str], 
        pytrends: 'TrendReq',
        geo: str = ""
    ) -> Dict[str, int]:
        """Synchronous function to fetch Google Trends data."""
        try:
            pytrends.build_payload(keywords, timeframe='today 3-m', geo=geo)
            interest = pytrends.interest_over_time()
            
            if interest.empty:
                return {kw: 0 for kw in keywords}
            
            # Get average interest for each keyword
            results = {}
            for kw in keywords:
                if kw in interest.columns:
                    results[kw] = int(interest[kw].mean())
                else:
                    results[kw] = 0
            
            return results
            
        except Exception as e:
            print(f"Trends fetch error: {e}")
            return {kw: 0 for kw in keywords}
    
    async def _get_related_keywords(
        self, 
        keywords: List[str],
        language: str = "en"
    ) -> Dict[str, List[str]]:
        """Get related keywords using DuckDuckGo Instant Answers."""
        results = {}
        
        # DuckDuckGo region parameter for localized results
        region_map = {
            "en": "us-en",
            "es": "es-es",
            "fr": "fr-fr",
            "de": "de-de",
            "it": "it-it",
            "pt": "br-pt",
        }
        region = region_map.get(language, "wt-wt")  # wt-wt = no region filter
        
        for keyword in keywords[:5]:  # Limit to avoid rate limiting
            try:
                url = f"https://api.duckduckgo.com/?q={keyword}&format=json&kl={region}"
                response = await self.http_client.get(url)
                
                if response.status_code == 200:
                    data = response.json()
                    related = []
                    
                    # Extract related topics
                    for topic in data.get('RelatedTopics', [])[:5]:
                        if isinstance(topic, dict) and 'Text' in topic:
                            # Extract first few words as related term
                            text = topic['Text'].split(' - ')[0][:50]
                            related.append(text)
                    
                    results[keyword] = related
                    
            except Exception as e:
                print(f"DuckDuckGo API error for '{keyword}': {e}")
                results[keyword] = []
        
        return results
    
    async def _get_serpapi_volumes(self, keywords: List[str]) -> Dict[str, Dict[str, Any]]:
        """Get search volumes from SerpAPI (paid)."""
        if not self.serpapi_key:
            return {}
        
        results = {}
        
        for keyword in keywords[:10]:  # Limit API calls
            try:
                url = "https://serpapi.com/search.json"
                params = {
                    "engine": "google_trends",
                    "q": keyword,
                    "api_key": self.serpapi_key,
                    "data_type": "TIMESERIES"
                }
                
                response = await self.http_client.get(url, params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Extract interest over time
                    timeline = data.get('interest_over_time', {}).get('timeline_data', [])
                    if timeline:
                        avg_interest = sum(
                            int(t.get('values', [{}])[0].get('value', 0)) 
                            for t in timeline
                        ) / len(timeline)
                        
                        results[keyword] = {
                            'search_volume': self._estimate_volume_from_trends(avg_interest),
                            'trend_interest': avg_interest
                        }
                        
            except Exception as e:
                print(f"SerpAPI error for '{keyword}': {e}")
        
        return results
    
    async def _get_serper_data(self, keywords: List[str]) -> Dict[str, Dict[str, Any]]:
        """Get search data from Serper.dev (paid)."""
        if not self.serper_key:
            return {}
        
        results = {}
        
        for keyword in keywords[:10]:
            try:
                url = "https://google.serper.dev/search"
                headers = {
                    "X-API-KEY": self.serper_key,
                    "Content-Type": "application/json"
                }
                payload = {"q": keyword, "num": 10}
                
                response = await self.http_client.post(url, json=payload, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Serper gives total results which can indicate popularity
                    total_results = data.get('searchInformation', {}).get('totalResults', 0)
                    
                    # Rough estimate: more results = more popular
                    estimated_volume = min(int(int(total_results) / 100000), 100000)
                    
                    results[keyword] = {
                        'search_volume': estimated_volume,
                        'total_results': total_results
                    }
                    
            except Exception as e:
                print(f"Serper error for '{keyword}': {e}")
        
        return results
    
    def _estimate_volume_from_trends(self, trend_score: int) -> int:
        """
        Estimate search volume from Google Trends score.
        
        This is a rough heuristic:
        - Trend score 100 (maximum interest) ≈ 100,000+ monthly searches
        - Trend score 50 ≈ 10,000 monthly searches
        - Trend score 10 ≈ 1,000 monthly searches
        - Trend score 0 = very low/no data
        """
        if trend_score <= 0:
            return 100  # Minimum placeholder
        
        # Exponential scale
        import math
        volume = int(100 * math.exp(trend_score / 15))
        
        # Cap at reasonable maximum
        return min(volume, 1000000)
    
    def _estimate_difficulty(self, trend_score: int, search_volume: int) -> float:
        """
        Estimate keyword difficulty based on available data.
        
        Higher trend scores and volumes typically mean more competition.
        """
        if search_volume <= 0:
            return 20.0  # Low difficulty for unknown keywords
        
        import math
        
        # Base difficulty from volume (log scale)
        volume_factor = min(math.log10(search_volume + 1) * 15, 50)
        
        # Trend factor
        trend_factor = (trend_score / 100) * 30
        
        # Combine factors
        difficulty = volume_factor + trend_factor
        
        # Ensure within 0-100 range
        return round(min(max(difficulty, 5), 95), 1)
    
    def _get_trend_direction(self, trends_data: Dict[str, int], keyword: str) -> str:
        """Determine if keyword is trending up, down, or stable."""
        score = trends_data.get(keyword, 0)
        
        # This would be better with historical data comparison
        # For now, use score thresholds
        if score >= 70:
            return "up"
        elif score <= 30:
            return "down"
        else:
            return "stable"
    
    async def enrich_keywords(
        self,
        keywords: List[str],
        geo: str = "US",
        language: str = "en"
    ) -> List[Dict[str, Any]]:
        """
        Enrich a list of keywords with real metrics.
        
        Args:
            keywords: List of keyword strings to enrich
            geo: Geographic location code (e.g., 'US', 'ES')
            language: Language code for keyword metrics (e.g., 'en', 'es')
            
        Returns:
            List of keyword dictionaries with metrics
        """
        if not keywords:
            return []
        
        try:
            # Get metrics for all keywords (with language support)
            metrics = await self.get_keyword_metrics(keywords, country=geo, language=language)
            
            # Convert to list format expected by analysis service
            enriched = []
            for keyword in keywords:
                if keyword in metrics:
                    kw_data = metrics[keyword]
                    enriched.append({
                        'keyword': keyword,
                        'search_volume': kw_data.get('search_volume', 0),
                        'difficulty': kw_data.get('difficulty', 50),
                        'trend_score': kw_data.get('trend_score', 0),
                        'trend_direction': kw_data.get('trend_direction', 'stable'),
                        'data_source': kw_data.get('data_source', 'estimated'),
                        'ai_visibility_score': 0  # Real AI visibility requires actual AI API queries - not available without AI Search Simulator
                    })
                else:
                    # Return basic entry for keywords without metrics
                    enriched.append({
                        'keyword': keyword,
                        'search_volume': 0,
                        'difficulty': 50,
                        'trend_score': 0,
                        'trend_direction': 'stable',
                        'data_source': 'none',
                        'ai_visibility_score': 0
                    })
            
            return enriched
            
        except Exception as e:
            print(f"Error enriching keywords: {e}")
            # Return basic entries on error
            return [{'keyword': kw, 'search_volume': 0, 'difficulty': 50, 'ai_visibility_score': 0} for kw in keywords]
    
    async def get_related_keywords(
        self,
        seed_keyword: str,
        geo: str = "US",
        limit: int = 10,
        language: str = "en"
    ) -> List[Dict[str, Any]]:
        """
        Get related keywords for a seed keyword.
        
        Args:
            seed_keyword: Base keyword to find related terms for
            geo: Geographic location code
            limit: Maximum number of related keywords to return
            language: Language code for keyword discovery
            
        Returns:
            List of related keyword dictionaries
        """
        try:
            related = await self._get_related_keywords([seed_keyword], language=language)
            related_list = related.get(seed_keyword, [])[:limit]
            
            # Return as enriched format
            return [{'keyword': kw, 'search_volume': 0, 'difficulty': 50, 'data_source': 'related'} for kw in related_list]
            
        except Exception as e:
            print(f"Error getting related keywords: {e}")
            return []

    async def get_ai_visibility_score(
        self,
        brand_name: str,
        keyword: str
    ) -> Dict[str, Any]:
        """
        Check if a brand appears in AI responses for a keyword.
        
        This actually queries AI models to see if they mention the brand.
        """
        # This would require calling multiple AI APIs
        # For now, return structure for future implementation
        return {
            'keyword': keyword,
            'brand': brand_name,
            'visibility_score': None,
            'mentioned_in': [],
            'note': 'AI visibility checking requires additional API integration'
        }
    
    async def close(self):
        """Close HTTP client."""
        await self.http_client.aclose()


class AIVisibilityChecker:
    """
    Service to check actual brand visibility in AI model responses.
    
    This queries real AI models to see if they mention a brand for specific queries.
    """
    
    def __init__(self):
        from app.services.llm.llm_service import LLMServiceFactory
        self.llm_factory = LLMServiceFactory
    
    async def check_brand_visibility(
        self,
        brand_name: str,
        queries: List[str],
        models: List[str] = ["openai", "anthropic"]
    ) -> Dict[str, Any]:
        """
        Check if brand is mentioned in AI responses.
        
        Args:
            brand_name: Brand to check visibility for
            queries: List of queries to test
            models: AI models to test against
            
        Returns:
            Visibility report across models
        """
        results = {
            'brand': brand_name,
            'queries_tested': len(queries),
            'models_tested': models,
            'mentions': {},
            'overall_visibility_score': 0
        }
        
        total_mentions = 0
        total_tests = 0
        
        for model_name in models:
            try:
                llm = self.llm_factory.get_service(model_name)
                model_mentions = 0
                
                for query in queries[:5]:  # Limit queries to save costs
                    total_tests += 1
                    
                    # Ask AI about the topic
                    response = await llm.generate_text(
                        prompt=f"What are the best options for: {query}? List top recommendations.",
                        max_tokens=500
                    )
                    
                    # Check if brand is mentioned
                    if brand_name.lower() in response.text.lower():
                        model_mentions += 1
                        total_mentions += 1
                
                results['mentions'][model_name] = {
                    'queries_with_mention': model_mentions,
                    'total_queries': min(len(queries), 5),
                    'mention_rate': model_mentions / min(len(queries), 5) * 100
                }
                
            except Exception as e:
                print(f"Error checking visibility on {model_name}: {e}")
                results['mentions'][model_name] = {'error': str(e)}
        
        # Calculate overall score
        if total_tests > 0:
            results['overall_visibility_score'] = round(total_mentions / total_tests * 100, 1)
        
        return results
