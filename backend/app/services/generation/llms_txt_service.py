"""
llms.txt Generator Service - Generate llms.txt and llms-full.txt for AI crawlers.

The llms.txt protocol is an emerging standard for websites to provide
structured information to AI models and crawlers.

Reference: https://llmstxt.org/
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class LLMSTxtGeneratorService:
    """
    Generate llms.txt files for AI crawler optimization.
    
    llms.txt format:
    - Line 1: Website name and tagline
    - Following lines: Structured content about the site
    
    llms-full.txt:
    - Extended version with detailed documentation
    """
    
    def generate_llms_txt(
        self,
        brand_name: str,
        domain: str,
        description: str = "",
        industry: str = "",
        services: List[str] = None,
        key_pages: List[Dict[str, str]] = None,
        contact_info: Dict[str, str] = None,
    ) -> str:
        """
        Generate llms.txt content for a brand.
        
        Args:
            brand_name: Company/brand name
            domain: Website domain
            description: Brief description
            industry: Industry/sector
            services: List of services offered
            key_pages: List of {url, title, description} dicts
            contact_info: Contact information dict
            
        Returns:
            llms.txt content as string
        """
        lines = []
        
        # Header
        lines.append(f"# {brand_name}")
        lines.append("")
        
        # Description
        if description:
            lines.append(f"> {description}")
            lines.append("")
        
        # Basic info
        lines.append("## About")
        lines.append(f"- Website: https://{domain}")
        if industry:
            lines.append(f"- Industry: {industry}")
        lines.append(f"- Generated: {datetime.utcnow().strftime('%Y-%m-%d')}")
        lines.append("")
        
        # Services
        if services:
            lines.append("## Services")
            for service in services[:10]:  # Limit to 10
                lines.append(f"- {service}")
            lines.append("")
        
        # Key pages
        if key_pages:
            lines.append("## Key Pages")
            for page in key_pages[:20]:  # Limit to 20
                url = page.get("url", "")
                title = page.get("title", "")
                desc = page.get("description", "")
                if url and title:
                    lines.append(f"- [{title}]({url})")
                    if desc:
                        lines.append(f"  {desc}")
            lines.append("")
        
        # Contact
        if contact_info:
            lines.append("## Contact")
            if contact_info.get("email"):
                lines.append(f"- Email: {contact_info['email']}")
            if contact_info.get("phone"):
                lines.append(f"- Phone: {contact_info['phone']}")
            if contact_info.get("address"):
                lines.append(f"- Address: {contact_info['address']}")
            lines.append("")
        
        return "\n".join(lines)
    
    def generate_llms_full_txt(
        self,
        brand_name: str,
        domain: str,
        description: str = "",
        industry: str = "",
        services: List[str] = None,
        key_pages: List[Dict[str, str]] = None,
        faqs: List[Dict[str, str]] = None,
        team: List[Dict[str, str]] = None,
        testimonials: List[Dict[str, str]] = None,
        case_studies: List[Dict[str, str]] = None,
        contact_info: Dict[str, str] = None,
    ) -> str:
        """
        Generate extended llms-full.txt with complete documentation.
        """
        # Start with basic llms.txt
        content = self.generate_llms_txt(
            brand_name=brand_name,
            domain=domain,
            description=description,
            industry=industry,
            services=services,
            key_pages=key_pages,
            contact_info=contact_info,
        )
        
        lines = [content]
        
        # FAQs
        if faqs:
            lines.append("## Frequently Asked Questions")
            lines.append("")
            for faq in faqs[:20]:
                q = faq.get("question", "")
                a = faq.get("answer", "")
                if q and a:
                    lines.append(f"### {q}")
                    lines.append(f"{a}")
                    lines.append("")
        
        # Team
        if team:
            lines.append("## Team")
            lines.append("")
            for member in team[:10]:
                name = member.get("name", "")
                role = member.get("role", "")
                bio = member.get("bio", "")
                if name and role:
                    lines.append(f"### {name} - {role}")
                    if bio:
                        lines.append(f"{bio}")
                    lines.append("")
        
        # Testimonials
        if testimonials:
            lines.append("## Testimonials")
            lines.append("")
            for t in testimonials[:10]:
                quote = t.get("quote", "")
                author = t.get("author", "")
                if quote:
                    lines.append(f"> \"{quote}\"")
                    if author:
                        lines.append(f"> — {author}")
                    lines.append("")
        
        # Case studies
        if case_studies:
            lines.append("## Case Studies")
            lines.append("")
            for cs in case_studies[:5]:
                title = cs.get("title", "")
                summary = cs.get("summary", "")
                url = cs.get("url", "")
                if title:
                    lines.append(f"### {title}")
                    if summary:
                        lines.append(f"{summary}")
                    if url:
                        lines.append(f"[Read more]({url})")
                    lines.append("")
        
        return "\n".join(lines)


# Singleton
_llms_txt_service: Optional[LLMSTxtGeneratorService] = None

def get_llms_txt_service() -> LLMSTxtGeneratorService:
    """Get singleton instance."""
    global _llms_txt_service
    if _llms_txt_service is None:
        _llms_txt_service = LLMSTxtGeneratorService()
    return _llms_txt_service
