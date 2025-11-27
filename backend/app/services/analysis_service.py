import json
from uuid import UUID
from datetime import datetime
from typing import Dict, Any, Optional, List

from app.models.analysis import Analysis, AnalysisStatus, AnalysisType, AIModel
from app.models.notification import Notification, NotificationType, NotificationStatus
from app.models.recommendation import Recommendation
from app.services.analysis_results_ingestion import AnalysisResultsIngestionService
from app.services.supabase.database import SupabaseDatabaseService
from app.services.llm.llm_service import LLMServiceFactory, LLMService
from app.services.web_search_service import WebSearchService
from app.services.technical_aeo_service import TechnicalAEOService
from app.services.keyword_metrics_service import KeywordMetricsService
from app.services.ai_visibility_service import AIVisibilityService
from app.core.config import settings

class AnalysisService:
    def __init__(self):
        self.analysis_db = SupabaseDatabaseService("aeo_analyses", Analysis)
        self.recommendation_db = SupabaseDatabaseService("recommendations", Recommendation)
        self.notification_db = SupabaseDatabaseService("notifications", Notification)
        self.ingestion_service = AnalysisResultsIngestionService()
        self.web_search_service = WebSearchService()
        self.technical_aeo_service = TechnicalAEOService()
        self.keyword_metrics_service = KeywordMetricsService()
        self.ai_visibility_service = AIVisibilityService()

    async def run_analysis(self, analysis_id: UUID):
        """
        Run the analysis in the background.
        """
        # 1. Fetch analysis
        analysis = await self.analysis_db.get(str(analysis_id))
        if not analysis:
            print(f"Analysis {analysis_id} not found")
            return

        # Update status to processing
        await self.analysis_db.update(str(analysis_id), {"status": AnalysisStatus.processing})

        try:
            # 2. Select LLM Provider
            provider = "openai" # Default
            if analysis.ai_model:
                provider = analysis.ai_model.value
            
            # Map 'chatgpt' to 'openai' for the factory
            if provider == "chatgpt":
                provider = "openai"
            
            llm_service = LLMServiceFactory.get_service(provider)
            
            # Determine model name
            model_name = analysis.model_name
            if not model_name:
                if provider == "openai":
                    # Use the latest available model as requested
                    model_name = "gpt-5-chat-latest" 
                elif provider == "anthropic":
                    model_name = "claude-3-sonnet-20240229"
                elif provider == "openrouter":
                    model_name = "openai/gpt-3.5-turbo" # Default for openrouter if not specified

            # 3. Gather Real Web Data
            search_context = await self._gather_search_context(analysis)
            
            # 3b. Perform Technical AEO Audit
            technical_aeo_data = await self._perform_technical_aeo_audit(analysis)
            
            # 3c. Gather REAL Keyword Metrics (Google Trends, SerpAPI, etc.)
            keyword_metrics = await self._gather_keyword_metrics(analysis, search_context)
            
            # 3d. Measure REAL AI Visibility (if enabled - costs API calls)
            ai_visibility_data = await self._measure_ai_visibility(analysis)

            # COST SAVING CHECK: If both search and audit failed/skipped, DO NOT call LLM
            if not search_context.get("enabled") and not technical_aeo_data.get("enabled"):
                print("ABORTING: No web search data AND no technical audit data available.")
                print("Skipping LLM call to save costs.")
                
                # Mark analysis as failed or completed with error note
                await self.analysis_db.update(str(analysis_id), {
                    "status": AnalysisStatus.failed,
                    "error_message": "Analysis aborted: Insufficient brand data (domain/industry) for web search and technical audit."
                })
                return

            # 4. Construct Prompt with Real Data (including real keyword metrics)
            prompt = self._construct_prompt(
                analysis, 
                search_context, 
                technical_aeo_data, 
                keyword_metrics,
                ai_visibility_data
            )

            # 5. Call LLM
            print(f"Sending prompt to LLM for analysis {analysis_id}...")
            # Increase max_tokens to ensure the large JSON response isn't truncated
            response = await llm_service.generate_text(prompt=prompt, model=model_name, max_tokens=4000)
            print(f"LLM Response received: {response.text[:200]}...") # Log first 200 chars
            
            # 5. Parse Results (Expect JSON)
            # 5. Parse Results (Expect JSON)
            try:
                content = response.text
                print(f"Raw LLM response length: {len(content)}")
                
                # Helper function to extract and clean JSON
                def clean_and_parse_json(text_content):
                    # 1. Extract JSON block
                    if "```json" in text_content:
                        text_content = text_content.split("```json")[1].split("```")[0].strip()
                    elif "```" in text_content:
                        text_content = text_content.split("```")[1].split("```")[0].strip()
                    
                    # 2. Find outer braces
                    start_idx = text_content.find('{')
                    end_idx = text_content.rfind('}') + 1
                    
                    if start_idx == -1 or end_idx == 0:
                        raise ValueError("No JSON brackets found")
                        
                    json_str = text_content[start_idx:end_idx]
                    
                    # 3. First attempt: Standard strict=False parse
                    try:
                        return json.loads(json_str, strict=False)
                    except json.JSONDecodeError:
                        pass
                    
                    # 4. Robust Cleanup Strategy
                    import re
                    
                    # Fix 1: Remove trailing commas
                    json_str = re.sub(r',\s*}', '}', json_str)
                    json_str = re.sub(r',\s*]', ']', json_str)
                    
                    # Fix 2: Remove comments
                    json_str = re.sub(r'//.*', '', json_str)
                    
                    # Fix 3: Handle unescaped newlines in strings (The most common GPT error)
                    # This regex looks for newlines that are NOT followed by a quote or typical JSON structure
                    # It's a heuristic but works well for text blocks
                    def escape_newlines(match):
                        return match.group(0).replace('\n', '\\n').replace('\r', '')
                    
                    # Naive approach: replace all newlines inside quotes? 
                    # Better approach: Iterate and build
                    chars = []
                    in_string = False
                    i = 0
                    while i < len(json_str):
                        char = json_str[i]
                        if char == '"' and (i == 0 or json_str[i-1] != '\\'):
                            in_string = not in_string
                            chars.append(char)
                        elif in_string and char == '\n':
                            chars.append('\\n')
                        elif in_string and char == '\r':
                            pass # skip carriage returns in strings
                        elif in_string and char == '\t':
                            chars.append('\\t')
                        else:
                            chars.append(char)
                        i += 1
                    
                    json_str_fixed = "".join(chars)
                    
                    try:
                        return json.loads(json_str_fixed, strict=False)
                    except json.JSONDecodeError:
                        # Fix 4: Aggressive newline removal (last resort)
                        # This might merge lines but saves the JSON structure
                        json_str_aggressive = json_str.replace('\n', ' ').replace('\r', '')
                        return json.loads(json_str_aggressive, strict=False)

                results = clean_and_parse_json(content)
                print("JSON parsed successfully.")

            except Exception as e:
                print(f"JSON Parsing Critical Failure: {e}")
                # Fallback: Create a minimal valid result so the UI doesn't crash
                results = {
                    "score": 0,
                    "summary": "Error processing analysis results. Raw data preserved.",
                    "error": str(e),
                    "raw_text": response.text[:1000]
                }

            # Extract score from LLM results (default to 0 if not present)
            score = results.get("score", 0)
            if isinstance(score, (int, float)):
                score = float(score)
            else:
                score = 0.0

            # 6. Update Analysis
            await self.analysis_db.update(str(analysis_id), {
                "results": results,
                "score": score,
                "status": AnalysisStatus.completed,
                "completed_at": f"{datetime.utcnow().isoformat()}Z"
            })

            # 7. Ingest Structured Results into DB (with real keyword metrics)
            print(f"Ingesting results into database for analysis {analysis_id}...")
            await self.ingestion_service.ingest_results(analysis, results, keyword_metrics)
            
            # 7b. Ingest Technical AEO Data
            await self.ingestion_service.ingest_technical_aeo(analysis, technical_aeo_data)
            
            # 7c. Ingest Web Search Results
            await self.ingestion_service.ingest_web_search_results(analysis, search_context)
            print("Ingestion completed.")

            # 7. Generate Recommendations
            if "recommendations" in results and isinstance(results["recommendations"], list):
                for rec_data in results["recommendations"]:
                    await self._create_recommendation(analysis, rec_data)

            # 8. Persist notifications
            await self._handle_notifications(analysis, results, success=True)

        except Exception as e:
            print(f"Analysis failed: {str(e)}")
            await self.analysis_db.update(str(analysis_id), {
                "status": AnalysisStatus.failed,
                "error_message": str(e)
            })
            await self._handle_notifications(analysis, {"error": str(e)}, success=False)

    def _construct_prompt(
        self, 
        analysis: Analysis, 
        search_context: Dict[str, Any] = None,
        technical_aeo: Dict[str, Any] = None,
        keyword_metrics: Dict[str, Any] = None,
        ai_visibility: Dict[str, Any] = None
    ) -> str:
        """Construct a rich prompt with real search data so the LLM can provide accurate analysis."""
        data = analysis.input_data or {}
        brand = data.get("brand", {})
        if not isinstance(brand, dict):
            brand = {}
        objectives = data.get("objectives", {})
        if not isinstance(objectives, dict):
            objectives = {}
        
        if search_context is None:
            search_context = {"enabled": False}
        if technical_aeo is None:
            technical_aeo = {"enabled": False}
        if keyword_metrics is None:
            keyword_metrics = {"enabled": False}
        if ai_visibility is None:
            ai_visibility = {"enabled": False}

        brand_profile = f"""
Brand Name: {brand.get('name', '')}
Domain: {brand.get('domain', '')}
Industry: {brand.get('industry', '')}
Description: {brand.get('description', '')}
Target Audience: {objectives.get('target_audience', '')}
Key Terms: {objectives.get('key_terms', '')}
Competitors Mentioned: {objectives.get('competitors', '')}
Unique Value Proposition: {objectives.get('unique_value', '')}
Content Strategy: {objectives.get('content_strategy', '')}
AI Visibility Goals: {', '.join(objectives.get('ai_goals', []))}
""".strip()
        
        # Add real search data context if available
        real_data_section = ""
        if search_context.get("enabled"):
            real_data_section = f"""

=== REAL WEB SEARCH DATA ===
The following data was gathered from real web searches about this brand:

Keyword/Brand Search Results ({len(search_context.get('keyword_results', []))} results):
{self._format_search_results(search_context.get('keyword_results', []), max_items=5)}

Competitor Search Results ({len(search_context.get('competitor_results', []))} results):
{self._format_competitor_results(search_context.get('competitor_results', []))}

Brand Mentions ({len(search_context.get('mention_results', []))} results):
{self._format_search_results(search_context.get('mention_results', []), max_items=3)}

Industry Context ({len(search_context.get('industry_results', []))} results):
{self._format_search_results(search_context.get('industry_results', []), max_items=3)}
""".strip()
        else:
            real_data_section = "\n\nNote: Web search data not available for this analysis."
        
        # Add technical AEO audit data if available
        technical_aeo_section = ""
        if technical_aeo.get("enabled"):
            aeo_score = technical_aeo.get('aeo_readiness_score', 0)
            crawlers = technical_aeo.get('ai_crawler_permissions', {}).get('crawlers', {})
            allowed_crawlers = [bot for bot, status in crawlers.items() if status in ('allowed', 'not_specified')]
            blocked_crawlers = [bot for bot, status in crawlers.items() if status == 'disallowed']
            
            schemas = technical_aeo.get('structured_data', {})
            
            technical_aeo_section = f"""

=== TECHNICAL AEO AUDIT ===
Domain AEO Readiness Score: {aeo_score}/100

AI Crawler Access:
- Allowed/Accessible: {', '.join(allowed_crawlers[:5]) if allowed_crawlers else 'None'}
- Blocked: {', '.join(blocked_crawlers) if blocked_crawlers else 'None'}

Structured Data Found:
- Total schemas: {schemas.get('total_schemas', 0)}
- Has FAQ schema: {schemas.get('has_faq', False)}
- Has HowTo schema: {schemas.get('has_howto', False)}
- Has Article schema: {schemas.get('has_article', False)}

IMPORTANT: Use this technical audit data to provide specific, actionable recommendations for improving GEO/AEO optimization.
""".strip()
        
        # Analysis instructions based on data availability
        analysis_instruction = ""
        if search_context.get("enabled") or technical_aeo.get("enabled") or keyword_metrics.get("enabled"):
            analysis_instruction = """You are an AEO (AI Engine Optimization) strategist. I have gathered REAL data about this brand.
Your job is to ANALYZE this real data and provide insights, NOT to generate fictional data.

CRITICAL: For keywords, I am providing REAL metrics from Google Trends and other sources. 
USE these exact values for search_volume, difficulty, and trend_score in your response.
Do NOT invent or modify the keyword metrics I provide.

For competitors: Use the actual competitors found in the search results.
For insights: Base your analysis on the real search snippets and technical audit provided.

Use the real data provided above to craft an accurate visibility audit."""
        else:
            analysis_instruction = """You are an AEO (AI Engine Optimization) strategist. 
Since real web search data is not available, use the brand information below to craft
a reasonable first visibility audit so Mentha can populate dashboards, keyword trackers, queries, crawler activity,
recommendations, and notifications."""

        # Add REAL keyword metrics section
        keyword_metrics_section = ""
        if keyword_metrics.get("enabled"):
            kw_list = keyword_metrics.get("keywords", [])
            keyword_metrics_section = f"""

=== REAL KEYWORD METRICS (FROM GOOGLE TRENDS & APIS) ===
The following keyword data is REAL, gathered from actual APIs. Use these EXACT values in your response:

"""
            for kw in kw_list[:10]:
                keyword_metrics_section += f"""- Keyword: "{kw.get('keyword', '')}"
  Search Volume: {kw.get('search_volume', 0)}
  Difficulty: {kw.get('difficulty', 50)}
  Trend Score: {kw.get('trend_score', 0)}/100
  Trend Direction: {kw.get('trend_direction', 'stable')}
  Data Source: {kw.get('data_source', 'estimated')}

"""
            keyword_metrics_section += """IMPORTANT: Copy the search_volume and difficulty values EXACTLY as shown above.
These are real data points, not estimates. Do not modify or "round" these numbers."""

        # Add REAL AI visibility data if measured
        ai_visibility_section = ""
        if ai_visibility.get("enabled"):
            overall_score = ai_visibility.get("overall_score", 0)
            mention_count = ai_visibility.get("mention_count", 0)
            sentiment = ai_visibility.get("sentiment", "neutral")
            models = ai_visibility.get("models", {})
            
            ai_visibility_section = f"""

=== REAL AI VISIBILITY MEASUREMENT ===
The following visibility data was measured by ACTUALLY querying AI models:

Overall AI Visibility Score: {overall_score}/100 (REAL - measured from actual AI responses)
Total Brand Mentions Found: {mention_count}
Overall Sentiment: {sentiment}

Model-by-Model Results:
"""
            for model_name, model_data in models.items():
                if model_data.get("enabled"):
                    score = model_data.get("visibility_score", 0)
                    mentions = model_data.get("mention_count", 0)
                    ai_visibility_section += f"""- {model_name.upper()}: {score}% visibility ({mentions} mentions)
"""
                    # Include context snippets if available
                    snippets = model_data.get("context_snippets", [])
                    if snippets:
                        ai_visibility_section += f"  Context: \"{snippets[0][:100]}...\"\n"
            
            ai_visibility_section += """
IMPORTANT: Use the EXACT visibility_score values above for the visibility_findings section.
These are real measurements from actual AI model responses, not estimates."""

        schema_instructions = """
Return ONLY valid JSON. Do NOT use markdown code blocks. Do NOT include any text outside the JSON object.
The JSON must follow this schema:
{
    "score": number 0-100,
    "summary": string,
    "strengths": ["strength 1", "strength 2"],
    "weaknesses": ["weakness 1", "weakness 2"],
    "visibility_findings": {
        "visibility_score": number,
        "models_tracking": ["chatgpt", "claude", "perplexity", "gemini"],
        "keywords_tracked": number,
        "crawler_activity": string
    },
    "keywords": [
        {
            "keyword": string,
            "search_volume": number,
            "difficulty": number,
            "ai_visibility_score": number,
            "opportunity": "low"|"medium"|"high"
        }
    ],
    "competitors": [
        {
            "name": string,
            "domain": string,
            "visibility_score": number,
            "tracked": boolean,
            "insight": string
        }
    ],
    "queries": [
        {
            "title": string,
            "question": string,
            "category": "comparison"|"definition"|"recommendation"|"tutorial"|"top_x"|"review",
            "frequency": "daily"|"weekly"|"monthly",
            "priority": "low"|"medium"|"high"
        }
    ],
    "crawlers": [
        {
            "name": string,
            "model": string,
            "last_visit_hours": number,
            "frequency": string,
            "pages_visited": number,
            "insight": string,
            "top_pages": ["/path-a", "/path-b"]
        }
    ],
    "recommendations": [
        {
            "title": string,
            "description": string,
            "priority": "low"|"medium"|"high"|"critical",
            "category": "content"|"technical"|"keywords"|"competitors"|"visibility",
            "implementation_effort": "low"|"medium"|"high",
            "expected_impact": "low"|"medium"|"high"
        }
    ],
    "notifications": [
        {
            "title": string,
            "message": string,
            "type": "analysis_complete"|"system"|"reminder",
            "severity": "info"|"success"|"warning"|"critical"
        }
    ]
}
Lists should include 3-5 high-signal items tailored to the brand context.
All numeric fields MUST be numbers (not strings).
DO NOT wrap the output in markdown code blocks (like ```json). Just return the raw JSON string.
DO NOT include trailing commas.
DO NOT include comments in the JSON.
IMPORTANT: Do not use unescaped newlines inside string values. Use \\n for line breaks.
""".strip()

        prompt = f"""
{analysis_instruction}

{brand_profile}
{real_data_section}
{technical_aeo_section}
{keyword_metrics_section}
{ai_visibility_section}

{schema_instructions}
""".strip()

        # Provide additional context if the analysis type demands it
        if analysis.analysis_type == AnalysisType.content:
            content = data.get("content", "")
            keyword = data.get("keyword", "")
            prompt += f"\n\nPrimary content sample for evaluation (keyword: {keyword}):\n{content}"
        elif analysis.analysis_type == AnalysisType.competitor:
            competitors = objectives.get("competitors", "")
            prompt += f"\n\nFocus on how the brand compares to: {competitors}"
        else:
            prompt += f"\n\nAdditional raw input: {json.dumps(data, default=str)}"

        return prompt
    
    async def _gather_search_context(self, analysis: Analysis) -> Dict[str, Any]:
        """Gather real web search data for the brand."""
        data = analysis.input_data or {}
        brand = data.get("brand", {})
        objectives = data.get("objectives", {})
        
        brand_name = brand.get('name', '')
        domain = brand.get('domain', '')
        industry = brand.get('industry', '')
        key_terms = objectives.get('key_terms', '')
        
        # Only perform search if we have minimum required info
        if not brand_name or not industry:
            print("Insufficient brand data for web search - skipping")
            return {"enabled": False}
        
        return await self.web_search_service.get_search_context(
            brand_name=brand_name,
            domain=domain,
            industry=industry,
            key_terms=key_terms
        )
    
    async def _perform_technical_aeo_audit(self, analysis: Analysis) -> Dict[str, Any]:
        """Perform technical AEO audit for the brand's domain."""
        data = analysis.input_data or {}
        brand = data.get("brand", {})
        
        domain = brand.get('domain', '')
        
        # Only audit if we have a domain
        if not domain:
            print("No domain provided for technical AEO audit - skipping")
            return {"enabled": False}
        
        try:
            print(f"Performing technical AEO audit for: {domain}")
            audit_results = await self.technical_aeo_service.audit_domain(domain)
            return {
                "enabled": True,
                **audit_results
            }
        except Exception as e:
            print(f"Error in technical AEO audit: {e}")
            return {"enabled": False, "error": str(e)}
    
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
        
        # Extract keywords from multiple sources
        keywords_to_analyze = set()
        
        # From key_terms input
        if key_terms:
            terms = [t.strip() for t in key_terms.replace(',', '\n').split('\n') if t.strip()]
            keywords_to_analyze.update(terms)
        
        # From brand name + industry combinations
        if brand_name:
            keywords_to_analyze.add(brand_name)
            if industry:
                keywords_to_analyze.add(f"{brand_name} {industry}")
                keywords_to_analyze.add(f"best {industry}")
        
        # Extract keywords from search results
        if search_context.get("enabled"):
            # Extract topics from search result titles
            for result in search_context.get('keyword_results', [])[:5]:
                title = result.get('title', '')
                # Extract relevant words (simple extraction)
                words = title.lower().split()
                for word in words:
                    if len(word) > 4 and word not in ['para', 'with', 'from', 'about', 'this', 'that', 'what', 'como']:
                        keywords_to_analyze.add(word)
        
        # Limit to most relevant keywords
        keywords_list = list(keywords_to_analyze)[:15]
        
        if not keywords_list:
            print("No keywords to analyze for metrics")
            return {"enabled": False, "keywords": []}
        
        try:
            print(f"Fetching REAL metrics for {len(keywords_list)} keywords...")
            
            # Get enriched keyword data with real metrics
            enriched_keywords = await self.keyword_metrics_service.enrich_keywords(
                keywords=keywords_list,
                geo=brand.get('country', 'US')
            )
            
            # Get related keywords for expansion
            if brand_name:
                related = await self.keyword_metrics_service.get_related_keywords(
                    seed_keyword=f"{brand_name} {industry}" if industry else brand_name,
                    geo=brand.get('country', 'US')
                )
                # Add some related keywords
                enriched_keywords.extend(related[:5])
            
            return {
                "enabled": True,
                "keywords": enriched_keywords,
                "source": "google_trends",
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
        
        if not brand_name:
            print("No brand name for AI visibility measurement - skipping")
            return {"enabled": False, "reason": "no_brand_name"}
        
        try:
            print(f"Measuring REAL AI visibility for: {brand_name}")
            
            # Get related keywords for query context
            keywords = []
            if key_terms:
                keywords = [t.strip() for t in key_terms.replace(',', '\n').split('\n') if t.strip()][:5]
            
            # Measure visibility across AI models
            visibility_results = await self.ai_visibility_service.measure_visibility(
                brand_name=brand_name,
                domain=domain,
                industry=industry,
                keywords=keywords,
                num_queries=3  # Limit queries to control costs
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

