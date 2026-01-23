"""
WebPage Schema.org model.

Generic page type that can be extended for various page types.
"""

from datetime import datetime, date
from typing import Any, Dict, List, Optional, Union
from pydantic import Field

from .base import SchemaOrgBase, ImageObject
from .person import PersonSchema


class BreadcrumbSchema(SchemaOrgBase):
    """
    Schema.org BreadcrumbList for navigation.
    
    Important for:
    - Site structure understanding by LLMs
    - Navigation context in AI responses
    """
    
    item_list_element: List[Dict[str, Any]] = Field(
        default_factory=list, alias="itemListElement"
    )
    
    @classmethod
    def get_schema_type(cls) -> str:
        return "BreadcrumbList"
    
    @classmethod
    def create(cls, items: List[tuple]) -> "BreadcrumbSchema":
        """
        Create breadcrumb from list of (name, url) tuples.
        
        Args:
            items: List of (name, url) tuples in order
        
        Returns:
            Configured BreadcrumbSchema
        
        Example:
            breadcrumb = BreadcrumbSchema.create([
                ("Home", "https://example.com"),
                ("Blog", "https://example.com/blog"),
                ("AEO Guide", "https://example.com/blog/aeo-guide"),
            ])
        """
        elements = []
        for i, (name, url) in enumerate(items, 1):
            elements.append({
                "@type": "ListItem",
                "position": i,
                "name": name,
                "item": url
            })
        
        return cls(itemListElement=elements)


class WebPageSchema(SchemaOrgBase):
    """
    Schema.org WebPage type.
    
    Base type for web pages. Use more specific types when applicable:
    - FAQPage for FAQ content
    - AboutPage for about pages
    - ContactPage for contact pages
    - SearchResultsPage for search results
    """
    
    # Core content
    name: str  # Page title
    description: Optional[str] = None
    
    # URL
    url: Optional[str] = None
    main_content_of_page: Optional[Dict[str, Any]] = Field(
        default=None, alias="mainContentOfPage"
    )
    
    # Dates
    date_published: Optional[Union[datetime, date, str]] = Field(
        default=None, alias="datePublished"
    )
    date_modified: Optional[Union[datetime, date, str]] = Field(
        default=None, alias="dateModified"
    )
    last_reviewed: Optional[Union[datetime, date, str]] = Field(
        default=None, alias="lastReviewed"
    )
    
    # Authorship
    author: Optional[Union[PersonSchema, Dict[str, Any]]] = None
    reviewed_by: Optional[Union[PersonSchema, Dict[str, Any]]] = Field(
        default=None, alias="reviewedBy"
    )
    
    # Navigation
    breadcrumb: Optional[BreadcrumbSchema] = None
    
    # Primary entity
    main_entity: Optional[Dict[str, Any]] = Field(
        default=None, alias="mainEntity"
    )
    
    # Language
    in_language: Optional[str] = Field(default=None, alias="inLanguage")
    
    # Visual
    primary_image_of_page: Optional[Union[str, ImageObject]] = Field(
        default=None, alias="primaryImageOfPage"
    )
    
    # Publisher
    publisher: Optional[Dict[str, Any]] = None
    
    # Voice optimization
    speakable: Optional[Dict[str, Any]] = None
    
    # Page classification
    is_part_of: Optional[Dict[str, Any]] = Field(
        default=None, alias="isPartOf"
    )
    
    @classmethod
    def get_schema_type(cls) -> str:
        return "WebPage"
    
    def with_breadcrumb(self, items: List[tuple]) -> "WebPageSchema":
        """
        Add breadcrumb navigation.
        
        Args:
            items: List of (name, url) tuples
        
        Returns:
            Self with breadcrumb populated
        """
        self.breadcrumb = BreadcrumbSchema.create(items)
        return self


class AboutPageSchema(WebPageSchema):
    """Schema.org AboutPage type."""
    
    @classmethod
    def get_schema_type(cls) -> str:
        return "AboutPage"


class ContactPageSchema(WebPageSchema):
    """Schema.org ContactPage type."""
    
    @classmethod
    def get_schema_type(cls) -> str:
        return "ContactPage"


class SearchResultsPageSchema(WebPageSchema):
    """Schema.org SearchResultsPage type."""
    
    @classmethod
    def get_schema_type(cls) -> str:
        return "SearchResultsPage"


class ItemPageSchema(WebPageSchema):
    """Schema.org ItemPage type for product/item detail pages."""
    
    @classmethod
    def get_schema_type(cls) -> str:
        return "ItemPage"


class CollectionPageSchema(WebPageSchema):
    """Schema.org CollectionPage type for category/collection pages."""
    
    @classmethod
    def get_schema_type(cls) -> str:
        return "CollectionPage"
