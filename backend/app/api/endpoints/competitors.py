from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import List
from uuid import UUID
from datetime import datetime

from app.api.deps import get_current_user
from app.models.auth import UserProfile
from app.models.competitor import Competitor, CompetitorCreate, CompetitorUpdate
from app.services.supabase.database import SupabaseDatabaseService
from app.services.analysis.competitor_analyzer import CompetitorAnalyzerService

router = APIRouter()

def get_competitor_service():
    return SupabaseDatabaseService("competitors", Competitor)

@router.get("/", response_model=List[Competitor])
async def list_competitors(
    brand_id: UUID = None,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_competitor_service)
):
    filters = {"user_id": current_user.id}
    if brand_id:
        filters["brand_id"] = str(brand_id)
    return await service.list(filters=filters)

@router.post("/", response_model=Competitor)
async def create_competitor(
    competitor: CompetitorCreate,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_competitor_service)
):
    data = competitor.dict(exclude_unset=True)
    data["user_id"] = current_user.id
    # Convert UUID fields to strings for JSON serialization
    if "brand_id" in data and data["brand_id"] is not None:
        data["brand_id"] = str(data["brand_id"])
    return await service.create(data)

@router.get("/{competitor_id}", response_model=Competitor)
async def get_competitor(
    competitor_id: UUID,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_competitor_service)
):
    competitor = await service.get(str(competitor_id))
    if not competitor:
        raise HTTPException(status_code=404, detail="Competitor not found")
    if str(competitor.user_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this competitor")
    return competitor

@router.put("/{competitor_id}", response_model=Competitor)
async def update_competitor(
    competitor_id: UUID,
    competitor_update: CompetitorUpdate,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_competitor_service)
):
    existing_competitor = await service.get(str(competitor_id))
    if not existing_competitor:
        raise HTTPException(status_code=404, detail="Competitor not found")
    if str(existing_competitor.user_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this competitor")
        
    return await service.update(str(competitor_id), competitor_update.dict(exclude_unset=True))

@router.delete("/{competitor_id}")
async def delete_competitor(
    competitor_id: UUID,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_competitor_service)
):
    existing_competitor = await service.get(str(competitor_id))
    if not existing_competitor:
        raise HTTPException(status_code=404, detail="Competitor not found")
    if str(existing_competitor.user_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this competitor")
        
    success = await service.delete(str(competitor_id))
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete competitor")
    return {"status": "success"}

@router.post("/{competitor_id}/analyze", response_model=Competitor)
async def analyze_competitor(
    competitor_id: UUID,
    background_tasks: BackgroundTasks,
    current_user: UserProfile = Depends(get_current_user),
    service: SupabaseDatabaseService = Depends(get_competitor_service)
):
    """
    Trigger a real-time analysis of the competitor.
    Crawls the competitor site and compares it with the brand site.
    """
    competitor = await service.get(str(competitor_id))
    if not competitor:
        raise HTTPException(status_code=404, detail="Competitor not found")
    if str(competitor.user_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # We need the brand URL to compare against
    # Assuming brand_id is present and we can fetch the brand
    # For now, we'll fetch the brand using a separate service instance or passed in context
    # To keep it simple, we'll assume the brand URL is accessible via a brands table lookup
    # But since we don't have direct access to brands service here easily without circular deps,
    # we will fetch the brand using the generic service
    
    # Run analysis in background
    background_tasks.add_task(
        _run_competitor_analysis,
        competitor_id=competitor_id,
        competitor_url=competitor.domain,
        brand_id=competitor.brand_id,
        service=service
    )
    
    return competitor

async def _run_competitor_analysis(
    competitor_id: UUID,
    competitor_url: str,
    brand_id: UUID,
    service: SupabaseDatabaseService
):
    """Background task to run competitor analysis."""
    try:
        # Fetch brand URL (Need to instantiate brand service or query DB directly)
        # Using the supabase client from the service
        brand_res = service.supabase.table("brands").select("domain").eq("id", str(brand_id)).execute()
        if not brand_res.data:
            print(f"Brand {brand_id} not found for competitor analysis")
            return
            
        brand_url = brand_res.data[0]["domain"]
        
        analyzer = CompetitorAnalyzerService()
        results = await analyzer.analyze_competitor(brand_url, competitor_url)
        await analyzer.close()
        
        # Update competitor record
        await service.update(str(competitor_id), {
            "analysis_data": results,
            "visibility_score": results.get("visibility_score"),
            "last_analyzed_at": datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        print(f"Competitor analysis failed: {e}")

from pydantic import BaseModel

class CompetitorDiscoveryRequest(BaseModel):
    brand_name: str
    industry: str
    domain: str = ""
    description: str = ""
    services: List[str] = []
    country: str = "ES"
    language: str = "es"
    # New fields for scope-aware competitor discovery
    business_scope: str = "national"  # local, regional, national, international
    city: str = ""  # City/location for local/regional businesses
    industry_specific: str = ""  # e.g., "reparación de móviles" instead of generic "Tecnología"

@router.post("/discover", response_model=List[dict])
async def discover_competitors(
    request: CompetitorDiscoveryRequest,
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Discover potential competitors using LLM.
    Uses AI to identify real competitors based on brand and industry knowledge.
    """
    from app.services.llm.llm_service import LLMServiceFactory
    from app.core.config import settings
    import json
    import logging
    
    logger = logging.getLogger(__name__)
    competitors = []
    
    # Mapping ISO codes to full names for better search/context
    country_names = {
        "ES": "España",
        "CO": "Colombia",
        "MX": "México",
        "AR": "Argentina",
        "CL": "Chile",
        "PE": "Perú",
        "US": "United States",
        "UK": "United Kingdom",
        "FR": "Francia",
        "IT": "Italia",
        "DE": "Alemania",
        "PT": "Portugal"
    }
    full_country = country_names.get(request.country.upper(), request.country)
    
            # 1. Search for potential competitors/listicles as RAW CONTEXT
    search_context_text = ""
    if settings.FIRECRAWL_API_KEY:
        try:
            from app.services.analysis.web_search_service import WebSearchService
            web_search = WebSearchService()
            
            industry_search = request.industry_specific if request.industry_specific else request.industry
            
            if request.business_scope == "local" or request.business_scope == "regional":
                location_part = request.city if request.city else full_country
                if request.language == "es":
                    search_query = f"mejores empresas de {industry_search} en {location_part}"
                else:
                    search_query = f"top {industry_search} companies in {location_part}"
            elif request.business_scope == "international":
                if request.language == "es":
                    search_query = f"mejores empresas de {industry_search} a nivel mundial"
                else:
                    search_query = f"top {industry_search} companies worldwide"
            else: # National or default
                location_part = full_country
                if request.language == "es":
                    search_query = f"mejores empresas de {industry_search} en {location_part}"
                else:
                    search_query = f"top {industry_search} companies in {location_part}"

            logger.info(f"[Competitors] Fetching raw context with query: {search_query} (Scope: {request.business_scope})")
            search_results = await web_search.firecrawl.search_web(
                query=search_query,
                limit=10,
                lang=request.language,
                country=request.country.lower()
            )
            
            if search_results.get("success") and search_results.get("data"):
                for r in search_results["data"]:
                    search_context_text += f"Title: {r.get('title')}\nSnippet: {r.get('description')}\nURL: {r.get('url')}\n\n"
            
            logger.info(f"[Competitors] Collected search context ({len(search_context_text)} chars)")
        except Exception as e:
            logger.error(f"[Competitors] Search context gathering failed: {e}")

    # 2. LLM-based discovery using BOTH its knowledge AND the provided search context
    if settings.OPENAI_API_KEY:
        try:
            from app.services.llm.llm_service import LLMServiceFactory
            llm = LLMServiceFactory.get_service("openai")
            
            # Build context-aware prompt
            location_context = f"en {full_country}"
            if request.city:
                location_context = f"en {request.city}, {full_country}"
            
            # Map scope for the prompt
            scope_desc = {
                "local": f"Local (solo en {request.city})",
                "regional": f"Regional (provincia/región de {request.city})",
                "national": f"Nacional ({full_country})",
                "international": "Internacional (Global)"
            }.get(request.business_scope, request.business_scope)

            prompt = f"""Analiza la siguiente información y encuentra los 5-8 principales competidores DIRECTOS de esta empresa. Es CRÍTICO que los competidores seleccionados coincidan con el ALCANCE GEOGRÁFICO de la empresa.

### Mi Empresa
Nombre: {request.brand_name}
Sector: {request.industry}
Especialidad: {request.industry_specific}
Descripción: {request.description}
Alcance del Negocio: {scope_desc}
Ubicación: {location_context}

### Contexto de Búsqueda (Usa esto para extraer empresas reales)
{search_context_text if search_context_text else "No hay contexto de búsqueda disponible. Usa tu propio conocimiento."}

### INSTRUCCIONES CRÍTICAS:
1. Extrae solo EMPRESAS REALES (competidores directos).
2. El ALCANCE es fundamental: si la empresa es LOCAL, solo incluye otras empresas que operen en la misma ciudad. Si es INTERNACIONAL, incluye líderes globales.
3. NO incluyas artículos, listas, directorios o blogs (ej: "Top 10 empresas de...", "Clutch", "LinkedIn").
4. Para cada empresa, identifica su NOMBRE y su DOMINIO WEB PRINCIPAL (ej: clece.es).
5. El dominio debe ser el de la empresa, no el del artículo de búsqueda.
6. Asegúrate de que operen en el mismo sector y mercado geográfico.

Responde SOLO con un JSON array con este formato exacto:
[
  {{"name": "Nombre Empresa Real", "domain": "dominio.com", "reason": "Por qué es competencia"}},
  ...
]"""

            logger.info(f"[Competitors] Calling LLM with search context for {request.brand_name}...")
            llm_response = await llm.generate_text(prompt, max_tokens=1000)
            response = llm_response.text
            
            # Parse JSON from response
            try:
                json_text = response.strip()
                if "```json" in json_text:
                    json_text = json_text.split("```json")[1].split("```")[0]
                elif "```" in json_text:
                    json_text = json_text.split("```")[1].split("```")[0]
                
                llm_competitors = json.loads(json_text.strip())
                
                for comp in llm_competitors[:10]:
                    if comp.get("name") and comp.get("domain"):
                        domain = comp["domain"].replace("https://", "").replace("http://", "").replace("www.", "").lower().split('/')[0].strip()
                        
                        # Avoid brand itself
                        clean_brand_domain = request.domain.replace("https://", "").replace("http://", "").replace("www.", "").lower().split('/')[0].strip()
                        if domain == clean_brand_domain:
                            continue
                            
                        # Check for duplicates and aggregate sources
                        existing_comp = next((c for c in competitors if c["domain"] == domain), None)
                        if existing_comp:
                            if "openai" not in existing_comp["sources"]:
                                existing_comp["sources"].append("openai")
                            continue
                            
                        competitors.append({
                            "name": comp["name"],
                            "domain": domain,
                            "description": comp.get("reason", ""),
                            "sources": ["openai"], # For now, LLM is the main extractor
                            "confidence": "high",
                            "favicon": f"https://www.google.com/s2/favicons?sz=128&domain={domain}"
                        })
                
                logger.info(f"[Competitors] Successfully extracted {len(competitors)} competitors")
                
            except json.JSONDecodeError as e:
                logger.warning(f"[Competitors] Failed to parse LLM response: {e}")
                
        except Exception as e:
            logger.error(f"[Competitors] LLM discovery failed: {e}")
    else:
        logger.warning("[Competitors] OPENAI_API_KEY not configured")
    
    return competitors

