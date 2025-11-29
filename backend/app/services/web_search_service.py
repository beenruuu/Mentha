"""
Web Search Service for gathering real-world data about brands, keywords, and competitors.
Uses DuckDuckGo Search API (free, no API key required).
Uses AI to filter and validate competitor results.
"""

from typing import List, Dict, Any, Optional, Set
import asyncio
import json
from datetime import datetime
from urllib.parse import urlparse

try:
    from ddgs import DDGS
except ImportError:
    DDGS = None
    print("Warning: ddgs not installed. Web search will be disabled.")


# Comprehensive exclusion list - sites that are never competitors
EXCLUDED_DOMAINS = {
    # Social media and user-generated content
    'wikipedia.org', 'linkedin.com', 'facebook.com', 'twitter.com', 'instagram.com',
    'youtube.com', 'reddit.com', 'quora.com', 'tiktok.com', 'pinterest.com',
    # Search engines
    'google.com', 'bing.com', 'duckduckgo.com', 'yahoo.com', 'yandex.ru',
    # E-commerce giants
    'amazon.com', 'amazon.es', 'ebay.com', 'ebay.es', 'aliexpress.com',
    # Job boards
    'indeed.com', 'infojobs.net', 'glassdoor.com', 'jobatus.es', 'monster.es',
    # News and press portals (NOT competitors)
    'guiadeprensa.com', 'eleconomista.es', 'cincodias.com', 'expansion.com',
    'larazon.es', 'abc.es', 'elmundo.es', 'elpais.com', 'europapress.es',
    'lavanguardia.com', 'elconfidencial.com', 'eldiario.es', '20minutos.es',
    # Business directories (NOT competitors)
    'empresite.eleconomista.es', 'einforma.com', 'axesor.es', 'infocif.es',
    'paginasamarillas.es', 'cylex.es', 'europages.es', 'kompass.com',
    # Generic platforms
    'whatsapp.com', 'play.google.com', 'apps.apple.com', 'microsoft.com',
    'windows.com', 'store.steampowered.com', 'telegram.org',
}


