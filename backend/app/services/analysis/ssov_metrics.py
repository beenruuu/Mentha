"""
Semantic Share of Voice (SSoV) Metrics Module.

Traditional "Share of Voice" measures brand mentions across media.
Semantic Share of Voice measures brand presence in AI-generated responses,
weighted by sentiment and prominence.

Formula:
    SSoV = (Brand Mentions / Total Mentions) * Sentiment Weight * Prominence Weight

Components:
- Brand Mentions: How often the brand appears in AI responses
- Total Mentions: How often competitors appear in the same responses
- Sentiment Weight: Positive sentiment amplifies, negative diminishes
- Prominence Weight: Featured (first/recommended) > Listed > Mentioned

This is THE key metric for AEO/GEO success - it measures actual
visibility in the AI ecosystem, not traditional search rankings.

Architecture:
- Async data collection from multiple AI platforms
- Sentiment analysis integration
- Historical tracking for trend analysis
- Competitor comparison
"""

import asyncio
import json
import logging
from typing import Dict, Any, List, Optional, Set, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import re

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class ProminenceLevel(str, Enum):
    """How prominently the brand is featured in the response."""
    FEATURED = "featured"  # Recommended, positioned first, highlighted
    LISTED = "listed"  # Part of a list of options
    MENTIONED = "mentioned"  # Passing mention
    HIDDEN = "hidden"  # Only in citations, not visible
    ABSENT = "absent"  # Not present at all


class SentimentCategory(str, Enum):
    """Sentiment of the brand mention."""
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"
    MIXED = "mixed"


@dataclass
class BrandMention:
    """A single brand mention in an AI response."""
    brand_name: str
    query: str
    source_model: str  # "openai", "anthropic", "perplexity", etc.
    
    # Mention details
    prominence: ProminenceLevel = ProminenceLevel.MENTIONED
    sentiment: SentimentCategory = SentimentCategory.NEUTRAL
    position: int = 0  # Position in response (1=first, 0=not found)
    
    # Context
    mention_text: str = ""  # The actual sentence containing the mention
    is_cited: bool = False  # Does the response cite the brand's website?
    
    # Scores
    raw_score: float = 0.0  # 0-1 base score
    sentiment_weight: float = 1.0  # Multiplier based on sentiment
    prominence_weight: float = 1.0  # Multiplier based on prominence
    final_score: float = 0.0  # Combined score
    
    timestamp: Optional[datetime] = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow()
        
        # Calculate weights
        self._calculate_weights()
        self._calculate_final_score()
    
    def _calculate_weights(self):
        """Calculate sentiment and prominence weights."""
        # Sentiment weights
        sentiment_weights = {
            SentimentCategory.POSITIVE: 1.3,
            SentimentCategory.NEUTRAL: 1.0,
            SentimentCategory.MIXED: 0.8,
            SentimentCategory.NEGATIVE: 0.5,
        }
        self.sentiment_weight = sentiment_weights.get(self.sentiment, 1.0)
        
        # Prominence weights
        prominence_weights = {
            ProminenceLevel.FEATURED: 2.0,
            ProminenceLevel.LISTED: 1.0,
            ProminenceLevel.MENTIONED: 0.5,
            ProminenceLevel.HIDDEN: 0.2,
            ProminenceLevel.ABSENT: 0.0,
        }
        self.prominence_weight = prominence_weights.get(self.prominence, 0.0)
    
    def _calculate_final_score(self):
        """Calculate final weighted score."""
        if self.prominence == ProminenceLevel.ABSENT:
            self.final_score = 0.0
        else:
            # Base score starts at 1.0 for a mention
            self.raw_score = 1.0
            # Apply weights
            self.final_score = self.raw_score * self.sentiment_weight * self.prominence_weight
            # Bonus for being cited
            if self.is_cited:
                self.final_score *= 1.2
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "brand": self.brand_name,
            "query": self.query,
            "model": self.source_model,
            "prominence": self.prominence.value,
            "sentiment": self.sentiment.value,
            "position": self.position,
            "mention_text": self.mention_text[:200] if self.mention_text else "",
            "is_cited": self.is_cited,
            "scores": {
                "raw": round(self.raw_score, 2),
                "sentiment_weight": round(self.sentiment_weight, 2),
                "prominence_weight": round(self.prominence_weight, 2),
                "final": round(self.final_score, 2),
            },
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }


