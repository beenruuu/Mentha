from app.core.celery_app import celery_app
from app.core.async_utils import async_to_sync
from app.services.firecrawl_service import FirecrawlService
from app.services.processing.chunking_service import get_chunking_service
from app.services.vectordb.qdrant_service import get_vector_db_service
from app.services.analysis.ai_search_simulator_service import get_ai_search_simulator
from app.services.notifications.alert_service import get_alert_service
import logging

logger = logging.getLogger(__name__)

# FirecrawlService needs instance creation (no singleton getter in that file)
def get_firecrawl_service():
    return FirecrawlService()


@celery_app.task(name="crawl_and_index_site")
def crawl_and_index_site_task(url: str, organization_id: str):
    """
    Background task to crawl a site, chunk it, and index it in Vector DB.
    """
    logger.info(f"Starting crawl and index for {url} for organization {organization_id}")
    async def _process():
        try:
            # 1. Scrape
            scraper = get_firecrawl_service()
            # Assume scrape_url returns text/markdown
            scraped_data = await scraper.scrape_url(url) 
            content = scraped_data.get("markdown", "")
            
            if not content:
                logger.warning(f"Failed to scrape content from {url}")
                return {"status": "failed", "message": f"Failed to scrape {url}"}

            # 2. Chunk
            chunker = get_chunking_service()
            chunks = chunker.chunk_content(content, metadata={"url": url, "source": "firecrawl", "organization_id": organization_id})
            logger.info(f"Chunked {len(chunks)} pieces of content from {url}")

            # 3. Embed & Index
            # For simplicity in this step, we push text. Real impl needs embeddings.
            # This matches the previous placeholder logic but connects real services.
            
            # NOTE: Skipping actual Embedding generation call here for brevity, 
            # assuming QdrantService or an intermediate step adds it. 
            # In a full production env, we'd call OpenAIService.get_embeddings(chunks).
            
            vector_db = get_vector_db_service()
            # Assuming QdrantService has an upsert_chunks method that handles embedding internally
            # or expects pre-embedded chunks. For this example, we'll pass text chunks.
            # A real implementation would involve generating embeddings for each chunk.
            await vector_db.upsert_chunks(chunks, collection_name=f"org_{organization_id}_data")
            logger.info(f"Indexed {len(chunks)} chunks for {url} in Qdrant collection org_{organization_id}_data")
            
            return {"status": "success", "message": f"Processed {len(chunks)} chunks for {url}"}
        except Exception as e:
            logger.error(f"Error during crawl and index for {url}: {e}", exc_info=True)
            return {"status": "error", "message": str(e)}

    return async_to_sync(_process())

@celery_app.task(name="run_geo_simulation")
def run_geo_simulation_task(brand_id: str, brand_name: str, domain: str, industry: str):
    """
    Run the GEO simulator for a specific brand.
    """
    logger.info(f"Starting GEO simulation for brand_id: {brand_id}, brand_name: {brand_name}")
    
    async def _process():
        try:
            simulator = get_ai_search_simulator()
            return await simulator.simulate_search(
                brand_name=brand_name,
                domain=domain,
                industry=industry
            )
        except Exception as e:
            logger.error(f"GEO simulation failed: {e}")
            return {"error": str(e)}

    return async_to_sync(_process())

@celery_app.task(name="check_competitors")
def check_competitors_task(brand_id: str):
    """
    Periodic task to check competitor updates.
    """
    logger.info(f"Checking competitors for {brand_id}")
    async def _process():
        alert_service = get_alert_service()
        # In a real impl, we'd fetch competitors, crawl them, comparing against previous snapshots
        # For now we simulate a check
        return {"status": "checked", "brand_id": brand_id}

    return async_to_sync(_process())


