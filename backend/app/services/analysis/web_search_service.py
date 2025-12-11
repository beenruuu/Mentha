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
import httpx  # For URL validation
from app.core.config import settings


# =============================================================================
# ANSI Color Codes for Terminal Output
# =============================================================================
class Colors:
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN = "\033[96m"
    WHITE = "\033[97m"
    BOLD = "\033[1m"
    RESET = "\033[0m"


def log_info(emoji: str, message: str):
    """Log info message with emoji and cyan color."""
    print(f"{Colors.CYAN}{emoji} {message}{Colors.RESET}")


def log_success(emoji: str, message: str):
    """Log success message with emoji and green color."""
    print(f"{Colors.GREEN}{emoji} {message}{Colors.RESET}")


def log_error(emoji: str, message: str):
    """Log error message with emoji and red color."""
    print(f"{Colors.RED}{emoji} {message}{Colors.RESET}")


def log_warning(emoji: str, message: str):
    """Log warning message with emoji and yellow color."""
    print(f"{Colors.YELLOW}{emoji} {message}{Colors.RESET}")


try:
    from ddgs import DDGS
except ImportError:
    DDGS = None
    log_warning("⚠️", "ddgs not installed. Web search will be disabled.")


# Comprehensive exclusion list - sites that are never competitors
EXCLUDED_DOMAINS = {
    # Social media and user-generated content
    'wikipedia.org', 'linkedin.com', 'facebook.com', 'twitter.com', 'instagram.com',
    'youtube.com', 'reddit.com', 'quora.com', 'tiktok.com', 'pinterest.com', 'x.com',
    # Search engines
    'google.com', 'google.es', 'bing.com', 'duckduckgo.com', 'yahoo.com', 'yandex.ru',
    # E-commerce giants
    'amazon.com', 'amazon.es', 'ebay.com', 'ebay.es', 'aliexpress.com',
    # Job boards
    'indeed.com', 'infojobs.net', 'glassdoor.com', 'jobatus.es', 'monster.es',
    # News and press portals (NOT competitors)
    'guiadeprensa.com', 'eleconomista.es', 'cincodias.com', 'expansion.com',
    'larazon.es', 'abc.es', 'elmundo.es', 'elpais.com', 'europapress.es',
    'lavanguardia.com', 'elconfidencial.com', 'eldiario.es', '20minutos.es',
    'xataka.com', 'genbeta.com', 'applesfera.com', 'motorpasion.com',
    'webirix.com', 'smediabusiness.com', 'blog.doctorsim.com',
    'researchgate.net', 'businessmodelanalyst.com',
    # Business directories (NOT competitors)
    'empresite.eleconomista.es', 'einforma.com', 'axesor.es', 'infocif.es',
    'paginasamarillas.es', 'cylex.es', 'europages.es', 'kompass.com',
    'yelp.com', 'yelp.es', 'tripadvisor.com', 'tripadvisor.es', 'foursquare.com',
    'trustpilot.com', 'google.com/maps', 'maps.google.com',
    # Food delivery / aggregators (NOT restaurant competitors)
    'justeat.es', 'just-eat.es', 'glovo.com', 'ubereats.com', 'deliveroo.es',
    'pedidosya.es', 'thefork.es', 'eltenedor.es', 'opentable.com',
    # Generic platforms
    'whatsapp.com', 'play.google.com', 'apps.apple.com', 'microsoft.com',
    'windows.com', 'store.steampowered.com', 'telegram.org',
    # Booking platforms (NOT hotel competitors)
    'booking.com', 'expedia.com', 'hotels.com', 'airbnb.com', 'vrbo.com',
}