@dataclass
class CompetitorComparison:
    """Comparison of brand vs competitor SSoV."""
    competitor_name: str
    competitor_ssov: float
    brand_ssov: float
    
    # Difference
    ssov_delta: float = 0.0  # positive = brand winning
    
    # Details
    competitor_mentions: int = 0
    brand_mentions: int = 0
    
    # Segments where brand leads/lags
    winning_queries: List[str] = field(default_factory=list)
    losing_queries: List[str] = field(default_factory=list)
    
    def __post_init__(self):
        self.ssov_delta = self.brand_ssov - self.competitor_ssov
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "competitor": self.competitor_name,
            "competitor_ssov": round(self.competitor_ssov, 1),
            "brand_ssov": round(self.brand_ssov, 1),
            "delta": round(self.ssov_delta, 1),
            "brand_leading": self.ssov_delta > 0,
            "competitor_mentions": self.competitor_mentions,
            "brand_mentions": self.brand_mentions,
            "winning_queries": self.winning_queries[:5],
            "losing_queries": self.losing_queries[:5],
        }


@dataclass
class SSoVResult:
    """Complete Semantic Share of Voice analysis result."""
    brand_name: str
    analysis_period: str  # "instant", "24h", "7d", "30d"
    
    # Core metrics
    ssov_score: float = 0.0  # 0-100 percentage
    total_mentions: int = 0
    brand_mentions: int = 0
    competitor_mentions: int = 0
    
    # Weighted scores
    raw_ssov: float = 0.0  # Unweighted
    sentiment_adjusted_ssov: float = 0.0  # Sentiment weighted
    prominence_adjusted_ssov: float = 0.0  # Prominence weighted
    
    # Breakdown by model
    model_breakdown: Dict[str, float] = field(default_factory=dict)  # model -> ssov
    
    # Breakdown by query type
    query_breakdown: Dict[str, float] = field(default_factory=dict)  # query_type -> ssov
    
    # Individual mentions
    mentions: List[BrandMention] = field(default_factory=list)
    
    # Competitor comparisons
    competitor_comparisons: List[CompetitorComparison] = field(default_factory=list)
    
    # Trends
    trend_direction: str = "stable"  # "up", "down", "stable"
    trend_percentage: float = 0.0
    
    # Recommendations
    recommendations: List[str] = field(default_factory=list)
    
    analysis_timestamp: Optional[datetime] = None
    
    def __post_init__(self):
        if self.analysis_timestamp is None:
            self.analysis_timestamp = datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "brand_name": self.brand_name,
            "period": self.analysis_period,
            "ssov": {
                "score": round(self.ssov_score, 1),
                "raw": round(self.raw_ssov, 1),
                "sentiment_adjusted": round(self.sentiment_adjusted_ssov, 1),
                "prominence_adjusted": round(self.prominence_adjusted_ssov, 1),
            },
            "mentions": {
                "total": self.total_mentions,
                "brand": self.brand_mentions,
                "competitors": self.competitor_mentions,
            },
            "breakdown": {
                "by_model": self.model_breakdown,
                "by_query_type": self.query_breakdown,
            },
            "mention_details": [m.to_dict() for m in self.mentions[:20]],
            "competitor_comparisons": [c.to_dict() for c in self.competitor_comparisons],
            "trend": {
                "direction": self.trend_direction,
                "percentage": round(self.trend_percentage, 1),
            },
            "recommendations": self.recommendations,
            "timestamp": self.analysis_timestamp.isoformat() if self.analysis_timestamp else None,
        }


