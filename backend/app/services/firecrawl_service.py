"""
Firecrawl Service - Web scraping and crawling using Firecrawl API v1.
Based on implementation patterns from firegeo project.
"""
import httpx
from typing import Dict, Any, List, Optional
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class FirecrawlService:
    """
    Service for web scraping and crawling using Firecrawl API v1.
    
    Features:
    - scrape_url: Scrape a single URL to markdown
    - map_site: Discover all URLs on a website
    - crawl_site: Crawl multiple pages with content extraction
    """
    
    def __init__(self):
        self.api_key = settings.FIRECRAWL_API_KEY
        self.base_url = settings.FIRECRAWL_API_URL.rstrip('/')
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            },
            timeout=120.0  # Increased timeout for crawl operations
        )

    async def scrape_url(
        self, 
        url: str, 
        formats: Optional[List[str]] = None,
        only_main_content: bool = True,
        wait_for: int = 0
    ) -> Dict[str, Any]:
        """
        Scrape a single URL and return clean markdown.
        Uses Firecrawl API v1 endpoint.
        
        Args:
            url: URL to scrape
            formats: Output formats (default: ["markdown"])
            only_main_content: Extract only main content, skip nav/footer
            wait_for: Wait time in ms for dynamic content
            
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
            
            if wait_for > 0:
                payload["waitFor"] = wait_for
            
            response = await self.client.post("/v1/scrape", json=payload)
            response.raise_for_status()
            data = response.json()
            
            # v1 API returns data directly in response
            return {
                "success": data.get("success", True),
                "data": data.get("data", {}),
                "markdown": data.get("data", {}).get("markdown", ""),
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
            
            return {
                "success": True,
                "status": data.get("status"),  # "scraping", "completed", "failed"
                "total": data.get("total", 0),
                "completed": data.get("completed", 0),
                "data": data.get("data", [])  # Array of scraped pages when complete
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

    async def close(self):
        """Close the HTTP client connection."""
        await self.client.aclose()


# Import asyncio for concurrent operations
import asyncio
