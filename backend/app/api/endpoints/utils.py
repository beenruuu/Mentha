from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from typing import List, Optional

from app.api.deps import get_current_user
from app.models.auth import UserProfile
import httpx
import logging
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

router = APIRouter()


class GeneratePromptsRequest(BaseModel):
    brand_name: str
    domain: str
    industry: Optional[str] = None
    description: Optional[str] = None
    competitors: Optional[str] = None
    location: Optional[str] = None
    language: str = "es"


class PromptItem(BaseModel):
    text: str
    type: str  # 'branded' or 'non-branded'


class GeneratePromptsResponse(BaseModel):
    prompts: List[PromptItem]


async def fetch_page_content(url: str) -> dict:
    """
    Fetch page HTML and extract metadata and main content.
    Returns dict with title, description, favicon, image, and main text content.
    """
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5,es;q=0.3"
    }
    
    async with httpx.AsyncClient(follow_redirects=True, timeout=30.0, headers=headers, verify=False) as client:
        response = await client.get(url)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Title
        title = soup.title.string if soup.title else ""
        if not title:
            og_title = soup.find("meta", property="og:title")
            title = og_title["content"] if og_title else ""

        # Description
        description = ""
        meta_desc = soup.find("meta", attrs={"name": "description"})
        if meta_desc:
            description = meta_desc.get("content", "")
        if not description:
            og_desc = soup.find("meta", property="og:description")
            description = og_desc["content"] if og_desc else ""

        # Favicon
        favicon = ""
        icon_link = soup.find("link", rel=lambda x: x and 'icon' in x.lower())
        if icon_link:
            favicon = urljoin(url, icon_link.get("href", ""))
        else:
            parsed_url = urlparse(url)
            favicon = f"{parsed_url.scheme}://{parsed_url.netloc}/favicon.ico"

        # OG Image
        image = ""
        og_image = soup.find("meta", property="og:image")
        if og_image:
            image = urljoin(url, og_image.get("content", ""))
        
        # Extract main text content for AI analysis
        # Remove script, style, nav, footer elements
        for element in soup(['script', 'style', 'nav', 'footer', 'header', 'aside', 'noscript']):
            element.decompose()
        
        # Get main content
        main_content = soup.find('main') or soup.find('article') or soup.find('body')
        text_content = ""
        if main_content:
            text_content = ' '.join(main_content.get_text(separator=' ', strip=True).split())[:2500]
        
        # Extract keywords meta tag
        keywords = ""
        meta_keywords = soup.find("meta", attrs={"name": "keywords"})
        if meta_keywords:
            keywords = meta_keywords.get("content", "")
        
        return {
            "url": url,
            "domain": urlparse(url).netloc,
            "title": title.strip() if title else "",
            "description": description.strip() if description else "",
            "favicon": favicon,
            "image": image,
            "text_content": text_content,
            "keywords": keywords
        }