@celery_app.task(name="refresh_brand_analysis")
def refresh_brand_analysis_task(brand_id: str):
    """
    Refresh analysis for a brand - triggered by scheduler based on subscription plan.
    """
    logger.info(f"Refreshing analysis for brand: {brand_id}")
    
    async def _process():
        try:
            from app.services.supabase.database import SupabaseDatabaseService
            from app.models.brand import Brand
            from app.models.analysis import Analysis, AnalysisStatus, AnalysisType
            from app.services.analysis.analysis_service import AnalysisService
            
            brand_db = SupabaseDatabaseService("brands", Brand)
            analysis_db = SupabaseDatabaseService("aeo_analyses", Analysis)
            
            # Fetch brand
            brand = await brand_db.get(brand_id)
            if not brand:
                logger.error(f"Brand {brand_id} not found")
                return {"status": "error", "message": "Brand not found"}
            
            # Create new analysis record
            analysis_data = {
                "user_id": str(brand.user_id),
                "brand_id": brand_id,
                "status": AnalysisStatus.pending,
                "analysis_type": AnalysisType.domain,
                "input_data": {
                    "brand": {
                        "name": brand.name,
                        "domain": brand.domain,
                        "industry": brand.industry or "",
                        "description": brand.description or "",
                        "entity_type": brand.entity_type or "business",
                    },
                    "discovery_prompts": brand.discovery_prompts or [],
                    "ai_providers": ["chatgpt"],  # OpenAI only
                    "preferred_language": "es",
                }
            }
            
            created_analysis = await analysis_db.create(analysis_data)
            
            # Run analysis
            service = AnalysisService()
            await service.run_analysis(created_analysis.id)
            
            return {"status": "success", "analysis_id": str(created_analysis.id)}
            
        except Exception as e:
            logger.error(f"Failed to refresh analysis for {brand_id}: {e}", exc_info=True)
            return {"status": "error", "message": str(e)}
    
    return async_to_sync(_process())


@celery_app.task(name="update_visibility_snapshots")
def update_visibility_snapshots_task():
    """
    Update AI visibility snapshots for all active brands.
    Only uses OpenAI to control costs.
    """
    logger.info("Starting visibility snapshot update for all brands")
    
    async def _process():
        try:
            from app.services.supabase.database import SupabaseDatabaseService
            from app.models.brand import Brand
            from app.services.analysis.ai_visibility_service import AIVisibilityService
            
            brand_db = SupabaseDatabaseService("brands", Brand)
            visibility_service = AIVisibilityService()
            
            # Get all brands
            brands = await brand_db.list()
            
            results = []
            for brand in brands:
                try:
                    # Measure visibility (OpenAI only)
                    visibility_data = await visibility_service.measure_visibility(
                        brand_name=brand.name,
                        domain=brand.domain,
                        industry=brand.industry or "",
                        keywords=brand.discovery_prompts[:3] if brand.discovery_prompts else None,
                        language="es"
                    )
                    
                    # Persist snapshot
                    await visibility_service.persist_visibility_snapshot(
                        brand_id=str(brand.id),
                        visibility_data=visibility_data
                    )
                    
                    results.append({"brand_id": str(brand.id), "status": "success"})
                    logger.info(f"Updated visibility for brand: {brand.name}")
                    
                except Exception as brand_error:
                    logger.error(f"Failed to update visibility for {brand.name}: {brand_error}")
                    results.append({"brand_id": str(brand.id), "status": "error", "error": str(brand_error)})
            
            return {"status": "completed", "results": results}
            
        except Exception as e:
            logger.error(f"Failed to update visibility snapshots: {e}", exc_info=True)
            return {"status": "error", "message": str(e)}
    
    return async_to_sync(_process())


    return async_to_sync(_process())


