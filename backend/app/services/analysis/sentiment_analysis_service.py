"""
Enhanced Sentiment Analysis Service - Deep sentiment analysis using LLM.

This service provides more accurate sentiment analysis than the basic keyword matching
in the AI Visibility Service. It uses LLMs to:
1. Analyze the context and tone of brand mentions
2. Extract positive and negative aspects
3. Provide a numeric sentiment score (0-100)
4. Identify trends over time
"""

import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime
import httpx

from app.core.config import settings


class SentimentAnalysisService:
    """
    Enhanced sentiment analysis service using LLM for accurate brand perception analysis.
    """
    
    # Sentiment scoring guidelines
    SENTIMENT_THRESHOLDS = {
        "very_positive": 80,  # 80-100
        "positive": 60,       # 60-79
        "neutral": 40,        # 40-59
        "negative": 20,       # 20-39
        "very_negative": 0    # 0-19
    }
    
    # Multilingual positive/negative indicators for quick pre-analysis
    SENTIMENT_INDICATORS = {
        "positive": {
            "en": ["best", "excellent", "amazing", "great", "recommended", "trusted", "leading", "innovative", "reliable", "top-rated", "favorite", "outstanding"],
            "es": ["mejor", "excelente", "increíble", "genial", "recomendado", "confiable", "líder", "innovador", "fiable", "destacado", "favorito", "sobresaliente"],
        },
        "negative": {
            "en": ["worst", "terrible", "avoid", "poor", "bad", "issues", "problems", "complaints", "unreliable", "slow", "expensive", "disappointing"],
            "es": ["peor", "terrible", "evitar", "pobre", "malo", "problemas", "quejas", "poco fiable", "lento", "caro", "decepcionante", "deficiente"],
        }
    }

    def __init__(self):
        self.openai_key = settings.OPENAI_API_KEY
        self.anthropic_key = settings.ANTHROPIC_API_KEY
        
    async def analyze_sentiment(
        self,
        brand_name: str,
        context_snippets: List[str],
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Perform deep sentiment analysis on brand mentions.
        
        Args:
            brand_name: The brand being analyzed
            context_snippets: List of text snippets containing brand mentions
            language: Language code for analysis
            
        Returns:
            Dict with sentiment score, classification, and detailed aspects
        """
        if not context_snippets:
            return {
                "overall_sentiment": "neutral",
                "sentiment_score": 50,
                "positive_aspects": [],
                "negative_aspects": [],
                "neutral_aspects": [],
                "sample_snippets": [],
                "confidence": 0,
                "analyzed_at": datetime.utcnow().isoformat() + "Z"
            }
        
        # First, do quick pre-analysis with keywords
        quick_analysis = self._quick_sentiment_check(context_snippets, language)
        
        # Then use LLM for deep analysis if we have API keys
        if self.openai_key or self.anthropic_key:
            try:
                llm_analysis = await self._llm_sentiment_analysis(
                    brand_name, 
                    context_snippets, 
                    language
                )
                
                # Merge quick and LLM analysis (LLM takes priority)
                return self._merge_analyses(quick_analysis, llm_analysis)
            except Exception as e:
                print(f"LLM sentiment analysis failed, using quick analysis: {e}")
                return quick_analysis
        
        return quick_analysis
    
    def _quick_sentiment_check(
        self, 
        snippets: List[str], 
        language: str
    ) -> Dict[str, Any]:
        """Quick keyword-based sentiment analysis."""
        text = " ".join(snippets).lower()
        
        positive_words = self.SENTIMENT_INDICATORS["positive"].get(language, self.SENTIMENT_INDICATORS["positive"]["en"])
        negative_words = self.SENTIMENT_INDICATORS["negative"].get(language, self.SENTIMENT_INDICATORS["negative"]["en"])
        
        positive_count = sum(1 for word in positive_words if word.lower() in text)
        negative_count = sum(1 for word in negative_words if word.lower() in text)
        total_signals = positive_count + negative_count
        
        if total_signals == 0:
            score = 50
            sentiment = "neutral"
        else:
            # Calculate weighted score
            positive_ratio = positive_count / total_signals
            score = int(positive_ratio * 100)
            
            if score >= 70:
                sentiment = "positive"
            elif score <= 30:
                sentiment = "negative"
            else:
                sentiment = "neutral"
        
        return {
            "overall_sentiment": sentiment,
            "sentiment_score": score,
            "positive_aspects": [],
            "negative_aspects": [],
            "neutral_aspects": [],
            "sample_snippets": snippets[:3],
            "confidence": 0.3,  # Low confidence for keyword-based
            "analyzed_at": datetime.utcnow().isoformat() + "Z",
            "method": "keyword_matching"
        }
    
    async def _llm_sentiment_analysis(
        self,
        brand_name: str,
        snippets: List[str],
        language: str
    ) -> Dict[str, Any]:
        """Use LLM for deep sentiment analysis."""
        
        # Prepare the analysis prompt
        snippets_text = "\n---\n".join(snippets[:10])  # Limit to 10 snippets
        
        prompts = {
            "en": f"""Analyze the sentiment towards the brand "{brand_name}" in the following AI-generated text snippets.

Text snippets:
{snippets_text}

Provide your analysis in the following JSON format:
{{
    "sentiment_score": <number 0-100, where 0=very negative, 50=neutral, 100=very positive>,
    "overall_sentiment": "<positive|neutral|negative|mixed>",
    "positive_aspects": ["<specific positive things mentioned about the brand>"],
    "negative_aspects": ["<specific negative things mentioned about the brand>"],
    "neutral_aspects": ["<neutral factual mentions>"],
    "reasoning": "<brief explanation of your analysis>"
}}

Only respond with valid JSON, no additional text.""",

            "es": f"""Analiza el sentimiento hacia la marca "{brand_name}" en los siguientes fragmentos de texto generados por IA.

Fragmentos de texto:
{snippets_text}

Proporciona tu análisis en el siguiente formato JSON:
{{
    "sentiment_score": <número 0-100, donde 0=muy negativo, 50=neutral, 100=muy positivo>,
    "overall_sentiment": "<positive|neutral|negative|mixed>",
    "positive_aspects": ["<cosas positivas específicas mencionadas sobre la marca>"],
    "negative_aspects": ["<cosas negativas específicas mencionadas sobre la marca>"],
    "neutral_aspects": ["<menciones neutrales y factuales>"],
    "reasoning": "<breve explicación de tu análisis>"
}}

Responde solo con JSON válido, sin texto adicional."""
        }
        
        prompt = prompts.get(language, prompts["en"])
        
        # Try OpenAI first, then Anthropic
        if self.openai_key:
            result = await self._call_openai_for_sentiment(prompt)
            if result:
                return result
        
        if self.anthropic_key:
            result = await self._call_anthropic_for_sentiment(prompt)
            if result:
                return result
        
        raise Exception("No LLM API available for sentiment analysis")
    
    async def _call_openai_for_sentiment(self, prompt: str) -> Optional[Dict[str, Any]]:
        """Call OpenAI API for sentiment analysis."""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.openai_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "gpt-4o-mini",
                        "messages": [
                            {"role": "system", "content": "You are a sentiment analysis expert. Always respond with valid JSON only."},
                            {"role": "user", "content": prompt}
                        ],
                        "max_tokens": 1000,
                        "temperature": 0.3
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    
                    # Parse JSON response
                    import json
                    try:
                        # Clean potential markdown code blocks
                        content = content.strip()
                        if content.startswith("```"):
                            content = content.split("```")[1]
                            if content.startswith("json"):
                                content = content[4:]
                        
                        analysis = json.loads(content)
                        
                        return {
                            "overall_sentiment": analysis.get("overall_sentiment", "neutral"),
                            "sentiment_score": min(100, max(0, analysis.get("sentiment_score", 50))),
                            "positive_aspects": analysis.get("positive_aspects", []),
                            "negative_aspects": analysis.get("negative_aspects", []),
                            "neutral_aspects": analysis.get("neutral_aspects", []),
                            "reasoning": analysis.get("reasoning", ""),
                            "confidence": 0.85,
                            "analyzed_at": datetime.utcnow().isoformat() + "Z",
                            "method": "openai_gpt4"
                        }
                    except json.JSONDecodeError:
                        print(f"Failed to parse OpenAI response: {content[:200]}")
                        return None
                        
        except Exception as e:
            print(f"OpenAI sentiment call failed: {e}")
            return None
    
    async def _call_anthropic_for_sentiment(self, prompt: str) -> Optional[Dict[str, Any]]:
        """Call Anthropic API for sentiment analysis."""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": self.anthropic_key,
                        "Content-Type": "application/json",
                        "anthropic-version": "2023-06-01"
                    },
                    json={
                        "model": "claude-3-haiku-20240307",
                        "max_tokens": 1000,
                        "messages": [{"role": "user", "content": prompt}]
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    content = ""
                    for block in data.get("content", []):
                        if block.get("type") == "text":
                            content += block.get("text", "")
                    
                    import json
                    try:
                        content = content.strip()
                        if content.startswith("```"):
                            content = content.split("```")[1]
                            if content.startswith("json"):
                                content = content[4:]
                        
                        analysis = json.loads(content)
                        
                        return {
                            "overall_sentiment": analysis.get("overall_sentiment", "neutral"),
                            "sentiment_score": min(100, max(0, analysis.get("sentiment_score", 50))),
                            "positive_aspects": analysis.get("positive_aspects", []),
                            "negative_aspects": analysis.get("negative_aspects", []),
                            "neutral_aspects": analysis.get("neutral_aspects", []),
                            "reasoning": analysis.get("reasoning", ""),
                            "confidence": 0.85,
                            "analyzed_at": datetime.utcnow().isoformat() + "Z",
                            "method": "anthropic_claude"
                        }
                    except json.JSONDecodeError:
                        print(f"Failed to parse Anthropic response: {content[:200]}")
                        return None
                        
        except Exception as e:
            print(f"Anthropic sentiment call failed: {e}")
            return None
    
    def _merge_analyses(
        self, 
        quick: Dict[str, Any], 
        llm: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Merge quick and LLM analyses, preferring LLM results."""
        return {
            "overall_sentiment": llm.get("overall_sentiment", quick.get("overall_sentiment")),
            "sentiment_score": llm.get("sentiment_score", quick.get("sentiment_score")),
            "positive_aspects": llm.get("positive_aspects", []),
            "negative_aspects": llm.get("negative_aspects", []),
            "neutral_aspects": llm.get("neutral_aspects", []),
            "sample_snippets": quick.get("sample_snippets", []),
            "reasoning": llm.get("reasoning", ""),
            "confidence": llm.get("confidence", quick.get("confidence")),
            "analyzed_at": llm.get("analyzed_at", quick.get("analyzed_at")),
            "method": llm.get("method", quick.get("method"))
        }
    
    async def analyze_sentiment_for_brand(
        self,
        brand_id: str,
        brand_name: str,
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Analyze sentiment for a brand by fetching existing mentions from database.
        
        This method retrieves recent brand mentions and performs sentiment analysis.
        """
        try:
            from supabase import create_client
            
            supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
            
            # Fetch recent mentions
            mentions_result = supabase.table("brand_mentions").select(
                "mention_text, context, sentiment"
            ).eq("brand_id", brand_id).order(
                "detected_at", desc=True
            ).limit(20).execute()
            
            snippets = []
            for mention in mentions_result.data or []:
                if mention.get("context"):
                    snippets.append(mention["context"])
                elif mention.get("mention_text"):
                    snippets.append(mention["mention_text"])
            
            if not snippets:
                # Try to get from visibility snapshots metadata
                visibility_result = supabase.table("ai_visibility_snapshots").select(
                    "metadata"
                ).eq("brand_id", brand_id).order(
                    "measured_at", desc=True
                ).limit(5).execute()
                
                for snapshot in visibility_result.data or []:
                    metadata = snapshot.get("metadata", {})
                    snippets.extend(metadata.get("context_snippets", []))
            
            # Perform sentiment analysis
            analysis = await self.analyze_sentiment(brand_name, snippets, language)
            
            # Persist to database
            await self._persist_sentiment_analysis(brand_id, analysis)
            
            return analysis
            
        except Exception as e:
            print(f"Brand sentiment analysis failed: {e}")
            import traceback
            traceback.print_exc()
            return {
                "overall_sentiment": "neutral",
                "sentiment_score": 50,
                "error": str(e)
            }
    
    async def _persist_sentiment_analysis(
        self,
        brand_id: str,
        analysis: Dict[str, Any]
    ) -> bool:
        """Persist sentiment analysis to database."""
        try:
            from supabase import create_client
            
            supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
            
            # Determine trend by comparing with previous analysis
            prev_result = supabase.table("sentiment_analysis").select(
                "sentiment_score"
            ).eq("brand_id", brand_id).order(
                "analyzed_at", desc=True
            ).limit(1).execute()
            
            trend = "stable"
            if prev_result.data:
                prev_score = prev_result.data[0].get("sentiment_score", 50)
                current_score = analysis.get("sentiment_score", 50)
                if current_score > prev_score + 5:
                    trend = "improving"
                elif current_score < prev_score - 5:
                    trend = "declining"
            
            # Insert new analysis
            data = {
                "brand_id": brand_id,
                "ai_model": "openai",  # Primary model used
                "overall_sentiment": analysis.get("overall_sentiment", "neutral"),
                "sentiment_score": analysis.get("sentiment_score", 50),
                "positive_aspects": analysis.get("positive_aspects", []),
                "negative_aspects": analysis.get("negative_aspects", []),
                "neutral_aspects": analysis.get("neutral_aspects", []),
                "sample_snippets": analysis.get("sample_snippets", []),
                "trend": trend,
                "metadata": {
                    "method": analysis.get("method"),
                    "confidence": analysis.get("confidence"),
                    "reasoning": analysis.get("reasoning", "")
                }
            }
            
            result = supabase.table("sentiment_analysis").insert(data).execute()
            return bool(result.data)
            
        except Exception as e:
            print(f"Failed to persist sentiment analysis: {e}")
            return False
    
    def calculate_sentiment_trend(
        self,
        historical_scores: List[Dict[str, Any]]
    ) -> str:
        """Calculate sentiment trend from historical data."""
        if len(historical_scores) < 2:
            return "stable"
        
        # Get last 5 scores
        recent_scores = [s.get("sentiment_score", 50) for s in historical_scores[:5]]
        older_scores = [s.get("sentiment_score", 50) for s in historical_scores[5:10]] if len(historical_scores) > 5 else recent_scores
        
        avg_recent = sum(recent_scores) / len(recent_scores)
        avg_older = sum(older_scores) / len(older_scores)
        
        diff = avg_recent - avg_older
        
        if diff > 10:
            return "improving"
        elif diff < -10:
            return "declining"
        return "stable"


# Singleton instance
_sentiment_service: Optional[SentimentAnalysisService] = None

def get_sentiment_analysis_service() -> SentimentAnalysisService:
    """Get singleton instance of SentimentAnalysisService."""
    global _sentiment_service
    if _sentiment_service is None:
        _sentiment_service = SentimentAnalysisService()
    return _sentiment_service