class WebSearchService:
    """Service for performing web searches to gather real market data."""
    
    def __init__(self, llm_service=None):
        """Initialize the web search service."""
        # Enable if any provider is available (DuckDuckGo, Tavily, Serper)
        self.web_provider = settings.WEB_SEARCH_PROVIDER.lower().strip() if settings.WEB_SEARCH_PROVIDER else "duckduckgo"
        self.tavily_api_key = settings.TAVILY_API_KEY
        self.serper_api_key = settings.SERPER_API_KEY

        self.enabled = bool(DDGS or self.tavily_api_key or self.serper_api_key)
        self.llm_service = llm_service
        log_info("🌐", f"Web search provider set to {self.web_provider} (tavily_key={'yes' if self.tavily_api_key else 'no'}, serper_key={'yes' if self.serper_api_key else 'no'})")

        if not self.enabled:
            log_warning("🔍❌", "Web search is disabled. Install duckduckgo-search or set Tavily/Serper keys to enable.")
    
    def set_llm_service(self, llm_service):
        """Set the LLM service for AI-powered filtering."""
        self.llm_service = llm_service
    
    async def _validate_url_accessibility(self, url: str, timeout: int = 5) -> bool:
        """
        Validate if a URL is accessible and returns a 200 OK status.
        Uses a lightweight HTTP HEAD/GET request.
        """
        if not url:
            return False
            
        # Ensure scheme
        if not url.startswith('http'):
            url = 'https://' + url
            
        try:
            # Use a real browser User-Agent to avoid being blocked
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5"
            }
            
            async with httpx.AsyncClient(verify=False, follow_redirects=True, timeout=timeout, headers=headers) as client:
                # Try HEAD first (lighter)
                try:
                    response = await client.head(url)
                    if 200 <= response.status_code < 400:
                        return True
                except Exception:
                    pass # Fallback to GET
                
                # Fallback to GET (some servers block HEAD)
                response = await client.get(url)
                return 200 <= response.status_code < 400
        except Exception as e:
            # log_warning("🌐⚠️", f"URL validation failed for {url}: {e}")
            return False

    def _is_excluded_domain(self, domain: str) -> bool:
        """
        Check if a domain should be excluded from competitor results.
        Uses both exact match and suffix match for subdomains.
        """
        if not domain:
            return True
        
        domain_lower = domain.lower().strip()
        
        # Direct match
        if domain_lower in EXCLUDED_DOMAINS:
            return True
        
        # Check if it's a subdomain of excluded domains
        for excluded in EXCLUDED_DOMAINS:
            if domain_lower.endswith('.' + excluded):
                return True
            # Also check without www
            if domain_lower == excluded or domain_lower == 'www.' + excluded:
                return True
        
        return False

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
            log_error("🤖❌", f"Could not initialize LLM service: {e}")
        
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
    "industry": "Industria Principal",
    "industry_specific": "Descripción específica del negocio",
    "business_scope": "local|regional|national|international",
    "city": "Ciudad si aplica",
    "services": ["servicio1", "servicio2"],
    "company_type": "B2B|B2C|B2B2C",
    "target_market": "mercado objetivo"
}}

REGLAS PARA "industry":
- Usa UN solo término genérico en Title Case
- Ejemplos: "Tecnología", "Hostelería", "Salud", "Educación"

REGLAS PARA "industry_specific":
- Descripción detallada del tipo de negocio
- Ejemplos: "reparación de móviles y tablets", "pizzería italiana", "clínica dental"
- Usar minúsculas, máximo 5-6 palabras

REGLAS CRÍTICAS PARA "business_scope":

NEGOCIOS QUE SON SIEMPRE "local" POR DEFECTO (a menos que indiquen claramente múltiples sedes):
- Reparación de móviles/tablets/electrónica → LOCAL
- Talleres de reparación (coches, electrodomésticos) → LOCAL
- Restaurantes, bares, cafeterías → LOCAL
- Peluquerías, estéticas, spas → LOCAL
- Clínicas dentales, médicas, veterinarias → LOCAL
- Tiendas físicas pequeñas → LOCAL
- Gimnasios independientes → LOCAL
- Servicios a domicilio (fontanería, electricidad, limpieza) → LOCAL

SOLO MARCAR COMO "national/international" SI:
- Tiene claramente múltiples tiendas/sedes en diferentes ciudades
- Menciona "envío a toda España" o similar
- Es una marca famosa conocida (El Corte Inglés, MediaMarkt, etc.)
- Tiene presencia online sin tienda física (e-commerce puro)

SI HAY DUDA → ASUMIR "local" (es más seguro para competidores)

REGLAS PARA "city":
- OBLIGATORIO intentar extraer la ciudad del contenido
- Buscar en: dirección física, teléfono con prefijo, menciones de ciudad/barrio
- Si el dominio es .es y parece negocio local pero no hay ciudad → dejar vacío pero marcar como local
- Si encuentra dirección física → SIEMPRE es local