class WebSearchService:
    """Service for performing web searches to gather real market data."""
    
    def __init__(self, llm_service=None):
        """Initialize the web search service."""
        self.enabled = DDGS is not None
        self.llm_service = llm_service
        if not self.enabled:
            print("Web search is disabled. Install duckduckgo-search to enable.")
    
    def set_llm_service(self, llm_service):
        """Set the LLM service for AI-powered filtering."""
        self.llm_service = llm_service
    
    async def _get_llm_service(self):
        """Get or create the LLM service."""
        if self.llm_service:
            return self.llm_service
        
        try:
            from app.services.llm.llm_service import OpenAIService
            from app.core.config import settings
            
            if settings.OPENAI_API_KEY:
                self.llm_service = OpenAIService(api_key=settings.OPENAI_API_KEY)
                return self.llm_service
        except Exception as e:
            print(f"Could not initialize LLM service: {e}")
        
        return None
    
    async def infer_business_info_from_page(
        self,
        url: str,
        page_title: str = "",
        page_description: str = "",
        page_content: str = ""
    ) -> Dict[str, Any]:
        """
        Use AI to infer business information from page content.
        
        Args:
            url: The page URL
            page_title: Page title
            page_description: Meta description
            page_content: Main text content (first 2000 chars)
            
        Returns:
            Dictionary with inferred business info:
            - industry: Main industry/sector
            - services: List of services offered
            - company_type: Type of company (B2B, B2C, etc.)
            - target_market: Geographic/demographic target
        """
        llm = await self._get_llm_service()
        if not llm:
            return {
                "industry": "Services",
                "services": [],
                "company_type": "unknown",
                "target_market": "unknown"
            }
        
        # Truncate content to avoid token limits
        content_preview = page_content[:2000] if page_content else ""
        
        prompt = f"""Analiza esta página web y extrae información del negocio.

URL: {url}
Título: {page_title}
Descripción: {page_description}
Contenido: {content_preview}

Responde SOLO con un JSON válido con esta estructura exacta:
{{
    "industry": "industria principal específica (ej: 'Servicios de Limpieza Industrial', 'Facility Management', 'Consultoría IT')",
    "services": ["servicio1", "servicio2", "servicio3"],
    "company_type": "B2B|B2C|B2B2C",
    "target_market": "mercado objetivo (ej: 'España', 'Europa', 'Empresas industriales')"
}}

IMPORTANTE:
- La industria debe ser ESPECÍFICA, no genérica
- Lista los servicios REALES que ofrece la empresa
- Si es una empresa multiservicios, indica todos los sectores"""

        try:
            response = await llm.generate_text(
                prompt=prompt,
                model="gpt-4o-mini",
                max_tokens=300,
                temperature=0
            )
            
            # Parse JSON response
            import re
            response_text = response.text.strip()
            # Find JSON in response
            json_match = re.search(r'\{[^{}]*\}', response_text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            
        except Exception as e:
            print(f"Error inferring business info: {e}")
        
        return {
            "industry": "Services",
            "services": [],
            "company_type": "unknown",
            "target_market": "unknown"
        }

    async def _filter_competitors_with_ai(
        self,
        candidates: List[Dict[str, Any]],
        brand_name: str,
        industry: str,
        description: str = ""
    ) -> List[Dict[str, Any]]:
        """
        Use AI to filter search results and identify real competitors.
        
        Args:
            candidates: List of potential competitor results from search
            brand_name: Name of the brand we're finding competitors for
            industry: Industry/sector
            description: Brand description for context
            
        Returns:
            Filtered list of actual competitors
        """
        if not candidates:
            return []
        
        llm = await self._get_llm_service()
        if not llm:
            return candidates[:5]  # Fallback without AI
        
        # Build prompt for AI filtering
        candidates_text = "\n".join([
            f"{i+1}. {c.get('name', 'Unknown')} ({c.get('domain', 'N/A')}): {c.get('snippet', '')[:150]}"
            for i, c in enumerate(candidates[:15])  # Limit to 15 for token efficiency
        ])
        
        prompt = f"""Eres un experto en análisis competitivo. Analiza estos resultados de búsqueda.

EMPRESA A ANALIZAR:
- Nombre: {brand_name}
- Industria: {industry}
- Descripción: {description or 'No disponible'}

RESULTADOS DE BÚSQUEDA:
{candidates_text}

TAREA: Identifica SOLO las empresas que son COMPETIDORES DIRECTOS.

INCLUIR (competidores válidos):
✓ Empresas que ofrecen los MISMOS servicios/productos
✓ Empresas en la MISMA industria y mercado geográfico
✓ Sitios web corporativos de empresas comerciales

EXCLUIR (NO son competidores):
✗ Periódicos, medios de comunicación, portales de noticias
✗ Blogs, artículos informativos, guías
✗ Directorios de empresas, listados, rankings
✗ Diccionarios, definiciones, Wikipedia
✗ Asociaciones, federaciones, gremios del sector
✗ Informes de mercado, estudios, análisis sectoriales
✗ Sitios de empleo, ofertas de trabajo
✗ Redes sociales, plataformas genéricas

Responde ÚNICAMENTE con un JSON array de números.
Ejemplo: [1, 4, 7]
Si ninguno es competidor real: []"""

        try:
            response = await llm.generate_text(
                prompt=prompt,
                model="gpt-4o-mini",
                max_tokens=100,
                temperature=0
            )
            
            # Parse response
            response_text = response.text.strip()
            # Extract JSON array from response
            import re
            match = re.search(r'\[[\d,\s]*\]', response_text)
            if match:
                indices = json.loads(match.group())
                filtered = [candidates[i-1] for i in indices if 0 < i <= len(candidates)]
                print(f"AI filtered {len(candidates)} candidates to {len(filtered)} competitors")
                return filtered
            
            return candidates[:5]  # Fallback
            
        except Exception as e:
            print(f"AI filtering failed: {e}, returning unfiltered results")
            return candidates[:5]

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
        description: str = "",
        services: str = "",
        max_results: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search for REAL competitors in the same industry.
        Uses AI to filter and validate results.
        
        Args:
            brand_name: Name of the brand
            industry: Industry/sector
            domain: Brand's own domain (to exclude from results)
            description: Brand description for context
            services: Services offered by the brand (comma-separated or list)
            max_results: Maximum number of competitors to find
            
        Returns:
            List of competitor information dictionaries
        """
        if not self.enabled:
            return []
        
        try:
            loop = asyncio.get_event_loop()
            
            # Parse services if it's a string
            service_list = []
            if isinstance(services, str) and services:
                service_list = [s.strip() for s in services.split(',') if s.strip()]
            elif isinstance(services, list):
                service_list = services
            
            # Build intelligent search queries
            queries = []
            
            # If we have specific services, search by each service
            if service_list:
                for service in service_list[:3]:  # Top 3 services
                    queries.append(f'empresas "{service}" España')
            
            # Add industry-based query
            if industry and industry.lower() not in ['other', 'otros', 'services', 'unknown']:
                queries.append(f'empresas "{industry}" España competidores')
            
            # Add description-based query if industry is generic
            if description and (not industry or industry.lower() in ['other', 'otros', 'services']):
                # Extract key terms from description
                key_words = [w for w in description.split()[:5] if len(w) > 4]
                if key_words:
                    queries.append(f'empresas {" ".join(key_words[:3])} España')
            
            # Fallback queries
            if not queries:
                queries = [
                    f'{brand_name} competidores España',
                    f'empresas similares a {brand_name}'
                ]
            
            print(f"Competitor search queries: {queries}")
            
            all_candidates = []
            seen_domains: Set[str] = set()
            
            # Add own domain to exclusion
            if domain:
                own_domain = self._normalize_domain(domain)
                seen_domains.add(own_domain)
            
            brand_lower = brand_name.lower().replace(' ', '')
            
            for query in queries:
                results = await loop.run_in_executor(
                    None,
                    self._search_sync,
                    query,
                    15  # Get more to filter with AI
                )
                
                for result in results:
                    link = result.get('href', '')
                    extracted_domain = self._extract_domain(link)
                    normalized = self._normalize_domain(extracted_domain)
                    
                    # Basic deduplication
                    if normalized in seen_domains:
                        continue
                    
                    # Skip obvious exclusions (social media, search engines)
                    if self._is_excluded_domain(normalized):
                        continue
                    
                    # Skip if it's the brand itself
                    if brand_lower in normalized.replace('.', '').replace('-', ''):
                        continue
                    
                    company_name = self._extract_company_name(result.get('title', ''), extracted_domain)
                    
                    if company_name and extracted_domain:
                        seen_domains.add(normalized)
                        # Get favicon for the competitor
                        favicon_url = self._get_favicon_url(extracted_domain)
                        all_candidates.append({
                            'name': company_name,
                            'domain': extracted_domain,
                            'snippet': result.get('body', '')[:200],
                            'favicon': favicon_url,
                            'source': 'web_search',
                            'confidence': 'medium'
                        })
                
                if len(all_candidates) >= 15:
                    break
            
            # Use AI to filter candidates
            filtered = await self._filter_competitors_with_ai(
                all_candidates,
                brand_name,
                industry,
                description
            )
            
            return filtered[:max_results]
            
        except Exception as e:
            print(f"Error in competitor search: {e}")
            return []
    
    def _get_favicon_url(self, domain: str) -> str:
        """Get favicon URL for a domain using Google's favicon service."""
        if not domain:
            return ""
        # Clean domain
        clean_domain = domain.lower().strip()
        if clean_domain.startswith('http'):
            from urllib.parse import urlparse
            clean_domain = urlparse(clean_domain).netloc
        if clean_domain.startswith('www.'):
            clean_domain = clean_domain[4:]
        
        # Use Google's favicon service (reliable and fast)
        return f"https://www.google.com/s2/favicons?domain={clean_domain}&sz=64"
    
    def _normalize_domain(self, domain: str) -> str:
        """Normalize domain for comparison."""
        if not domain:
            return ""
        domain = domain.lower().strip()
        
        # Remove www. prefix
        if domain.startswith('www.'):
            domain = domain[4:]
        
        # Handle country/language subdomains (es.domain.com -> domain.com)
        parts = domain.split('.')
        if len(parts) >= 3:
            # Check if first part is a country/language code (2 letters)
            if len(parts[0]) == 2 and parts[0].isalpha():
                # Move to next part which should be the brand name
                domain = '.'.join(parts[1:])
                parts = domain.split('.')
        
        # Extract base domain name for comparison (sodexo from sodexo.es)
        # Return the first meaningful part (not just 2 letters like .es, .com)
        if parts:
            base_name = parts[0]
            return base_name
        
        return domain
    
    def _is_excluded_domain(self, domain: str) -> bool:
        """Check if domain should be excluded (obvious non-business sites)."""
        domain_lower = domain.lower()
        
        # Check against comprehensive exclusion list
        for excluded in EXCLUDED_DOMAINS:
            excluded_base = excluded.split('.')[0]
            if excluded_base == domain_lower:
                return True
            # Also check full domain match
            if excluded in domain_lower or domain_lower in excluded:
                return True
        
        # Exclude common patterns that indicate non-competitor sites
        excluded_patterns = [
            'prensa', 'noticias', 'news', 'blog.', 'wikipedia',
            'press', 'directorio', 'directory', 'ranking', 'listado',
            'guia', 'guide', '.gov', '.edu', '.org', 'asociacion',
            'federacion', 'gobierno', 'ministerio', 'empleo', 'trabajo'
        ]
        for pattern in excluded_patterns:
            if pattern in domain_lower:
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
        key_terms: Optional[str] = None,
        description: str = "",
        services: str = ""
    ) -> Dict[str, Any]:
        """
        Gather comprehensive search context for a brand analysis.
        This is the main method to call for analysis enrichment.
        
        Args:
            brand_name: Name of the brand
            domain: Brand's domain
            industry: Industry/sector
            key_terms: Optional additional key terms
            description: Brand description for context
            services: Services offered by the brand
            
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
            self.search_competitors(brand_name, industry, domain=domain, description=description, services=services, max_results=5),
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
