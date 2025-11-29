"""
LLM SEO Analyzer Service - AI-powered SEO/AEO analysis.
Based on python-seo-analyzer's LLM analyst with enhancements for GEO optimization.
Provides structured analysis using multiple AI models.
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
import json
import asyncio

from app.services.llm.llm_service import LLMServiceFactory, LLMService


# Pydantic models for structured LLM output
class EntityAnalysis(BaseModel):
    """Entity optimization analysis for knowledge panel readiness."""
    entity_assessment: str = Field(description="Detailed analysis of entity optimization")
    knowledge_panel_readiness: int = Field(description="Score from 0-100")
    key_improvements: List[str] = Field(description="Top 3-5 improvements needed")


class CredibilityAnalysis(BaseModel):
    """N-E-E-A-T analysis for content credibility."""
    credibility_assessment: str = Field(description="Overall credibility analysis")
    neeat_scores: Dict[str, int] = Field(
        description="Individual N-E-E-A-T-T component scores (Notability, Experience, Expertise, Authority, Trust, Transparency)"
    )
    trust_signals: List[str] = Field(description="Identified trust signals")


class ConversationAnalysis(BaseModel):
    """Analysis of content readiness for AI conversations."""
    conversation_readiness: str = Field(description="Overall assessment")
    query_patterns: List[str] = Field(description="Identified query patterns content can answer")
    engagement_score: int = Field(description="Score from 0-100")
    gaps: List[str] = Field(description="Identified conversational gaps")


class PlatformPresence(BaseModel):
    """Multi-platform visibility analysis."""
    platform_coverage: Dict[str, str] = Field(description="Coverage analysis per platform")
    visibility_scores: Dict[str, int] = Field(description="Scores per platform type")
    optimization_opportunities: List[str] = Field(description="List of opportunities")


class SEORecommendations(BaseModel):
    """Strategic SEO/AEO recommendations."""
    strategic_recommendations: List[str] = Field(description="Major strategic recommendations")
    quick_wins: List[str] = Field(description="Immediate action items")
    long_term_strategy: List[str] = Field(description="Long-term strategic goals")
    priority_matrix: Dict[str, str] = Field(description="Priority matrix by impact/effort")


class LLMSEOAnalyzer:
    """
    AI-powered SEO/AEO analyzer using LLM services.
    Provides comprehensive analysis across multiple dimensions:
    - Entity optimization
    - Content credibility (N-E-E-A-T)
    - Conversational readiness
    - Cross-platform presence
    """
    
    def __init__(self, provider: str = "openai"):
        """
        Initialize the LLM SEO analyzer.
        
        Args:
            provider: LLM provider to use ('openai', 'anthropic', 'openrouter')
        """
        self.llm_service = LLMServiceFactory.get_service(provider)
        self.provider = provider
    
    async def analyze_seo_data(self, seo_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Perform comprehensive SEO/AEO analysis using AI.
        
        Args:
            seo_data: Dictionary containing page analysis data
            
        Returns:
            Enhanced analysis with AI insights
        """
        seo_data_str = json.dumps(seo_data, indent=2, default=str)
        
        # Run analyses in parallel for efficiency
        entity_task = self._analyze_entity(seo_data_str)
        credibility_task = self._analyze_credibility(seo_data_str)
        conversation_task = self._analyze_conversation(seo_data_str)
        platform_task = self._analyze_platform_presence(seo_data_str)
        
        results = await asyncio.gather(
            entity_task,
            credibility_task,
            conversation_task,
            platform_task,
            return_exceptions=True
        )
        
        # Process results
        entity_analysis = results[0] if not isinstance(results[0], Exception) else {"error": str(results[0])}
        credibility_analysis = results[1] if not isinstance(results[1], Exception) else {"error": str(results[1])}
        conversation_analysis = results[2] if not isinstance(results[2], Exception) else {"error": str(results[2])}
        platform_analysis = results[3] if not isinstance(results[3], Exception) else {"error": str(results[3])}
        
        # Combine analyses
        combined = {
            "entity_analysis": entity_analysis,
            "credibility_analysis": credibility_analysis,
            "conversation_analysis": conversation_analysis,
            "platform_presence": platform_analysis
        }
        
        # Generate final recommendations
        recommendations = await self._generate_recommendations(combined)
        
        return {
            "analysis": combined,
            "recommendations": recommendations,
            "scores": self._calculate_scores(combined),
            "quick_wins": recommendations.get("quick_wins", []),
            "strategic_recommendations": recommendations.get("strategic_recommendations", [])
        }
    
    async def _analyze_entity(self, seo_data: str) -> Dict[str, Any]:
        """Analyze entity optimization and knowledge panel readiness."""
        prompt = f"""Analyze this SEO data for entity optimization and knowledge panel readiness.

Evaluate:
1. Entity understanding (Is the brand/entity clearly defined?)
2. Knowledge Panel readiness (Does the content support Google Knowledge Panel inclusion?)
3. Brand credibility signals
4. Entity relationships and mentions
5. Topic entity connections
6. Schema markup effectiveness

Data to analyze:
{seo_data}

Return ONLY valid JSON with this structure:
{{
    "entity_assessment": "detailed analysis string",
    "knowledge_panel_readiness": 0-100,
    "key_improvements": ["improvement 1", "improvement 2", "improvement 3"]
}}

Do not include any text outside the JSON."""

        try:
            response = await self.llm_service.generate_text(
                prompt=prompt,
                model=self._get_model_name(),
                max_tokens=1500,
                temperature=0.3
            )
            return self._parse_json_response(response.text)
        except Exception as e:
            return {"error": str(e)}
    
    async def _analyze_credibility(self, seo_data: str) -> Dict[str, Any]:
        """Analyze content credibility using N-E-E-A-T framework."""
        prompt = f"""Analyze this SEO data for content credibility using the N-E-E-A-T-T framework:
- Notability: Is the entity notable and recognized?
- Experience: Does content show real-world experience?
- Expertise: Is subject matter expertise demonstrated?
- Authority: Are there authority signals and citations?
- Trust: Are there trust and safety signals?
- Transparency: Is authorship and sourcing clear?

Data to analyze:
{seo_data}

Return ONLY valid JSON with this structure:
{{
    "credibility_assessment": "overall analysis string",
    "neeat_scores": {{
        "notability": 0-100,
        "experience": 0-100,
        "expertise": 0-100,
        "authority": 0-100,
        "trust": 0-100,
        "transparency": 0-100
    }},
    "trust_signals": ["signal 1", "signal 2", "signal 3"]
}}

Do not include any text outside the JSON."""

        try:
            response = await self.llm_service.generate_text(
                prompt=prompt,
                model=self._get_model_name(),
                max_tokens=1500,
                temperature=0.3
            )
            return self._parse_json_response(response.text)
        except Exception as e:
            return {"error": str(e)}
    
    async def _analyze_conversation(self, seo_data: str) -> Dict[str, Any]:
        """Analyze content readiness for AI conversations (ChatGPT, Claude, etc.)."""
        prompt = f"""Analyze this SEO data for conversational AI readiness.

Evaluate:
1. Query pattern matching - Can the content answer common questions?
2. Intent coverage - Does it cover informational, navigational, and transactional intents?
3. Natural language quality - Is the content conversational and clear?
4. Follow-up content availability - Can it support multi-turn conversations?
5. Conversational triggers - Are there clear question-answer patterns?

Data to analyze:
{seo_data}

Return ONLY valid JSON with this structure:
{{
    "conversation_readiness": "overall assessment string",
    "query_patterns": ["question pattern 1", "question pattern 2"],
    "engagement_score": 0-100,
    "gaps": ["gap 1", "gap 2"]
}}

Do not include any text outside the JSON."""

        try:
            response = await self.llm_service.generate_text(
                prompt=prompt,
                model=self._get_model_name(),
                max_tokens=1500,
                temperature=0.3
            )
            return self._parse_json_response(response.text)
        except Exception as e:
            return {"error": str(e)}
    
    async def _analyze_platform_presence(self, seo_data: str) -> Dict[str, Any]:
        """Analyze cross-platform presence and visibility opportunities."""
        prompt = f"""Analyze this SEO data for multi-platform visibility opportunities.

Evaluate presence and optimization for:
1. Traditional search (Google, Bing)
2. AI assistants (ChatGPT, Claude, Perplexity)
3. Knowledge graphs
4. Social platforms
5. Industry-specific platforms

Data to analyze:
{seo_data}

Return ONLY valid JSON with this structure:
{{
    "platform_coverage": {{
        "search_engines": "assessment",
        "ai_assistants": "assessment",
        "knowledge_graphs": "assessment",
        "social": "assessment"
    }},
    "visibility_scores": {{
        "search_engines": 0-100,
        "ai_assistants": 0-100,
        "knowledge_graphs": 0-100,
        "social": 0-100
    }},
    "optimization_opportunities": ["opportunity 1", "opportunity 2"]
}}

Do not include any text outside the JSON."""

        try:
            response = await self.llm_service.generate_text(
                prompt=prompt,
                model=self._get_model_name(),
                max_tokens=1500,
                temperature=0.3
            )
            return self._parse_json_response(response.text)
        except Exception as e:
            return {"error": str(e)}
    
    async def _generate_recommendations(self, combined_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Generate strategic recommendations based on combined analysis."""
        analysis_str = json.dumps(combined_analysis, indent=2, default=str)
        
        prompt = f"""Based on this comprehensive SEO/AEO analysis, provide strategic recommendations.

Analysis results:
{analysis_str}

Provide recommendations in these categories:
1. Quick Wins - Actions that can be implemented immediately with high impact
2. Strategic Recommendations - Major initiatives for long-term improvement
3. Long-term Strategy - Building blocks for sustained visibility
4. Priority Matrix - Categorize by impact (high/medium/low) and effort (easy/medium/hard)

Return ONLY valid JSON with this structure:
{{
    "quick_wins": ["action 1", "action 2", "action 3"],
    "strategic_recommendations": ["recommendation 1", "recommendation 2"],
    "long_term_strategy": ["strategy 1", "strategy 2"],
    "priority_matrix": {{
        "high_impact_easy": ["item"],
        "high_impact_hard": ["item"],
        "low_impact_easy": ["item"]
    }}
}}

Do not include any text outside the JSON."""

        try:
            response = await self.llm_service.generate_text(
                prompt=prompt,
                model=self._get_model_name(),
                max_tokens=2000,
                temperature=0.3
            )
            return self._parse_json_response(response.text)
        except Exception as e:
            return {"error": str(e), "quick_wins": [], "strategic_recommendations": []}
    
    def _calculate_scores(self, combined_analysis: Dict[str, Any]) -> Dict[str, float]:
        """Calculate summary scores from analysis."""
        scores = {
            "entity_score": 0,
            "credibility_score": 0,
            "conversation_score": 0,
            "platform_score": 0,
            "overall_score": 0
        }
        
        try:
            # Entity score
            entity = combined_analysis.get("entity_analysis", {})
            scores["entity_score"] = entity.get("knowledge_panel_readiness", 0)
            
            # Credibility score (average of N-E-E-A-T-T)
            cred = combined_analysis.get("credibility_analysis", {})
            neeat = cred.get("neeat_scores", {})
            if neeat:
                scores["credibility_score"] = sum(neeat.values()) / len(neeat)
            
            # Conversation score
            conv = combined_analysis.get("conversation_analysis", {})
            scores["conversation_score"] = conv.get("engagement_score", 0)
            
            # Platform score (average)
            platform = combined_analysis.get("platform_presence", {})
            vis_scores = platform.get("visibility_scores", {})
            if vis_scores:
                scores["platform_score"] = sum(vis_scores.values()) / len(vis_scores)
            
            # Overall score (weighted average)
            weights = {
                "entity_score": 0.25,
                "credibility_score": 0.30,
                "conversation_score": 0.25,
                "platform_score": 0.20
            }
            scores["overall_score"] = sum(
                scores[k] * v for k, v in weights.items()
            )
            
        except Exception:
            pass
        
        return {k: round(v, 1) for k, v in scores.items()}
    
    def _get_model_name(self) -> str:
        """Get appropriate model name for provider."""
        if self.provider == "openai":
            return "gpt-4o"
        elif self.provider == "anthropic":
            return "claude-3-sonnet-20240229"
        else:
            return "openai/gpt-4o"
    
    def _parse_json_response(self, text: str) -> Dict[str, Any]:
        """Parse JSON from LLM response with error handling."""
        try:
            # Remove markdown code blocks if present
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            
            # Find JSON object
            start = text.find('{')
            end = text.rfind('}') + 1
            
            if start == -1 or end == 0:
                return {"error": "No JSON found in response"}
            
            json_str = text[start:end]
            return json.loads(json_str, strict=False)
            
        except json.JSONDecodeError as e:
            return {"error": f"JSON parse error: {e}"}


async def analyze_page_with_llm(
    page_data: Dict[str, Any],
    provider: str = "openai"
) -> Dict[str, Any]:
    """
    Convenience function to analyze page data with LLM.
    
    Args:
        page_data: Page analysis data from PageAnalyzer
        provider: LLM provider to use
        
    Returns:
        Enhanced analysis with AI insights
    """
    analyzer = LLMSEOAnalyzer(provider=provider)
    return await analyzer.analyze_seo_data(page_data)
