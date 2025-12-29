import json
import asyncio
from uuid import UUID
from datetime import datetime
from typing import Dict, Any, Optional, List

from app.models.analysis import Analysis, AnalysisStatus, AnalysisType, AIModel
from app.models.notification import Notification, NotificationType, NotificationStatus
from app.models.recommendation import Recommendation
from app.services.analysis.analysis_results_ingestion import AnalysisResultsIngestionService
from app.services.supabase.database import SupabaseDatabaseService
from app.services.llm.llm_service import LLMServiceFactory, LLMService
from app.services.analysis.web_search_service import WebSearchService
# from app.services.analysis.keyword_metrics_service import KeywordMetricsService
from app.services.analysis.ai_visibility_service import AIVisibilityService
from app.services.analysis.content_structure_analyzer_service import ContentStructureAnalyzerService
from app.services.analysis.sentiment_analysis_service import get_sentiment_analysis_service
from app.api.endpoints.utils import fetch_page_content
from app.core.config import settings
from app.core.logging import Colors, log_info, log_success, log_error, log_warning, log_phase


class AnalysisService:
    def __init__(self):
        self.analysis_db = SupabaseDatabaseService("aeo_analyses", Analysis)
        self.recommendation_db = SupabaseDatabaseService("recommendations", Recommendation)
        self.notification_db = SupabaseDatabaseService("notifications", Notification)
        # Import Competitor locally to avoid circular imports if any
        from app.models.competitor import Competitor
        self.competitor_db = SupabaseDatabaseService("competitors", Competitor)
        # from app.models.keyword import Keyword
        # self.keyword_db = SupabaseDatabaseService("keywords", Keyword)
        self.ingestion_service = AnalysisResultsIngestionService()
        self.web_search_service = WebSearchService()
        # self.keyword_metrics_service = KeywordMetricsService()
        self.ai_visibility_service = AIVisibilityService()
        self.content_structure_service = ContentStructureAnalyzerService()
        from app.services.analysis.citation_tracking_service import CitationTrackingService
        self.citation_service = CitationTrackingService()
        from app.services.analysis.hallucination_detection_service import HallucinationDetectionService
        self.hallucination_service = HallucinationDetectionService()

    async def run_analysis(self, analysis_id: UUID):
        """
        Run a complete AEO/GEO analysis for a brand using the Real Data First pipeline.
        
        Phases:
        1. Entity Resolution: Determine what we are analyzing (Business, Media, etc.)
        2. Real Data Acquisition: Gather metrics from all services in parallel.
        3. Result Assembly: Construct the data structure from real metrics.
        4. Synthesis: Use LLM only for qualitative insights.
        """
        # 1. Fetch analysis
        analysis = await self.analysis_db.get(str(analysis_id))
        if not analysis:
            print(f"Analysis {analysis_id} not found")
            return

        # Update status to processing
        await self.analysis_db.update(str(analysis_id), {"status": AnalysisStatus.processing})
        
        try:
            # Initialize services
            # Note: We use the factory for the LLM service
            provider = "openai"
            if analysis.ai_model:
                provider = analysis.ai_model.value
            if provider == "chatgpt":
                provider = "openai"
            
            self.llm_service = LLMServiceFactory.get_service(provider)
            self.web_search_service.set_llm_service(self.llm_service)
            
            # Extract basic info from input_data (populated from brand during trigger)
            data = analysis.input_data or {}
            brand = data.get("brand", {})
            brand_name = brand.get('name', '')
            brand_url = brand.get('domain', '')
            
            # Extract discovery prompts configured during onboarding
            discovery_prompts = data.get("discovery_prompts", [])
            ai_providers = data.get("ai_providers", [])
            
            # Use industry from input_data if available (from onboarding)
            onboarding_industry = brand.get("industry", "")
            onboarding_description = brand.get("description", "")
            entity_type_hint = brand.get("entity_type", "")
            business_scope = brand.get("business_scope", "national")
            city = brand.get("city", "")
            
            log_info("📋", f"Discovery prompts from onboarding: {len(discovery_prompts)}")
            log_info("🤖", f"AI providers configured: {ai_providers}")
            
            print(f"\n{Colors.BOLD}{Colors.GREEN}{'═'*60}{Colors.RESET}")
            log_success("🚀", f"Starting analysis for {Colors.BOLD}{brand_name}{Colors.RESET}{Colors.GREEN} ({brand_url})")
            print(f"{Colors.BOLD}{Colors.GREEN}{'═'*60}{Colors.RESET}\n")

            # --- PHASE 1: ENTITY RESOLUTION ---
            log_phase(1, "Entity Resolution")
            log_info("🔍", "Fetching page content...")
            
            # Fetch basic page content to understand the entity
            page_content = await fetch_page_content(brand_url)
            
            # Infer entity type and business info
            log_info("🧠", "Inferring business info from page...")
            business_info = await self.web_search_service.infer_business_info_from_page(
                url=brand_url,
                page_title=page_content.get('title', ''),
                page_description=page_content.get('description', ''),
                page_content=page_content.get('text_content', '')
            )
            
            # Prioritize onboarding data over inferred data
            entity_type = entity_type_hint or business_info.get('entity_type', 'business')
            industry = onboarding_industry or business_info.get('industry', 'Services')
            # Use onboarding description if provided, otherwise use page description
            description = onboarding_description or page_content.get('description', '')
            log_success("✅", f"Detected → Entity: {Colors.BOLD}{entity_type}{Colors.RESET}{Colors.GREEN} | Industry: {Colors.BOLD}{industry}{Colors.RESET}")

            # --- PHASE 2: REAL DATA ACQUISITION ---
            log_phase(2, "Real Data Acquisition")
            
            user_country = data.get("user_country", "ES")
            preferred_language = data.get("preferred_language", "es")
            
            # Fetch existing competitors from DB (from onboarding + previous analyses)
            existing_competitors = []
            existing_competitor_objects = []
            if analysis.brand_id:
                comps = await self.competitor_db.list(filters={"brand_id": str(analysis.brand_id)})
                existing_competitors = [c.name for c in comps]
                existing_competitor_objects = [{"name": c.name, "domain": c.domain} for c in comps]
                log_info("🏢", f"Found {len(existing_competitors)} existing competitors")
            
            # Use Firecrawl to get deeper context from the website
            site_context = ""
            try:
                from app.services.firecrawl_service import FirecrawlService
                firecrawl = FirecrawlService()
                if firecrawl.api_key:
                    log_info("🔥", "Crawling website for context...")
                    # Map the site to get important URLs
                    site_urls = await firecrawl.map_site(brand_url, limit=10, search="about services products")
                    if site_urls:
                        log_info("🗺️", f"Found {len(site_urls)} pages to analyze")
                        # Scrape key pages for context
                        for url in site_urls[:5]:  # Limit to 5 pages
                            scrape_result = await firecrawl.scrape_url(url, formats=["markdown"])
                            if scrape_result.get("success") and scrape_result.get("markdown"):
                                site_context += f"\n\n--- Page: {url} ---\n{scrape_result['markdown'][:2000]}"
                    await firecrawl.close()
            except Exception as fc_err:
                log_warning("🔥", f"Firecrawl context gathering failed: {fc_err}")
            
            # Search for competitors using web search + AI context
            search_task = self.web_search_service.get_search_context(
                brand_name=brand_name,
                domain=brand_url,
                industry=industry,
                description=description,
                services=",".join(business_info.get('services', [])),
                country=user_country,
                language=preferred_language
            )
            
            # AI Visibility (Real API checks) - Use discovery prompts from onboarding
            # Pass business_scope info for geo-aware visibility measurement
            location = brand.get("location", user_country)
            visibility_task = self.ai_visibility_service.measure_visibility(
                brand_name=brand_name,
                domain=brand_url,
                industry=industry,
                keywords=discovery_prompts[:5] if discovery_prompts else None,
                competitors=existing_competitors,
                language=preferred_language,
                business_scope=business_scope,
                city=city,
                location=location
            )
            
            content_task = self.content_structure_service.analyze_content_structure(url=brand_url)
            
            search_context, visibility_data, content_data = await asyncio.gather(
                search_task, visibility_task, content_task
            )
            
            # Derive technical_data from content analysis
            technical_data = {
                "aeo_readiness_score": content_data.get("overall_structure_score", 0),
                "has_faq": content_data.get("faq_analysis", {}).get("has_faq_section", False),
                "has_howto": content_data.get("howto_analysis", {}).get("total_howtos", 0) > 0,
                "schema_types": [],
                "recommendations": content_data.get("recommendations", [])
            }
            
            # --- SENTIMENT ANALYSIS ---
            # Collect context snippets from visibility data and search context
            context_snippets = []
            
            # From AI Visibility
            if visibility_data.get("models"):
                for model_data in visibility_data["models"].values():
                    if model_data.get("context_snippets"):
                        context_snippets.extend(model_data["context_snippets"])
            
            # From search context
            if search_context.get("competitor_results"):
                for result in search_context["competitor_results"]:
                    if result.get("snippet"):
                        context_snippets.append(result["snippet"])
            
            # Run Sentiment Analysis
            sentiment_analysis = await self.sentiment_service.analyze_sentiment(
                brand_name=brand_name,
                context_snippets=list(set(context_snippets))[:10], # Limit and deduplicate
                language=preferred_language
            )
            
            # Persist sentiment analysis
            if analysis.brand_id:
                await self.sentiment_service._persist_sentiment_analysis(str(analysis.brand_id), sentiment_analysis)
            
            # 4. Keyword Metrics
            # Extract initial keywords from business info + discovery prompts + search results
            initial_keywords = [brand_name] + business_info.get('services', [])
            if discovery_prompts:
                initial_keywords.extend(discovery_prompts[:5])
            if search_context.get('keyword_results'):
                initial_keywords.extend([k.get('title', '') for k in search_context['keyword_results'][:5]])
            
            # Clean and enrich keywords
            # keywords_data = await self.keyword_metrics_service.enrich_keywords(
            #     list(set(initial_keywords))[:10], # Limit to top 10 unique
            #     language=preferred_language
            # )
            keywords_data = []
            
            # Detect NEW competitors (not in existing list)
            new_competitors = []
            existing_domains = {c["domain"].lower().replace("www.", "") for c in existing_competitor_objects}
            for comp in search_context.get('competitor_results', []):
                comp_domain = (comp.get('domain') or '').lower().replace("www.", "")
                if comp_domain and comp_domain not in existing_domains:
                    new_competitors.append(comp)
                    existing_domains.add(comp_domain)
            
            if new_competitors:
                log_info("🆕", f"Discovered {len(new_competitors)} new competitors")
            
            # --- HALLUCINATION DETECTION ---
            # Run this after other data gathering
            log_info("🤥", "Detecting hallucinations...")
            hallucination_task = self.hallucination_service.detect_hallucinations(
                brand_name=brand_name,
                domain=brand_url,
                industry=industry,
                ai_responses=visibility_data.get("models_raw", []) # Assuming visibility service returns raw responses
            )
            hallucination_data = await hallucination_task

            # --- PHASE 3: RESULT ASSEMBLY ---
            log_phase(3, "Result Assembly")
            log_info("📦", "Constructing result object...")
            
            visual_suggestions = []
            
            # Combine existing + new competitors
            all_competitors = existing_competitor_objects + new_competitors
            
            # Construct the deterministic result object
            results = {
                "brand_name": brand_name,
                "url": brand_url,
                "timestamp": datetime.utcnow().isoformat(),
                "entity_type": entity_type,
                "industry": industry,
                
                # Real Metrics
                "score": technical_data.get('aeo_readiness_score', 0),
                "visibility_findings": visibility_data,
                "competitors": new_competitors,  # Only new ones for ingestion (existing already in DB)
                "keywords": keywords_data,
                "technical_audit": technical_data,
                "content_analysis": content_data,
                "knowledge_graph": kg_data,
                "visual_suggestions": visual_suggestions,
                "sentiment_analysis": sentiment_analysis,
                "hallucination_analysis": hallucination_data,
                
                "notifications": [],
                
                # Placeholders for LLM Synthesis
                "summary": "",
                "strengths": [],
                "weaknesses": [],
                "recommendations": [],
                "market_position": "Analyzing...",
                "voice_search_readiness": "Analyzing..."
            }
            
            # --- ADD NOTABLE CHANGE: New competitors detected ---
            if new_competitors:
                new_names = [c.get('name', c.get('domain', 'Unknown')) for c in new_competitors[:5]]
                results["notifications"].append({
                    "title": "Nuevos Competidores Detectados",
                    "message": f"Se han detectado {len(new_competitors)} nuevos competidores: {', '.join(new_names)}{'...' if len(new_competitors) > 5 else ''}.",
                    "type": "competitor_discovered",
                    "severity": "info",
                    "data": {"count": len(new_competitors), "names": new_names}
                })
            
            # --- PHASE 4: SYNTHESIS ---
            log_phase(4, "Synthesis (LLM)")
            log_info("🤖", "Generating qualitative insights with AI...")
            
            # Construct prompt with the REAL data
            prompt = self._construct_synthesis_prompt(
                brand_name, 
                business_info, 
                results, 
                page_content
            )
            
            # Generate qualitative insights
            # Increase max_tokens to ensure the large JSON response isn't truncated
            synthesis_response = await self.llm_service.generate_json(
                prompt=prompt,
                model="gpt-4o", # Use high quality model for synthesis
                max_tokens=1500
            )
            
            # Merge synthesis into results
            if synthesis_response:
                try:
                    import json
                    synthesis_data = json.loads(synthesis_response.text)
                    results.update({
                        "summary": synthesis_data.get("summary", ""),
                        "strengths": synthesis_data.get("strengths", []),
                        "weaknesses": synthesis_data.get("weaknesses", []),
                        "recommendations": synthesis_data.get("recommendations", []),
                        "market_position": synthesis_data.get("market_position", ""),
                        "voice_search_readiness": synthesis_data.get("voice_search_readiness", "")
                    })
                except json.JSONDecodeError:
                    log_error("❌", f"Failed to parse LLM JSON response")
                    results.update({"summary": "Failed to generate synthesis."})
                
                # Enrich competitors with AI insights if available
                if "competitor_insights" in synthesis_response:
                    comp_map = {c['domain']: c for c in results['competitors']}
                    for domain, insight in synthesis_response["competitor_insights"].items():
                        # Fuzzy match domain
                        for comp_domain in comp_map:
                            if domain in comp_domain or comp_domain in domain:
                                comp_map[comp_domain]['ai_insight'] = insight
            
            # Extract score
            score = results.get("score", 0)
            
            # 6. Update Analysis
            await self.analysis_db.update(str(analysis_id), {
                "results": results,
                "score": score,
                "status": AnalysisStatus.completed,
                "completed_at": f"{datetime.utcnow().isoformat()}Z"
            })

            # 7. Ingest Structured Results into DB
            log_phase(5, "Database Ingestion")
            log_info("💾", f"Ingesting results for analysis {analysis_id}...")
            await self.ingestion_service.ingest_results(analysis, results, {"keywords": keywords_data})
            await self.ingestion_service.ingest_technical_aeo(analysis, technical_data)
            await self.ingestion_service.ingest_web_search_results(analysis, search_context)
            
            # 7b. Update Brand with Inferred Info (Industry/Entity Type)
            if analysis.brand_id:
                try:
                    from app.services.supabase.database import SupabaseDatabaseService
                    from app.models.brand import Brand
                    brand_db = SupabaseDatabaseService("brands", Brand)
                    
                    # Only update if we have valid data
                    update_payload = {}
                    if industry and industry != "Services": # Avoid overwriting with default if possible, or maybe we want to?
                        update_payload["industry"] = industry
                    if entity_type:
                        update_payload["entity_type"] = entity_type
                        
                    if update_payload:
                        log_info("🏷️", f"Updating Brand with inferred info: {update_payload}")
                        await brand_db.update(str(analysis.brand_id), update_payload)
                except Exception as brand_update_error:
                    log_error("❌", f"Failed to update Brand info: {brand_update_error}")
            
            # 7c. Persist visibility snapshots for dashboard charts
            if visibility_data and visibility_data.get("models") and analysis.brand_id:
                log_info("📊", "Persisting visibility snapshots...")
                try:
                    await self.ai_visibility_service.persist_visibility_snapshot(
                        brand_id=str(analysis.brand_id),
                        visibility_data=visibility_data
                    )
                except Exception as vis_err:
                    log_error("❌", f"Failed to persist visibility snapshots: {vis_err}")
            
            # 7d. Update Competitor Visibility Scores
            log_info("📊", "Measuring competitor visibility...")
            await self._update_competitor_visibility(analysis, preferred_language)
            
            # 7e. Update Keyword Visibility Scores
            # log_info("🔑", "Measuring keyword visibility...")
            # await self._update_keyword_visibility(analysis, brand_name, brand_url, preferred_language)

            print(f"\n{Colors.BOLD}{Colors.GREEN}{'='*60}{Colors.RESET}")
            log_success("✅", f"Analysis completed successfully for {Colors.BOLD}{brand_name}{Colors.RESET}")
            print(f"{Colors.BOLD}{Colors.GREEN}{'='*60}{Colors.RESET}\n")

            # 8. Persist notifications
            await self._handle_notifications(analysis, results, success=True)

        except Exception as e:
            log_error("💥", f"Analysis failed: {e}")
            import traceback
            traceback.print_exc()
            await self.analysis_db.update(str(analysis_id), {
                "status": AnalysisStatus.failed,
                "error_message": str(e)
            })
            await self._handle_notifications(analysis, {"error": str(e)}, success=False)

    def _construct_synthesis_prompt(self, brand_name: str, business_info: Dict, results: Dict, page_content: Dict) -> str:
        """Construct a prompt that asks ONLY for qualitative insights based on provided data."""
        
        return f"""
Act as an expert AEO (Answer Engine Optimization) Analyst.
Analyze the provided REAL DATA for the brand "{brand_name}".

ENTITY CONTEXT:
- Type: {business_info.get('entity_type')}
- Industry: {business_info.get('industry')}
- Description: {page_content.get('description')}

MEASURED DATA (DO NOT INVENT METRICS, USE THESE):
- Technical AEO Score: {results['score']}/100
- AI Visibility Score: {results['visibility_findings'].get('overall_score')}%
- Competitors Found: {[c['name'] for c in results['competitors']]}
- Top Keywords: {[k['keyword'] for k in results['keywords'][:5]]}
- Speakability Score: {results['content_analysis'].get('speakability_analysis', {}).get('quality_score', 0)}/100
- Speakability Score: {results['content_analysis'].get('speakability_analysis', {}).get('quality_score', 0)}/100
- Content Structure Score: {results['content_analysis'].get('overall_structure_score', 0)}/100
- Knowledge Graph Presence: {results['knowledge_graph'].get('presence_score', 0)}/100
- KG Completeness: {results['knowledge_graph'].get('completeness_score', 0)}/100
- Recognized as Entity: {results['knowledge_graph'].get('knowledge_sources', {}).get('llm_recognition', {}).get('recognized_as_entity', False)}

TASK:
Generate a qualitative analysis JSON.
1. summary: A professional executive summary of their AEO status (2-3 sentences).
2. strengths: List 3 key strengths based on the high scores/metrics provided.
3. weaknesses: List 3 key weaknesses based on low scores/missing data.
4. recommendations: List 3-5 actionable strategic recommendations.
5. market_position: Describe their position relative to the competitors found.
6. voice_search_readiness: Assessment based on the technical score.
7. competitor_insights: A dictionary mapping competitor domain to a 1-sentence insight about why they are a threat.

OUTPUT JSON FORMAT:
{{
    "summary": "...",
    "strengths": ["...", "...", "..."],
    "weaknesses": ["...", "...", "..."],
    "recommendations": [{{ "title": "...", "description": "...", "priority": "high" }}],
    "market_position": "...",
    "voice_search_readiness": "...",
    "competitor_insights": {{ "competitor.com": "Insight..." }}
}}
"""
    
    def _is_valid_keyword(self, keyword: str, preferred_language: str = "en") -> bool:
        """Check if a keyword is valid (no foreign scripts, no generic words)."""
        import re
        
        # Skip if empty or too short
        if not keyword or len(keyword) < 3:
            return False
        
        # Skip if contains non-Latin characters (Cyrillic, Chinese, Arabic, etc.)
        if re.search(r'[^\u0000-\u007F\u00C0-\u00FF\u0100-\u017F]', keyword):
            return False
        
        # Skip common generic words that are never useful keywords
        generic_words = {
            # English
            'whatsapp', 'google', 'facebook', 'twitter', 'instagram', 'youtube',
            'windows', 'android', 'iphone', 'apple', 'microsoft', 'download',
            'free', 'store', 'app', 'messenger', 'telegram', 'wikipedia',
            'login', 'sign', 'account', 'password', 'email', 'home', 'page',
            # Spanish
            'descargar', 'gratis', 'inicio', 'pagina', 'cuenta', 'correo',
            # Russian/Cyrillic transliterations that might slip through
            'skachat', 'besplatno', 'ustanovit',
        }
        
        if keyword.lower() in generic_words:
            return False
        
        return True
    
    def _is_valid_competitor(self, competitor: Dict[str, Any]) -> bool:
        """Check if a competitor entry is valid (not a news site, directory, etc.)."""
        name = (competitor.get('name') or '').lower()
        domain = (competitor.get('domain') or '').lower()
        
        if not name or not domain:
            return False
        
        # Domains that are NEVER competitors
        invalid_domains = {
            'guiadeprensa', 'eleconomista', 'cincodias', 'expansion',
            'larazon', 'abc', 'elmundo', 'elpais', 'europapress',
            'lavanguardia', 'elconfidencial', 'eldiario', '20minutos',
            'wikipedia', 'linkedin', 'facebook', 'twitter', 'instagram',
            'youtube', 'reddit', 'quora', 'tiktok', 'pinterest',
            'amazon', 'ebay', 'aliexpress', 'google', 'bing', 'yahoo',
            'indeed', 'infojobs', 'glassdoor', 'jobatus', 'monster',
            'empresite', 'einforma', 'axesor', 'infocif', 'paginasamarillas',
            'cylex', 'europages', 'kompass', 'whatsapp', 'microsoft',
            'windows', 'apple', 'telegram', 'messenger'
        }
        
        # Check domain
        domain_base = domain.split('.')[0]
        if domain_base in invalid_domains:
            return False
        
        # Check for news/press patterns in domain
        invalid_patterns = ['prensa', 'noticias', 'news', 'blog', 'press', 
                           'directorio', 'directory', 'ranking', 'listado',
                           'guia', 'guide', 'wikipedia', 'empleo', 'trabajo']
        for pattern in invalid_patterns:
            if pattern in domain:
                return False
        
        # Check for invalid name patterns
        invalid_name_patterns = ['wikipedia', 'linkedin', 'facebook', 'google',
                                  'whatsapp', 'telegram', 'news', 'noticias',
                                  'directorio', 'directory', 'guia', 'guide']
        for pattern in invalid_name_patterns:
            if pattern in name:
                return False
        
        return True
    
    def _post_process_results(self, results: Dict[str, Any], preferred_language: str = "en") -> Dict[str, Any]:
        """Post-process LLM results to filter out irrelevant keywords and competitors."""
        
        # Filter keywords
        if 'keywords' in results and isinstance(results['keywords'], list):
            filtered_keywords = []
            for kw in results['keywords']:
                keyword = kw.get('keyword', '')
                if self._is_valid_keyword(keyword, preferred_language):
                    filtered_keywords.append(kw)
            results['keywords'] = filtered_keywords
            print(f"Filtered keywords: {len(results['keywords'])} valid out of original list")
        
        # Filter competitors
        if 'competitors' in results and isinstance(results['competitors'], list):
            filtered_competitors = []
            for comp in results['competitors']:
                if self._is_valid_competitor(comp):
                    filtered_competitors.append(comp)
            results['competitors'] = filtered_competitors
            print(f"Filtered competitors: {len(results['competitors'])} valid out of original list")
        
        # Filter queries (remove those with non-Latin characters)
        if 'queries' in results and isinstance(results['queries'], list):
            import re
            filtered_queries = []
            for query in results['queries']:
                title = query.get('title', '')
                question = query.get('question', '')
                # Skip if contains non-Latin characters
                if not re.search(r'[^\u0000-\u007F\u00C0-\u00FF\u0100-\u017F]', title + question):
                    filtered_queries.append(query)
            results['queries'] = filtered_queries
            print(f"Filtered queries: {len(results['queries'])} valid")
        
        return results
    
    async def _gather_keyword_metrics(
        self, 
        analysis: Analysis, 
        search_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Gather REAL keyword metrics from Google Trends and other sources."""
        # Method disabled as KeywordMetricsService is removed
        return {"enabled": False, "keywords": []}
    
    async def _measure_ai_visibility(self, analysis: Analysis) -> Dict[str, Any]:
        """
        Measure REAL AI visibility by querying AI models.
        
        WARNING: This makes actual API calls that cost money.
        Only runs if AI_VISIBILITY_ENABLED=true in environment.
        """
        # Check if AI visibility measurement is enabled
        if not getattr(settings, 'AI_VISIBILITY_ENABLED', False):
            print("AI visibility measurement is disabled (set AI_VISIBILITY_ENABLED=true to enable)")
            return {"enabled": False, "reason": "disabled_in_config"}
        
        data = analysis.input_data or {}
        brand = data.get("brand", {})
        objectives = data.get("objectives", {})
        
        brand_name = brand.get('name', '')
        domain = brand.get('domain', '')
        industry = brand.get('industry', '')
        key_terms = objectives.get('key_terms', '')
        
        # Get user's preferred language
        preferred_language = data.get("preferred_language", "en")
        
        if not brand_name:
            print("No brand name for AI visibility measurement - skipping")
            return {"enabled": False, "reason": "no_brand_name"}
        
        try:
            print(f"Measuring REAL AI visibility for: {brand_name} (language: {preferred_language})")
            
            # Get related keywords for query context
            keywords = []
            if key_terms:
                keywords = [t.strip() for t in key_terms.replace(',', '\n').split('\n') if t.strip()][:5]
            
            # Measure visibility across AI models (in user's preferred language)
            visibility_results = await self.ai_visibility_service.measure_visibility(
                brand_name=brand_name,
                domain=domain,
                industry=industry,
                keywords=keywords,
                num_queries=3,  # Limit queries to control costs
                language=preferred_language
            )
            
            # Persist visibility snapshot for dashboard charts
            if visibility_results.get("overall_score", 0) > 0 and analysis.brand_id:
                try:
                    await self.ai_visibility_service.persist_visibility_snapshot(
                        brand_id=str(analysis.brand_id),
                        visibility_data=visibility_results
                    )
                    print(f"Persisted visibility snapshot for brand {analysis.brand_id}")
                except Exception as persist_err:
                    print(f"Warning: Failed to persist visibility snapshot: {persist_err}")
            
            return visibility_results
            
        except Exception as e:
            print(f"Error measuring AI visibility: {e}")
            return {"enabled": False, "error": str(e)}
    
    def _format_search_results(self, results: list, max_items: int = 5) -> str:
        """Format search results for prompt inclusion."""
        if not results:
            return "No results found."
        
        formatted = []
        for i, result in enumerate(results[:max_items], 1):
            title = result.get('title', 'No title')
            snippet = result.get('body', result.get('snippet', 'No description'))
            link = result.get('href', result.get('link', ''))
            formatted.append(f"{i}. {title}\n   {snippet[:150]}...\n   URL: {link}")
        
        return "\n\n".join(formatted)
    
    def _format_competitor_results(self, competitors: list) -> str:
        """Format competitor search results."""
        if not competitors:
            return "No competitors found."
        
        formatted = []
        for i, comp in enumerate(competitors, 1):
            name = comp.get('name', 'Unknown')
            domain = comp.get('domain', 'N/A')
            snippet = comp.get('snippet', '')
            formatted.append(f"{i}. {name} ({domain})\n   {snippet[:120]}...")
        
        return "\n\n".join(formatted)

    async def _handle_notifications(self, analysis: Analysis, results: Dict[str, Any], success: bool) -> None:
        try:
            if success:
                summary = results.get("summary") or "El análisis inicial se ha completado."
                await self._create_notification(
                    analysis,
                    title="Análisis inicial completado",
                    message=summary,
                    notif_type=NotificationType.analysis_complete,
                    metadata={"analysis_id": str(analysis.id), "score": results.get("score")}
                )

                for item in results.get("notifications", []) or []:
                    notif_type = item.get("type") or NotificationType.system.value
                    if notif_type not in NotificationType._value2member_map_:
                        notif_type = NotificationType.system.value
                    metadata = {"severity": item.get("severity"), "analysis_id": str(analysis.id)}
                    await self._create_notification(
                        analysis,
                        title=item.get("title", "Actualización"),
                        message=item.get("message", ""),
                        notif_type=NotificationType(notif_type),
                        metadata=metadata
                    )
            else:
                await self._create_notification(
                    analysis,
                    title="Análisis fallido",
                    message=results.get("error", "No fue posible completar el análisis."),
                    notif_type=NotificationType.analysis_failed,
                    metadata={"analysis_id": str(analysis.id)}
                )
        except Exception as notification_error:
            print(f"Failed to store notifications: {notification_error}")

    async def _create_notification(
        self,
        analysis: Analysis,
        title: str,
        message: str,
        notif_type: NotificationType,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        payload = {
            "user_id": str(analysis.user_id),
            "brand_id": str(analysis.brand_id) if analysis.brand_id else None,
            "title": title,
            "message": message,
            "type": notif_type.value,
            "status": NotificationStatus.unread.value,
            "metadata": metadata or {}
        }
        await self.notification_db.create(payload)

    async def _create_recommendation(self, analysis: Analysis, data: Dict[str, Any]):
        """Create a recommendation record."""
        try:
            rec_data = {
                "analysis_id": str(analysis.id),
                "user_id": str(analysis.user_id),
                "brand_id": str(analysis.brand_id) if analysis.brand_id else None,
                "title": data.get("title", "Recommendation"),
                "description": data.get("description", ""),
                "priority": data.get("priority", "medium"),
                "category": data.get("category", "content"),
                "implementation_effort": data.get("implementation_effort", "medium"),
                "expected_impact": data.get("expected_impact", "medium"),
                "status": "pending"
            }
            await self.recommendation_db.create(rec_data)
        except Exception as e:
            print(f"Failed to create recommendation: {e}")

    async def _update_competitor_visibility(self, analysis: Analysis, preferred_language: str = "es") -> None:
        """
        Measure AI visibility for each competitor and update their visibility_score.
        
        This runs after the main analysis to populate competitor visibility data
        that is displayed in the dashboard.
        """
        if not analysis.brand_id:
            return
        
        # Check if AI visibility is enabled
        if not getattr(settings, 'AI_VISIBILITY_ENABLED', False):
            print("Skipping competitor visibility measurement (AI_VISIBILITY_ENABLED=false)")
            return
        
        try:
            # Get all competitors for this brand
            competitors = await self.competitor_db.list(filters={"brand_id": str(analysis.brand_id)})
            
            if not competitors:
                print("No competitors found to measure visibility for")
                return
            
            log_info("📊", f"Measuring AI visibility for {len(competitors)} competitors...")
            
            for comp in competitors:
                try:
                    # Measure visibility for this competitor (limited queries to save costs)
                    visibility_result = await self.ai_visibility_service.measure_visibility(
                        brand_name=comp.name,
                        domain=comp.domain,
                        num_queries=2,  # Limited queries for cost control
                        language=preferred_language
                    )
                    
                    visibility_score = visibility_result.get("overall_score", 0)
                    
                    # Update competitor with visibility score
                    await self.competitor_db.update(str(comp.id), {
                        "visibility_score": visibility_score
                    })
                    
                    print(f"  → {comp.name}: {visibility_score}% visibility")
                    
                except Exception as comp_err:
                    print(f"  → {comp.name}: Failed to measure ({comp_err})")
                    continue
            
            log_success("✅", f"Updated visibility for {len(competitors)} competitors")
            
        except Exception as e:
            log_error("❌", f"Failed to update competitor visibility: {e}")

    async def _update_competitor_visibility(
        self,
        analysis: Analysis,
        preferred_language: str
    ):
        """Update competitor visibility scores based on analysis findings."""
        if not analysis.brand_id:
            return
            
        results = analysis.results or {}
        visibility_data = results.get("visibility_findings", {})
        
        # Aggregate logic is already done in ai_visibility_service, but we used to just grab 'competitor_mentions'
        # Now we want specific scores per model if available, or at least the breakdown
        
        competitor_models = visibility_data.get("competitor_models", {})
        
        # Get all competitors for this brand
        competitors = await self.competitor_db.list(filters={"brand_id": str(analysis.brand_id)})
        comp_map = {c.name.lower(): c for c in competitors}
        
        # We also have the aggregated counts in 'competitor_mentions' to calculate an overall visibility
        # But 'ai_visibility_service' doesn't calculate an 'overall_score' for competitors, only for the main brand.
        # We can calculate it here similar to how the brand score is calculated.
        
        # Model weights (should match ai_visibility_service)
        weights = {
            "openai": 0.35,
            "anthropic": 0.30,
            "perplexity": 0.25,
            "google_search": 0.10,
            "baseline": 0.10
        }
        
        for comp_name, model_scores in competitor_models.items():
            comp_db = comp_map.get(comp_name.lower())
            if not comp_db:
                # Might be a new competitor not yet in DB, skipping for now or handled by new competitor detection
                continue
            
            # Calculate overall weighted score for this competitor
            total_weighted_score = 0
            total_weight = 0
            
            for model, score in model_scores.items():
                w = weights.get(model, 0.1)
                total_weighted_score += score * w
                total_weight += w
            
            final_visibility = 0
            if total_weight > 0:
                final_visibility = round(total_weighted_score / total_weight, 1)
            
            # Update competitor in DB
            await self.competitor_db.update(str(comp_db.id), {
                "visibility_score": final_visibility,
                "metrics_breakdown": model_scores, # Persist the breakdown!
                "updated_at": datetime.utcnow().isoformat()
            })
            log_info("📊", f"Updated visibility for competitor {comp_name}: {final_visibility}%")

    async def _update_keyword_visibility(
        self, 
        analysis: Analysis, 
        brand_name: str,
        brand_domain: str,
        preferred_language: str = "es"
    ) -> None:
        """
        Measure AI visibility for each keyword and update their ai_visibility_score.
        
        This asks AI models "Tell me about [keyword]" and checks if the brand appears.
        """
        pass

