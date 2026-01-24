"""
Brand Voice Profiler - Digitizing Brand's Semantic Signature for GEO/AEO.

This service captures and quantifies the "voice signature" of a brand by
analyzing existing content. The resulting Voice Profile is used to:

1. Benchmark AI-generated content against brand standards
2. Detect "voice erosion" when LLMs represent the brand
3. Generate content recommendations aligned with brand voice
4. Calculate Voice Alignment Score in analysis results

Voice Dimensions:
- Formality: Casual (0.0) to Formal (1.0)
- Technical Depth: Consumer-friendly (0.0) to Expert (1.0)
- Emotional Tone: Neutral (0.5), Positive (1.0), Negative (0.0)
- Sentence Complexity: Simple (0.0) to Complex (1.0)
- Vocabulary Level: Basic (0.0) to Sophisticated (1.0)
- Humor: None (0.0) to High (1.0)
- Authority: Conversational (0.0) to Authoritative (1.0)

The profile generates a multi-dimensional voice vector that can be
compared against AI outputs using cosine similarity.
"""

import asyncio
import logging
import re
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import statistics
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


# Formal vs informal word indicators
FORMAL_INDICATORS = {
    "therefore", "consequently", "furthermore", "moreover", "nevertheless",
    "notwithstanding", "accordingly", "hence", "thus", "wherein", "whereby",
    "pursuant", "regarding", "concerning", "demonstrate", "utilize", "commence",
    "endeavor", "facilitate", "implement", "subsequent", "prior", "pursuant",
}

INFORMAL_INDICATORS = {
    "gonna", "wanna", "gotta", "kinda", "sorta", "yeah", "yep", "nope",
    "cool", "awesome", "great", "amazing", "basically", "literally",
    "actually", "really", "totally", "super", "pretty", "just", "so",
    "like", "stuff", "thing", "things", "okay", "ok", "hey", "hi",
}

# Technical depth indicators
TECHNICAL_INDICATORS = {
    "algorithm", "architecture", "api", "backend", "frontend", "database",
    "encryption", "protocol", "latency", "throughput", "scalability",
    "optimization", "integration", "infrastructure", "deployment", "kubernetes",
    "microservices", "analytics", "metrics", "methodology", "framework",
    "vectorization", "embedding", "neural", "tokenization", "inference",
}


class VoiceTone(str, Enum):
    """Overall voice tone classification."""
    PROFESSIONAL = "professional"
    CONVERSATIONAL = "conversational"
    ACADEMIC = "academic"
    CASUAL = "casual"
    AUTHORITATIVE = "authoritative"
    FRIENDLY = "friendly"


