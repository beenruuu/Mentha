"""
Firecrawl Service - Web scraping and crawling using Firecrawl API v1.
Includes /agent endpoint support for FIRE-1 autonomous navigation.
"""
import httpx
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.services.processing.pii_service import PiiService
import logging
import json

logger = logging.getLogger(__name__)


class FirecrawlService:
    """
    Service for web scraping and crawling using Firecrawl API v1.
    
    Features (5 Firecrawl endpoints):
    - scrape_url: Scrape a single URL to markdown
    - search_web: Search the web and extract content from results
    - map_site: Discover all URLs on a website
    - crawl_site: Crawl multiple pages with content extraction
    - agent_discover: Use FIRE-1 agent for autonomous data discovery (Beta)
    """
    
    def __init__(self):
        self.api_key = settings.FIRECRAWL_API_KEY
        self.base_url = settings.FIRECRAWL_API_URL.rstrip('/')
        self.agent_enabled = settings.FIRECRAWL_AGENT_ENABLED
        self.agent_max_pages = settings.FIRECRAWL_AGENT_MAX_PAGES
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            },
            timeout=180.0  # Increased timeout for agent operations
        )
        self.pii_service = PiiService()

    async def scrape_url(
        self, 
        url: str, 
        formats: Optional[List[str]] = None,
        only_main_content: bool = True,
        wait_for: int = 0,
        max_age: int = 604800  # 1 week cache by default (firegeo pattern)
    ) -> Dict[str, Any]:
        """
        Scrape a single URL and return clean markdown.
        Uses Firecrawl API v1 endpoint with caching to reduce API costs.
        
        Args:
            url: URL to scrape
            formats: Output formats (default: ["markdown"])
            only_main_content: Extract only main content, skip nav/footer
            wait_for: Wait time in ms for dynamic content
            max_age: Cache duration in seconds (default: 604800 = 1 week)
                     Set to 0 to force fresh scrape (costs more)
            
        Returns:
            Dictionary with success status, markdown content, and metadata
        """
        if not self.api_key:
            return {"success": False, "error": "Firecrawl API key not configured"}

        if formats is None:
            formats = ["markdown"]
            
        # Normalize URL
        if not url.startswith(('http://', 'https://')):
            url = f'https://{url}'

        try:
            payload = {
                "url": url,
                "formats": formats,
                "onlyMainContent": only_main_content
            }
            
            # Add caching to reduce API costs (firegeo pattern)
            if max_age > 0:
                payload["maxAge"] = max_age
            
            if wait_for > 0:
                payload["waitFor"] = wait_for
            
            response = await self.client.post("/v1/scrape", json=payload)
            response.raise_for_status()
            data = response.json()
            
            # v1 API returns data directly in response
            markdown = data.get("data", {}).get("markdown", "")
            
            # Redact PII
            if markdown:
                markdown = self.pii_service.anonymize_text(markdown)
            
            return {
                "success": data.get("success", True),
                "data": data.get("data", {}),
                "markdown": markdown,
                "metadata": data.get("data", {}).get("metadata", {})
            }
        except httpx.HTTPStatusError as e:
            logger.error(f"Firecrawl scrape HTTP error: {e.response.status_code} - {e.response.text}")
            return {"success": False, "error": f"HTTP {e.response.status_code}: {e.response.text}"}
        except Exception as e:
            logger.error(f"Firecrawl scrape error: {e}")
            return {"success": False, "error": str(e)}

    async def map_site(
        self, 
        url: str, 
        limit: int = 100,
        include_subdomains: bool = False,
        search: Optional[str] = None
    ) -> List[str]:
        """
        Get all links from a website using the Map endpoint (v1 API).
        This is useful for discovering pages before crawling.
        
        Args:
            url: Base URL to map
            limit: Maximum number of URLs to return (default: 100, max: 5000)
            include_subdomains: Whether to include subdomain URLs
            search: Optional search query to filter/order results by relevance
            
        Returns:
            List of discovered URLs
        """
        if not self.api_key:
            logger.warning("Firecrawl API key not configured for map operation")
            return []
            
        # Normalize URL
        if not url.startswith(('http://', 'https://')):
            url = f'https://{url}'

        try:
            payload = {
                "url": url,
                "limit": min(limit, 5000),
                "includeSubdomains": include_subdomains,
                "ignoreQueryParameters": True
            }
            
            if search:
                payload["search"] = search
            
            response = await self.client.post("/v1/map", json=payload)
            response.raise_for_status()
            data = response.json()
            
            if data.get("success"):
                links = data.get("links", [])
                # v1/v2 API may return objects with url field or plain strings
                if links and isinstance(links[0], dict):
                    return [link.get("url", "") for link in links if link.get("url")]
                return links
            else:
                logger.warning(f"Firecrawl map returned unsuccessful: {data}")
                return []
                
        except httpx.HTTPStatusError as e:
            logger.error(f"Firecrawl map HTTP error: {e.response.status_code} - {e.response.text}")
            return []
        except Exception as e:
            logger.error(f"Firecrawl map error: {e}")
            return []

    async def search_web(
        self,
        query: str,
        limit: int = 10,
        lang: str = "en",
        country: str = "us",
        scrape_options: Optional[Dict[str, Any]] = None,
        max_age: int = 86400  # 1 day cache for search results (fresher than scrape)
    ) -> Dict[str, Any]:
        """
        Search the web and extract content from results using Firecrawl Search API.
        Combines web search with content extraction in a single call.
        
        Args:
            query: Search query string
            limit: Maximum number of results to return (default: 10)
            lang: Language code for search results (default: "en")
            country: Country code for search localization (default: "us")
            scrape_options: Optional scraping options (formats, onlyMainContent, etc.)
            max_age: Cache duration in seconds (default: 86400 = 1 day)
            
        Returns:
            Dictionary with search results including scraped content
        """
        if not self.api_key:
            return {"success": False, "error": "Firecrawl API key not configured"}

        try:
            payload = {
                "query": query,
                "limit": limit,
                "lang": lang,
                "country": country
            }
            
            if scrape_options:
                # Add maxAge to provided scrape options
                scrape_options["maxAge"] = scrape_options.get("maxAge", max_age)
                payload["scrapeOptions"] = scrape_options
            else:
                payload["scrapeOptions"] = {
                    "formats": ["markdown"],
                    "onlyMainContent": True,
                    "maxAge": max_age
                }
            
            logger.info(f"[FIRECRAWL SEARCH] Searching for: {query}")
            response = await self.client.post("/v1/search", json=payload)
            response.raise_for_status()
            data = response.json()
            
            # Process results and redact PII
            results = data.get("data", [])
            for result in results:
                if result.get("markdown"):
                    result["markdown"] = self.pii_service.anonymize_text(result["markdown"])
            
            return {
                "success": data.get("success", True),
                "data": results,
                "query": query,
                "total_results": len(results)
            }
            
        except httpx.HTTPStatusError as e:
            logger.error(f"Firecrawl search HTTP error: {e.response.status_code} - {e.response.text}")
            return {"success": False, "error": f"HTTP {e.response.status_code}: {e.response.text}"}
        except Exception as e:
            logger.error(f"Firecrawl search error: {e}")
            return {"success": False, "error": str(e)}

    async def crawl_site(
        self, 
        url: str, 
        limit: int = 10,
        max_depth: int = 2,
        formats: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Crawl a website and return a job ID for async crawling.
        Use check_crawl_status to poll for results.
        
        Args:
            url: Starting URL to crawl
            limit: Maximum number of pages to crawl
            max_depth: Maximum crawl depth from starting URL
            formats: Output formats for scraped content
            
        Returns:
            Dictionary with job_id for status polling
        """
        if not self.api_key:
            return {"success": False, "error": "Firecrawl API key not configured"}
            
        if formats is None:
            formats = ["markdown"]
            
        # Normalize URL
        if not url.startswith(('http://', 'https://')):
            url = f'https://{url}'

        try:
            payload = {
                "url": url,
                "limit": limit,
                "maxDepth": max_depth,
                "scrapeOptions": {
                    "formats": formats,
                    "onlyMainContent": True
                }
            }
            response = await self.client.post("/v1/crawl", json=payload)
            response.raise_for_status()
            data = response.json()
            
            return {
                "success": data.get("success", True),
                "id": data.get("id"),  # Job ID for polling
                "url": data.get("url")  # Status URL
            }
        except httpx.HTTPStatusError as e:
            logger.error(f"Firecrawl crawl HTTP error: {e.response.status_code} - {e.response.text}")
            return {"success": False, "error": f"HTTP {e.response.status_code}"}
        except Exception as e:
            logger.error(f"Firecrawl crawl error: {e}")
            return {"success": False, "error": str(e)}

    async def check_crawl_status(self, job_id: str) -> Dict[str, Any]:
        """
        Check the status of a crawl job and get results when complete.
        
        Args:
            job_id: The crawl job ID returned from crawl_site
            
        Returns:
            Dictionary with status and data when complete
        """
        if not self.api_key:
            return {"success": False, "error": "Firecrawl API key not configured"}

        try:
            response = await self.client.get(f"/v1/crawl/{job_id}")
            response.raise_for_status()
            data = response.json()
            
            # Process/Redact PII from crawled pages
            crawled_data = data.get("data", [])
            for page in crawled_data:
                if "markdown" in page and page["markdown"]:
                    page["markdown"] = self.pii_service.anonymize_text(page["markdown"])

            return {
                "success": True,
                "status": data.get("status"),  # "scraping", "completed", "failed"
                "total": data.get("total", 0),
                "completed": data.get("completed", 0),
                "data": crawled_data  # Array of scraped pages when complete
            }
        except httpx.HTTPStatusError as e:
            logger.error(f"Firecrawl status HTTP error: {e.response.status_code}")
            return {"success": False, "error": f"HTTP {e.response.status_code}"}
        except Exception as e:
            logger.error(f"Firecrawl status error: {e}")
            return {"success": False, "error": str(e)}

    async def scrape_multiple(
        self, 
        urls: List[str], 
        formats: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Scrape multiple URLs concurrently.
        
        Args:
            urls: List of URLs to scrape
            formats: Output formats
            
        Returns:
            List of scrape results
        """
        if formats is None:
            formats = ["markdown"]
            
        tasks = [self.scrape_url(url, formats) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        processed = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                processed.append({
                    "success": False,
                    "url": urls[i],
                    "error": str(result)
                })
            else:
                result["url"] = urls[i]
                processed.append(result)
                
        return processed

    async def agent_discover(
        self,
        prompt: str,
        urls: Optional[List[str]] = None,
        schema: Optional[Dict[str, Any]] = None,
        max_pages: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Use Firecrawl's FIRE-1 agent for autonomous data discovery.
        The agent searches, navigates, and extracts data based on a natural language prompt.
        
        Args:
            prompt: Natural language description of data to find
            urls: Optional starting URLs (agent can search without them)
            schema: JSON schema for structured output (use Pydantic model.model_json_schema())
            max_pages: Maximum pages for the agent to visit (default from config)
            
        Returns:
            Dictionary with job_id for async polling, or immediate results for quick tasks
        """
        if not self.api_key:
            return {"success": False, "error": "Firecrawl API key not configured"}
            
        if not self.agent_enabled:
            return {"success": False, "error": "Firecrawl Agent is not enabled. Set FIRECRAWL_AGENT_ENABLED=True in .env"}

        try:
            payload = {
                "prompt": prompt,
                "maxPages": max_pages or self.agent_max_pages,
            }
            
            if urls:
                payload["urls"] = urls
                
            if schema:
                payload["schema"] = schema
            
            logger.info(f"[FIRECRAWL AGENT] Starting agent with prompt: {prompt[:100]}...")
            response = await self.client.post("/v1/agent", json=payload)
            response.raise_for_status()
            data = response.json()
            
            # Agent returns job_id for async operations
            if data.get("id"):
                return {
                    "success": True,
                    "job_id": data.get("id"),
                    "status": data.get("status", "pending"),
                    "message": "Agent job started. Poll with agent_status() for results."
                }
            
            # Some simple queries may return immediate results
            result_data = data.get("data", {})
            if result_data:
                # Redact PII from any text content
                if isinstance(result_data, dict):
                    for key, value in result_data.items():
                        if isinstance(value, str):
                            result_data[key] = self.pii_service.anonymize_text(value)
                            
            return {
                "success": data.get("success", True),
                "data": result_data,
                "sources": data.get("sources", []),
                "status": "completed"
            }
            
        except httpx.HTTPStatusError as e:
            error_detail = e.response.text if hasattr(e.response, 'text') else str(e)
            logger.error(f"Firecrawl agent HTTP error: {e.response.status_code} - {error_detail}")
            return {"success": False, "error": f"HTTP {e.response.status_code}: {error_detail}"}
        except Exception as e:
            logger.error(f"Firecrawl agent error: {e}")
            return {"success": False, "error": str(e)}

    async def agent_status(self, job_id: str) -> Dict[str, Any]:
        """
        Check the status of an agent job and get results when complete.
        
        Args:
            job_id: The agent job ID returned from agent_discover
            
        Returns:
            Dictionary with status and data when complete
        """
        if not self.api_key:
            return {"success": False, "error": "Firecrawl API key not configured"}

        try:
            response = await self.client.get(f"/v1/agent/{job_id}")
            response.raise_for_status()
            data = response.json()
            
            result = {
                "success": True,
                "job_id": job_id,
                "status": data.get("status", "unknown"),
                "progress": data.get("progress"),
            }
            
            if data.get("status") == "completed":
                result_data = data.get("data", {})
                # Redact PII from results
                if isinstance(result_data, dict):
                    for key, value in result_data.items():
                        if isinstance(value, str):
                            result_data[key] = self.pii_service.anonymize_text(value)
                result["data"] = result_data
                result["sources"] = data.get("sources", [])
                
            if data.get("status") == "failed":
                result["error"] = data.get("error", "Agent job failed")
                
            return result
            
        except httpx.HTTPStatusError as e:
            logger.error(f"Firecrawl agent status HTTP error: {e.response.status_code}")
            return {"success": False, "error": f"HTTP {e.response.status_code}"}
        except Exception as e:
            logger.error(f"Firecrawl agent status error: {e}")
            return {"success": False, "error": str(e)}

    async def close(self):
        """Close the HTTP client connection."""
        await self.client.aclose()


# Import asyncio for concurrent operations
import asyncio
