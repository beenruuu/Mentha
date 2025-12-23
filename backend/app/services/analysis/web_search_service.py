"""
Web Search Service - Wrapper for web search and business info extraction.
Uses Firecrawl for web search and LLM for entity extraction.
"""
import logging
from typing import Dict, Any, List, Optional
from app.services.firecrawl_service import FirecrawlService
from app.services.llm.llm_service import LLMService, LLMServiceFactory

logger = logging.getLogger(__name__)


class WebSearchService:
    """
    Service for web search operations and business info extraction.
    Wraps Firecrawl for search and uses LLM for intelligent extraction.
    """
    
    def __init__(self):
        self.firecrawl = FirecrawlService()
        self.llm_service: Optional[LLMService] = None
    
    def set_llm_service(self, llm_service: LLMService):
        """Set the LLM service to use for extraction."""
        self.llm_service = llm_service
    
    async def infer_business_info_from_page(
        self,
        url: str,
        page_title: str = "",
        page_description: str = "",
        page_content: str = ""
    ) -> Dict[str, Any]:
        """
        Infer business information from page content using LLM.
        
        Returns:
            Dictionary with entity_type, industry, services, business_scope, etc.
        """
        # If no LLM service, return basic defaults
        if not self.llm_service:
            logger.warning("No LLM service configured, using defaults")
            return self._extract_basic_info(page_title, page_description)
        
        try:
            # Build prompt for business info extraction
            prompt = f"""Analyze this webpage and extract business information.

URL: {url}
Title: {page_title}
Description: {page_description}
Content Preview: {page_content[:3000] if page_content else 'N/A'}

Extract and return a JSON object with:
- entity_type: "business" | "media" | "ecommerce" | "saas" | "agency" | "nonprofit" | "government" | "personal"
- industry: The main industry/sector (e.g., "Technology", "Healthcare", "Finance", "Marketing", "Legal", "Education")
- industry_specific: More specific industry niche if applicable (e.g., "AI Software", "Family Law", "K-12 Education")
- services: Array of 3-5 main services or products offered
- company_type: "B2B" | "B2C" | "B2B2C" based on target audience
- target_market: Primary country/region target (e.g., "Spain", "United States", "Latin America")
- city: If the business mentions a specific city/location (empty if not mentioned)
- business_scope: "local" | "regional" | "national" | "international" based on service area mentioned
- target_audience: Brief description of target audience
- unique_value: One sentence describing unique value proposition

Analyze carefully:
- If the page mentions serving only one city/location → business_scope = "local"
- If multiple cities in one country/state → business_scope = "regional"
- If entire country → business_scope = "national"
- If multiple countries → business_scope = "international"

Return ONLY valid JSON, no markdown or explanation."""

            response = await self.llm_service.generate_json(
                prompt=prompt,
                model="gpt-4o-mini",
                max_tokens=600
            )
            
            if response and response.text:
                import json
                try:
                    data = json.loads(response.text)
                    return {
                        "entity_type": data.get("entity_type", "business"),
                        "industry": data.get("industry", "Services"),
                        "industry_specific": data.get("industry_specific", ""),
                        "services": data.get("services", []),
                        "company_type": data.get("company_type", ""),
                        "target_market": data.get("target_market", ""),
                        "city": data.get("city", ""),
                        "business_scope": data.get("business_scope", "national"),
                        "target_audience": data.get("target_audience", ""),
                        "unique_value": data.get("unique_value", "")
                    }
                except json.JSONDecodeError:
                    logger.error("Failed to parse LLM response as JSON")
                    
        except Exception as e:
            logger.error(f"Error inferring business info: {e}")
        
        return self._extract_basic_info(page_title, page_description)
    
    def _extract_basic_info(self, title: str, description: str) -> Dict[str, Any]:
        """Extract basic info without LLM (fallback)."""
        # Simple keyword-based classification
        text = f"{title} {description}".lower()
        
        entity_type = "business"
        if any(w in text for w in ["news", "blog", "magazine", "media"]):
            entity_type = "media"
        elif any(w in text for w in ["shop", "store", "buy", "cart", "ecommerce"]):
            entity_type = "ecommerce"
        elif any(w in text for w in ["saas", "software", "platform", "app"]):
            entity_type = "saas"
        elif any(w in text for w in ["agency", "consulting", "services"]):
            entity_type = "agency"
        
        return {
            "entity_type": entity_type,
            "industry": "Services",
            "services": [],
            "target_audience": "",
            "unique_value": ""
        }
    
    async def get_search_context(
        self,
        brand_name: str,
        domain: str,
        industry: str = "",
        description: str = "",
        services: str = "",
        country: str = "ES",
        language: str = "es"
    ) -> Dict[str, Any]:
        """
        Get search context including competitors, keywords, and mentions.
        
        Returns:
            Dictionary with competitor_results, keyword_results, mention_results, etc.
        """
        results = {
            "enabled": True,
            "competitor_results": [],
            "keyword_results": [],
            "mention_results": [],
            "industry_results": []
        }
        
        try:
            # 1. Search for competitors
            competitor_query = f"{industry} companies like {brand_name}" if industry else f"competitors of {brand_name}"
            if language == "es":
                competitor_query = f"empresas de {industry} como {brand_name}" if industry else f"competidores de {brand_name}"
            
            comp_results = await self.firecrawl.search_web(
                query=competitor_query,
                limit=10,
                lang=language,
                country=country.lower()
            )
            
            if comp_results.get("success") and comp_results.get("data"):
                for r in comp_results["data"]:
                    # Filter out the brand itself and common non-competitors
                    result_domain = self._extract_domain(r.get("url", ""))
                    if domain not in result_domain and result_domain not in domain:
                        results["competitor_results"].append({
                            "name": r.get("title", "").split(" - ")[0].split(" | ")[0].strip(),
                            "domain": result_domain,
                            "url": r.get("url"),
                            "snippet": r.get("description", "")[:200]
                        })
            
            # 2. Search for industry keywords
            keyword_query = f"best {industry} services" if industry else f"{brand_name} industry trends"
            if language == "es":
                keyword_query = f"mejores servicios de {industry}" if industry else f"tendencias {brand_name}"
            
            kw_results = await self.firecrawl.search_web(
                query=keyword_query,
                limit=5,
                lang=language,
                country=country.lower()
            )
            
            if kw_results.get("success") and kw_results.get("data"):
                for r in kw_results["data"]:
                    results["keyword_results"].append({
                        "title": r.get("title", ""),
                        "url": r.get("url"),
                        "description": r.get("description", "")
                    })
            
            # 3. Search for brand mentions
            mention_query = f'"{brand_name}" reviews OR mentions'
            mention_results = await self.firecrawl.search_web(
                query=mention_query,
                limit=5,
                lang=language,
                country=country.lower()
            )
            
            if mention_results.get("success") and mention_results.get("data"):
                for r in mention_results["data"]:
                    result_domain = self._extract_domain(r.get("url", ""))
                    if domain not in result_domain:
                        results["mention_results"].append({
                            "title": r.get("title", ""),
                            "url": r.get("url"),
                            "description": r.get("description", "")
                        })
            
            logger.info(f"[WebSearch] Found {len(results['competitor_results'])} competitors, "
                       f"{len(results['keyword_results'])} keywords, "
                       f"{len(results['mention_results'])} mentions")
            
        except Exception as e:
            logger.error(f"Error getting search context: {e}")
            results["enabled"] = False
            results["error"] = str(e)
        
        return results
    
    async def search_competitors(
        self,
        brand_name: str,
        industry: str = "",
        domain: str = "",
        description: str = "",
        services: Optional[List[str]] = None,
        country: str = "ES",
        language: str = "es",
        max_results: int = 10,
        business_scope: str = "national",
        city: str = "",
        industry_specific: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Search for competitors with advanced filtering.
        
        Args:
            brand_name: Brand name to find competitors for
            industry: Industry category
            domain: Brand's domain (to exclude from results)
            description: Brand description for context
            services: List of services to match
            country: Country code
            language: Language code
            max_results: Maximum results to return
            business_scope: "local" | "regional" | "national" | "global"
            city: City name for local searches
            industry_specific: Whether to focus on exact industry match
        """
        competitors = []
        
        # Check if Firecrawl is configured
        if not self.firecrawl.api_key:
            logger.warning("[WebSearch] FIRECRAWL_API_KEY not configured - cannot search for competitors")
            return []
        
        try:
            # Build search query based on scope
            if business_scope == "local" and city:
                query = f"{industry} {city}" if industry else f"empresas en {city}"
                if language == "es":
                    query = f"{industry} en {city}" if industry else f"negocios en {city}"
            elif business_scope == "regional" and city:
                query = f"mejores {industry} cerca de {city}" if language == "es" else f"best {industry} near {city}"
            else:
                query = f"mejores empresas de {industry}" if language == "es" else f"top {industry} companies"
            
            # Add services context if available
            if services and len(services) > 0:
                services_str = ", ".join(services[:3])
                query += f" {services_str}"
            
            logger.info(f"[WebSearch] Searching competitors with query: {query}")
            
            results = await self.firecrawl.search_web(
                query=query,
                limit=max_results * 2,  # Get extra to filter
                lang=language,
                country=country.lower()
            )
            
            logger.info(f"[WebSearch] Firecrawl result: success={results.get('success')}, data_count={len(results.get('data', []))}")
            
            if results.get("success") and results.get("data"):
                seen_domains = set()
                domain_clean = self._extract_domain(domain).lower()
                
                for r in results["data"]:
                    comp_domain = self._extract_domain(r.get("url", ""))
                    comp_domain_clean = comp_domain.lower()
                    
                    # Skip own domain and duplicates
                    if domain_clean in comp_domain_clean or comp_domain_clean in domain_clean:
                        continue
                    if comp_domain_clean in seen_domains:
                        continue
                    
                    # Skip common non-competitor domains
                    skip_domains = [
                        "wikipedia", "linkedin", "facebook", "twitter", "instagram",
                        "youtube", "amazon", "google", "bing", "yahoo", "pinterest",
                        "reddit", "quora", "indeed", "glassdoor", "infojobs"
                    ]
                    if any(skip in comp_domain_clean for skip in skip_domains):
                        continue
                    
                    seen_domains.add(comp_domain_clean)
                    
                    name = r.get("title", "").split(" - ")[0].split(" | ")[0].strip()
                    
                    competitors.append({
                        "name": name,
                        "domain": comp_domain,
                        "url": r.get("url"),
                        "description": r.get("description", "")[:300],
                        "source": "web_search",
                        "confidence": "medium"
                    })
                    
                    if len(competitors) >= max_results:
                        break
            
            logger.info(f"[WebSearch] Found {len(competitors)} competitors for {brand_name}")
            
        except Exception as e:
            logger.error(f"Error searching competitors: {e}")
        
        return competitors
    
    def _extract_domain(self, url: str) -> str:
        """Extract domain from URL."""
        if not url:
            return ""
        try:
            from urllib.parse import urlparse
            parsed = urlparse(url)
            domain = parsed.netloc or parsed.path.split("/")[0]
            if domain.startswith("www."):
                domain = domain[4:]
            return domain
        except:
            return url


# Singleton getter
_web_search_service = None

def get_web_search_service() -> WebSearchService:
    global _web_search_service
    if _web_search_service is None:
        _web_search_service = WebSearchService()
    return _web_search_service