@dataclass
class VoiceProfile:
    """
    Quantified voice profile representing a brand's communication style.
    
    All dimension values are normalized to 0.0 - 1.0 range.
    """
    brand_id: str
    brand_name: str
    
    # Core dimensions (0.0 to 1.0)
    formality: float = 0.5
    technical_depth: float = 0.5
    emotional_positivity: float = 0.5
    sentence_complexity: float = 0.5
    vocabulary_level: float = 0.5
    humor: float = 0.1
    authority: float = 0.5
    
    # Derived metrics
    overall_tone: VoiceTone = VoiceTone.PROFESSIONAL
    avg_sentence_length: float = 15.0
    avg_word_length: float = 5.0
    unique_word_ratio: float = 0.7
    
    # Metadata
    analyzed_content_count: int = 0
    analyzed_word_count: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()
        if self.updated_at is None:
            self.updated_at = self.created_at
    
    def to_vector(self) -> List[float]:
        """
        Convert profile to a multi-dimensional vector for similarity comparison.
        
        This vector can be compared against AI-generated content vectors
        using cosine similarity to measure voice alignment.
        """
        return [
            self.formality,
            self.technical_depth,
            self.emotional_positivity,
            self.sentence_complexity,
            self.vocabulary_level,
            self.humor,
            self.authority,
        ]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage/API response."""
        return {
            "brand_id": self.brand_id,
            "brand_name": self.brand_name,
            "dimensions": {
                "formality": round(self.formality, 3),
                "technical_depth": round(self.technical_depth, 3),
                "emotional_positivity": round(self.emotional_positivity, 3),
                "sentence_complexity": round(self.sentence_complexity, 3),
                "vocabulary_level": round(self.vocabulary_level, 3),
                "humor": round(self.humor, 3),
                "authority": round(self.authority, 3),
            },
            "derived": {
                "overall_tone": self.overall_tone.value,
                "avg_sentence_length": round(self.avg_sentence_length, 1),
                "avg_word_length": round(self.avg_word_length, 2),
                "unique_word_ratio": round(self.unique_word_ratio, 3),
            },
            "metadata": {
                "analyzed_content_count": self.analyzed_content_count,
                "analyzed_word_count": self.analyzed_word_count,
                "created_at": self.created_at.isoformat() if self.created_at else None,
                "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            },
            "vector": self.to_vector(),
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "VoiceProfile":
        """Create profile from dictionary."""
        dims = data.get("dimensions", {})
        derived = data.get("derived", {})
        meta = data.get("metadata", {})
        
        return cls(
            brand_id=data.get("brand_id", ""),
            brand_name=data.get("brand_name", ""),
            formality=dims.get("formality", 0.5),
            technical_depth=dims.get("technical_depth", 0.5),
            emotional_positivity=dims.get("emotional_positivity", 0.5),
            sentence_complexity=dims.get("sentence_complexity", 0.5),
            vocabulary_level=dims.get("vocabulary_level", 0.5),
            humor=dims.get("humor", 0.1),
            authority=dims.get("authority", 0.5),
            overall_tone=VoiceTone(derived.get("overall_tone", "professional")),
            avg_sentence_length=derived.get("avg_sentence_length", 15.0),
            avg_word_length=derived.get("avg_word_length", 5.0),
            unique_word_ratio=derived.get("unique_word_ratio", 0.7),
            analyzed_content_count=meta.get("analyzed_content_count", 0),
            analyzed_word_count=meta.get("analyzed_word_count", 0),
        )


@dataclass
class VoiceAnalysisResult:
    """Result of voice analysis on a piece of content."""
    content_id: str
    content_title: str
    word_count: int
    sentence_count: int
    
    # Raw metrics
    formality_score: float
    technical_score: float
    sentiment_score: float
    complexity_score: float
    vocabulary_score: float
    
    # Analysis details
    formal_words_found: List[str] = field(default_factory=list)
    informal_words_found: List[str] = field(default_factory=list)
    technical_words_found: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "content_id": self.content_id,
            "content_title": self.content_title,
            "word_count": self.word_count,
            "sentence_count": self.sentence_count,
            "scores": {
                "formality": round(self.formality_score, 3),
                "technical": round(self.technical_score, 3),
                "sentiment": round(self.sentiment_score, 3),
                "complexity": round(self.complexity_score, 3),
                "vocabulary": round(self.vocabulary_score, 3),
            },
            "details": {
                "formal_words": self.formal_words_found[:10],
                "informal_words": self.informal_words_found[:10],
                "technical_words": self.technical_words_found[:10],
            }
        }


class BrandVoiceProfiler:
    """
    Brand Voice Profiler - Captures and quantifies brand communication style.
    
    Usage:
        profiler = get_brand_voice_profiler()
        
        # Analyze existing content
        result = await profiler.analyze_content(text, "Homepage")
        
        # Generate profile from multiple content pieces
        profile = await profiler.generate_profile(
            brand_id="xxx",
            brand_name="Mentha",
            content_samples=["Sample text 1...", "Sample text 2..."]
        )
        
        # Compare AI output against brand voice
        alignment = await profiler.calculate_voice_alignment(
            profile, ai_generated_text
        )
    """
    
    _instance: Optional["BrandVoiceProfiler"] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if hasattr(self, "_initialized") and self._initialized:
            return
        self._http_client: Optional[httpx.AsyncClient] = None
        self._initialized = True
    
    async def _get_http_client(self) -> httpx.AsyncClient:
        if self._http_client is None:
            self._http_client = httpx.AsyncClient(timeout=30.0)
        return self._http_client
    
    def _tokenize(self, text: str) -> List[str]:
        """Simple word tokenization."""
        # Remove URLs
        text = re.sub(r'https?://\S+', '', text)
        # Remove special characters but keep apostrophes
        text = re.sub(r"[^a-zA-Z'\s]", ' ', text)
        # Split and lowercase
        words = [w.lower().strip("'") for w in text.split() if len(w) > 1]
        return words
    
    def _get_sentences(self, text: str) -> List[str]:
        """Split text into sentences."""
        # Simple sentence splitting
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if len(s.strip()) > 10]
    
    def _calculate_formality(self, words: List[str]) -> Tuple[float, List[str], List[str]]:
        """Calculate formality score based on word choice."""
        word_set = set(words)
        
        formal_found = word_set.intersection(FORMAL_INDICATORS)
        informal_found = word_set.intersection(INFORMAL_INDICATORS)
        
        total_indicators = len(formal_found) + len(informal_found)
        
        if total_indicators == 0:
            return 0.5, list(formal_found), list(informal_found)
        
        formality = len(formal_found) / total_indicators
        return formality, list(formal_found), list(informal_found)
    
    def _calculate_technical_depth(self, words: List[str]) -> Tuple[float, List[str]]:
        """Calculate technical depth based on specialized vocabulary."""
        word_set = set(words)
        technical_found = word_set.intersection(TECHNICAL_INDICATORS)
        
        # Technical score based on ratio of technical words
        if len(words) == 0:
            return 0.0, list(technical_found)
        
        ratio = len(technical_found) / min(len(words), 100)  # Normalize
        score = min(1.0, ratio * 10)  # Scale up
        
        return score, list(technical_found)
    
    def _calculate_complexity(self, sentences: List[str], words: List[str]) -> Tuple[float, float, float]:
        """Calculate sentence complexity metrics."""
        if not sentences or not words:
            return 0.5, 15.0, 5.0
        
        # Average sentence length
        avg_sentence_length = len(words) / len(sentences)
        
        # Average word length
        avg_word_length = sum(len(w) for w in words) / len(words)
        
        # Complexity score
        # Higher sentence length and word length = more complex
        length_score = min(1.0, avg_sentence_length / 30)  # 30+ words = max complexity
        word_score = min(1.0, (avg_word_length - 3) / 5)  # 3-8 chars range
        
        complexity = (length_score * 0.6 + word_score * 0.4)
        
        return complexity, avg_sentence_length, avg_word_length
    
    def _calculate_vocabulary_level(self, words: List[str]) -> Tuple[float, float]:
        """Calculate vocabulary sophistication."""
        if not words:
            return 0.5, 0.0
        
        unique_words = set(words)
        unique_ratio = len(unique_words) / len(words)
        
        # Long words indicate sophistication
        long_words = [w for w in words if len(w) > 8]
        long_ratio = len(long_words) / len(words)
        
        # Combine metrics
        score = (unique_ratio * 0.5 + long_ratio * 5 * 0.5)
        score = min(1.0, score)
        
        return score, unique_ratio
    
    async def _analyze_sentiment_with_llm(self, text: str) -> float:
        """Use LLM to analyze sentiment/emotional tone."""
        openai_key = settings.OPENAI_API_KEY
        if not openai_key:
            return 0.5  # Neutral fallback
        
        try:
            client = await self._get_http_client()
            
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {openai_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o-mini",
                    "messages": [{
                        "role": "user",
                        "content": f"""Analyze the emotional tone of this text. 
