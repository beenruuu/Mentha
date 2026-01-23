"""
Schema.org Pydantic Models - Type-safe JSON-LD Generation for GEO/AEO.

Provides strict Pydantic models that map to Schema.org types for:
- Robust JSON-LD generation with validation
- Automatic sameAs validation (only trusted domains)
- Integration with Knowledge Graph for mentions property
- Prevention of malformed structured data

Supported Types:
- Organization: Companies, brands
- Person: Authors, experts
- Article: Blog posts, news articles
- FAQPage: FAQ content
- HowTo: How-to guides
- Product: Products and services
- WebPage: Generic pages
- LocalBusiness: Local businesses

Usage:
    from app.models.schema_org import ArticleSchema, PersonSchema
    
    author = PersonSchema(name="John Doe", url="https://example.com/john")
    article = ArticleSchema(
        headline="How to Optimize for AI",
        author=author,
        datePublished=datetime.now()
    )
    json_ld = article.to_json_ld()
"""

from .base import SchemaOrgBase, TRUSTED_SAME_AS_DOMAINS
from .organization import OrganizationSchema, LocalBusinessSchema
from .person import PersonSchema
from .article import ArticleSchema, NewsArticleSchema, BlogPostingSchema
from .faq import FAQPageSchema, QuestionSchema
from .howto import HowToSchema, HowToStepSchema
from .product import ProductSchema, OfferSchema
from .webpage import WebPageSchema

__all__ = [
    # Base
    "SchemaOrgBase",
    "TRUSTED_SAME_AS_DOMAINS",
    
    # Organization
    "OrganizationSchema",
    "LocalBusinessSchema",
    
    # Person
    "PersonSchema",
    
    # Article
    "ArticleSchema",
    "NewsArticleSchema",
    "BlogPostingSchema",
    
    # FAQ
    "FAQPageSchema",
    "QuestionSchema",
    
    # HowTo
    "HowToSchema",
    "HowToStepSchema",
    
    # Product
    "ProductSchema",
    "OfferSchema",
    
    # WebPage
    "WebPageSchema",
]