class SSoVCalculator:
    """
    Semantic Share of Voice Calculator.
    
    Measures brand presence in AI-generated responses across multiple platforms,
    weighted by sentiment and prominence.
    
    Usage:
        calculator = get_ssov_calculator()
        
        result = await calculator.calculate_ssov(
            brand_name="Mentha",
            brand_domain="mentha.ai",
            competitors=["Semrush", "Ahrefs"],
            queries=["best seo tools", "ai seo platform"],
        )
        
        print(f"SSoV Score: {result.ssov_score}%")
    """
    
    _instance: Optional["SSoVCalculator"] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if hasattr(self, "_initialized") and self._initialized:
            return
        
        self._openai_key = settings.OPENAI_API_KEY
        self._anthropic_key = settings.ANTHROPIC_API_KEY
        self._http_client: Optional[httpx.AsyncClient] = None
        self._initialized = True
    
    async def _get_http_client(self) -> httpx.AsyncClient:
        if self._http_client is None:
            self._http_client = httpx.AsyncClient(timeout=60.0)
        return self._http_client
    
    async def calculate_ssov(
        self,
        brand_name: str,
        brand_domain: str,
        competitors: List[str],
        queries: List[str],
        models: Optional[List[str]] = None,
        include_historical: bool = False
    ) -> SSoVResult:
        """
        Calculate Semantic Share of Voice.
        
        Args:
            brand_name: Brand to measure
            brand_domain: Brand's domain for citation detection
            competitors: List of competitor names
            queries: List of queries to test
            models: AI models to query (default: all available)
            include_historical: Include historical trend data
            
        Returns:
            SSoVResult with complete analysis
        """
        logger.info(f"Calculating SSoV for {brand_name} vs {len(competitors)} competitors")
        
        if models is None:
            models = ["openai", "anthropic"]
        
        result = SSoVResult(
            brand_name=brand_name,
            analysis_period="instant",
        )
        
        all_mentions: List[BrandMention] = []
        all_brands = [brand_name] + competitors
        
        # Query each model with each query
        for query in queries:
            for model in models:
                response = await self._query_model(model, query)
                if not response:
                    continue
                
                # Analyze response for all brands
                for brand in all_brands:
                    mention = await self._analyze_mention(
                        brand_name=brand,
                        brand_domain=brand_domain if brand == brand_name else "",
                        query=query,
                        model=model,
                        response=response,
                    )
                    all_mentions.append(mention)
        
        # Calculate metrics
        result.mentions = [m for m in all_mentions if m.prominence != ProminenceLevel.ABSENT]
        result.total_mentions = len([m for m in all_mentions if m.prominence != ProminenceLevel.ABSENT])
        
        brand_mentions = [m for m in all_mentions if m.brand_name == brand_name and m.prominence != ProminenceLevel.ABSENT]
        result.brand_mentions = len(brand_mentions)
        result.competitor_mentions = result.total_mentions - result.brand_mentions
        
        # Calculate raw SSoV
        if result.total_mentions > 0:
            result.raw_ssov = (result.brand_mentions / result.total_mentions) * 100
        
        # Calculate weighted SSoV
        total_weighted = sum(m.final_score for m in all_mentions)
        brand_weighted = sum(m.final_score for m in brand_mentions)
        
        if total_weighted > 0:
            result.ssov_score = (brand_weighted / total_weighted) * 100
            result.prominence_adjusted_ssov = result.ssov_score
        
        # Sentiment adjustment
        avg_sentiment = sum(m.sentiment_weight for m in brand_mentions) / max(1, len(brand_mentions))
        result.sentiment_adjusted_ssov = result.raw_ssov * avg_sentiment
        
        # Model breakdown
        for model in models:
            model_mentions = [m for m in all_mentions if m.source_model == model]
            model_brand = [m for m in model_mentions if m.brand_name == brand_name and m.prominence != ProminenceLevel.ABSENT]
            if model_mentions:
                model_total = len([m for m in model_mentions if m.prominence != ProminenceLevel.ABSENT])
                if model_total > 0:
                    result.model_breakdown[model] = (len(model_brand) / model_total) * 100
        
        # Competitor comparisons
        for comp in competitors:
            comp_mentions = [m for m in all_mentions if m.brand_name == comp and m.prominence != ProminenceLevel.ABSENT]
            comp_weighted = sum(m.final_score for m in comp_mentions)
            comp_ssov = (comp_weighted / total_weighted) * 100 if total_weighted > 0 else 0
            
            comparison = CompetitorComparison(
                competitor_name=comp,
                competitor_ssov=comp_ssov,
                brand_ssov=result.ssov_score,
                competitor_mentions=len(comp_mentions),
                brand_mentions=result.brand_mentions,
            )
            
            # Find winning/losing queries
            for query in queries:
                query_brand = [m for m in brand_mentions if m.query == query]
                query_comp = [m for m in comp_mentions if m.query == query]
                
                brand_score = sum(m.final_score for m in query_brand)
                comp_score = sum(m.final_score for m in query_comp)
                
                if brand_score > comp_score:
                    comparison.winning_queries.append(query)
                elif comp_score > brand_score:
                    comparison.losing_queries.append(query)
            
            result.competitor_comparisons.append(comparison)
        
        # Generate recommendations
        result.recommendations = self._generate_recommendations(result)
        
        logger.info(f"SSoV calculated: {result.ssov_score:.1f}% with {result.brand_mentions} brand mentions")
        
        return result
    
    async def _query_model(self, model: str, query: str) -> Optional[str]:
        """Query an AI model and return the response."""
        client = await self._get_http_client()
        
        if model == "openai" and self._openai_key:
            try:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self._openai_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "gpt-4o-mini",
                        "messages": [{"role": "user", "content": query}],
                        "max_tokens": 500,
                        "temperature": 0.7,
                    },
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data["choices"][0]["message"]["content"]
            except Exception as e:
                logger.warning(f"OpenAI query failed: {e}")
        
        elif model == "anthropic" and self._anthropic_key:
            try:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": self._anthropic_key,
                        "Content-Type": "application/json",
                        "anthropic-version": "2023-06-01",
                    },
                    json={
                        "model": "claude-3-haiku-20240307",
                        "max_tokens": 500,
                        "messages": [{"role": "user", "content": query}],
                    },
                )
                
                if response.status_code == 200:
                    data = response.json()
                    content = ""
                    for block in data.get("content", []):
                        if block.get("type") == "text":
                            content += block.get("text", "")
                    return content
            except Exception as e:
                logger.warning(f"Anthropic query failed: {e}")
        
        return None
    
    async def _analyze_mention(
        self,
        brand_name: str,
        brand_domain: str,
        query: str,
        model: str,
        response: str
    ) -> BrandMention:
        """Analyze a response for brand mention details."""
        response_lower = response.lower()
        brand_lower = brand_name.lower()
        
        mention = BrandMention(
            brand_name=brand_name,
            query=query,
            source_model=model,
        )
        
        # Check if brand is mentioned
        if brand_lower not in response_lower:
            mention.prominence = ProminenceLevel.ABSENT
            return mention
        
        # Find the position and context
        position = response_lower.find(brand_lower)
        mention.position = position
        
        # Extract mention context
        start = max(0, position - 50)
        end = min(len(response), position + len(brand_name) + 100)
        mention.mention_text = response[start:end]
        
        # Determine prominence
        mention.prominence = self._determine_prominence(response, brand_name)
        
        # Check for citation
        if brand_domain:
            domain_patterns = [
                brand_domain,
                brand_domain.replace("www.", ""),
                f"https://{brand_domain}",
                f"http://{brand_domain}",
            ]
            for pattern in domain_patterns:
                if pattern.lower() in response_lower:
                    mention.is_cited = True
                    break
        
        # Analyze sentiment
        mention.sentiment = await self._analyze_sentiment(mention.mention_text, brand_name)
        
        # Recalculate weights and score
        mention._calculate_weights()
        mention._calculate_final_score()
        
        return mention
    
    def _determine_prominence(self, response: str, brand_name: str) -> ProminenceLevel:
        """Determine how prominently the brand is featured."""
        response_lower = response.lower()
        brand_lower = brand_name.lower()
        
        # Check for featured indicators
        featured_patterns = [
            f"recommend {brand_lower}",
            f"{brand_lower} is the best",
            f"top choice.*{brand_lower}",
            f"best.*is {brand_lower}",
            f"{brand_lower}.*is excellent",
            f"i recommend {brand_lower}",
            f"definitely {brand_lower}",
        ]
        
        for pattern in featured_patterns:
            if re.search(pattern, response_lower):
                return ProminenceLevel.FEATURED
        
        # Check if it's in a list
        list_patterns = [
            r"^\d+\.",  # Numbered list
            r"^[-•*]",  # Bullet list
            r"options include",
            r"alternatives:",
            r"you could try",
        ]
        
        lines = response.split("\n")
        for line in lines:
            if brand_lower in line.lower():
                for pattern in list_patterns:
                    if re.search(pattern, line):
                        return ProminenceLevel.LISTED
        
        # Check if it's early in the response (first 20%)
        position = response_lower.find(brand_lower)
        if position < len(response) * 0.2:
            return ProminenceLevel.LISTED
        
        return ProminenceLevel.MENTIONED
    
    async def _analyze_sentiment(self, text: str, brand_name: str) -> SentimentCategory:
        """Analyze sentiment of brand mention."""
        if not text:
            return SentimentCategory.NEUTRAL
        
        text_lower = text.lower()
        
        # Quick keyword-based sentiment
        positive_words = {
            "excellent", "great", "best", "recommend", "love", "amazing",
            "fantastic", "good", "perfect", "ideal", "top", "leading",
            "innovative", "powerful", "reliable", "trusted",
        }
        
        negative_words = {
            "bad", "poor", "avoid", "problem", "issue", "difficult",
            "expensive", "slow", "limited", "outdated", "complex",
            "disappointing", "frustrating", "lacking",
        }
        
        positive_count = sum(1 for w in positive_words if w in text_lower)
        negative_count = sum(1 for w in negative_words if w in text_lower)
        
        if positive_count > 0 and negative_count > 0:
            return SentimentCategory.MIXED
        elif positive_count > negative_count:
            return SentimentCategory.POSITIVE
        elif negative_count > positive_count:
            return SentimentCategory.NEGATIVE
        else:
            return SentimentCategory.NEUTRAL
    
    def _generate_recommendations(self, result: SSoVResult) -> List[str]:
        """Generate recommendations based on SSoV analysis."""
        recommendations = []
        
        if result.ssov_score < 30:
            recommendations.append(
                "Low SSoV detected. Increase brand mentions in AI training data "
                "by publishing authoritative content on high-traffic sites."
            )
        
        if result.brand_mentions < result.competitor_mentions:
            recommendations.append(
                f"Competitors are mentioned {result.competitor_mentions} times vs your {result.brand_mentions}. "
                "Focus on building topical authority through comprehensive content."
            )
        
        # Check model-specific performance
        for model, score in result.model_breakdown.items():
            if score < 20:
                recommendations.append(
                    f"Low visibility on {model.title()} ({score:.0f}%). "
                    f"Create content specifically optimized for this model's knowledge cutoff."
                )
        
        # Check competitor-specific issues
        for comp in result.competitor_comparisons:
            if comp.ssov_delta < -20:
                recommendations.append(
                    f"{comp.competitor_name} has +{abs(comp.ssov_delta):.0f}% higher SSoV. "
                    f"Analyze their content strategy for: {', '.join(comp.losing_queries[:3])}."
                )
        
        if not recommendations:
            recommendations.append(
                "SSoV is competitive. Continue monitoring and maintain content freshness."
            )
        
        return recommendations
    
    async def track_ssov_over_time(
        self,
        brand_id: str,
        brand_name: str,
        current_ssov: SSoVResult,
        db_service: Any = None
    ) -> Dict[str, Any]:
        """
        Track SSoV changes over time and return trend data.
        
        This would persist snapshots to database for historical analysis.
        """
        # TODO: Implement database persistence for SSoV snapshots
        # For now, return the current snapshot formatted for storage
        
        snapshot = {
            "brand_id": brand_id,
            "brand_name": brand_name,
            "timestamp": datetime.utcnow().isoformat(),
            "ssov_score": current_ssov.ssov_score,
            "raw_ssov": current_ssov.raw_ssov,
            "brand_mentions": current_ssov.brand_mentions,
            "total_mentions": current_ssov.total_mentions,
            "model_breakdown": current_ssov.model_breakdown,
            "competitor_scores": {
                c.competitor_name: c.competitor_ssov
                for c in current_ssov.competitor_comparisons
            },
        }
        
        return snapshot
    
    async def close(self):
        """Clean up resources."""
        if self._http_client:
            await self._http_client.aclose()
            self._http_client = None


# Singleton instance
_ssov_calculator: Optional[SSoVCalculator] = None


def get_ssov_calculator() -> SSoVCalculator:
    """Get singleton instance."""
    global _ssov_calculator
    if _ssov_calculator is None:
        _ssov_calculator = SSoVCalculator()
    return _ssov_calculator
