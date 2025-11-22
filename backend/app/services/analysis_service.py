import json
from uuid import UUID
from datetime import datetime
from typing import Dict, Any, Optional

from app.models.analysis import Analysis, AnalysisStatus, AnalysisType, AIModel
from app.models.notification import Notification, NotificationType, NotificationStatus
from app.models.recommendation import Recommendation
from app.services.analysis_results_ingestion import AnalysisResultsIngestionService
from app.services.supabase.database import SupabaseDatabaseService
from app.services.llm.llm_service import LLMServiceFactory, LLMService

class AnalysisService:
    def __init__(self):
        self.analysis_db = SupabaseDatabaseService("aeo_analyses", Analysis)
        self.recommendation_db = SupabaseDatabaseService("recommendations", Recommendation)
        self.notification_db = SupabaseDatabaseService("notifications", Notification)
        self.ingestion_service = AnalysisResultsIngestionService()

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
                    model_name = "gpt-5-nano-2025-08-07"
                elif provider == "anthropic":
                    model_name = "claude-3-sonnet-20240229"
                elif provider == "openrouter":
                    model_name = "openai/gpt-3.5-turbo" # Default for openrouter if not specified

            # 3. Construct Prompt
            prompt = self._construct_prompt(analysis)

            # 4. Call LLM
            response = await llm_service.generate_text(prompt=prompt, model=model_name)
            
            # 5. Parse Results (Expect JSON)
            try:
                # Try to find JSON in the response if it's wrapped in text
                content = response.text
                start_idx = content.find('{')
                end_idx = content.rfind('}') + 1
                if start_idx != -1 and end_idx != -1:
                    json_str = content[start_idx:end_idx]
                    results = json.loads(json_str)
                else:
                    results = {"raw_text": content}
            except json.JSONDecodeError:
                results = {"raw_text": response.text, "error": "Failed to parse JSON response"}

            # Calculate a mock score if not present
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

            # 6b. Hydrate downstream tables so dashboards show data
            await self.ingestion_service.ingest_results(analysis, results)

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

    def _construct_prompt(self, analysis: Analysis) -> str:
        """Construct a rich prompt so the LLM can hydrate all UI sections."""
        data = analysis.input_data or {}
        brand = data.get("brand", {})
        if not isinstance(brand, dict):
            brand = {}
        objectives = data.get("objectives", {})
        if not isinstance(objectives, dict):
            objectives = {}

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

        schema_instructions = """
Return ONLY valid JSON (no markdown, no explanations) following this schema:
{
    "score": number 0-100,
    "summary": string,
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
All numeric fields MUST be numbers (not strings) so they can be stored directly in the database.
""".strip()

        prompt = f"""
You are an AEO (AI Engine Optimization) strategist. Use the onboarding briefing below to craft
a first visibility audit so Mentha can populate dashboards, keyword trackers, queries, crawler activity,
recommendations, and notifications.

{brand_profile}

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

