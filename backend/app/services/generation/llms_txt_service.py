"""
llms.txt Generator Service - Generate llms.txt and llms-full.txt for AI crawlers.

The llms.txt protocol is an emerging standard for websites to provide
structured information to AI models and crawlers.

Enhanced with Knowledge Graph integration for:
- Dynamic content ordering by PageRank authority
- Entity-rich semantic descriptions
- Automatic concept linking
- Real-time generation from database

Reference: https://llmstxt.org/
"""

from typing import Dict, Any, List, Optional, TYPE_CHECKING
from datetime import datetime
import logging
import asyncio

if TYPE_CHECKING:
    from app.services.knowledge_graph import KnowledgeGraphService

logger = logging.getLogger(__name__)


class LLMSTxtGeneratorService:
    """
    Generate llms.txt files for AI crawler optimization.
    
    Features:
    - Static generation from provided data
    - Dynamic generation from Knowledge Graph (PageRank ordering)
    - Database-driven content with automatic updates
    - Entity-rich semantic descriptions
    
    llms.txt format:
    - Line 1: Website name and tagline
    - Following lines: Structured content about the site
    
    llms-full.txt:
    - Extended version with detailed documentation
    """
    
    def __init__(self):
        """Initialize service."""
        self._kg_service = None
    
    def _get_kg_service(self) -> Optional["KnowledgeGraphService"]:
        """Lazy load Knowledge Graph service."""
        if self._kg_service is None:
            try:
                from app.services.knowledge_graph import get_knowledge_graph_service
                self._kg_service = get_knowledge_graph_service()
            except ImportError:
                logger.warning("Knowledge Graph service not available")
        return self._kg_service
    
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
    
    async def generate_llms_txt_from_kg(
        self,
        brand_id: str,
        brand_name: str,
        domain: str,
        description: str = "",
        industry: str = "",
        limit: int = 100
    ) -> str:
        """
        Generate llms.txt dynamically from Knowledge Graph.
        
        Content is ordered by PageRank authority score, ensuring
        the most authoritative content appears first for AI crawlers.
        
        Args:
            brand_id: Brand ID in the system
            brand_name: Brand display name
            domain: Website domain
            description: Brand description
            industry: Industry/sector
            limit: Maximum pages to include
        
        Returns:
            llms.txt content with PageRank-ordered pages
        """
        kg_service = self._get_kg_service()
        
        lines = []
        
        # Header with rich metadata
        lines.append(f"# {brand_name}")
        lines.append("")
        
        if description:
            lines.append(f"> {description}")
            lines.append("")
        
        # Meta section
        lines.append("## Metadata")
        lines.append(f"- Domain: https://{domain}")
        if industry:
            lines.append(f"- Industry: {industry}")
        lines.append(f"- Generated: {datetime.utcnow().isoformat()}Z")
        lines.append(f"- Content-Type: Authority-Ranked")
        lines.append("")
        
        # Get content from Knowledge Graph
        if kg_service:
            try:
                content_items = await kg_service.export_for_llms_txt(
                    brand_id=brand_id,
                    limit=limit,
                    include_concepts=True
                )
                
                if content_items:
                    lines.append("## Documentation")
                    lines.append("")
                    
                    for item in content_items:
                        title = item.get("title", "Untitled")
                        url = item.get("url", "")
                        desc = item.get("description", "")
                        concepts = item.get("concepts", [])
                        pagerank = item.get("pagerank", 0)
                        
                        if url and title:
                            # Format with authority score context
                            lines.append(f"### [{title}]({url})")
                            
                            if desc:
                                lines.append(f"{desc}")
                            
                            # Add concept tags for semantic context
                            if concepts:
                                concepts_str = ", ".join(concepts[:5])
                                lines.append(f"*Topics: {concepts_str}*")
                            
                            lines.append("")
                    
                    # Add statistics
                    lines.append("---")
                    lines.append(f"*{len(content_items)} pages indexed, ordered by authority*")
                    lines.append("")
                
            except Exception as e:
                logger.error(f"Failed to get content from Knowledge Graph: {e}")
                lines.append("## Documentation")
                lines.append("*Content index temporarily unavailable*")
                lines.append("")
        else:
            lines.append("## Documentation")
            lines.append("*Knowledge Graph not configured*")
            lines.append("")
        
        return "\n".join(lines)
    
    async def generate_llms_txt_from_database(
        self,
        brand_id: str,
        limit: int = 100
    ) -> str:
        """
        Generate llms.txt from database records.
        
        Fetches brand info and related content from Supabase,
        then generates optimized llms.txt.
        
        Args:
            brand_id: Brand UUID
            limit: Maximum pages to include
        
        Returns:
            Complete llms.txt content
        """
        try:
            from supabase import create_client
            from app.core.config import settings
            
            supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
            
            # Fetch brand info
            brand_response = supabase.table("brands") \
                .select("*") \
                .eq("id", brand_id) \
                .single() \
                .execute()
            
            brand = brand_response.data
            if not brand:
                return f"# Brand Not Found\n\n> No brand with ID {brand_id}"
            
            brand_name = brand.get("name", "Unknown")
            domain = brand.get("domain", "example.com")
            description = brand.get("description", "")
            industry = brand.get("industry", "")
            
            # Try Knowledge Graph first
            kg_service = self._get_kg_service()
            if kg_service:
                try:
                    stats = await kg_service.get_stats(brand_id)
                    if stats.get("total_nodes", 0) > 0:
                        return await self.generate_llms_txt_from_kg(
                            brand_id=brand_id,
                            brand_name=brand_name,
                            domain=domain,
                            description=description,
                            industry=industry,
                            limit=limit
                        )
                except Exception as e:
                    logger.debug(f"KG not available, using database: {e}")
            
            # Fallback to page_analysis table
            pages_response = supabase.table("page_analysis") \
                .select("url, title, meta_description, aeo_score") \
                .eq("brand_id", brand_id) \
                .order("aeo_score", desc=True) \
                .limit(limit) \
                .execute()
            
            key_pages = []
            for page in (pages_response.data or []):
                key_pages.append({
                    "url": page.get("url", ""),
                    "title": page.get("title", ""),
                    "description": page.get("meta_description", "")
                })
            
            # Get services/keywords
            keywords_response = supabase.table("keywords") \
                .select("keyword") \
                .eq("brand_id", brand_id) \
                .limit(10) \
                .execute()
            
            services = [k.get("keyword") for k in (keywords_response.data or []) if k.get("keyword")]
            
            return self.generate_llms_txt(
                brand_name=brand_name,
                domain=domain,
                description=description,
                industry=industry,
                services=services,
                key_pages=key_pages,
            )
            
        except Exception as e:
            logger.error(f"Failed to generate llms.txt from database: {e}")
            return f"# Error\n\n> Failed to generate content: {str(e)}"
    
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
    
    async def generate_llms_full_txt_from_database(
        self,
        brand_id: str
    ) -> str:
        """
        Generate llms-full.txt from database with all available data.
        
        Includes:
        - Brand info
        - Pages ordered by authority
        - FAQs (if available)
        - Team members (if available)
        - Testimonials (if available)
        
        Args:
            brand_id: Brand UUID
        
        Returns:
            Complete llms-full.txt content
        """
        try:
            from supabase import create_client
            from app.core.config import settings
            
            supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
            
            # Fetch brand info
            brand_response = supabase.table("brands") \
                .select("*") \
                .eq("id", brand_id) \
                .single() \
                .execute()
            
            brand = brand_response.data
            if not brand:
                return f"# Brand Not Found\n\n> No brand with ID {brand_id}"
            
            brand_name = brand.get("name", "Unknown")
            domain = brand.get("domain", "example.com")
            description = brand.get("description", "")
            industry = brand.get("industry", "")
            
            # Fetch pages
            pages_response = supabase.table("page_analysis") \
                .select("url, title, meta_description, aeo_score") \
                .eq("brand_id", brand_id) \
                .order("aeo_score", desc=True) \
                .limit(50) \
                .execute()
            
            key_pages = []
            for page in (pages_response.data or []):
                key_pages.append({
                    "url": page.get("url", ""),
                    "title": page.get("title", ""),
                    "description": page.get("meta_description", "")
                })
            
            # Get keywords/services
            keywords_response = supabase.table("keywords") \
                .select("keyword") \
                .eq("brand_id", brand_id) \
                .limit(15) \
                .execute()
            
            services = [k.get("keyword") for k in (keywords_response.data or []) if k.get("keyword")]
            
            # Get FAQs from discovery prompts (treated as FAQ-like content)
            prompts_response = supabase.table("discovery_prompts") \
                .select("prompt_text, category") \
                .eq("brand_id", brand_id) \
                .limit(20) \
                .execute()
            
            faqs = []
            for prompt in (prompts_response.data or []):
                # Treat prompts as questions
                faqs.append({
                    "question": prompt.get("prompt_text", ""),
                    "answer": f"See our content for detailed information about {prompt.get('category', 'this topic')}."
                })
            
            return self.generate_llms_full_txt(
                brand_name=brand_name,
                domain=domain,
                description=description,
                industry=industry,
                services=services,
                key_pages=key_pages,
                faqs=faqs if faqs else None,
            )
            
        except Exception as e:
            logger.error(f"Failed to generate llms-full.txt from database: {e}")
            return f"# Error\n\n> Failed to generate content: {str(e)}"


# Singleton
_llms_txt_service: Optional[LLMSTxtGeneratorService] = None

def get_llms_txt_service() -> LLMSTxtGeneratorService:
    """Get singleton instance."""
    global _llms_txt_service
    if _llms_txt_service is None:
        _llms_txt_service = LLMSTxtGeneratorService()
    return _llms_txt_service