DEFINICIONES DE ENTITY_TYPE:
- business: Vende productos o servicios comerciales
- media: Periódico, revista, portal de noticias
- institution: Gobierno, universidad, ONG
- blog: Blog personal o temático no comercial
- other: No encaja en los anteriores
"""


        try:
            response = await llm.generate_text(
                prompt=prompt,
                model="gpt-5-chat-latest",
                max_tokens=500,
                temperature=0
            )
            
            # Parse JSON response
            import re
            response_text = response.text.strip()
            json_match = re.search(r'\{[^{}]*\}', response_text, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                
                # POST-AI HEURISTICS: Force local scope for service-based businesses
                result = self._apply_local_business_heuristics(result, url)
                
                log_info("📊", f"Business info inferred: scope={result.get('business_scope')}, city={result.get('city')}, type={result.get('industry_specific')}")
                return result
            
        except Exception as e:
            log_error("📄❌", f"Error inferring business info: {e}")
        
        return {
            "entity_type": "business",
            "industry": "Services",
            "industry_specific": "",
            "business_scope": "national",
            "city": "",
            "services": [],
            "company_type": "unknown",
            "target_market": "unknown"
        }
    
    def _apply_local_business_heuristics(self, result: Dict[str, Any], url: str) -> Dict[str, Any]:
        """
        Apply heuristics to force local scope for certain business types.
        Service-based businesses are almost always local unless proven otherwise.
        """
        industry_specific = result.get("industry_specific", "").lower()
        industry = result.get("industry", "").lower()
        current_scope = result.get("business_scope", "national")
        
        # Keywords that indicate LOCAL businesses (repair, personal services, food)
        local_keywords = [
            # Repair services
            "reparación", "reparacion", "repair", "arreglo", "fix", "taller",
            "servicio técnico", "servicio tecnico", "sat", "mantenimiento",
            # Electronics repair
            "móvil", "movil", "tablet", "ordenador", "pantalla", "iphone", "samsung",
            # Personal services
            "peluquería", "peluqueria", "barbería", "barberia", "estética", "estetica",
            "spa", "masaje", "manicura", "pedicura",
            # Health services
            "clínica", "clinica", "dental", "veterinario", "veterinaria", "fisio",
            "podólogo", "podologo", "óptica", "optica",
            # Food services
            "restaurante", "pizzería", "pizzeria", "bar", "cafetería", "cafeteria",
            "panadería", "panaderia", "pastelería", "pasteleria",
            # Home services
            "fontanero", "electricista", "cerrajero", "pintor", "carpintero",
            "limpieza", "mudanza", "reformas",
            # Auto services
            "taller mecánico", "taller mecanico", "lavadero", "autolavado",
        ]
        
        # Check if the business matches local keywords
        combined_text = f"{industry_specific} {industry}"
        is_service_business = any(kw in combined_text for kw in local_keywords)
        
        # If it's a service business and currently marked as national, override to local
        if is_service_business and current_scope in ["national", "international"]:
            log_info("🏠", f"Heuristic override: '{industry_specific}' → forcing scope to LOCAL")
            result["business_scope"] = "local"
        
        return result



    async def _filter_competitors_with_ai(
        self,
        candidates: List[Dict[str, Any]],
        brand_name: str,
        industry: str,
        description: str = "",
        entity_type: str = "business"
    ) -> List[Dict[str, Any]]:
        """
        Use AI to filter search results, identify real competitors, and extract correct company names.
        """
        if not candidates:
            return []
        
        llm = await self._get_llm_service()
        if not llm:
            return candidates[:5]
        
        # Build prompt for AI filtering
        candidates_text = "\n".join([
            f"{i+1}. Dominio: {c.get('domain', 'N/A')} | Título: {c.get('name', 'Unknown')} | Snippet: {c.get('snippet', '')[:150]}"
            for i, c in enumerate(candidates[:15])
        ])
        
        # Adjust criteria based on entity type
        criteria = ""
        if entity_type == 'media':
            criteria = "INCLUIR: periódicos, revistas digitales, portales de noticias. EXCLUIR: tiendas, blogs personales."
        elif entity_type == 'institution':
            criteria = "INCLUIR: organismos similares, universidades, asociaciones. EXCLUIR: empresas comerciales."
        else:
            criteria = "INCLUIR: empresas que venden lo mismo o servicios sustitutivos. EXCLUIR: periódicos, Wikipedia, directorios."

        prompt = f"""Analiza estos resultados de búsqueda y extrae SOLO los competidores directos reales.

