"""
Base Schema.org Pydantic Model with shared validation logic.

All Schema.org models inherit from SchemaOrgBase which provides:
- Common @context and @type handling
- sameAs URL validation against trusted domains
- JSON-LD serialization
- Mentions property injection from Knowledge Graph
"""

from datetime import datetime, date
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field, field_validator, model_validator
from urllib.parse import urlparse
import json
import re


# Trusted domains for sameAs property
# Only URLs from these domains are allowed in sameAs to prevent spam/attacks
TRUSTED_SAME_AS_DOMAINS = {
    # Knowledge bases
    "wikipedia.org",
    "wikidata.org",
    "dbpedia.org",
    
    # Professional networks
    "linkedin.com",
    "crunchbase.com",
    
    # Social platforms
    "twitter.com",
    "x.com",
    "facebook.com",
    "instagram.com",
    "youtube.com",
    "tiktok.com",
    
    # Developer platforms
    "github.com",
    "gitlab.com",
    
    # Business directories
    "yelp.com",
    "tripadvisor.com",
    "glassdoor.com",
    
    # Government/official
    "sec.gov",
    "companieshouse.gov.uk",
    
    # Academic
    "orcid.org",
    "researchgate.net",
    "scholar.google.com",
}


def is_trusted_domain(url: str) -> bool:
    """Check if URL is from a trusted domain for sameAs."""
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        
        # Remove www. prefix
        if domain.startswith("www."):
            domain = domain[4:]
        
        # Check if domain or parent domain is trusted
        for trusted in TRUSTED_SAME_AS_DOMAINS:
            if domain == trusted or domain.endswith("." + trusted):
                return True
        
        return False
    except Exception:
        return False


