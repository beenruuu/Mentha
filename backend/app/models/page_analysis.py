"""
Page Analysis Models - Pydantic models for page and website SEO analysis.
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime
from enum import Enum


class PageAnalysisStatus(str, Enum):
    """Status of a page analysis."""
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class PageMetadata(BaseModel):
    """Page metadata extracted during analysis."""
    title: str = ""
    description: str = ""
    author: str = ""
    keywords: str = ""
    canonical: str = ""
    robots: str = ""


class ContentAnalysis(BaseModel):
    """Content analysis metrics."""
    word_count: int = 0
    sentence_count: int = 0
    avg_words_per_sentence: float = 0
    content_length: int = 0


class AEOSignals(BaseModel):
    """AI Engine Optimization signals."""
    has_faq_structure: bool = False
    has_how_to_structure: bool = False
    has_article_structure: bool = False
    question_content_ratio: int = 0
    has_clear_entity_references: bool = False
    conversational_readiness_score: int = 0


class LinkInfo(BaseModel):
    """Information about a link on the page."""
    href: str
    text: str = ""
    title: str = ""
    is_external: bool = False
    nofollow: bool = False


class ImageInfo(BaseModel):
    """Information about an image on the page."""
    src: str
    alt: str = ""
    has_alt: bool = False


class PageAnalysisBase(BaseModel):
    """Base model for page analysis."""
    url: str
    status: PageAnalysisStatus = PageAnalysisStatus.pending
    metadata: Optional[PageMetadata] = None
    content_analysis: Optional[ContentAnalysis] = None
    seo_warnings: List[str] = []
    headings: Dict[str, List[str]] = {}
    additional_tags: Dict[str, Any] = {}
    links: List[LinkInfo] = []
    images: List[ImageInfo] = []
    keywords: Dict[str, int] = {}
    bigrams: Dict[str, int] = {}
    trigrams: Dict[str, int] = {}
    aeo_signals: Optional[AEOSignals] = None
    content_hash: Optional[str] = None


class PageAnalysisCreate(BaseModel):
    """Request model for creating a page analysis."""
    url: str
    analyze_headings: bool = True
    analyze_extra_tags: bool = True
    extract_links: bool = True
    run_llm_analysis: bool = False
    llm_provider: Optional[str] = "openai"


class PageAnalysisResponse(PageAnalysisBase):
    """Response model for page analysis."""
    id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    brand_id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    llm_analysis: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    
    class Config:
        from_attributes = True


class WebsiteCrawlRequest(BaseModel):
    """Request model for website crawl."""
    base_url: str
    sitemap_url: Optional[str] = None
    max_pages: int = Field(default=50, le=200, ge=1)
    follow_links: bool = True
    run_llm_analysis: bool = False
    llm_provider: Optional[str] = "openai"


class CrawlKeyword(BaseModel):
    """Keyword found during crawl."""
    word: str
    count: int


class WebsiteCrawlResponse(BaseModel):
    """Response model for website crawl."""
    id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    brand_id: Optional[UUID] = None
    base_url: str
    status: PageAnalysisStatus = PageAnalysisStatus.pending
    total_pages: int = 0
    pages: List[PageAnalysisResponse] = []
    keywords: List[CrawlKeyword] = []
    duplicate_pages: List[List[str]] = []
    errors: List[str] = []
    created_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# LLM Analysis specific models
class NEEATScores(BaseModel):
    """N-E-E-A-T-T credibility scores."""
    notability: int = Field(default=0, ge=0, le=100)
    experience: int = Field(default=0, ge=0, le=100)
    expertise: int = Field(default=0, ge=0, le=100)
    authority: int = Field(default=0, ge=0, le=100)
    trust: int = Field(default=0, ge=0, le=100)
    transparency: int = Field(default=0, ge=0, le=100)


class EntityAnalysisResult(BaseModel):
    """Entity optimization analysis result."""
    entity_assessment: str = ""
    knowledge_panel_readiness: int = Field(default=0, ge=0, le=100)
    key_improvements: List[str] = []


class CredibilityAnalysisResult(BaseModel):
    """Credibility analysis result."""
    credibility_assessment: str = ""
    neeat_scores: Optional[NEEATScores] = None
    trust_signals: List[str] = []


class ConversationAnalysisResult(BaseModel):
    """Conversational readiness analysis result."""
    conversation_readiness: str = ""
    query_patterns: List[str] = []
    engagement_score: int = Field(default=0, ge=0, le=100)
    gaps: List[str] = []


class PlatformVisibilityScores(BaseModel):
    """Visibility scores per platform type."""
    search_engines: int = Field(default=0, ge=0, le=100)
    ai_assistants: int = Field(default=0, ge=0, le=100)
    knowledge_graphs: int = Field(default=0, ge=0, le=100)
    social: int = Field(default=0, ge=0, le=100)


class PlatformPresenceResult(BaseModel):
    """Platform presence analysis result."""
    platform_coverage: Dict[str, str] = {}
    visibility_scores: Optional[PlatformVisibilityScores] = None
    optimization_opportunities: List[str] = []


class LLMAnalysisScores(BaseModel):
    """Summary scores from LLM analysis."""
    entity_score: float = Field(default=0, ge=0, le=100)
    credibility_score: float = Field(default=0, ge=0, le=100)
    conversation_score: float = Field(default=0, ge=0, le=100)
    platform_score: float = Field(default=0, ge=0, le=100)
    overall_score: float = Field(default=0, ge=0, le=100)


class LLMAnalysisResponse(BaseModel):
    """Complete LLM analysis response."""
    entity_analysis: Optional[EntityAnalysisResult] = None
    credibility_analysis: Optional[CredibilityAnalysisResult] = None
    conversation_analysis: Optional[ConversationAnalysisResult] = None
    platform_presence: Optional[PlatformPresenceResult] = None
    scores: Optional[LLMAnalysisScores] = None
    quick_wins: List[str] = []
    strategic_recommendations: List[str] = []
