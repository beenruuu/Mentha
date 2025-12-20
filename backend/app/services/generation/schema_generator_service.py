"""
Schema Generator Service - Auto-generate structured data schemas for AEO.

Generates:
- FAQ Schema
- HowTo Schema
- Article Schema
- Organization Schema
- LocalBusiness Schema
- Product Schema
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
import json
import logging

logger = logging.getLogger(__name__)


class SchemaGeneratorService:
    """
    Generate JSON-LD structured data schemas for AI optimization.
    """
    
    def generate_faq_schema(
        self,
        questions: List[Dict[str, str]],
        page_url: str = ""
    ) -> Dict[str, Any]:
        """
        Generate FAQPage schema.
        
        Args:
            questions: List of {question, answer} dicts
            page_url: URL of the page
            
        Returns:
            JSON-LD schema dict
        """
        main_entity = []
        for qa in questions:
            q = qa.get("question", "")
            a = qa.get("answer", "")
            if q and a:
                main_entity.append({
                    "@type": "Question",
                    "name": q,
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": a
                    }
                })
        
        schema = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": main_entity
        }
        
        if page_url:
            schema["url"] = page_url
        
        return schema
    
    def generate_howto_schema(
        self,
        name: str,
        description: str,
        steps: List[Dict[str, str]],
        total_time: str = "",
        image: str = "",
        page_url: str = ""
    ) -> Dict[str, Any]:
        """
        Generate HowTo schema.
        
        Args:
            name: Title of the how-to
            description: Brief description
            steps: List of {name, text, image?} dicts
            total_time: ISO 8601 duration (e.g., "PT30M")
            image: Featured image URL
            page_url: URL of the page
        """
        step_items = []
        for i, step in enumerate(steps, 1):
            step_item = {
                "@type": "HowToStep",
                "position": i,
                "name": step.get("name", f"Step {i}"),
                "text": step.get("text", "")
            }
            if step.get("image"):
                step_item["image"] = step["image"]
            step_items.append(step_item)
        
        schema = {
            "@context": "https://schema.org",
            "@type": "HowTo",
            "name": name,
            "description": description,
            "step": step_items
        }
        
        if total_time:
            schema["totalTime"] = total_time
        if image:
            schema["image"] = image
        if page_url:
            schema["url"] = page_url
        
        return schema
    
    def generate_article_schema(
        self,
        headline: str,
        description: str,
        author_name: str,
        date_published: str,
        date_modified: str = "",
        image: str = "",
        publisher_name: str = "",
        publisher_logo: str = "",
        page_url: str = ""
    ) -> Dict[str, Any]:
        """
        Generate Article schema.
        """
        schema = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": headline,
            "description": description,
            "author": {
                "@type": "Person",
                "name": author_name
            },
            "datePublished": date_published
        }
        
        if date_modified:
            schema["dateModified"] = date_modified
        if image:
            schema["image"] = image
        if page_url:
            schema["url"] = page_url
        
        if publisher_name:
            schema["publisher"] = {
                "@type": "Organization",
                "name": publisher_name
            }
            if publisher_logo:
                schema["publisher"]["logo"] = {
                    "@type": "ImageObject",
                    "url": publisher_logo
                }
        
        return schema
    
    def generate_organization_schema(
        self,
        name: str,
        description: str = "",
        url: str = "",
        logo: str = "",
        email: str = "",
        phone: str = "",
        address: Dict[str, str] = None,
        social_links: List[str] = None
    ) -> Dict[str, Any]:
        """
        Generate Organization schema.
        """
        schema = {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": name
        }
        
        if description:
            schema["description"] = description
        if url:
            schema["url"] = url
        if logo:
            schema["logo"] = logo
        if email:
            schema["email"] = email
        if phone:
            schema["telephone"] = phone
        
        if address:
            schema["address"] = {
                "@type": "PostalAddress",
                "streetAddress": address.get("street", ""),
                "addressLocality": address.get("city", ""),
                "postalCode": address.get("postal_code", ""),
                "addressCountry": address.get("country", "")
            }
        
        if social_links:
            schema["sameAs"] = social_links
        
        return schema
    
    def generate_local_business_schema(
        self,
        name: str,
        business_type: str = "LocalBusiness",
        description: str = "",
        url: str = "",
        image: str = "",
        phone: str = "",
        address: Dict[str, str] = None,
        geo: Dict[str, float] = None,
        opening_hours: List[str] = None,
        price_range: str = ""
    ) -> Dict[str, Any]:
        """
        Generate LocalBusiness schema.
        """
        schema = {
            "@context": "https://schema.org",
            "@type": business_type,
            "name": name
        }
        
        if description:
            schema["description"] = description
        if url:
            schema["url"] = url
        if image:
            schema["image"] = image
        if phone:
            schema["telephone"] = phone
        if price_range:
            schema["priceRange"] = price_range
        
        if address:
            schema["address"] = {
                "@type": "PostalAddress",
                "streetAddress": address.get("street", ""),
                "addressLocality": address.get("city", ""),
                "postalCode": address.get("postal_code", ""),
                "addressCountry": address.get("country", "")
            }
        
        if geo:
            schema["geo"] = {
                "@type": "GeoCoordinates",
                "latitude": geo.get("latitude"),
                "longitude": geo.get("longitude")
            }
        
        if opening_hours:
            schema["openingHours"] = opening_hours
        
        return schema
    
    def to_script_tag(self, schema: Dict[str, Any]) -> str:
        """
        Convert schema dict to HTML script tag.
        """
        json_str = json.dumps(schema, indent=2, ensure_ascii=False)
        return f'<script type="application/ld+json">\n{json_str}\n</script>'


# Singleton
_schema_service: Optional[SchemaGeneratorService] = None

def get_schema_service() -> SchemaGeneratorService:
    """Get singleton instance."""
    global _schema_service
    if _schema_service is None:
        _schema_service = SchemaGeneratorService()
    return _schema_service