class SchemaOrgBase(BaseModel):
    """
    Base model for all Schema.org types.
    
    Provides:
    - Automatic @context and @type in JSON-LD output
    - sameAs validation against trusted domains
    - Common properties (name, url, description, image)
    - JSON-LD serialization with proper formatting
    """
    
    # Core properties common to all Schema.org types
    name: Optional[str] = None
    url: Optional[str] = None
    description: Optional[str] = None
    image: Optional[Union[str, List[str]]] = None
    
    # Identity linking (validated against trusted domains)
    same_as: Optional[List[str]] = Field(default=None, alias="sameAs")
    
    # Internal ID (not serialized to JSON-LD)
    internal_id: Optional[str] = Field(default=None, exclude=True)
    
    # Mentions property for Knowledge Graph integration
    mentions: Optional[List[Dict[str, Any]]] = None
    
    # Additional properties not in the model
    additional_properties: Optional[Dict[str, Any]] = Field(default=None, exclude=True)
    
    model_config = {
        "populate_by_name": True,
        "extra": "allow"
    }
    
    @field_validator("same_as", mode="before")
    @classmethod
    def validate_same_as(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        """Validate that sameAs URLs are from trusted domains only."""
        if v is None:
            return None
        
        validated = []
        for url in v:
            if isinstance(url, str) and url.strip():
                if is_trusted_domain(url):
                    validated.append(url.strip())
                # Silently drop untrusted URLs to prevent injection
        
        return validated if validated else None
    
    @field_validator("url", mode="before")
    @classmethod
    def validate_url(cls, v: Optional[str]) -> Optional[str]:
        """Validate URL format."""
        if v is None:
            return None
        
        v = str(v).strip()
        if not v:
            return None
        
        # Basic URL validation
        if not re.match(r'^https?://', v):
            return None
        
        return v
    
    @classmethod
    def get_schema_type(cls) -> str:
        """Get the Schema.org @type for this model. Override in subclasses."""
        return "Thing"
    
    def to_json_ld(self, include_context: bool = True) -> Dict[str, Any]:
        """
        Convert model to JSON-LD format.
        
        Args:
            include_context: Whether to include @context (True for root, False for nested)
        
        Returns:
            Dict ready for JSON serialization as JSON-LD
        """
        # Start with @type
        result: Dict[str, Any] = {
            "@type": self.get_schema_type()
        }
        
        # Add @context for root objects
        if include_context:
            result = {"@context": "https://schema.org", **result}
        
        # Convert model to dict, excluding None values
        data = self.model_dump(
            by_alias=True,
            exclude_none=True,
            exclude={"internal_id", "additional_properties"}
        )
        
        # Process nested objects
        for key, value in data.items():
            if key.startswith("@"):
                continue
            
            # Handle nested SchemaOrgBase objects
            if isinstance(value, dict) and hasattr(value, "to_json_ld"):
                result[key] = value.to_json_ld(include_context=False)
            elif isinstance(value, list):
                result[key] = [
                    item.to_json_ld(include_context=False) 
                    if hasattr(item, "to_json_ld") else item
                    for item in value
                ]
            elif value is not None:
                # Convert datetime to ISO format
                if isinstance(value, (datetime, date)):
                    result[key] = value.isoformat()
                else:
                    result[key] = value
        
        # Add additional properties
        if self.additional_properties:
            for key, value in self.additional_properties.items():
                if key not in result:
                    result[key] = value
        
        return result
    
    def to_json_ld_string(self, indent: int = 2) -> str:
        """
        Convert to JSON-LD string for embedding in HTML.
        
        Returns:
            JSON string ready for <script type="application/ld+json">
        """
        return json.dumps(self.to_json_ld(), indent=indent, ensure_ascii=False)
    
    def inject_mentions_from_entities(
        self,
        entities: List[Dict[str, Any]]
    ) -> "SchemaOrgBase":
        """
        Inject mentions property from extracted entities.
        
        Used to link article to Knowledge Graph entities.
        
        Args:
            entities: List of entity dicts from NER extraction
        
        Returns:
            Self with mentions populated
        """
        if not entities:
            return self
        
        mentions = []
        for entity in entities:
            mention = {
                "@type": entity.get("type", "Thing"),
                "name": entity.get("text", entity.get("name", ""))
            }
            
            # Add sameAs if available
            same_as = entity.get("same_as", [])
            if same_as:
                # Filter through validation
                valid_same_as = [url for url in same_as if is_trusted_domain(url)]
                if valid_same_as:
                    mention["sameAs"] = valid_same_as
            
            mentions.append(mention)
        
        self.mentions = mentions
        return self


class ImageObject(SchemaOrgBase):
    """Schema.org ImageObject for structured image references."""
    
    url: str
    width: Optional[int] = None
    height: Optional[int] = None
    caption: Optional[str] = None
    
    @classmethod
    def get_schema_type(cls) -> str:
        return "ImageObject"


class ContactPoint(SchemaOrgBase):
    """Schema.org ContactPoint for contact information."""
    
    telephone: Optional[str] = None
    email: Optional[str] = None
    contact_type: Optional[str] = Field(default=None, alias="contactType")
    area_served: Optional[str] = Field(default=None, alias="areaServed")
    available_language: Optional[Union[str, List[str]]] = Field(
        default=None, alias="availableLanguage"
    )
    
    @classmethod
    def get_schema_type(cls) -> str:
        return "ContactPoint"


class PostalAddress(SchemaOrgBase):
    """Schema.org PostalAddress for physical addresses."""
    
    street_address: Optional[str] = Field(default=None, alias="streetAddress")
    address_locality: Optional[str] = Field(default=None, alias="addressLocality")
    address_region: Optional[str] = Field(default=None, alias="addressRegion")
    postal_code: Optional[str] = Field(default=None, alias="postalCode")
    address_country: Optional[str] = Field(default=None, alias="addressCountry")
    
    @classmethod
    def get_schema_type(cls) -> str:
        return "PostalAddress"


class GeoCoordinates(SchemaOrgBase):
    """Schema.org GeoCoordinates for geographic locations."""
    
    latitude: float
    longitude: float
    
    @classmethod
    def get_schema_type(cls) -> str:
        return "GeoCoordinates"