MARCA A ANALIZAR:
- Nombre: {brand_name}
- Tipo: {entity_type.upper()}
- Industria: {industry}
- Descripción: {description or 'No disponible'}

RESULTADOS:
{candidates_text}

TAREA: 
1. Identifica SOLO los competidores directos ({criteria})
2. Para cada uno, extrae el NOMBRE REAL de la empresa

Responde SOLO con un JSON array así:
[
  {{"index": 1, "name": "Nombre Real Empresa"}},
  {{"index": 4, "name": "Otra Empresa"}}
]

EXCLUIR OBLIGATORIAMENTE:
- Directorios de empresas (paginasamarillas, yelp, tripadvisor, google maps)
- Redes sociales (facebook, instagram, twitter)
- Agregadores de reseñas
- Blogs y medios de comunicación (xataka, webirix, blogs personales)
- Páginas de Wikipedia o similares
- Servicios de delivery (justeat, glovo, ubereats) - NO son competidores de restaurantes
- Portales de empleo
- Webs que no funcionan o están en construcción
- Artículos de "Top X empresas" o "Mejores X" (extrae las empresas mencionadas, NO el artículo)

SOLO INCLUIR:
- Empresas que venden EXACTAMENTE lo mismo
- Con web propia funcional (NO subdominios de blog)
- En el mismo mercado geográfico

IMPORTANTE sobre el nombre:
- Usa el nombre comercial/marca de la empresa
- Si el título es genérico, deduce el nombre del dominio
- Ejemplo: dominio "restaurantemario.com" → nombre "Restaurante Mario"
"""

        try:
            response = await llm.generate_text(
                prompt=prompt,
                model="gpt-5-chat-latest",
                max_tokens=300,
                temperature=0
            )
            
            import re
            # Try to parse JSON array with objects
            match = re.search(r'\[[\s\S]*?\]', response.text.strip())
            if match:
                results = json.loads(match.group())
                filtered = []
                for item in results:
                    idx = item.get('index', 0)
                    name = item.get('name', '')
                    if 0 < idx <= len(candidates) and name:
                        competitor = candidates[idx - 1].copy()
                        competitor['name'] = name  # Override with AI-extracted name
                        filtered.append(competitor)
                
                if filtered:
                    log_success("🎯✅", f"AI filtered {len(candidates)} candidates to {len(filtered)} competitors (Type: {entity_type})")
                    return filtered
            
            return candidates[:5]
            
        except Exception as e:
            log_warning("🎯⚠️", f"AI filtering failed: {e}, returning unfiltered results")
            return candidates[:5]

    async def _get_competitors_from_llm(
        self,
        brand_name: str,
        industry: str,
        description: str = "",
        services: str = "",
        country: str = "ES",
        language: str = "es",
        max_results: int = 10,
        business_scope: str = "national",
        city: str = "",
        industry_specific: str = ""
    ) -> List[Dict[str, Any]]:
        """
        Get competitors directly from LLM knowledge (no web search).
        The LLM knows about established companies from its training data.
        Now considers business_scope to find appropriately sized competitors.
        """
        llm = await self._get_llm_service()
        if not llm:
            return []
        
        lang_text = "español" if language == "es" else "English"
        country_text = f"en {country}" if country else ""
        
        # Use industry_specific if available, fallback to industry
        business_type = industry_specific if industry_specific else industry
        
        # Build scope-specific instructions
        scope_instructions = ""
        location_context = ""
        
        if business_scope == "local" and city:
            scope_instructions = f"""
IMPORTANTE - NEGOCIO LOCAL:
- Este es un negocio LOCAL que opera solo en {city}
- SOLO busca competidores que operen en {city} o alrededores
- NO incluir cadenas nacionales ni grandes empresas
- Busca tiendas/negocios pequeños similares en la misma zona
- Si no conoces competidores locales específicos en {city}, devuelve array vacío []
"""
            location_context = f" en {city}"
        elif business_scope == "regional" and city:
            scope_instructions = f"""
