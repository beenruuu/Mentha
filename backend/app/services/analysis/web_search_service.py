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
        Use AI to infer business information and ENTITY TYPE from page content.
        
        Args:
            url: The page URL
            page_title: Page title
            page_description: Meta description
            page_content: Main text content (first 2000 chars)
            
        Returns:
            Dictionary with inferred business info:
            - entity_type: 'business', 'media', 'institution', 'blog', 'other'
            - industry: Main industry/sector
            - services: List of services offered
            - company_type: Type of company (B2B, B2C, etc.)
            - target_market: Geographic/demographic target
        """
        llm = await self._get_llm_service()
        if not llm:
            return {
                "entity_type": "business", # Default assumption
                "industry": "Services",
                "services": [],
                "company_type": "unknown",
                "target_market": "unknown"
            }
        
        # Truncate content to avoid token limits
        content_preview = page_content[:2000] if page_content else ""
        
        prompt = f"""Analiza esta página web y clasifica la entidad.

URL: {url}
Título: {page_title}
Descripción: {page_description}
Contenido: {content_preview}

Responde SOLO con un JSON válido con esta estructura exacta:
{{
    "entity_type": "business|media|institution|blog|other",
    "industry": "industria principal específica",
    "services": ["servicio1", "servicio2"],
    "company_type": "B2B|B2C|B2B2C",
    "target_market": "mercado objetivo"
}}

DEFINICIONES DE ENTITY_TYPE:
- business: Vende productos o servicios comerciales (agencia, tienda, consultora, SaaS).
- media: Periódico, revista, portal de noticias, canal de TV.
- institution: Gobierno, universidad, ONG, asociación.
- blog: Blog personal o temático no comercial.
- other: No encaja en los anteriores.
"""

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
            json_match = re.search(r'\{[^{}]*\}', response_text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            
        except Exception as e:
            print(f"Error inferring business info: {e}")
        
        return {
            "entity_type": "business",
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
        description: str = "",
        entity_type: str = "business"
    ) -> List[Dict[str, Any]]:
        """
        Use AI to filter search results and identify real competitors based on ENTITY TYPE.
        """
        if not candidates:
            return []
        
        llm = await self._get_llm_service()
        if not llm:
            return candidates[:5]
        
        # Build prompt for AI filtering
        candidates_text = "\n".join([
            f"{i+1}. {c.get('name', 'Unknown')} ({c.get('domain', 'N/A')}): {c.get('snippet', '')[:150]}"
            for i, c in enumerate(candidates[:15])
        ])
        
        # Adjust criteria based on entity type
        criteria = ""
        if entity_type == 'media':
            criteria = """
            CRITERIOS PARA MEDIOS/NOTICIAS:
            ✓ INCLUIR: Otros periódicos, revistas digitales, portales de noticias.
            ✗ EXCLUIR: Tiendas online, empresas de servicios, blogs personales pequeños.
            """
        elif entity_type == 'institution':
            criteria = """
            CRITERIOS PARA INSTITUCIONES:
            ✓ INCLUIR: Organismos similares, universidades, asociaciones del mismo sector.
            ✗ EXCLUIR: Empresas comerciales, tiendas.
            """
        else: # business (default)
            criteria = """
            CRITERIOS PARA NEGOCIOS (Default):
            ✓ INCLUIR: Empresas que venden lo mismo o servicios sustitutivos.
            ✗ EXCLUIR: Periódicos, Wikipedia, Directorios, Gobiernos.
            """

        prompt = f"""Eres un experto en análisis competitivo. Analiza estos resultados.

ENTIDAD A ANALIZAR:
- Nombre: {brand_name}
- Tipo: {entity_type.upper()}
- Industria: {industry}
- Descripción: {description or 'No disponible'}

RESULTADOS DE BÚSQUEDA:
{candidates_text}

TAREA: Identifica SOLO los competidores directos para una entidad de tipo {entity_type.upper()}.
{criteria}

