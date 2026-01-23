"""
Organization Schema.org models.

Provides strict typing for:
- Organization: General companies, brands
- LocalBusiness: Physical local businesses
"""

from datetime import date
from typing import Any, Dict, List, Optional, Union
from pydantic import Field

from .base import SchemaOrgBase, ContactPoint, PostalAddress, GeoCoordinates, ImageObject


class OrganizationSchema(SchemaOrgBase):
    """
    Schema.org Organization type.
    
    Use for companies, brands, NGOs, etc.
    
    Key GEO properties:
    - sameAs: Links to authoritative profiles (Wikipedia, LinkedIn, Crunchbase)
    - legalName: Helps LLMs disambiguate the organization
    - foundingDate: Establishes credibility/history
    - knowsAbout: Declares expertise areas (helps topic matching)
    """
    
    # Core identity
    name: str
    legal_name: Optional[str] = Field(default=None, alias="legalName")
    alternate_name: Optional[Union[str, List[str]]] = Field(
        default=None, alias="alternateName"
    )
    
    # Contact & location
    email: Optional[str] = None
    telephone: Optional[str] = None
    address: Optional[PostalAddress] = None
    contact_point: Optional[Union[ContactPoint, List[ContactPoint]]] = Field(
        default=None, alias="contactPoint"
    )
    
    # Branding
    logo: Optional[Union[str, ImageObject]] = None
    
    # History & credibility
    founding_date: Optional[date] = Field(default=None, alias="foundingDate")
    founding_location: Optional[str] = Field(default=None, alias="foundingLocation")
    
    # Business identifiers (important for disambiguation)
    duns: Optional[str] = None  # D-U-N-S Number
    iso6523_code: Optional[str] = Field(default=None, alias="iso6523Code")
    tax_id: Optional[str] = Field(default=None, alias="taxID")
    
    # Expertise declaration (critical for GEO)
    knows_about: Optional[List[str]] = Field(default=None, alias="knowsAbout")
    
    # Employees/team
    number_of_employees: Optional[int] = Field(default=None, alias="numberOfEmployees")
    employee: Optional[List["PersonSchema"]] = None  # Forward reference
    founder: Optional[Union["PersonSchema", List["PersonSchema"]]] = None
    
    # Social proof
    award: Optional[Union[str, List[str]]] = None
    
    # Industry classification
    naics_code: Optional[str] = Field(default=None, alias="naics")
    isic_v4: Optional[str] = Field(default=None, alias="isicV4")
    
    # Parent/subsidiary relationships
    parent_organization: Optional["OrganizationSchema"] = Field(
        default=None, alias="parentOrganization"
    )
    sub_organization: Optional[List["OrganizationSchema"]] = Field(
        default=None, alias="subOrganization"
    )
    
    @classmethod
    def get_schema_type(cls) -> str:
        return "Organization"


class LocalBusinessSchema(OrganizationSchema):
    """
    Schema.org LocalBusiness type.
    
    Extends Organization with location-specific properties
    critical for local SEO and geo-targeted AI responses.
    
    Key GEO properties:
    - geo: Precise coordinates for location matching
    - areaServed: Explicit service area declaration
    - openingHours: Operational availability
    - priceRange: Quick context for AI responses
    """
    
    # Geographic precision
    geo: Optional[GeoCoordinates] = None
    has_map: Optional[str] = Field(default=None, alias="hasMap")
    
    # Service area (critical for local AI queries)
    area_served: Optional[Union[str, List[str]]] = Field(
        default=None, alias="areaServed"
    )
    
    # Operational details
    opening_hours: Optional[str] = Field(default=None, alias="openingHours")
    opening_hours_specification: Optional[List[Dict[str, Any]]] = Field(
        default=None, alias="openingHoursSpecification"
    )
    
    # Quick context
    price_range: Optional[str] = Field(default=None, alias="priceRange")
    currencies_accepted: Optional[str] = Field(default=None, alias="currenciesAccepted")
    payment_accepted: Optional[str] = Field(default=None, alias="paymentAccepted")
    
    # Reviews aggregate
    aggregate_rating: Optional[Dict[str, Any]] = Field(
        default=None, alias="aggregateRating"
    )
    review: Optional[List[Dict[str, Any]]] = None
    
    @classmethod
    def get_schema_type(cls) -> str:
        return "LocalBusiness"


# Import PersonSchema for forward references
from .person import PersonSchema

# Update forward references
OrganizationSchema.model_rebuild()
LocalBusinessSchema.model_rebuild()
