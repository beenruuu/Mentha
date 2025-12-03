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
from app.services.analysis.technical_aeo_service import TechnicalAEOService
from app.services.analysis.keyword_metrics_service import KeywordMetricsService
from app.services.analysis.ai_visibility_service import AIVisibilityService
from app.services.analysis.content_structure_analyzer_service import ContentStructureAnalyzerService
from app.services.analysis.knowledge_graph_service import KnowledgeGraphMonitorService
from app.core.config import settings

# ANSI color codes for terminal output
class Colors:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    # Colors
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN = "\033[96m"
    WHITE = "\033[97m"
    GRAY = "\033[90m"

def log_info(emoji: str, message: str, color: str = Colors.CYAN):
    """Log an info message with emoji and color."""
    print(f"{color}{emoji} {message}{Colors.RESET}")

def log_success(emoji: str, message: str):
    """Log a success message in green."""
    print(f"{Colors.GREEN}{emoji} {message}{Colors.RESET}")

def log_error(emoji: str, message: str):
    """Log an error message in red."""
    print(f"{Colors.RED}{emoji} {message}{Colors.RESET}")

def log_warning(emoji: str, message: str):
    """Log a warning message in yellow."""
    print(f"{Colors.YELLOW}{emoji} {message}{Colors.RESET}")

def log_phase(phase_num: int, phase_name: str):
    """Log a phase header."""
    print(f"\n{Colors.BOLD}{Colors.MAGENTA}{'─'*50}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.MAGENTA}📍 Phase {phase_num}: {phase_name}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.MAGENTA}{'─'*50}{Colors.RESET}")