Return ONLY a number between 0 and 1:
- 0.0 = Very negative tone
- 0.5 = Neutral tone
- 1.0 = Very positive tone

Text: {text[:1000]}

Score:"""
                    }],
                    "max_tokens": 10,
                    "temperature": 0
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                content = data["choices"][0]["message"]["content"].strip()
                # Extract number
                match = re.search(r'(\d+\.?\d*)', content)
                if match:
                    return min(1.0, max(0.0, float(match.group(1))))
            
            return 0.5
            
        except Exception as e:
            logger.debug(f"Sentiment analysis failed: {e}")
            return 0.5
    
    async def _analyze_voice_dimensions_with_llm(self, text: str) -> Dict[str, float]:
        """Use LLM for nuanced voice dimension analysis."""
        openai_key = settings.OPENAI_API_KEY
        if not openai_key:
            return {}
        
        try:
            client = await self._get_http_client()
            
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {openai_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o-mini",
                    "messages": [{
                        "role": "user",
                        "content": f"""Analyze the communication style of this text.
Rate each dimension from 0.0 to 1.0.

Return ONLY valid JSON:
{{
    "formality": 0.0-1.0 (0=casual, 1=formal),
    "humor": 0.0-1.0 (0=none, 1=very humorous),
    "authority": 0.0-1.0 (0=conversational, 1=authoritative),
    "emotional_positivity": 0.0-1.0 (0=negative, 0.5=neutral, 1=positive)
}}

