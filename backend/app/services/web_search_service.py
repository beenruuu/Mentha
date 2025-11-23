"""
Web Search Service for gathering real-world data about brands, keywords, and competitors.
Uses DuckDuckGo Search API (free, no API key required).
"""

from typing import List, Dict, Any, Optional
import asyncio
from datetime import datetime

try:
    from ddgs import DDGS
except ImportError:
    DDGS = None
    print("Warning: ddgs not installed. Web search will be disabled.")


class WebSearchService:
    """Service for performing web searches to gather real market data."""
    
    def __init__(self):
        """Initialize the web search service."""
        self.enabled = DDGS is not None
        if not self.enabled:
            print("Web search is disabled. Install duckduckgo-search to enable.")
    
    async def search_keywords(
        self, 
        brand_name: str, 
        industry: str, 
        max_results: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search for relevant keywords related to a brand and industry.
        
        Args:
            brand_name: Name of the brand
            industry: Industry/sector of the brand
            max_results: Maximum number of results to return
            
        Returns:
            List of dictionaries with search results
        """
        if not self.enabled:
            return []
        
        try:
            # Run synchronous DDGS in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            results = await loop.run_in_executor(
                None,
                self._search_sync,
                f"{brand_name} {industry}",
                max_results
            )
            return results
        except Exception as e:
            print(f"Error in keyword search: {e}")
            return []
    
    async def search_competitors(
        self, 
        brand_name: str, 
        industry: str,
        max_results: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search for competitors in the same industry.
        
        Args:
            brand_name: Name of the brand
            industry: Industry/sector
            max_results: Maximum number of competitors to find
            
        Returns:
            List of competitor information dictionaries
        """
        if not self.enabled:
            return []
        
        try:
            loop = asyncio.get_event_loop()
            # Search for competitors
            query = f"best {industry} companies like {brand_name}"
            results = await loop.run_in_executor(
                None,
                self._search_sync,
                query,
                max_results
            )
            
            # Extract domain names and company names from results
            competitors = []
            for result in results:
                # Try to extract domain from the link
                link = result.get('href', '')
                domain = self._extract_domain(link)
                
                if domain and domain.lower() not in brand_name.lower():
                    competitors.append({
                        'name': result.get('title', '').split('|')[0].strip(),
                        'domain': domain,
                        'snippet': result.get('body', '')
                    })
            
            return competitors[:max_results]
        except Exception as e:
            print(f"Error in competitor search: {e}")
            return []
    
    async def search_brand_mentions(
        self, 
        brand_name: str, 
        domain: str,
        max_results: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search for mentions and discussions about the brand.
        
        Args:
            brand_name: Name of the brand
            domain: Brand's domain
            max_results: Maximum number of mentions to find
            
        Returns:
            List of brand mention dictionaries
        """
        if not self.enabled:
            return []
        
        try:
            loop = asyncio.get_event_loop()
            results = await loop.run_in_executor(
                None,
                self._search_sync,
                f'"{brand_name}" OR {domain}',
                max_results
            )
            return results
        except Exception as e:
            print(f"Error in brand mentions search: {e}")
            return []
    
    async def search_industry_terms(
        self,
        industry: str,
        max_results: int = 15
    ) -> List[Dict[str, Any]]:
        """
        Search for common terms and topics in an industry.
        
        Args:
            industry: Industry/sector name
            max_results: Maximum number of results
            
        Returns:
            List of search results about industry
        """
        if not self.enabled:
            return []
        
        try:
            loop = asyncio.get_event_loop()
            results = await loop.run_in_executor(
                None,
                self._search_sync,
                f"{industry} trends topics services",
                max_results
            )
            return results
        except Exception as e:
            print(f"Error in industry search: {e}")
            return []
    
    def _search_sync(self, query: str, max_results: int) -> List[Dict[str, Any]]:
        """
        Synchronous search function to be run in thread pool.
        
        Args:
            query: Search query
            max_results: Maximum results to return
            
        Returns:
            List of search result dictionaries
        """
        try:
            with DDGS() as ddgs:
                results = list(ddgs.text(query, max_results=max_results))
                return results
        except Exception as e:
            print(f"DuckDuckGo search failed for '{query}': {e}")
            return []
    
    def _extract_domain(self, url: str) -> str:
        """
        Extract domain name from URL.
        
        Args:
            url: Full URL
            
        Returns:
            Domain name (e.g., 'example.com')
        """
        try:
            from urllib.parse import urlparse
            parsed = urlparse(url)
            domain = parsed.netloc or parsed.path
            # Remove 'www.' prefix if present
            if domain.startswith('www.'):
                domain = domain[4:]
            return domain
        except Exception:
            return ""
    
    async def get_search_context(
        self,
        brand_name: str,
        domain: str,
        industry: str,
        key_terms: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Gather comprehensive search context for a brand analysis.
        This is the main method to call for analysis enrichment.
        
        Args:
            brand_name: Name of the brand
            domain: Brand's domain
            industry: Industry/sector
            key_terms: Optional additional key terms
            
        Returns:
            Dictionary with all search context data
        """
        if not self.enabled:
            print("Web search disabled - skipping real data gathering")
            return {
                "enabled": False,
                "message": "Web search is disabled. Install duckduckgo-search to enable."
            }
        
        print(f"Gathering web search context for: {brand_name}")
        
        # Perform searches in parallel
        keyword_results, competitor_results, mention_results, industry_results = await asyncio.gather(
            self.search_keywords(brand_name, industry, max_results=10),
            self.search_competitors(brand_name, industry, max_results=5),
            self.search_brand_mentions(brand_name, domain, max_results=8),
            self.search_industry_terms(industry, max_results=10),
            return_exceptions=True
        )
        
        # Handle any exceptions from parallel execution
        if isinstance(keyword_results, Exception):
            print(f"Keyword search error: {keyword_results}")
            keyword_results = []
        if isinstance(competitor_results, Exception):
            print(f"Competitor search error: {competitor_results}")
            competitor_results = []
        if isinstance(mention_results, Exception):
            print(f"Mention search error: {mention_results}")
            mention_results = []
        if isinstance(industry_results, Exception):
            print(f"Industry search error: {industry_results}")
            industry_results = []
        
        context = {
            "enabled": True,
            "timestamp": datetime.utcnow().isoformat(),
            "brand_name": brand_name,
            "domain": domain,
            "industry": industry,
            "keyword_results": keyword_results,
            "competitor_results": competitor_results,
            "mention_results": mention_results,
            "industry_results": industry_results,
            "total_results": (
                len(keyword_results) + 
                len(competitor_results) + 
                len(mention_results) + 
                len(industry_results)
            )
        }
        
        print(f"Search context gathered: {context['total_results']} total results")
        return context
