"""
Product Schema.org models.

Essential for e-commerce GEO and product-related AI queries.
"""

from datetime import date, datetime
from typing import Any, Dict, List, Optional, Union
from pydantic import Field, field_validator

from .base import SchemaOrgBase, ImageObject


class OfferSchema(SchemaOrgBase):
    """
    Schema.org Offer type.
    
    Price and availability information for a product.
    """
    
    # Price
    price: Optional[Union[float, str]] = None
    price_currency: Optional[str] = Field(default=None, alias="priceCurrency")
    
    # Availability
    availability: Optional[str] = None  # InStock, OutOfStock, PreOrder, etc.
    
    # Validity
    price_valid_until: Optional[Union[date, str]] = Field(
        default=None, alias="priceValidUntil"
    )
    
    # Seller
    seller: Optional[Dict[str, Any]] = None
    
    # Item condition
    item_condition: Optional[str] = Field(default=None, alias="itemCondition")
    
    # Delivery
    shipping_details: Optional[Dict[str, Any]] = Field(
        default=None, alias="shippingDetails"
    )
    
    @classmethod
    def get_schema_type(cls) -> str:
        return "Offer"


class ProductSchema(SchemaOrgBase):
    """
    Schema.org Product type.
    
    Key GEO properties:
    - name: Product name (should be specific)
    - description: Clear, keyword-rich description
    - brand: Links to Organization
    - aggregateRating: Social proof
    - offers: Price and availability
    - review: Customer reviews
    """
    
    # Core identification
    name: str
    description: Optional[str] = None
    sku: Optional[str] = None
    mpn: Optional[str] = None  # Manufacturer Part Number
    gtin: Optional[str] = None  # Global Trade Item Number
    
    # Branding
    brand: Optional[Dict[str, Any]] = None
    manufacturer: Optional[Dict[str, Any]] = None
    
    # Categorization
    category: Optional[Union[str, List[str]]] = None
    
    # Visual
    image: Optional[Union[str, List[str], ImageObject]] = None
    
    # Pricing and availability
    offers: Optional[Union[OfferSchema, List[OfferSchema], Dict[str, Any]]] = None
    
    # Reviews and ratings
    aggregate_rating: Optional[Dict[str, Any]] = Field(
        default=None, alias="aggregateRating"
    )
    review: Optional[List[Dict[str, Any]]] = None
    
    # Physical properties
    weight: Optional[str] = None
    width: Optional[str] = None
    height: Optional[str] = None
    depth: Optional[str] = None
    color: Optional[str] = None
    material: Optional[str] = None
    
    # Related products
    is_related_to: Optional[List[Dict[str, Any]]] = Field(
        default=None, alias="isRelatedTo"
    )
    is_similar_to: Optional[List[Dict[str, Any]]] = Field(
        default=None, alias="isSimilarTo"
    )
    
    # Awards
    award: Optional[Union[str, List[str]]] = None
    
    @classmethod
    def get_schema_type(cls) -> str:
        return "Product"
    
    def with_brand(
        self,
        brand_name: str,
        brand_url: Optional[str] = None,
        logo_url: Optional[str] = None
    ) -> "ProductSchema":
        """
        Add brand information.
        
        Args:
            brand_name: Brand name
            brand_url: Brand website URL
            logo_url: Brand logo URL
        
        Returns:
            Self with brand populated
        """
        brand = {
            "@type": "Brand",
            "name": brand_name
        }
        
        if brand_url:
            brand["url"] = brand_url
        if logo_url:
            brand["logo"] = logo_url
        
        self.brand = brand
        return self
    
    def with_offer(
        self,
        price: float,
        currency: str = "USD",
        availability: str = "InStock"
    ) -> "ProductSchema":
        """
        Add a simple offer.
        
        Args:
            price: Product price
            currency: Currency code (ISO 4217)
            availability: Availability status
        
        Returns:
            Self with offer populated
        """
        # Map simple availability to Schema.org URLs
        availability_map = {
            "InStock": "https://schema.org/InStock",
            "OutOfStock": "https://schema.org/OutOfStock",
            "PreOrder": "https://schema.org/PreOrder",
            "LimitedAvailability": "https://schema.org/LimitedAvailability",
        }
        
        self.offers = OfferSchema(
            price=price,
            priceCurrency=currency,
            availability=availability_map.get(availability, availability)
        )
        return self
    
    def with_rating(
        self,
        rating_value: float,
        review_count: int,
        best_rating: float = 5.0,
        worst_rating: float = 1.0
    ) -> "ProductSchema":
        """
        Add aggregate rating.
        
        Args:
            rating_value: Average rating
            review_count: Number of reviews
            best_rating: Maximum possible rating
            worst_rating: Minimum possible rating
        
        Returns:
            Self with aggregateRating populated
        """
        self.aggregate_rating = {
            "@type": "AggregateRating",
            "ratingValue": rating_value,
            "reviewCount": review_count,
            "bestRating": best_rating,
            "worstRating": worst_rating
        }
        return self
