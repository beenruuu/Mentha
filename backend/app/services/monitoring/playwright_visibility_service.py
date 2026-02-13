"""
Playwright Visibility Service - Browser-based AI Visibility Monitoring.

This service implements "synthetic probing" - automated queries to AI platforms
to measure brand visibility and Share of Model metrics.

Capabilities:
1. Browser Automation:
   - Query Perplexity, ChatGPT (web), Google AI Overviews
   - Stealth techniques to avoid bot detection
   - Residential proxy support

2. Share of Model Metrics:
   - Mention rate: % of responses mentioning the brand
   - Citation rate: % of responses citing the brand as a source
   - Sentiment analysis: Positive/negative/neutral
   - Competitor co-occurrence: How often competitors appear together

3. LLM-as-a-Judge:
   - Automated evaluation of captured responses
   - Structured scoring rubric
   - Trend detection

Architecture:
- Playwright for browser automation
- Stealth techniques for anti-bot evasion
- Redis for probe result caching
- Celery for scheduled probe execution

Note: This service requires careful ethical consideration.
Only probe public AI interfaces in compliance with their ToS.
"""

import asyncio
import logging
import hashlib
import json
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional, Set
import re

logger = logging.getLogger(__name__)

# Check for Playwright availability
try:
    from playwright.async_api import async_playwright, Browser, Page, BrowserContext
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False
    logger.warning("Playwright not installed. Browser monitoring disabled.")


class AIEngine(str, Enum):
    """Supported AI engines for probing."""
    PERPLEXITY = "perplexity"
    CHATGPT = "chatgpt"
    CLAUDE = "claude"
    GOOGLE_SGE = "google_sge"
    GEMINI = "gemini"


class MentionType(str, Enum):
    """Types of brand mentions in AI responses."""
    DIRECT = "direct"          # Brand explicitly named
    INDIRECT = "indirect"      # Brand implied/described
    CITATION = "citation"      # Brand as a source link
    RECOMMENDATION = "recommendation"  # Brand recommended
    NOT_MENTIONED = "not_mentioned"


class Sentiment(str, Enum):
    """Sentiment of brand mention."""
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"


@dataclass
class VisibilityProbe:
    """A single probe query configuration."""
    query_id: str
    query_text: str
    engine: AIEngine
    brand_name: str
    competitors: List[str] = field(default_factory=list)
    language: str = "en"
    location: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "query_id": self.query_id,
            "query_text": self.query_text,
            "engine": self.engine.value,
            "brand_name": self.brand_name,
            "competitors": self.competitors,
            "language": self.language,
            "location": self.location
        }


@dataclass
class ProbeResult:
    """Result of a single visibility probe."""
    probe: VisibilityProbe
    success: bool
    response_text: str
    response_hash: str
    citations: List[str]  # URLs cited
    brand_mentioned: bool
    mention_type: MentionType
    mention_count: int
    sentiment: Sentiment
    competitors_mentioned: List[str]
    position_in_response: Optional[int]  # Character position of first mention
    captured_at: datetime = field(default_factory=datetime.utcnow)
    error: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "query_id": self.probe.query_id,
            "query_text": self.probe.query_text,
            "engine": self.probe.engine.value,
            "success": self.success,
            "response_text": self.response_text[:1000],  # Truncate for storage
            "response_hash": self.response_hash,
            "citations": self.citations,
            "brand_mentioned": self.brand_mentioned,
            "mention_type": self.mention_type.value,
            "mention_count": self.mention_count,
            "sentiment": self.sentiment.value,
            "competitors_mentioned": self.competitors_mentioned,
            "position_in_response": self.position_in_response,
            "captured_at": self.captured_at.isoformat(),
            "error": self.error
        }


@dataclass
class ShareOfModelMetrics:
    """Aggregated Share of Model metrics."""
    brand_name: str
    period_start: datetime
    period_end: datetime
    total_probes: int
    mention_rate: float  # % of responses mentioning brand
    citation_rate: float  # % of responses citing brand
    average_position: Optional[float]  # Average position in response
    sentiment_distribution: Dict[str, float]  # positive/neutral/negative %
    competitor_overlap: Dict[str, float]  # Brand co-mentioned with competitors
    engine_breakdown: Dict[str, Dict[str, float]]  # Per-engine metrics
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "brand_name": self.brand_name,
            "period_start": self.period_start.isoformat(),
            "period_end": self.period_end.isoformat(),
            "total_probes": self.total_probes,
            "mention_rate": round(self.mention_rate, 2),
            "citation_rate": round(self.citation_rate, 2),
            "average_position": round(self.average_position, 1) if self.average_position else None,
            "sentiment_distribution": self.sentiment_distribution,
            "competitor_overlap": self.competitor_overlap,
            "engine_breakdown": self.engine_breakdown
        }