IMPORTANTE - NEGOCIO REGIONAL:
- Este negocio opera a nivel regional cerca de {city}
- Busca competidores regionales en la misma comunidad/provincia
- Puedes incluir algunas cadenas regionales pero no multinacionales
"""
            location_context = f" en la región de {city}"
        else:
            scope_instructions = """
NEGOCIO NACIONAL/INTERNACIONAL:
- Busca competidores a nivel nacional o internacional
- Puedes incluir grandes empresas y cadenas conocidas
"""
        
        prompt = f"""Eres un experto en análisis de mercado. Dame los principales competidores de esta empresa.

EMPRESA:
- Nombre: {brand_name}
- Tipo de negocio: {business_type}
- Industria: {industry}
- Descripción: {description or 'No disponible'}
- Servicios: {services or 'No especificados'}
- País: {country}
- Alcance: {business_scope.upper()}
- Ciudad: {city or 'No especificada'}

{scope_instructions}

TAREA: Lista los {max_results} principales competidores directos{location_context}.

Responde SOLO con un JSON array así:
[
  {{"name": "Nombre Empresa", "domain": "empresa.com", "reason": "Por qué es competidor"}},
  {{"name": "Otra Empresa", "domain": "otra.com", "reason": "Razón"}}
]

REGLAS CRÍTICAS:
- Solo empresas REALES que EXISTAN actualmente con web FUNCIONAL
- El dominio debe ser el dominio REAL y PRINCIPAL de la empresa (NO subdominios, NO páginas de Facebook/Instagram)
- Competidores DIRECTOS que ofrezcan los MISMOS productos/servicios
- NO incluir: redes sociales, directorios, páginas de reseñas, agregadores
- Verifica que la empresa tenga presencia web real antes de incluirla
- Responde en {lang_text}
- IMPORTANTE: Si no estás 100% seguro de que el dominio existe, NO lo incluyas. Prefiero menos resultados pero que funcionen.
- NO inventes dominios (ej: no pongas "reparacionmovilesmalaga.com" si no existe).
- Si es un negocio LOCAL y no conoces competidores específicos de esa ciudad, devuelve array vacío []"""


        try:
            response = await llm.generate_text(
                prompt=prompt,
                model="gpt-5-chat-latest",
                max_tokens=800,
                temperature=0.3
            )
            
            import re
            match = re.search(r'\[[\s\S]*?\]', response.text.strip())
            if match:
                results = json.loads(match.group())
                competitors = []
                for item in results:
                    name = item.get('name', '')
                    domain = item.get('domain', '')
                    if name and domain:
                        # Clean domain
                        domain = domain.lower().strip()
                        if domain.startswith('http'):
                            from urllib.parse import urlparse
                            domain = urlparse(domain).netloc
                        if domain.startswith('www.'):
                            domain = domain[4:]
                        
                        # Skip excluded domains (LLM might suggest aggregators)
                        if self._is_excluded_domain(domain):
                            log_warning("🧠⚠️", f"Skipping excluded domain from LLM: {domain}")
                            continue
                        
                        competitors.append({
                            'name': name,
                            'domain': domain,
                            'snippet': item.get('reason', ''),
                            'favicon': self._get_favicon_url(domain),
                            'source': 'llm_knowledge',
                            'confidence': 'high'
                        })
                
                log_success("🧠✅", f"LLM found {len(competitors)} competitors from knowledge base")
                return competitors
            
            return []
            
        except Exception as e:
            log_error("🧠❌", f"LLM competitor search failed: {e}")
            return []

    async def _get_competitors_from_web_search(
        self,
        brand_name: str,
        industry: str,
        domain: str = "",
        description: str = "",
        services: str = "",
        entity_type: str = "business",
        country: str = "ES",
        language: str = "es",
        max_results: int = 10,
        business_scope: str = "national",
        city: str = "",
        industry_specific: str = ""
    ) -> List[Dict[str, Any]]:
        """
        Get competitors from DuckDuckGo web search + AI validation.
        Now considers business_scope to generate appropriate queries.
        """
        if not self.enabled:
            return []
        
        try:
            
            # Parse services
            service_list = []
            if isinstance(services, str) and services:
                service_list = [s.strip() for s in services.split(',') if s.strip()]
            elif isinstance(services, list):
                service_list = services
            
            # Use industry_specific if available for more precise searches
            search_term = industry_specific if industry_specific else industry
            
            # Build localized queries based on entity type AND business scope
            queries = []
            
            # Localization helpers - adjust based on scope
            if business_scope == "local" and city:
                loc_suffix = f" {city}"
            elif business_scope == "regional" and city:
                loc_suffix = f" {city} región"
            else:
                loc_suffix = f" {country}" if country else ""
            
            # Language-specific terms
            terms = {
                "es": {
                    "news": "noticias", "digital_papers": "diarios digitales", "magazines": "revistas",
                    "orgs": "organismos", "associations": "asociaciones", "companies": "empresas",
                    "competitors": "competidores", "similar": "similar a", "alternatives": "alternativas a",
                    "vs": "vs", "best": "mejores", "stores": "tiendas", "near": "cerca de",
                    "local": "local", "zone": "zona"
                },
                "en": {
                    "news": "news", "digital_papers": "digital newspapers", "magazines": "magazines",
                    "orgs": "organizations", "associations": "associations", "companies": "companies",
                    "competitors": "competitors", "similar": "similar to", "alternatives": "alternatives to",
                    "vs": "vs", "best": "best", "stores": "stores", "near": "near",
                    "local": "local", "zone": "area"
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
                # Business queries - ADJUSTED FOR SCOPE
                if business_scope == "local" and city:
                    # LOCAL BUSINESS: Very specific local searches
                    queries.append(f'{search_term} {city}')
                    queries.append(f'{t["stores"]} {search_term} {city}')
                    queries.append(f'{search_term} {t["near"]} {city}')
                    queries.append(f'{t["best"]} {search_term} {city}')
                    if service_list:
                        for service in service_list[:2]:
                            queries.append(f'{service} {city}')
                    # Don't add generic "similar to" queries for local - they return national results
                    log_info("🔍📍", f"Using LOCAL search strategy for {brand_name} in {city}")
                    
                elif business_scope == "regional" and city:
                    # REGIONAL BUSINESS: Include region/province
                    queries.append(f'{search_term} {city}')
                    queries.append(f'{t["companies"]} {search_term} {city} región')
                    if service_list:
                        for service in service_list[:2]:
                            queries.append(f'{service} {city}')
                    queries.append(f'{t["similar"]} {brand_name}')
                    log_info("🔍🗺️", f"Using REGIONAL search strategy for {brand_name} near {city}")
                    
                else:
                    # NATIONAL/INTERNATIONAL: Original broad strategy
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
                    log_info("🔍🌍", f"Using NATIONAL/INTERNATIONAL search strategy for {brand_name}")
            
            # Fallback
            if not queries:
                queries = [f'{brand_name} {t["competitors"]}', f'{t["similar"]} {brand_name}']
            
            # Add negative terms to exclude blogs and articles
            # Simplified query to avoid DuckDuckGo "No results" errors
            # We rely on post-filtering for strict exclusions
            queries = [f'{q} -site:wikipedia.org' for q in queries]

            log_info("🔍🏢", f"Competitor search queries (Type: {entity_type}, Scope: {business_scope}, Loc: {city or country}): {queries}")

            
            all_candidates = []
            seen_domains: Set[str] = set()
            
            if domain:
                seen_domains.add(self._normalize_domain(domain))
            
            brand_lower = brand_name.lower().replace(' ', '')
            
            for query in queries:
                results = await self._search(query, 25)
                
                for result in results:
                    link = result.get('href', '')
                    extracted_domain = self._extract_domain(link)
                    normalized = self._normalize_domain(extracted_domain)
                    
                    if normalized in seen_domains:
                        continue
                        
                    # Skip self
                    if brand_lower in normalized.replace('.', '').replace('-', ''):
                        continue

                    # Pre-filter excluded domains (directories, social media, delivery apps, etc.)
                    if self._is_excluded_domain(extracted_domain):
                        continue
                    
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
                
                if len(all_candidates) >= 40: # Increased candidate pool from 20
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
            log_error("🏢❌", f"Error in web search competitor discovery: {e}")
            return []

    async def search_competitors(
        self, 
        brand_name: str, 
        industry: str,
        domain: str = "",
        description: str = "",
        services: str = "",
        max_results: int = 10,
        entity_type: str = "business",
        country: str = "ES",
        language: str = "es",
        business_scope: str = "national",
        city: str = "",
        industry_specific: str = ""
    ) -> List[Dict[str, Any]]:
        """
        Search for competitors using multiple sources and combine results.
        
        Sources:
        1. LLM Knowledge - Competitors the AI knows from training data (high confidence)
        2. Web Search - Real-time search via DuckDuckGo + AI validation (medium confidence)
        
        Each competitor is tagged with its source for analytics.
        Now considers business_scope for appropriately sized competitor suggestions.
        """
        log_info("🔍🚀", f"Starting multi-source competitor discovery for: {brand_name} (scope: {business_scope}, city: {city})")
        
        # Run both searches in parallel
        llm_results, web_results = await asyncio.gather(
            self._get_competitors_from_llm(
                brand_name=brand_name,
                industry=industry,
                description=description,
                services=services,
                country=country,
                language=language,
                max_results=8,
                business_scope=business_scope,
                city=city,
                industry_specific=industry_specific
            ),
            self._get_competitors_from_web_search(
                brand_name=brand_name,
                industry=industry,
                domain=domain,
                description=description,
                services=services,
                entity_type=entity_type,
                country=country,
                language=language,
                max_results=8,
                business_scope=business_scope,
                city=city,
                industry_specific=industry_specific
            ),
            return_exceptions=True
        )

        
        # Handle exceptions
        if isinstance(llm_results, Exception):
            log_error("🧠❌", f"LLM search failed: {llm_results}")
            llm_results = []
        if isinstance(web_results, Exception):
            log_error("🔍❌", f"Web search failed: {web_results}")
            web_results = []
        
        # Merge results, avoiding duplicates by domain
        seen_domains: Set[str] = set()
        if domain:
            seen_domains.add(self._normalize_domain(domain))
        
        merged = []
        candidates_to_validate = []
        
        # Add LLM results first (higher confidence)
        for comp in llm_results:
            normalized = self._normalize_domain(comp.get('domain', ''))
            if normalized and normalized not in seen_domains:
                seen_domains.add(normalized)
                candidates_to_validate.append(comp)
        
        # Add web search results that aren't duplicates
        for comp in web_results:
            normalized = self._normalize_domain(comp.get('domain', ''))
            if normalized and normalized not in seen_domains:
                seen_domains.add(normalized)
                candidates_to_validate.append(comp)
        
        # Validate URLs in parallel
        log_info("🔍🛡️", f"Validating accessibility for {len(candidates_to_validate)} candidates...")
        
        validation_tasks = []
        for comp in candidates_to_validate:
            domain_url = comp.get('domain', '')
            if domain_url and not domain_url.startswith('http'):
                domain_url = f"https://{domain_url}"
            validation_tasks.append(self._validate_url_accessibility(domain_url))
            
        validation_results = await asyncio.gather(*validation_tasks)
        
        valid_count = 0
        for comp, is_valid in zip(candidates_to_validate, validation_results):
            if is_valid:
                merged.append(comp)
                valid_count += 1
            else:
                log_warning("🚫", f"Discarding inaccessible competitor: {comp.get('domain')}")

        log_success("🎯✅", f"Found {len(merged)} unique & valid competitors ({len(llm_results)} from LLM, {len(web_results)} from web search). Discarded {len(candidates_to_validate) - valid_count} invalid.")
        
        return merged[:max_results]
    
    def _extract_company_name(self, title: str, domain: str) -> str:
        """
        Extract a preliminary company name from search result title.
        This is just a fallback - the AI will provide the final correct name.
        """
        if not title:
            return self._domain_to_name(domain)
        
        # Just do basic cleanup - AI will fix the name later
        name = title.split('|')[0].strip()
        name = name.split(' - ')[0].strip()
        name = name.split(':')[0].strip()
        
        # If it looks like garbage, use domain
        if len(name) < 2 or len(name) > 60:
            return self._domain_to_name(domain)
        
        return name
    
    def _domain_to_name(self, domain: str) -> str:
        """Convert domain to a readable company name."""
        if not domain:
            return ""
        domain_name = domain.split('.')[0]
        if domain_name and len(domain_name) > 2:
            return domain_name.replace('-', ' ').replace('_', ' ').title()
        return ""

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
            log_error("📰❌", f"Error in brand mentions search: {e}")
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
            log_error("🔑❌", f"Error in keyword search: {e}")
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
            log_error("🏭❌", f"Error in industry search: {e}")
            return []
    
    async def _search(self, query: str, max_results: int) -> List[Dict[str, Any]]:
        """Run multi-provider search (Tavily + Serper + DuckDuckGo) and merge unique results."""

        tasks = []

        # Tavily
        if self.tavily_api_key:
            async def tavily_call():
                payload = {
                    "api_key": self.tavily_api_key,
                    "query": query,
                    "search_depth": "advanced",
                    "max_results": max_results,
                    "include_answer": False,
                }
                log_info("🌐", f"Using Tavily for query: {query}")
                async with httpx.AsyncClient(timeout=12) as client:
                    res = await client.post("https://api.tavily.com/search", json=payload)
                    res.raise_for_status()
                    data = res.json()
                    return [
                        {
                            "title": r.get("title", ""),
                            "href": r.get("url", ""),
                            "body": r.get("content", "") or r.get("snippet", ""),
                        }
                        for r in data.get("results", [])[:max_results]
                    ]
            tasks.append(tavily_call())

        # Serper (Google)
        if self.serper_api_key:
            async def serper_call():
                headers = {
                    "X-API-KEY": self.serper_api_key,
                    "Content-Type": "application/json",
                }
                payload = {"q": query, "num": max_results}
                log_info("🌐", f"Using Serper for query: {query}")
                async with httpx.AsyncClient(timeout=10) as client:
                    res = await client.post("https://google.serper.dev/search", headers=headers, json=payload)
                    res.raise_for_status()
                    data = res.json()
                    organic = data.get("organic", [])
                    return [
                        {
                            "title": r.get("title", ""),
                            "href": r.get("link", ""),
                            "body": r.get("snippet", "") or r.get("description", ""),
                        }
                        for r in organic[:max_results]
                    ]
            tasks.append(serper_call())

        # DuckDuckGo fallback (always add)
        async def ddg_call():
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(
                None,
                self._search_sync,
                query,
                max_results,
            )
        tasks.append(ddg_call())

        results: List[Dict[str, Any]] = []
        try:
            provider_results = await asyncio.gather(*tasks, return_exceptions=True)
            for res in provider_results:
                if isinstance(res, Exception):
                    log_warning("🌐⚠️", f"Search provider error: {res}")
                    continue
                results.extend(res or [])
        except Exception as e:
            log_error("🌐❌", f"Search failed: {e}")
            return []

        # Dedupe by href
        seen = set()
        deduped = []
        for r in results:
            href = r.get("href", "").strip()
            if href and href not in seen:
                seen.add(href)
                deduped.append(r)

        return deduped[:max_results]

    def _search_sync(self, query: str, max_results: int) -> List[Dict[str, Any]]:
        """Synchronous DuckDuckGo search (fallback)."""
        with DDGS() as ddgs:
            return list(ddgs.text(query, max_results=max_results))
    
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
            log_warning("🔍❌", "Web search disabled - skipping real data gathering")
            return {
                "enabled": False,
                "message": "Web search is disabled. Install duckduckgo-search to enable."
            }
        
        log_info("🌐🔍", f"Gathering web search context for: {brand_name} (Loc: {country}, Lang: {language})")
        
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
            log_error("🔑❌", f"Keyword search error: {keyword_results}")
            keyword_results = []
        if isinstance(competitor_results, Exception):
            log_error("🏢❌", f"Competitor search error: {competitor_results}")
            competitor_results = []
        if isinstance(mention_results, Exception):
            log_error("📰❌", f"Mention search error: {mention_results}")
            mention_results = []
        if isinstance(industry_results, Exception):
            log_error("🏭❌", f"Industry search error: {industry_results}")
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
        
        log_success("🌐✅", f"Search context gathered: {context['total_results']} total results")
        return context
