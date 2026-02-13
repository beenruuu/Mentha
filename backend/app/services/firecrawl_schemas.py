"""
Pydantic schemas for Firecrawl /agent structured extraction.
These schemas define typed responses from the FIRE-1 autonomous agent.
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class BrandMention(BaseModel):
    """A single brand mention discovered by the agent."""
    source_url: str = Field(description="URL where the brand was mentioned")
    context: str = Field(description="Text surrounding the brand mention")
    sentiment: Optional[str] = Field(None, description="positive, negative, or neutral")
    ai_engine: Optional[str] = Field(None, description="AI engine that generated the response (chatgpt, perplexity, etc.)")
    position: Optional[int] = Field(None, description="Position in the response if applicable")
    discovered_at: datetime = Field(default_factory=datetime.utcnow)


class CompetitorInfo(BaseModel):
    """Competitor information discovered by the agent."""
    name: str = Field(description="Competitor company name")
    website: Optional[str] = Field(None, description="Competitor website URL")
    description: Optional[str] = Field(None, description="Brief description of the competitor")
    mentioned_alongside: List[str] = Field(default_factory=list, description="Other brands mentioned with this competitor")
    source_url: Optional[str] = Field(None, description="URL where competitor was discovered")


class IndustryMention(BaseModel):
    """Industry-related mention for visibility analysis."""
    keyword: str = Field(description="The keyword or topic")
    brands_mentioned: List[str] = Field(default_factory=list, description="Brands mentioned for this keyword")
    source_url: str = Field(description="Source URL")
    context: Optional[str] = Field(None, description="Context of the mention")


# Result Schemas for Agent Workflows
class BrandMentionsResult(BaseModel):
    """Result from brand mention discovery."""
    mentions: List[BrandMention] = Field(default_factory=list, description="List of brand mentions found")
    total_sources_checked: int = Field(default=0, description="Number of sources the agent checked")
    query_used: Optional[str] = Field(None, description="Query the agent used for discovery")


class CompetitorDiscoveryResult(BaseModel):
    """Result from competitor discovery."""
    competitors: List[CompetitorInfo] = Field(default_factory=list, description="List of competitors discovered")
    industry: Optional[str] = Field(None, description="Industry context")
    total_sources_checked: int = Field(default=0)


class IndustryVisibilityResult(BaseModel):
    """Result from industry visibility analysis."""
    keyword_mentions: List[IndustryMention] = Field(default_factory=list)
    brand_visibility_score: Optional[float] = Field(None, description="0-100 score of brand visibility")
    top_competitors: List[str] = Field(default_factory=list)


# Request Schemas for API Endpoints
class BrandMentionRequest(BaseModel):
    """Request to discover brand mentions."""
    brand_name: str = Field(description="Brand name to search for")
    industry: Optional[str] = Field(None, description="Industry context for better results")
    ai_engines: List[str] = Field(
        default=["chatgpt", "perplexity", "claude"],
        description="AI engines to check"
    )
    keywords: List[str] = Field(default_factory=list, description="Additional keywords to include in search")


class CompetitorScanRequest(BaseModel):
    """Request to scan for competitor intelligence."""
    brand_name: str = Field(description="Your brand name")
    known_competitors: List[str] = Field(default_factory=list, description="Known competitors to track")
    industry: str = Field(description="Industry for discovery")
    keywords: List[str] = Field(default_factory=list, description="Keywords to search")


class AgentJobStatus(BaseModel):
    """Status of an async agent job."""
    job_id: str
    status: str = Field(description="pending, running, completed, failed")
    progress: Optional[int] = Field(None, description="0-100 percentage")
    result: Optional[dict] = Field(None, description="Result data when completed")
    error: Optional[str] = Field(None, description="Error message if failed")