class PlaywrightVisibilityService:
    """
    Browser-based AI visibility monitoring service.
    
    Features:
    - Stealth browser automation with Playwright
    - Multi-engine support (Perplexity, ChatGPT, Google SGE)
    - LLM-as-a-Judge for response evaluation
    - Share of Model metrics aggregation
    
    Usage:
        service = get_playwright_visibility_service()
        
        probe = VisibilityProbe(
            query_id="q1",
            query_text="What is the best CRM software?",
            engine=AIEngine.PERPLEXITY,
            brand_name="Salesforce",
            competitors=["HubSpot", "Zoho", "Pipedrive"]
        )
        
        result = await service.execute_probe(probe)
        print(f"Mentioned: {result.brand_mentioned}")
    
    Note: Browser-based probing requires appropriate infrastructure
    (residential proxies, etc.) and ToS compliance.
    """
    
    _instance: Optional["PlaywrightVisibilityService"] = None
    
    def __new__(cls):
        """Singleton pattern."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize the service."""
        if hasattr(self, "_initialized") and self._initialized:
            return
        
        self._browser: Optional[Browser] = None
        self._playwright = None
        self._results_cache: Dict[str, ProbeResult] = {}
        self._initialized = True
    
    async def _ensure_browser(self) -> Optional[Browser]:
        """Ensure browser is launched."""
        if not PLAYWRIGHT_AVAILABLE:
            logger.error("Playwright not available")
            return None
        
        if self._browser is not None and self._browser.is_connected():
            return self._browser
        
        try:
            self._playwright = await async_playwright().start()
            
            # Launch with stealth options
            self._browser = await self._playwright.chromium.launch(
                headless=True,
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--disable-dev-shm-usage",
                    "--no-sandbox",
                ]
            )
            
            logger.info("Playwright browser launched")
            return self._browser
            
        except Exception as e:
            logger.error(f"Failed to launch browser: {e}")
            return None
    
    async def _create_stealth_context(self) -> Optional[BrowserContext]:
        """Create a browser context with stealth settings."""
        browser = await self._ensure_browser()
        if not browser:
            return None
        
        try:
            context = await browser.new_context(
                viewport={"width": 1920, "height": 1080},
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                locale="en-US",
                timezone_id="America/New_York",
            )
            
            # Add stealth scripts
            await context.add_init_script("""
                // Mask webdriver
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                });
                
                // Mask automation
                Object.defineProperty(navigator, 'languages', {
                    get: () => ['en-US', 'en']
                });
                
                // Mask plugins
                Object.defineProperty(navigator, 'plugins', {
                    get: () => [1, 2, 3, 4, 5]
                });
            """)
            
            return context
            
        except Exception as e:
            logger.error(f"Failed to create browser context: {e}")
            return None
    
    async def execute_probe(self, probe: VisibilityProbe) -> ProbeResult:
        """
        Execute a single visibility probe.
        
        Args:
            probe: The probe configuration
        
        Returns:
            ProbeResult with response analysis
        """
        # Currently only supports API-based analysis
        # Browser-based probing requires additional infrastructure
        logger.info(f"Executing probe: {probe.query_text[:50]}... on {probe.engine.value}")
        
        # For now, fall back to API-based probing
        return await self._execute_api_probe(probe)
    
    async def _execute_api_probe(self, probe: VisibilityProbe) -> ProbeResult:
        """
        Execute probe using API instead of browser.
        
        This is the fallback when browser-based probing
        is not available or appropriate.
        """
        try:
            # Use existing AI visibility service for API-based probing
            from app.services.analysis.ai_visibility_service import get_ai_visibility_service
            
            ai_service = get_ai_visibility_service()
            
            # Map our engine enum to service provider
            provider_map = {
                AIEngine.PERPLEXITY: "perplexity",
                AIEngine.CHATGPT: "openai",
                AIEngine.CLAUDE: "anthropic",
                AIEngine.GEMINI: "gemini",
                AIEngine.GOOGLE_SGE: "google"
            }
            
            provider = provider_map.get(probe.engine, "openai")
            
            # Check visibility
            result = await ai_service.check_brand_visibility(
                brand_name=probe.brand_name,
                query=probe.query_text,
                provider=provider
            )
            
            # Parse result
            response_text = result.get("response", "")
            response_hash = hashlib.md5(response_text.encode()).hexdigest()
            
            # Analyze response
            brand_mentioned = result.get("is_mentioned", False)
            mention_count = response_text.lower().count(probe.brand_name.lower())
            
            # Find position
            position = None
            brand_lower = probe.brand_name.lower()
            response_lower = response_text.lower()
            if brand_lower in response_lower:
                position = response_lower.index(brand_lower)
            
            # Determine mention type
            if mention_count > 0:
                if position and position < 100:
                    mention_type = MentionType.RECOMMENDATION
                else:
                    mention_type = MentionType.DIRECT
            else:
                mention_type = MentionType.NOT_MENTIONED
            
            # Check competitors
            competitors_found = []
            for comp in probe.competitors:
                if comp.lower() in response_lower:
                    competitors_found.append(comp)
            
            # Determine sentiment (simplified)
            sentiment = Sentiment.NEUTRAL
            positive_words = ["best", "excellent", "great", "recommended", "top", "leading"]
            negative_words = ["avoid", "poor", "bad", "worst", "issue", "problem"]
            
            context_start = max(0, (position or 0) - 50)
            context_end = min(len(response_text), (position or 0) + 100)
            context = response_lower[context_start:context_end]
            
            if any(word in context for word in positive_words):
                sentiment = Sentiment.POSITIVE
            elif any(word in context for word in negative_words):
                sentiment = Sentiment.NEGATIVE
            
            # Extract citations
            citations = result.get("sources", [])
            if isinstance(citations, list):
                citations = [c.get("url", c) if isinstance(c, dict) else c for c in citations]
            
            return ProbeResult(
                probe=probe,
                success=True,
                response_text=response_text,
                response_hash=response_hash,
                citations=citations[:10],
                brand_mentioned=brand_mentioned,
                mention_type=mention_type,
                mention_count=mention_count,
                sentiment=sentiment,
                competitors_mentioned=competitors_found,
                position_in_response=position
            )
            
        except Exception as e:
            logger.error(f"API probe failed: {e}")
            return ProbeResult(
                probe=probe,
                success=False,
                response_text="",
                response_hash="",
                citations=[],
                brand_mentioned=False,
                mention_type=MentionType.NOT_MENTIONED,
                mention_count=0,
                sentiment=Sentiment.NEUTRAL,
                competitors_mentioned=[],
                position_in_response=None,
                error=str(e)
            )
    
    async def execute_probes_batch(
        self,
        probes: List[VisibilityProbe],
        delay_seconds: float = 2.0
    ) -> List[ProbeResult]:
        """
        Execute multiple probes with rate limiting.
        
        Args:
            probes: List of probe configurations
            delay_seconds: Delay between probes to avoid rate limiting
        
        Returns:
            List of ProbeResult
        """
        results = []
        
        for i, probe in enumerate(probes):
            result = await self.execute_probe(probe)
            results.append(result)
            
            # Rate limiting
            if i < len(probes) - 1:
                await asyncio.sleep(delay_seconds)
        
        return results
    
    def calculate_share_of_model(
        self,
        results: List[ProbeResult],
        brand_name: str
    ) -> ShareOfModelMetrics:
        """
        Calculate Share of Model metrics from probe results.
        
        Args:
            results: List of probe results
            brand_name: Brand to calculate metrics for
        
        Returns:
            ShareOfModelMetrics with aggregated data
        """
        if not results:
            return ShareOfModelMetrics(
                brand_name=brand_name,
                period_start=datetime.utcnow(),
                period_end=datetime.utcnow(),
                total_probes=0,
                mention_rate=0,
                citation_rate=0,
                average_position=None,
                sentiment_distribution={"positive": 0, "neutral": 0, "negative": 0},
                competitor_overlap={},
                engine_breakdown={}
            )
        
        # Filter successful results
        successful = [r for r in results if r.success]
        total = len(successful)
        
        if total == 0:
            return ShareOfModelMetrics(
                brand_name=brand_name,
                period_start=min(r.captured_at for r in results),
                period_end=max(r.captured_at for r in results),
                total_probes=len(results),
                mention_rate=0,
                citation_rate=0,
                average_position=None,
                sentiment_distribution={"positive": 0, "neutral": 0, "negative": 0},
                competitor_overlap={},
                engine_breakdown={}
            )
        
        # Calculate mention rate
        mentioned = sum(1 for r in successful if r.brand_mentioned)
        mention_rate = (mentioned / total) * 100
        
        # Calculate citation rate
        brand_lower = brand_name.lower()
        cited = sum(
            1 for r in successful 
            if any(brand_lower in c.lower() for c in r.citations)
        )
        citation_rate = (cited / total) * 100
        
        # Calculate average position
        positions = [r.position_in_response for r in successful if r.position_in_response is not None]
        average_position = sum(positions) / len(positions) if positions else None
        
        # Sentiment distribution
        sentiments = {"positive": 0, "neutral": 0, "negative": 0}
        for r in successful:
            if r.brand_mentioned:
                sentiments[r.sentiment.value] += 1
        
        mentioned_total = sum(sentiments.values())
        if mentioned_total > 0:
            sentiment_distribution = {
                k: round((v / mentioned_total) * 100, 1) 
                for k, v in sentiments.items()
            }
        else:
            sentiment_distribution = sentiments
        
        # Competitor overlap
        competitor_counts: Dict[str, int] = {}
        for r in successful:
            if r.brand_mentioned:
                for comp in r.competitors_mentioned:
                    competitor_counts[comp] = competitor_counts.get(comp, 0) + 1
        
        competitor_overlap = {
            comp: round((count / mentioned) * 100, 1) if mentioned > 0 else 0
            for comp, count in competitor_counts.items()
        }
        
        # Engine breakdown
        engine_breakdown: Dict[str, Dict[str, float]] = {}
        for engine in AIEngine:
            engine_results = [r for r in successful if r.probe.engine == engine]
            if engine_results:
                engine_mentioned = sum(1 for r in engine_results if r.brand_mentioned)
                engine_total = len(engine_results)
                engine_breakdown[engine.value] = {
                    "mention_rate": round((engine_mentioned / engine_total) * 100, 1),
                    "total_probes": engine_total
                }
        
        return ShareOfModelMetrics(
            brand_name=brand_name,
            period_start=min(r.captured_at for r in successful),
            period_end=max(r.captured_at for r in successful),
            total_probes=total,
            mention_rate=mention_rate,
            citation_rate=citation_rate,
            average_position=average_position,
            sentiment_distribution=sentiment_distribution,
            competitor_overlap=competitor_overlap,
            engine_breakdown=engine_breakdown
        )
    
    async def evaluate_with_llm_judge(
        self,
        result: ProbeResult,
        rubric: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Evaluate a probe result using LLM-as-a-Judge pattern.
        
        Args:
            result: The probe result to evaluate
            rubric: Custom evaluation rubric (optional)
        
        Returns:
            Dict with structured evaluation
        """
        try:
            from app.services.llm.openai_service import OpenAIService
            
            llm = OpenAIService()
            
            default_rubric = {
                "mentioned": "Is the brand mentioned in the response?",
                "sentiment": "Is the mention positive, neutral, or negative?",
                "citation_type": "Is the brand cited as primary source, in a list, or hidden reference?",
                "share_of_voice_score": "Rate brand prominence 1-10",
                "recommendation_strength": "Is the brand recommended, mentioned, or absent?"
            }
            
            rubric = rubric or default_rubric
            
            prompt = f"""Analyze this AI-generated response about "{result.probe.query_text}".
            
Response:
{result.response_text[:2000]}

Evaluate the presence and treatment of the brand "{result.probe.brand_name}".

Return JSON with these fields:
{json.dumps(rubric, indent=2)}

Also include:
- "reasoning": Brief explanation of your evaluation
- "key_quotes": List of relevant quotes mentioning the brand
"""
            
            response = await llm.generate_response(
                prompt=prompt,
                system_prompt="You are a brand analyst evaluating AI responses for brand visibility.",
                temperature=0.1
            )
            
            # Parse JSON from response
            try:
                json_match = re.search(r'\{[\s\S]*\}', response)
                if json_match:
                    return json.loads(json_match.group())
            except json.JSONDecodeError:
                pass
            
            return {
                "error": "Failed to parse evaluation",
                "raw_response": response[:500]
            }
            
        except Exception as e:
            logger.error(f"LLM evaluation failed: {e}")
            return {"error": str(e)}
    
    async def close(self):
        """Clean up browser resources."""
        if self._browser:
            await self._browser.close()
            self._browser = None
        
        if self._playwright:
            await self._playwright.stop()
            self._playwright = None


# Singleton instance
_playwright_visibility_service: Optional[PlaywrightVisibilityService] = None


def get_playwright_visibility_service() -> PlaywrightVisibilityService:
    """Get singleton instance of PlaywrightVisibilityService."""
    global _playwright_visibility_service
    if _playwright_visibility_service is None:
        _playwright_visibility_service = PlaywrightVisibilityService()
    return _playwright_visibility_service