class AnalysisService:
    def __init__(self):
        self.analysis_db = SupabaseDatabaseService("aeo_analyses", Analysis)
        self.recommendation_db = SupabaseDatabaseService("recommendations", Recommendation)
        self.notification_db = SupabaseDatabaseService("notifications", Notification)
        # Import Competitor locally to avoid circular imports if any
        from app.models.competitor import Competitor
        self.competitor_db = SupabaseDatabaseService("competitors", Competitor)
        self.ingestion_service = AnalysisResultsIngestionService()
        self.web_search_service = WebSearchService()
        self.technical_aeo_service = TechnicalAEOService()
        self.keyword_metrics_service = KeywordMetricsService()
        self.ai_visibility_service = AIVisibilityService()
        self.ai_visibility_service = AIVisibilityService()
        self.content_structure_service = ContentStructureAnalyzerService()
        self.kg_service = KnowledgeGraphMonitorService()
        from app.services.analysis.citation_tracking_service import CitationTrackingService
        self.citation_service = CitationTrackingService()

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
            
            # Extract basic info
            data = analysis.input_data or {}
            brand = data.get("brand", {})
            brand_name = brand.get('name', '')
            brand_url = brand.get('domain', '')
            
            print(f"\n{Colors.BOLD}{Colors.GREEN}{'═'*60}{Colors.RESET}")
            log_success("🚀", f"Starting analysis for {Colors.BOLD}{brand_name}{Colors.RESET}{Colors.GREEN} ({brand_url})")
            print(f"{Colors.BOLD}{Colors.GREEN}{'═'*60}{Colors.RESET}\n")

            # --- PHASE 1: ENTITY RESOLUTION ---
            log_phase(1, "Entity Resolution")
            log_info("🔍", "Fetching page content...")
            
            # Fetch basic page content to understand the entity
            page_content = await self.technical_aeo_service.fetch_page_content(brand_url)
            
            # Infer entity type and business info
            log_info("🧠", "Inferring business info from page...")
            business_info = await self.web_search_service.infer_business_info_from_page(
                url=brand_url,
                page_title=page_content.get('title', ''),
                page_description=page_content.get('description', ''),
                page_content=page_content.get('text', '')
            )
            
            entity_type = business_info.get('entity_type', 'business')
            industry = business_info.get('industry', 'Services')
            log_success("✅", f"Detected → Entity: {Colors.BOLD}{entity_type}{Colors.RESET}{Colors.GREEN} | Industry: {Colors.BOLD}{industry}{Colors.RESET}")

            # --- PHASE 2: REAL DATA ACQUISITION ---
            log_phase(2, "Real Data Acquisition")
            
            # Run data gathering in parallel
            # 1. Web Search (Competitors & Context) - Pass entity_type for smart filtering
            user_country = data.get("user_country", "ES")
            preferred_language = data.get("preferred_language", "es")
            
            search_task = self.web_search_service.get_search_context(
                brand_name=brand_name,
                domain=brand_url,
                industry=industry,
                description=page_content.get('description', ''),
                services=",".join(business_info.get('services', [])),
                country=user_country,
                language=preferred_language
            )
            
            # 2. Technical Audit
            technical_task = self.technical_aeo_service.audit_domain(brand_url)
            
            # Fetch existing competitors to check for Share of Model
            existing_competitors = []
            if analysis.brand_id:
                comps = await self.competitor_db.list(filters={"brand_id": str(analysis.brand_id)})
                existing_competitors = [c.name for c in comps]
            
            # 3. AI Visibility (Real API checks)
            visibility_task = self.ai_visibility_service.measure_visibility(
                brand_name=brand_name,
                domain=brand_url,
                industry=industry,
                competitors=existing_competitors
            )
            
            content_task = self.content_structure_service.analyze_content_structure(url=brand_url)
            
            kg_task = self.kg_service.monitor_knowledge_presence(
                brand_name=brand_name, 
                domain=brand_url
            )

            search_context, technical_data, visibility_data, content_data, kg_data = await asyncio.gather(
                search_task, technical_task, visibility_task, content_task, kg_task
            )
            
            # 4. Keyword Metrics (Dependent on search context keywords)
            # Extract initial keywords from search context + business info
            initial_keywords = [brand_name] + business_info.get('services', [])
            if search_context.get('keyword_results'):
                initial_keywords.extend([k.get('title', '') for k in search_context['keyword_results'][:5]])
            
            # Clean and enrich keywords
            keywords_data = await self.keyword_metrics_service.enrich_keywords(
                list(set(initial_keywords))[:10], # Limit to top 10 unique
                language="es" # Default to Spanish for now, could be inferred
            )

            # --- PHASE 3: RESULT ASSEMBLY ---
            log_phase(3, "Result Assembly")
            log_info("📦", "Constructing result object...")
            
            visual_suggestions = []

            
            # Construct the deterministic result object
            results = {
                "brand_name": brand_name,
                "url": brand_url,
                "timestamp": datetime.utcnow().isoformat(),
                "entity_type": entity_type,
                "industry": industry,
                
                # Real Metrics
                "score": technical_data.get('aeo_readiness_score', 0),
                "visibility_findings": visibility_data, # Contains real visibility score
                "competitors": search_context.get('competitor_results', []), # Real competitors from search
                "keywords": keywords_data, # Real keyword metrics
                "technical_audit": technical_data,
                "content_analysis": content_data,
                "knowledge_graph": kg_data,
                "visual_suggestions": visual_suggestions,
                "authority_nexus": await self._calculate_authority_nexus(brand_name, brand_url),
                
                # Placeholders for LLM Synthesis
                "summary": "",
                "strengths": [],
                "weaknesses": [],
                "recommendations": [],
                "market_position": "Analyzing...",
                "voice_search_readiness": "Analyzing..."
            }
            
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

            print(f"\n{Colors.BOLD}{Colors.GREEN}{'═'*60}{Colors.RESET}")
            log_success("✅", f"Analysis completed successfully for {Colors.BOLD}{brand_name}{Colors.RESET}")
            print(f"{Colors.BOLD}{Colors.GREEN}{'═'*60}{Colors.RESET}\n")

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
        data = analysis.input_data or {}
        brand = data.get("brand", {})
        objectives = data.get("objectives", {})
        
        brand_name = brand.get('name', '')
        industry = brand.get('industry', '')
        key_terms = objectives.get('key_terms', '')
        
        # Get user's preferred language
        preferred_language = data.get("preferred_language", "en")
        
        # Language-specific "best" keyword prefix
        best_prefix = {
            "en": "best",
            "es": "mejor", 
            "fr": "meilleur",
            "de": "beste",
            "it": "migliore"
        }.get(preferred_language, "best")
        
        # Extract keywords from multiple sources
        keywords_to_analyze = set()
        
        # From key_terms input (user-provided, already in their language)
        if key_terms:
            terms = [t.strip() for t in key_terms.replace(',', '\n').split('\n') if t.strip()]
            for term in terms:
                if self._is_valid_keyword(term, preferred_language):
                    keywords_to_analyze.add(term)
        
        # From brand name + industry combinations (in user's language)
        if brand_name and self._is_valid_keyword(brand_name, preferred_language):
            keywords_to_analyze.add(brand_name)
            if industry and self._is_valid_keyword(industry, preferred_language):
                keywords_to_analyze.add(f"{brand_name} {industry}")
                keywords_to_analyze.add(f"{best_prefix} {industry}")
        
        # Extract keywords from search results - BE MORE SELECTIVE
        if search_context.get("enabled"):
            # Extract topics from search result titles - only meaningful phrases
            for result in search_context.get('keyword_results', [])[:5]:
                title = result.get('title', '')
                # Skip titles with non-Latin characters
                import re
                if re.search(r'[^\u0000-\u007F\u00C0-\u00FF\u0100-\u017F]', title):
                    continue
                    
                # Extract multi-word phrases instead of single words
                words = title.lower().split()
                # Look for relevant 2-3 word phrases
                for i in range(len(words) - 1):
                    phrase = ' '.join(words[i:i+2])
                    if len(phrase) > 8 and self._is_valid_keyword(phrase, preferred_language):
                        # Only add if it seems related to the industry
                        if industry and industry.lower() in phrase:
                            keywords_to_analyze.add(phrase)
        
        # Filter all keywords one more time
        keywords_to_analyze = {kw for kw in keywords_to_analyze if self._is_valid_keyword(kw, preferred_language)}
        
        # Limit to most relevant keywords
        keywords_list = list(keywords_to_analyze)[:15]
        
        if not keywords_list:
            print("No keywords to analyze for metrics")
            return {"enabled": False, "keywords": []}
        
        try:
            print(f"Fetching REAL metrics for {len(keywords_list)} keywords (language: {preferred_language})...")
            
            # Get enriched keyword data with real metrics (in user's language)
            enriched_keywords = await self.keyword_metrics_service.enrich_keywords(
                keywords=keywords_list,
                geo=brand.get('country', 'US'),
                language=preferred_language
            )
            
            # Get related keywords for expansion
            if brand_name:
                related = await self.keyword_metrics_service.get_related_keywords(
                    seed_keyword=f"{brand_name} {industry}" if industry else brand_name,
                    geo=brand.get('country', 'US'),
                    language=preferred_language
                )
                # Add some related keywords
                enriched_keywords.extend(related[:5])
            
            return {
                "enabled": True,
                "keywords": enriched_keywords,
                "source": "google_trends",
                "language": preferred_language,
                "data_freshness": "real_time"
            }
        except Exception as e:
            print(f"Error gathering keyword metrics: {e}")
            return {"enabled": False, "keywords": [], "error": str(e)}
    
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

    async def _calculate_authority_nexus(self, brand_name: str, brand_url: str) -> Dict[str, Any]:
        """
        Calculate authority nexus data including score and citations.
        """
        citations = await self.citation_service.check_authority_sources(brand_name, brand_url)
        
        # Calculate score based on citations
        # 10 points for each 'present' citation
        # Max score 100
        present_count = sum(1 for c in citations if c.get('status') == 'present')
        score = min(present_count * 10, 100)
        
        # Bonus for high impact sources
        high_impact_bonus = sum(5 for c in citations if c.get('status') == 'present' and c.get('impact') == 'high')
        score = min(score + high_impact_bonus, 100)
        
        return {
            "citations": citations,
            "score": score
        }