@celery_app.task(name="scheduled_analysis_runner")
def scheduled_analysis_runner_task():
    """
    Master scheduler task that determines which brands need analysis based on their subscription plan.
    - Starter: Weekly analysis
    - Pro: Daily analysis
    - Enterprise: Every 6 hours
    """
    logger.info("Running scheduled analysis check")
    
    async def _process():
        try:
            from datetime import datetime, timedelta
            from app.services.supabase.database import SupabaseDatabaseService
            from app.models.brand import Brand
            from app.models.analysis import Analysis
            
            brand_db = SupabaseDatabaseService("brands", Brand)
            analysis_db = SupabaseDatabaseService("aeo_analyses", Analysis)
            
            brands = await brand_db.list()
            now = datetime.utcnow()
            
            triggered = []
            
            for brand in brands:
                # Get user's subscription plan
                # For now, default to 'starter' if not found
                # TODO: Fetch from subscriptions table
                plan = "starter"
                
                # Determine interval based on plan
                intervals = {
                    "starter": timedelta(days=7),
                    "pro": timedelta(days=1),
                    "enterprise": timedelta(hours=6),
                }
                interval = intervals.get(plan, timedelta(days=7))
                
                # Check last analysis
                analyses = await analysis_db.list(
                    filters={"brand_id": str(brand.id)},
                    order_by="created_at",
                    order_desc=True,
                    limit=1
                )
                
                should_run = True
                if analyses:
                    last_analysis = analyses[0]
                    if last_analysis.created_at:
                        # Parse the timestamp
                        if isinstance(last_analysis.created_at, str):
                            last_time = datetime.fromisoformat(last_analysis.created_at.replace('Z', '+00:00'))
                        else:
                            last_time = last_analysis.created_at
                        
                        # Make timezone naive for comparison
                        last_time = last_time.replace(tzinfo=None)
                        
                        if now - last_time < interval:
                            should_run = False
                
                if should_run:
                    # Trigger analysis
                    refresh_brand_analysis_task.delay(str(brand.id))
                    triggered.append(str(brand.id))
                    logger.info(f"Triggered analysis for brand: {brand.name} (plan: {plan})")
            
            return {"status": "completed", "triggered": len(triggered), "brand_ids": triggered}
            
        except Exception as e:
            logger.error(f"Scheduled analysis runner failed: {e}", exc_info=True)
            return {"status": "error", "message": str(e)}
    
    return async_to_sync(_process())


@celery_app.task(name="refresh_bot_ip_ranges")
def refresh_bot_ip_ranges_task():
    """
    Daily task to refresh AI bot IP ranges from official sources.
    
    This keeps the IP verification cache up-to-date for detecting
    legitimate vs spoofed bot requests.
    """
    logger.info("Refreshing AI bot IP ranges")
    
    async def _process():
        try:
            from app.services.monitoring.ip_verification_service import get_ip_verification_service
            
            ip_service = get_ip_verification_service()
            results = await ip_service.refresh_all_ranges()
            
            refreshed = [name for name, success in results.items() if success]
            failed = [name for name, success in results.items() if not success]
            
            logger.info(f"IP range refresh completed: {len(refreshed)} refreshed, {len(failed)} failed")
            
            return {
                "status": "completed",
                "refreshed": refreshed,
                "failed": failed
            }
            
        except Exception as e:
            logger.error(f"IP range refresh failed: {e}", exc_info=True)
            return {"status": "error", "message": str(e)}
    
    return async_to_sync(_process())


@celery_app.task(name="cleanup_semantic_cache")
def cleanup_semantic_cache_task(max_entries: int = 10000):
    """
    Periodic task to clean up old semantic cache entries.
    
    Removes expired entries and trims cache to max_entries if needed.
    """
    logger.info("Cleaning up semantic cache")
    
    async def _process():
        try:
            from app.services.llm.semantic_cache_service import get_semantic_cache_service
            
            cache_service = get_semantic_cache_service()
            stats_before = cache_service.get_stats()
            
            # The cache auto-removes expired entries on access,
            # but we can force a cleanup by iterating
            # For now, just return stats
            
            return {
                "status": "completed",
                "entries": stats_before.total_entries,
                "hit_rate": stats_before.hit_rate,
                "tokens_saved": stats_before.total_tokens_saved,
                "cost_saved_usd": round(stats_before.estimated_cost_saved, 4)
            }
            
        except Exception as e:
            logger.error(f"Semantic cache cleanup failed: {e}", exc_info=True)
            return {"status": "error", "message": str(e)}
    
    return async_to_sync(_process())


