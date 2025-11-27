"""
Web Search Service for gathering real-world data about brands, keywords, and competitors.
Uses DuckDuckGo Search API (free, no API key required).
"""

from typing import List, Dict, Any, Optional, Set
import asyncio
from datetime import datetime
from urllib.parse import urlparse

try:
    from ddgs import DDGS
except ImportError:
    DDGS = None
    print("Warning: ddgs not installed. Web search will be disabled.")


# Domains to exclude from competitor results (news, directories, etc.)
EXCLUDED_DOMAINS = {
    # News sites
    'elmundofinanciero.com', 'elmundo.es', 'elpais.com', 'abc.es', 'lavanguardia.com',
    'expansion.com', 'cincodias.com', 'eleconomista.es', 'forbes.com', 'bloomberg.com',
    'reuters.com', 'bbc.com', 'cnn.com', 'nytimes.com', 'theguardian.com',
    # Directories and aggregators  
    'wikipedia.org', 'linkedin.com', 'facebook.com', 'twitter.com', 'instagram.com',
    'youtube.com', 'reddit.com', 'quora.com', 'trustpilot.com', 'glassdoor.com',
    'indeed.com', 'crunchbase.com', 'paginasamarillas.es', 'yelp.com',
    # Generic sites
    'google.com', 'amazon.com', 'ebay.com', 'aliexpress.com',
}

# Keywords that indicate a result is NOT a competitor
NON_COMPETITOR_INDICATORS = [
    'noticias', 'news', 'periódico', 'newspaper', 'medio', 'media',
    'blog', 'artículo', 'article', 'opinion', 'editorial',
    'directorio', 'directory', 'listado', 'ranking', 'comparativa',
]


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
        domain: str = "",
        max_results: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search for REAL competitors in the same industry.
        Uses multiple search strategies and filters out news/directories.
        
        Args:
            brand_name: Name of the brand
            industry: Industry/sector
            domain: Brand's own domain (to exclude from results)
            max_results: Maximum number of competitors to find
            
        Returns:
            List of competitor information dictionaries
        """
        if not self.enabled:
            return []
        
        try:
            loop = asyncio.get_event_loop()
            
            # Multiple search queries for better results
            queries = [
                f"empresas {industry} España principales",  # Spanish companies in industry
                f"competidores directos {industry}",  # Direct competitors
                f"mejores empresas {industry} alternativas",  # Best alternatives
                f"{industry} companies Spain top",  # English variant
            ]
            
            all_results = []
            seen_domains: Set[str] = set()
            
            # Add own domain to exclusion
            if domain:
                own_domain = self._normalize_domain(domain)
                seen_domains.add(own_domain)
            
            # Also exclude the brand name variations
            brand_lower = brand_name.lower().replace(' ', '')
            
            for query in queries:
                results = await loop.run_in_executor(
                    None,
                    self._search_sync,
                    query,
                    10  # Get more to filter
                )
                
                for result in results:
                    link = result.get('href', '')
                    extracted_domain = self._extract_domain(link)
                    normalized = self._normalize_domain(extracted_domain)
                    
                    # Skip if already seen
                    if normalized in seen_domains:
                        continue
                    
                    # Skip excluded domains (news, directories, etc.)
                    if self._is_excluded_domain(normalized):
                        continue
                    
                    # Skip if it's the brand itself
                    if brand_lower in normalized.replace('.', '').replace('-', ''):
                        continue
                    
                    # Skip if title/snippet indicates it's not a competitor
                    title = result.get('title', '').lower()
                    snippet = result.get('body', '').lower()
                    if self._is_non_competitor_content(title, snippet):
                        continue
                    
                    # Extract clean company name from title
                    company_name = self._extract_company_name(result.get('title', ''), extracted_domain)
                    
                    if company_name and extracted_domain:
                        seen_domains.add(normalized)
                        all_results.append({
                            'name': company_name,
                            'domain': extracted_domain,
                            'snippet': result.get('body', '')[:200],
                            'source': 'web_search',
                            'confidence': 'medium'
                        })
                    
                    if len(all_results) >= max_results:
                        break
                
                if len(all_results) >= max_results:
                    break
            
            return all_results[:max_results]
        except Exception as e:
            print(f"Error in competitor search: {e}")
            return []
    
    def _normalize_domain(self, domain: str) -> str:
        """Normalize domain for comparison."""
        if not domain:
            return ""
        domain = domain.lower().strip()
        if domain.startswith('www.'):
            domain = domain[4:]
        # Remove common TLDs variations for comparison
        return domain
    
    def _is_excluded_domain(self, domain: str) -> bool:
        """Check if domain should be excluded (news, directories, etc.)."""
        domain_lower = domain.lower()
        
        # Check against exclusion list
        for excluded in EXCLUDED_DOMAINS:
            if excluded in domain_lower:
                return True
        
        return False
    
    def _is_non_competitor_content(self, title: str, snippet: str) -> bool:
        """Check if content indicates this is NOT a competitor (news article, directory, etc.)."""
        combined = f"{title} {snippet}".lower()
        
        for indicator in NON_COMPETITOR_INDICATORS:
            if indicator in combined:
                return True
        
        return False
    
    def _extract_company_name(self, title: str, domain: str) -> str:
        """Extract clean company name from search result title."""
        if not title:
            return ""
        
        # Clean up title
        name = title.split('|')[0].strip()
        name = name.split('-')[0].strip()
        name = name.split('–')[0].strip()
        name = name.split(':')[0].strip()
        
        # Remove common suffixes
        for suffix in [' S.A.', ' S.L.', ' S.L.U.', ' Inc.', ' Ltd.', ' LLC', ' GmbH']:
            if name.endswith(suffix):
                name = name[:-len(suffix)].strip()
        
        # If name is too long or looks like a sentence, try to use domain
        if len(name) > 50 or ' es ' in name.lower() or ' the ' in name.lower():
            # Derive from domain
            domain_name = domain.split('.')[0] if domain else ""
            if domain_name and len(domain_name) > 2:
                return domain_name.replace('-', ' ').title()
        
        return name if len(name) > 1 else ""
    
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
            self.search_competitors(brand_name, industry, domain=domain, max_results=5),
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