@router.get("/metadata")
async def get_url_metadata(
    url: str = Query(..., description="The URL to fetch metadata from"),
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Fetch metadata (title, description, favicon, og:image) from a given URL.
    Requires authentication.
    """
    try:
        data = await fetch_page_content(url)
        # Return basic metadata (backwards compatible)
        return {
            "url": data["url"],
            "domain": data["domain"],
            "title": data["title"],
            "description": data["description"],
            "favicon": data["favicon"],
            "image": data["image"]
        }
    except httpx.RequestError as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing metadata: {str(e)}")


@router.get("/brand-info")
async def get_brand_info(
    url: str = Query(..., description="The URL to analyze"),
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Fetch metadata AND infer business information using AI.
    Uses deeper crawling if available.
    """
    from app.core.config import settings
    logger = logging.getLogger(__name__)

    try:
        # 1. Use Firecrawl for deeper context if API key is present
        crawled_content = ""
        page_data = None
        
        if settings.FIRECRAWL_API_KEY:
            try:
                from app.services.firecrawl_service import FirecrawlService
                firecrawl = FirecrawlService()
                
                # We do a limited crawl (top 3-5 pages) to get more than just the home page
                # but keep it fast enough for onboarding (timeout/limit)
                logger.info(f"[BrandInfo] Deep crawling {url}...")
                
                # For now, let's use search/scrape to find a few key pages or just a deeper scrape
                # Firecrawl 'scrape' with 'formats': ['markdown'] is already very good
                scrape_res = await firecrawl.scrape_url(url, max_age=86400)
                
                if scrape_res.get("success") and scrape_res.get("data"):
                    data = scrape_res["data"]
                    meta = data.get("metadata", {})
                    
                    page_data = {
                        "url": url,
                        "domain": urlparse(url).netloc,
                        "title": meta.get("title") or data.get("title") or "",
                        "description": meta.get("description") or data.get("description") or "",
                        "favicon": meta.get("favicon") or f"https://www.google.com/s2/favicons?sz=128&domain={urlparse(url).netloc}",
                        "image": meta.get("ogImage") or "",
                        "text_content": data.get("markdown", "")[:5000], # Increased limit for better context
                        "keywords": ""
                    }
                    crawled_content = page_data["text_content"]
                    logger.info("[BrandInfo] Firecrawl scrape successful")
            except Exception as e:
                logger.error(f"[BrandInfo] Firecrawl failed, falling back to basic fetch: {e}")

        # 2. Fallback to basic fetch if Firecrawl failed or not configured
        if not page_data:
            page_data = await fetch_page_content(url)
            crawled_content = page_data["text_content"]

        # 3. Use AI to infer business info from the richer context
        from app.services.analysis.web_search_service import WebSearchService
        web_service = WebSearchService()
        
        business_info = await web_service.infer_business_info_from_page(
            url=page_data["url"],
            page_title=page_data["title"],
            page_description=page_data["description"],
            page_content=crawled_content
        )
        
        # Determine location/scope
        location = business_info.get("target_market", "")
        domain = page_data["domain"]
        tld_countries = {
            ".es": "Spain", ".mx": "Mexico", ".ar": "Argentina", ".co": "Colombia",
            ".de": "Germany", ".fr": "France", ".it": "Italy", ".uk": "United Kingdom",
            ".us": "United States", ".br": "Brazil", ".pt": "Portugal"
        }
        for tld, country in tld_countries.items():
            if domain.endswith(tld):
                location = country
                break
        
        company_type = business_info.get("company_type", "").upper()
        business_model = "B2B" if company_type == "B2B" else "B2C" if company_type == "B2C" else company_type
        
        return {
            "url": page_data["url"],
            "domain": page_data["domain"],
            "title": page_data["title"],
            "description": page_data["description"],
            "favicon": page_data["favicon"],
            "image": page_data["image"],
            "industry": business_info.get("industry", "").strip().title(),
            "location": location,
            "services": business_info.get("services", []),
            "businessModel": business_model,
            "companyType": business_info.get("company_type", ""),
            "businessScope": business_info.get("business_scope", "national"),
            "city": business_info.get("city", ""),
            "industrySpecific": business_info.get("industry_specific", "")
        }
        
    except Exception as e:
        logger.error(f"[BrandInfo] Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))



@router.post("/generate-research-prompts", response_model=GeneratePromptsResponse)
async def generate_research_prompts(
    request: GeneratePromptsRequest,
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Generate personalized research prompts using AI based on brand info, industry, and competitors.
    Requires authentication.
    """
    try:
        from app.core.config import settings
        import openai
        import json
        
        client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        
        # Build context for the AI
        context_parts = [
            f"Marca: {request.brand_name}",
            f"Dominio: {request.domain}",
        ]
        if request.industry:
            context_parts.append(f"Sector/Industria: {request.industry}")
        if request.description:
            context_parts.append(f"Descripción: {request.description}")
        if request.competitors:
            context_parts.append(f"Competidores: {request.competitors}")
        if request.location:
            context_parts.append(f"Ubicación/País: {request.location}")
        
        context = "\n".join(context_parts)
        
        lang_instruction = "en español" if request.language == "es" else "in English"
        
        prompt = f"""Eres un experto en SEO y análisis de intención de búsqueda.

Genera 8-10 prompts de investigación personalizados para analizar la presencia online y posicionamiento de esta marca:

{context}

Los prompts deben ser:
1. Consultas que usuarios reales buscarían en Google
2. Relevantes para el sector/industria específico
3. Una mezcla de:
   - "branded": consultas que incluyen el nombre de la marca (ej: "marca opiniones", "marca precios")
   - "non-branded": consultas genéricas del sector sin mencionar la marca (ej: "mejores empresas de X", "servicios de X en ciudad")

Genera los prompts {lang_instruction}.

Responde SOLO con un JSON válido con este formato:
{{
  "prompts": [
    {{"text": "consulta de búsqueda aquí", "type": "branded"}},
    {{"text": "otra consulta", "type": "non-branded"}}
  ]
}}

Importante:
- Incluye al menos 3 prompts branded y 4 non-branded
- Los prompts deben ser específicos al sector, no genéricos
- Si hay competidores, incluye algunos prompts comparativos como "marca vs competidor"
- Piensa en diferentes intenciones: informacional, transaccional, comparativa"""

        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        
        # Validate and clean prompts
        prompts = []
        for p in result.get("prompts", []):
            if isinstance(p, dict) and "text" in p and "type" in p:
                prompt_type = p["type"] if p["type"] in ["branded", "non-branded"] else "non-branded"
                prompts.append(PromptItem(text=p["text"], type=prompt_type))
        
        return GeneratePromptsResponse(prompts=prompts)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        # Return fallback prompts on error
        fallback = [
            PromptItem(text=f"{request.brand_name} opiniones", type="branded"),
            PromptItem(text=f"{request.brand_name} precios", type="branded"),
            PromptItem(text=f"{request.brand_name} reviews", type="branded"),
            PromptItem(text=f"mejores empresas de {request.industry or 'servicios'}", type="non-branded"),
            PromptItem(text=f"{request.industry or 'servicios'} cerca de mi", type="non-branded"),
        ]
        return GeneratePromptsResponse(prompts=fallback)


@router.get("/system-status")
async def get_system_status(
    current_user: UserProfile = Depends(get_current_user)
) -> dict:
    """
    Get system configuration status.
    Checks if all required services are properly configured.
    Useful for debugging and ensuring the platform is ready.
    """
    from app.core.config import settings
    from app.services.scraper import get_unified_scraper
    
    # Check LLM configuration
    llm_status = {
        "openai_configured": bool(settings.OPENAI_API_KEY),
        "anthropic_configured": bool(settings.ANTHROPIC_API_KEY),
        "openrouter_configured": bool(settings.OPENROUTER_API_KEY),
        "any_llm_available": bool(settings.OPENAI_API_KEY or settings.ANTHROPIC_API_KEY or settings.OPENROUTER_API_KEY)
    }
    
    # Check scraper configuration
    scraper = get_unified_scraper()
    scraper_status = scraper.get_status()
    
    # Check AI visibility configuration
    visibility_status = {
        "enabled": settings.AI_VISIBILITY_ENABLED,
        "perplexity_configured": bool(settings.PERPLEXITY_API_KEY),
        "gemini_configured": bool(settings.GEMINI_API_KEY)
    }
    
    # Check database configuration
    db_status = {
        "supabase_configured": bool(settings.SUPABASE_URL and settings.SUPABASE_SERVICE_KEY),
        "qdrant_configured": bool(settings.QDRANT_URL and settings.QDRANT_API_KEY)
    }
    
    # Overall health
    is_healthy = (
        llm_status["any_llm_available"] and
        db_status["supabase_configured"]
    )
    
    return {
        "status": "healthy" if is_healthy else "degraded",
        "llm": llm_status,
        "scraper": scraper_status,
        "visibility": visibility_status,
        "database": db_status,
        "environment": settings.ENVIRONMENT,
        "demo_mode": settings.DEMO_MODE,
        "warnings": [
            "No LLM configured - analysis will fail" if not llm_status["any_llm_available"] else None,
            "Scraper using Playwright fallback (Firecrawl unavailable)" if scraper_status.get("active_backend") == "playwright" else None,
            "AI visibility features limited (no Perplexity/Gemini keys)" if not (visibility_status["perplexity_configured"] or visibility_status["gemini_configured"]) else None
        ]
    }

