"""
Article Schema.org models.

Provides strict typing for:
- Article: General articles
- NewsArticle: News content
- BlogPosting: Blog posts
"""

from datetime import datetime, date
from typing import Any, Dict, List, Optional, Union
from pydantic import Field, field_validator

from .base import SchemaOrgBase, ImageObject
from .person import PersonSchema


class ArticleSchema(SchemaOrgBase):
    """
    Schema.org Article type.
    
    Key GEO properties:
    - headline: Should match the primary user intent (first 50 tokens matter!)
    - author: E-E-A-T signal - must link to credentialed person
    - datePublished/dateModified: Freshness signal for LLMs
    - mentions: Extracted entities from Knowledge Graph
    - about: Primary topic(s) the article covers
    - speakable: Sections optimized for voice/AI assistants
    """
    
    # Core content
    headline: str
    alternative_headline: Optional[str] = Field(
        default=None, alias="alternativeHeadline"
    )
    description: Optional[str] = None  # Meta description
    article_body: Optional[str] = Field(default=None, alias="articleBody")
    
    # Visual
    image: Optional[Union[str, List[str], ImageObject]] = None
    thumbnail_url: Optional[str] = Field(default=None, alias="thumbnailUrl")
    
    # Authorship (critical for E-E-A-T)
    author: Optional[Union[PersonSchema, List[PersonSchema], Dict[str, Any]]] = None
    creator: Optional[Union[PersonSchema, Dict[str, Any]]] = None
    
    # Publisher (organization)
    publisher: Optional[Dict[str, Any]] = None
    
    # Dates (freshness signals)
    date_published: Optional[Union[datetime, date, str]] = Field(
        default=None, alias="datePublished"
    )
    date_modified: Optional[Union[datetime, date, str]] = Field(
        default=None, alias="dateModified"
    )
    date_created: Optional[Union[datetime, date, str]] = Field(
        default=None, alias="dateCreated"
    )
    
    # Topic classification (helps LLM categorization)
    about: Optional[List[Dict[str, Any]]] = None  # Topics from Knowledge Graph
    article_section: Optional[str] = Field(default=None, alias="articleSection")
    keywords: Optional[Union[str, List[str]]] = None
    
    # Word count (signals depth)
    word_count: Optional[int] = Field(default=None, alias="wordCount")
    
    # Language
    in_language: Optional[str] = Field(default=None, alias="inLanguage")
    
    # Source/citations
    citation: Optional[Union[str, List[str]]] = None
    is_based_on: Optional[Union[str, List[str]]] = Field(
        default=None, alias="isBasedOn"
    )
    
    # Voice/AI optimization
    speakable: Optional[Dict[str, Any]] = None
    
    # Accessibility
    accessibility_feature: Optional[List[str]] = Field(
        default=None, alias="accessibilityFeature"
    )
    
    @field_validator("date_published", "date_modified", "date_created", mode="before")
    @classmethod
    def parse_dates(cls, v):
        """Parse various date formats to datetime."""
        if v is None:
            return None
        if isinstance(v, (datetime, date)):
            return v
        if isinstance(v, str):
            try:
                return datetime.fromisoformat(v.replace("Z", "+00:00"))
            except ValueError:
                return v
        return v
    
    @classmethod
    def get_schema_type(cls) -> str:
        return "Article"
    
    def with_publisher(
        self,
        name: str,
        logo_url: Optional[str] = None,
        url: Optional[str] = None
    ) -> "ArticleSchema":
        """
        Add publisher information.
        
        Args:
            name: Publisher/organization name
            logo_url: Logo image URL
            url: Publisher website URL
        
        Returns:
            Self with publisher populated
        """
        publisher = {
            "@type": "Organization",
            "name": name
        }
        
        if logo_url:
            publisher["logo"] = {
                "@type": "ImageObject",
                "url": logo_url
            }
        
        if url:
            publisher["url"] = url
        
        self.publisher = publisher
        return self
    
    def with_speakable(
        self,
        css_selectors: Optional[List[str]] = None,
        xpath: Optional[List[str]] = None
    ) -> "ArticleSchema":
        """
        Add speakable specification for voice assistants.
        
        Args:
            css_selectors: CSS selectors for speakable content
            xpath: XPath expressions for speakable content
        
        Returns:
            Self with speakable populated
        """
        speakable = {"@type": "SpeakableSpecification"}
        
        if css_selectors:
            speakable["cssSelector"] = css_selectors
        if xpath:
            speakable["xpath"] = xpath
        
        self.speakable = speakable
        return self


class NewsArticleSchema(ArticleSchema):
    """
    Schema.org NewsArticle type.
    
    Extends Article with news-specific properties.
    """
    
    dateline: Optional[str] = None
    print_edition: Optional[str] = Field(default=None, alias="printEdition")
    print_page: Optional[str] = Field(default=None, alias="printPage")
    print_section: Optional[str] = Field(default=None, alias="printSection")
    
    @classmethod
    def get_schema_type(cls) -> str:
        return "NewsArticle"


class BlogPostingSchema(ArticleSchema):
    """
    Schema.org BlogPosting type.
    
    Use for blog posts and similar informal articles.
    """
    
    # Blog-specific properties
    shared_content: Optional[Dict[str, Any]] = Field(
        default=None, alias="sharedContent"
    )
    
    @classmethod
    def get_schema_type(cls) -> str:
        return "BlogPosting"
