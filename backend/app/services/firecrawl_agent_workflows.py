"""
Firecrawl Agent Workflows - High-level workflows using FIRE-1 agent for Mentha.
These workflows leverage the autonomous agent for brand monitoring and competitive analysis.
"""
import logging
from typing import List, Dict, Any, Optional
from app.services.firecrawl_service import FirecrawlService
from app.services.firecrawl_schemas import (
    BrandMention,
    BrandMentionsResult,
    CompetitorInfo,
    CompetitorDiscoveryResult,
    IndustryMention,
    IndustryVisibilityResult
)

logger = logging.getLogger(__name__)


class FirecrawlAgentWorkflows:
    """
    Pre-built workflows using Firecrawl /agent for Mentha use cases.
    
    These workflows provide high-level abstractions for:
    - Brand mention discovery across AI engines
    - Competitor presence monitoring
    - Industry visibility analysis
    """
    
    def __init__(self):
        self.firecrawl = FirecrawlService()
    
    async def discover_brand_mentions(
        self,
        brand_name: str,
        industry: Optional[str] = None,
        ai_engines: List[str] = None,
        additional_keywords: List[str] = None
    ) -> Dict[str, Any]:
        """
        Discover how AI engines mention a brand using the FIRE-1 agent.
        
        Args:
            brand_name: The brand name to search for
            industry: Optional industry context for better results
            ai_engines: AI engines to check (default: chatgpt, perplexity, claude)
            additional_keywords: Extra keywords to include in search
            
        Returns:
            Dictionary with mentions found and metadata
        """
        if ai_engines is None:
            ai_engines = ["chatgpt", "perplexity", "claude", "gemini"]
            
        if additional_keywords is None:
            additional_keywords = []
        
        # Build the prompt for the agent
        industry_context = f" in the {industry} industry" if industry else ""
        keywords_context = f" Also include context about: {', '.join(additional_keywords)}." if additional_keywords else ""
        
        prompt = f"""Find mentions and references to the brand "{brand_name}"{industry_context} across AI search engines and assistants.
        
Search for how {brand_name} is discussed in responses from: {', '.join(ai_engines)}.

For each mention found, extract:
- The source URL or AI engine
- The exact text context where the brand is mentioned
- Whether the sentiment is positive, negative, or neutral
- The position/prominence of the mention

{keywords_context}
Focus on recent and relevant mentions that would impact brand visibility."""

        # Schema for structured extraction
        schema = BrandMentionsResult.model_json_schema()
        
        try:
            result = await self.firecrawl.agent_discover(
                prompt=prompt,
                schema=schema,
                max_pages=15
            )
            
            if not result.get("success"):
                return result
                
            # If async job started, return job_id for polling
            if result.get("job_id"):
                return {
                    "success": True,
                    "async": True,
                    "job_id": result["job_id"],
                    "message": "Brand mention discovery started. Poll for results."
                }
            
            # Parse immediate results
            data = result.get("data", {})
            return {
                "success": True,
                "async": False,
                "brand_name": brand_name,
                "industry": industry,
                "mentions": data.get("mentions", []),
                "total_sources_checked": data.get("total_sources_checked", 0),
                "sources": result.get("sources", [])
            }
            
        except Exception as e:
            logger.error(f"Error in discover_brand_mentions: {e}")
            return {"success": False, "error": str(e)}
    
    async def monitor_competitor_presence(
        self,
        brand_name: str,
        known_competitors: List[str],
        industry: str,
        keywords: List[str] = None
    ) -> Dict[str, Any]:
        """
        Monitor competitor presence and discover new competitors using the agent.
        
        Args:
            brand_name: Your brand name for context
            known_competitors: List of known competitors to track
            industry: Industry for competitor discovery
            keywords: Keywords to search for competitor mentions
            
        Returns:
            Dictionary with competitor information
        """
        if keywords is None:
            keywords = []
            
        competitors_str = ", ".join(known_competitors) if known_competitors else "unknown competitors"
        keywords_str = ", ".join(keywords) if keywords else industry
        
        prompt = f"""Analyze the competitive landscape for "{brand_name}" in the {industry} industry.

Known competitors to track: {competitors_str}

For each competitor (known and newly discovered), find:
- Company name and website
- How they are mentioned alongside {brand_name}
- Their visibility in AI search results for keywords: {keywords_str}
- Brief description of their positioning

Also discover any new competitors that appear in AI search results when users ask about {industry} solutions similar to {brand_name}."""

        schema = CompetitorDiscoveryResult.model_json_schema()
        
        try:
            result = await self.firecrawl.agent_discover(
                prompt=prompt,
                schema=schema,
                max_pages=20
            )
            
            if not result.get("success"):
                return result
                
            if result.get("job_id"):
                return {
                    "success": True,
                    "async": True,
                    "job_id": result["job_id"],
                    "message": "Competitor monitoring started. Poll for results."
                }
            
            data = result.get("data", {})
            return {
                "success": True,
                "async": False,
                "brand_name": brand_name,
                "industry": industry,
                "competitors": data.get("competitors", []),
                "total_sources_checked": data.get("total_sources_checked", 0),
                "sources": result.get("sources", [])
            }
            
        except Exception as e:
            logger.error(f"Error in monitor_competitor_presence: {e}")
            return {"success": False, "error": str(e)}
    
    async def analyze_industry_visibility(
        self,
        brand_name: str,
        industry: str,
        target_keywords: List[str]
    ) -> Dict[str, Any]:
        """
        Analyze brand visibility across specific industry keywords.
        
        Args:
            brand_name: Brand to analyze visibility for
            industry: Industry context
            target_keywords: Keywords to check visibility for
            
        Returns:
            Dictionary with visibility analysis results
        """
        keywords_str = ", ".join(target_keywords)
        
        prompt = f"""Analyze the visibility of "{brand_name}" in AI search results for the {industry} industry.

For each of these keywords, search AI assistants (ChatGPT, Perplexity, Claude, Gemini) and find:
Keywords to analyze: {keywords_str}

For each keyword:
- Which brands are mentioned in AI responses
- Where does {brand_name} appear (if at all)
- What is the context of mentions
- Who are the top-mentioned competitors for this keyword

Provide a visibility assessment: is {brand_name} well-represented, underrepresented, or absent from AI responses for these keywords?"""

        schema = IndustryVisibilityResult.model_json_schema()
        
        try:
            result = await self.firecrawl.agent_discover(
                prompt=prompt,
                schema=schema,
                max_pages=20
            )
            
            if not result.get("success"):
                return result
                
            if result.get("job_id"):
                return {
                    "success": True,
                    "async": True,
                    "job_id": result["job_id"],
                    "message": "Industry visibility analysis started. Poll for results."
                }
            
            data = result.get("data", {})
            return {
                "success": True,
                "async": False,
                "brand_name": brand_name,
                "industry": industry,
                "keywords_analyzed": target_keywords,
                "keyword_mentions": data.get("keyword_mentions", []),
                "visibility_score": data.get("brand_visibility_score"),
                "top_competitors": data.get("top_competitors", []),
                "sources": result.get("sources", [])
            }
            
        except Exception as e:
            logger.error(f"Error in analyze_industry_visibility: {e}")
            return {"success": False, "error": str(e)}
    
    async def get_job_status(self, job_id: str) -> Dict[str, Any]:
        """
        Get the status of an async agent job.
        
        Args:
            job_id: The job ID returned from a workflow
            
        Returns:
            Job status and results when complete
        """
        return await self.firecrawl.agent_status(job_id)
    
    async def close(self):
        """Close the Firecrawl client connection."""
        await self.firecrawl.close()


# Singleton instance
_workflows_instance = None

def get_agent_workflows() -> FirecrawlAgentWorkflows:
    """Get or create the singleton workflows instance."""
    global _workflows_instance
    if _workflows_instance is None:
        _workflows_instance = FirecrawlAgentWorkflows()
    return _workflows_instance