Responde ÚNICAMENTE con un JSON array de números de los candidatos válidos.
Ejemplo: [1, 4, 7]"""

        try:
            response = await llm.generate_text(
                prompt=prompt,
                model="gpt-4o-mini",
                max_tokens=100,
                temperature=0
            )
            
            import re
            match = re.search(r'\[[\d,\s]*\]', response.text.strip())
            if match:
                indices = json.loads(match.group())
                filtered = [candidates[i-1] for i in indices if 0 < i <= len(candidates)]
                print(f"AI filtered {len(candidates)} candidates to {len(filtered)} competitors (Type: {entity_type})")
                return filtered
            
            return candidates[:5]
            
        except Exception as e:
            print(f"AI filtering failed: {e}, returning unfiltered results")
            return candidates[:5]

    async def search_competitors(
        self, 
        brand_name: str, 
        industry: str,
        domain: str = "",
        description: str = "",
        services: str = "",
        max_results: int = 5,
        entity_type: str = "business",
        country: str = "ES",
        language: str = "es"
    ) -> List[Dict[str, Any]]:
        """
        Search for REAL competitors in the same industry, respecting entity type and location.
        """
        if not self.enabled:
            return []
        
        try:
            loop = asyncio.get_event_loop()
            
            # Parse services
            service_list = []
            if isinstance(services, str) and services:
                service_list = [s.strip() for s in services.split(',') if s.strip()]
            elif isinstance(services, list):
                service_list = services
            
            # Build localized queries based on entity type
            queries = []
            
            # Localization helpers
            loc_suffix = f" {country}" if country else ""
            
            # Language-specific terms
            terms = {
                "es": {
                    "news": "noticias", "digital_papers": "diarios digitales", "magazines": "revistas",
                    "orgs": "organismos", "associations": "asociaciones", "companies": "empresas",
                    "competitors": "competidores", "similar": "similar a", "alternatives": "alternativas a",
                    "vs": "vs", "best": "mejores"
                },
                "en": {
                    "news": "news", "digital_papers": "digital newspapers", "magazines": "magazines",
                    "orgs": "organizations", "associations": "associations", "companies": "companies",
                    "competitors": "competitors", "similar": "similar to", "alternatives": "alternatives to",
                    "vs": "vs", "best": "best"
                }
            }
            t = terms.get(language, terms["en"])
            
            if entity_type == 'media':
                queries.append(f'{t["news"]} "{industry}"{loc_suffix}')
                queries.append(f'{t["digital_papers"]} "{industry}"')
                queries.append(f'{t["magazines"]} "{industry}"')
            elif entity_type == 'institution':
                queries.append(f'{t["orgs"]} "{industry}"{loc_suffix}')
                queries.append(f'{t["associations"]} "{industry}"')
            else:
                # Business queries (standard)
                if service_list:
                    for service in service_list[:3]:
                        queries.append(f'{t["companies"]} "{service}"{loc_suffix}')
                        queries.append(f'{t["best"]} {t["companies"]} {service}{loc_suffix}')
                
                if industry:
                    queries.append(f'{t["companies"]} "{industry}"{loc_suffix} {t["competitors"]}')
                    queries.append(f'top {t["companies"]} {industry}{loc_suffix}')
                
                # Direct competitor discovery queries
                queries.append(f'{t["similar"]} {brand_name}')
                queries.append(f'{t["alternatives"]} {brand_name}')
                queries.append(f'{brand_name} {t["vs"]}')
            
            # Fallback
            if not queries:
                queries = [f'{brand_name} {t["competitors"]}', f'{t["similar"]} {brand_name}']
            
            print(f"Competitor search queries (Type: {entity_type}, Loc: {country}): {queries}")
            
            all_candidates = []
            seen_domains: Set[str] = set()
            
            if domain:
                seen_domains.add(self._normalize_domain(domain))
            
            brand_lower = brand_name.lower().replace(' ', '')
            
            for query in queries:
                results = await loop.run_in_executor(
                    None,
                    self._search_sync,
                    query,
                    15
                )
                
                for result in results:
                    link = result.get('href', '')
                    extracted_domain = self._extract_domain(link)
                    normalized = self._normalize_domain(extracted_domain)
                    
                    if normalized in seen_domains:
                        continue
                        
                    # Skip self
                    if brand_lower in normalized.replace('.', '').replace('-', ''):
                        continue

                    # NO HARDCODED EXCLUSIONS HERE - We rely on AI filtering later
                    
                    company_name = self._extract_company_name(result.get('title', ''), extracted_domain)
                    
                    if company_name and extracted_domain:
                        seen_domains.add(normalized)
                        favicon_url = self._get_favicon_url(extracted_domain)
                        all_candidates.append({
                            'name': company_name,
                            'domain': extracted_domain,
                            'snippet': result.get('body', '')[:200],
                            'favicon': favicon_url,
                            'source': 'web_search',
                            'confidence': 'medium'
                        })
                
                if len(all_candidates) >= 20: # Increased candidate pool
                    break
            
            # Use AI to filter candidates with context
            filtered = await self._filter_competitors_with_ai(
                all_candidates,
                brand_name,
                industry,
                description,
                entity_type=entity_type
            )
            
            return filtered[:max_results]
            
        except Exception as e:
            print(f"Error in competitor search: {e}")
            return []
    
    def _is_excluded_domain(self, domain: str) -> bool:
        # Deprecated: We now use AI context-aware filtering
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
    
    async def search_keywords(
        self,
        brand_name: str,
        industry: str,
        max_results: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search for relevant keywords related to the brand and industry.
        
        Args:
            brand_name: Name of the brand
            industry: Industry/sector
            max_results: Maximum number of keyword results
            
        Returns:
            List of keyword search results
        """
        if not self.enabled:
            return []
        
        try:
            loop = asyncio.get_event_loop()
            # Search for keywords related to the brand and industry
            query = f'"{industry}" keywords trends "{brand_name}"'
            results = await loop.run_in_executor(
                None,
                self._search_sync,
                query,
                max_results
            )
            return results
        except Exception as e:
            print(f"Error in keyword search: {e}")
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
    
    def _normalize_domain(self, domain: str) -> str:
        """
        Normalize domain for comparison (lowercase, no www).
        
        Args:
            domain: Domain name
            
        Returns:
            Normalized domain string
        """
        if not domain:
            return ""
        domain = domain.lower().strip()
        if domain.startswith('www.'):
            domain = domain[4:]
        return domain
    
    def _get_favicon_url(self, domain: str) -> str:
        """
        Get favicon URL for a domain.
        
        Args:
            domain: Domain name
            
        Returns:
            Favicon URL
        """
        if not domain:
            return ""
        # Use Google's favicon service
        return f"https://www.google.com/s2/favicons?domain={domain}&sz=64"
    
    async def get_search_context(
        self,
        brand_name: str,
        domain: str,
        industry: str,
        key_terms: Optional[str] = None,
        description: str = "",
        services: str = "",
        country: str = "ES",
        language: str = "es"
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
            country: User's country code (e.g., 'ES', 'US')
            language: User's language code (e.g., 'es', 'en')
            
        Returns:
            Dictionary with all search context data
        """
        if not self.enabled:
            print("Web search disabled - skipping real data gathering")
            return {
                "enabled": False,
                "message": "Web search is disabled. Install duckduckgo-search to enable."
            }
        
        print(f"Gathering web search context for: {brand_name} (Loc: {country}, Lang: {language})")
        
        # Perform searches in parallel
        keyword_results, competitor_results, mention_results, industry_results = await asyncio.gather(
            self.search_keywords(brand_name, industry, max_results=10),
            self.search_competitors(
                brand_name, 
                industry, 
                domain=domain, 
                description=description, 
                services=services, 
                max_results=5,
                country=country,
                language=language
            ),
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