Text: {text[:2000]}"""
                    }],
                    "max_tokens": 100,
                    "temperature": 0
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                # Extract JSON
                import json
                match = re.search(r'\{[^{}]+\}', content, re.DOTALL)
                if match:
                    return json.loads(match.group())
            
            return {}
            
        except Exception as e:
            logger.debug(f"Voice dimension analysis failed: {e}")
            return {}
    
    async def analyze_content(
        self,
        content: str,
        content_title: str = "Untitled",
        content_id: Optional[str] = None,
        use_llm: bool = True
    ) -> VoiceAnalysisResult:
        """
        Analyze a single piece of content for voice characteristics.
        
        Args:
            content: The text content to analyze
            content_title: Title for identification
            content_id: Optional unique identifier
            use_llm: Whether to use LLM for nuanced analysis
            
        Returns:
            VoiceAnalysisResult with all metrics
        """
        if content_id is None:
            import hashlib
            content_id = hashlib.md5(content.encode()).hexdigest()[:16]
        
        words = self._tokenize(content)
        sentences = self._get_sentences(content)
        
        # Calculate basic metrics
        formality, formal_words, informal_words = self._calculate_formality(words)
        technical, technical_words = self._calculate_technical_depth(words)
        complexity, avg_sent_len, avg_word_len = self._calculate_complexity(sentences, words)
        vocabulary, unique_ratio = self._calculate_vocabulary_level(words)
        
        # Get sentiment
        if use_llm:
            sentiment = await self._analyze_sentiment_with_llm(content)
        else:
            sentiment = 0.5
        
        return VoiceAnalysisResult(
            content_id=content_id,
            content_title=content_title,
            word_count=len(words),
            sentence_count=len(sentences),
            formality_score=formality,
            technical_score=technical,
            sentiment_score=sentiment,
            complexity_score=complexity,
            vocabulary_score=vocabulary,
            formal_words_found=formal_words,
            informal_words_found=informal_words,
            technical_words_found=technical_words,
        )
    
    async def generate_profile(
        self,
        brand_id: str,
        brand_name: str,
        content_samples: List[str],
        content_titles: Optional[List[str]] = None,
        use_llm: bool = True
    ) -> VoiceProfile:
        """
        Generate a comprehensive voice profile from content samples.
        
        Args:
            brand_id: Unique brand identifier
            brand_name: Brand name
            content_samples: List of text samples (blog posts, pages, etc.)
            content_titles: Optional titles for samples
            use_llm: Whether to use LLM for nuanced analysis
            
        Returns:
            VoiceProfile representing the brand's voice
        """
        if not content_samples:
            return VoiceProfile(brand_id=brand_id, brand_name=brand_name)
        
        if content_titles is None:
            content_titles = [f"Sample {i+1}" for i in range(len(content_samples))]
        
        # Analyze each piece of content
        analyses = []
        for content, title in zip(content_samples, content_titles):
            if len(content.strip()) < 50:
                continue
            analysis = await self.analyze_content(
                content, title, use_llm=use_llm
            )
            analyses.append(analysis)
        
        if not analyses:
            return VoiceProfile(brand_id=brand_id, brand_name=brand_name)
        
        # Aggregate metrics
        formality = statistics.mean([a.formality_score for a in analyses])
        technical = statistics.mean([a.technical_score for a in analyses])
        sentiment = statistics.mean([a.sentiment_score for a in analyses])
        complexity = statistics.mean([a.complexity_score for a in analyses])
        vocabulary = statistics.mean([a.vocabulary_score for a in analyses])
        
        # Use LLM for deeper analysis on combined text
        llm_dimensions = {}
        if use_llm:
            combined_text = " ".join(content_samples[:3])[:5000]
            llm_dimensions = await self._analyze_voice_dimensions_with_llm(combined_text)
        
        # Merge LLM insights
        humor = llm_dimensions.get("humor", 0.1)
        authority = llm_dimensions.get("authority", formality * 0.7 + technical * 0.3)
        
        # Determine overall tone
        tone = self._determine_tone(formality, technical, authority, humor)
        
        # Calculate derived metrics
        total_words = sum(a.word_count for a in analyses)
        total_sentences = sum(a.sentence_count for a in analyses)
        avg_sent_len = total_words / max(1, total_sentences)
        
        all_words = []
        for content in content_samples:
            all_words.extend(self._tokenize(content))
        avg_word_len = sum(len(w) for w in all_words) / max(1, len(all_words))
        unique_ratio = len(set(all_words)) / max(1, len(all_words))
        
        profile = VoiceProfile(
            brand_id=brand_id,
            brand_name=brand_name,
            formality=formality,
            technical_depth=technical,
            emotional_positivity=sentiment,
            sentence_complexity=complexity,
            vocabulary_level=vocabulary,
            humor=humor,
            authority=authority,
            overall_tone=tone,
            avg_sentence_length=avg_sent_len,
            avg_word_length=avg_word_len,
            unique_word_ratio=unique_ratio,
            analyzed_content_count=len(analyses),
            analyzed_word_count=total_words,
        )
        
        return profile
    
    def _determine_tone(
        self,
        formality: float,
        technical: float,
        authority: float,
        humor: float
    ) -> VoiceTone:
        """Determine overall voice tone from dimensions."""
        if humor > 0.5:
            return VoiceTone.CASUAL if formality < 0.5 else VoiceTone.FRIENDLY
        
        if authority > 0.7:
            return VoiceTone.AUTHORITATIVE
        
        if technical > 0.7:
            return VoiceTone.ACADEMIC if formality > 0.6 else VoiceTone.PROFESSIONAL
        
        if formality > 0.7:
            return VoiceTone.PROFESSIONAL
        
        if formality < 0.3:
            return VoiceTone.CASUAL
        
        return VoiceTone.CONVERSATIONAL
    
    async def calculate_voice_alignment(
        self,
        profile: VoiceProfile,
        text: str,
        detailed: bool = False
    ) -> Dict[str, Any]:
        """
        Calculate how well a text aligns with a brand's voice profile.
        
        Uses cosine similarity between the profile vector and the
        analyzed text vector.
        
        Args:
            profile: The brand's voice profile
            text: Text to analyze (typically AI-generated content)
            detailed: Include dimension-by-dimension breakdown
            
        Returns:
            Alignment result with overall score and optional details
        """
        # Analyze the text
        analysis = await self.analyze_content(text, "Comparison", use_llm=True)
        
        # Build comparison vector
        text_vector = [
            analysis.formality_score,
            analysis.technical_score,
            analysis.sentiment_score,
            analysis.complexity_score,
            analysis.vocabulary_score,
            0.1,  # Humor (would need LLM analysis)
            analysis.formality_score * 0.5 + analysis.technical_score * 0.5,  # Approximate authority
        ]
        
        profile_vector = profile.to_vector()
        
        # Calculate cosine similarity
        from math import sqrt
        
        dot_product = sum(a * b for a, b in zip(profile_vector, text_vector))
        magnitude_a = sqrt(sum(a ** 2 for a in profile_vector))
        magnitude_b = sqrt(sum(b ** 2 for b in text_vector))
        
        if magnitude_a == 0 or magnitude_b == 0:
            similarity = 0.0
        else:
            similarity = dot_product / (magnitude_a * magnitude_b)
        
        result = {
            "alignment_score": round(similarity * 100, 1),
            "quality": self._alignment_quality(similarity),
            "profile_brand": profile.brand_name,
        }
        
        if detailed:
            dimension_names = [
                "formality", "technical_depth", "emotional_positivity",
                "sentence_complexity", "vocabulary_level", "humor", "authority"
            ]
            
            result["dimension_comparison"] = {}
            for i, name in enumerate(dimension_names):
                diff = abs(profile_vector[i] - text_vector[i])
                result["dimension_comparison"][name] = {
                    "profile_value": round(profile_vector[i], 3),
                    "text_value": round(text_vector[i], 3),
                    "difference": round(diff, 3),
                    "aligned": diff < 0.2,
                }
        
        return result
    
    def _alignment_quality(self, similarity: float) -> str:
        """Interpret alignment score."""
        if similarity >= 0.9:
            return "excellent"
        elif similarity >= 0.75:
            return "good"
        elif similarity >= 0.6:
            return "moderate"
        elif similarity >= 0.4:
            return "low"
        else:
            return "misaligned"
    
    async def close(self):
        """Clean up resources."""
        if self._http_client:
            await self._http_client.aclose()
            self._http_client = None


# Singleton instance
_brand_voice_profiler: Optional[BrandVoiceProfiler] = None


def get_brand_voice_profiler() -> BrandVoiceProfiler:
    """Get singleton instance."""
    global _brand_voice_profiler
    if _brand_voice_profiler is None:
        _brand_voice_profiler = BrandVoiceProfiler()
    return _brand_voice_profiler
