"""
Unified Scraper Service - Abstraction layer for web scraping.

Provides automatic fallback between Firecrawl API and local Playwright scraper.
Follows the architectural guideline of not depending on a single external service.
"""
import logging
from typing import Dict, Any, List, Optional
from enum import Enum

from app.core.config import settings

logger = logging.getLogger(__name__)


class ScraperBackend(Enum):
    """Available scraper backends."""
    FIRECRAWL = "firecrawl"
    PLAYWRIGHT = "playwright"
    AUTO = "auto"  # Automatic fallback


class UnifiedScraper:
    """
    Unified scraper that abstracts Firecrawl and Playwright.
    
    Automatically falls back to Playwright if Firecrawl fails (402/429 errors)
    or if no API key is configured.
    """
    
    def __init__(self, preferred_backend: ScraperBackend = ScraperBackend.AUTO):
        self.preferred_backend = preferred_backend
        self._firecrawl = None
        self._playwright = None
        self._firecrawl_available = bool(settings.FIRECRAWL_API_KEY)
        self._firecrawl_failed = False  # Track if Firecrawl has failed (credits exhausted)
        
        logger.info(f"[SCRAPER] 🔧 Initializing UnifiedScraper (preferred: {preferred_backend.value})")
        logger.info(f"[SCRAPER] 🔑 Firecrawl API configured: {self._firecrawl_available}")

    def _get_firecrawl(self):
        """Lazy load Firecrawl service."""
        if self._firecrawl is None:
            from app.services.firecrawl_service import FirecrawlService
            self._firecrawl = FirecrawlService()
        return self._firecrawl

    def _get_playwright(self):
        """Lazy load Playwright scraper."""
        if self._playwright is None:
            from app.services.scraper.playwright_scraper import get_playwright_scraper
            self._playwright = get_playwright_scraper()
        return self._playwright

    def _should_use_firecrawl(self) -> bool:
        """Determine if Firecrawl should be used."""
        if self._firecrawl_failed:
            logger.debug("[SCRAPER] Skipping Firecrawl (previously failed)")
            return False
            
        if self.preferred_backend == ScraperBackend.PLAYWRIGHT:
            return False
            
        if self.preferred_backend == ScraperBackend.FIRECRAWL:
            return self._firecrawl_available
            
        # AUTO mode: use Firecrawl if available and not failed
        return self._firecrawl_available

    def _handle_firecrawl_error(self, result: Dict[str, Any]) -> bool:
        """Check if Firecrawl error indicates we should fallback. Returns True if should fallback."""
        if not result.get("success"):
            error = result.get("error", "")
            # Check for payment/credit errors
            if "402" in error or "Insufficient credits" in error or "payment" in error.lower():
                logger.warning("[SCRAPER] ⚠️ Firecrawl credits exhausted - switching to Playwright fallback")
                self._firecrawl_failed = True
                return True
            # Check for rate limiting
            if "429" in error or "rate limit" in error.lower():
                logger.warning("[SCRAPER] ⚠️ Firecrawl rate limited - using Playwright for this request")
                return True
        return False

    async def scrape_url(
        self,
        url: str,
        formats: Optional[List[str]] = None,
        only_main_content: bool = True,
        wait_for: int = 2000,
        max_age: int = 604800
    ) -> Dict[str, Any]:
        """
        Scrape a single URL with automatic backend selection and fallback.
        
        Args:
            url: URL to scrape
            formats: Output formats (default: ["markdown"])
            only_main_content: Extract only main content
            wait_for: Wait time in ms for dynamic content
            max_age: Cache duration (Firecrawl only)
            
        Returns:
            Dictionary with success status, markdown content, and metadata
        """
        logger.info(f"[SCRAPER] 📄 Request to scrape: {url}")
        
        # Try Firecrawl first if appropriate
        if self._should_use_firecrawl():
            logger.info("[SCRAPER] 🔥 Attempting Firecrawl...")
            firecrawl = self._get_firecrawl()
            result = await firecrawl.scrape_url(url, formats, only_main_content, wait_for, max_age)
            
            if result.get("success"):
                logger.info(f"[SCRAPER] ✅ Firecrawl success: {url}")
                result["backend"] = "firecrawl"
                return result
                
            # Check if we should fallback
            if self._handle_firecrawl_error(result):
                logger.info("[SCRAPER] 🔄 Falling back to Playwright...")
            else:
                # Non-recoverable error
                logger.error(f"[SCRAPER] ❌ Firecrawl failed: {result.get('error')}")
                return result
        
        # Use Playwright
        logger.info("[SCRAPER] 🎭 Using Playwright scraper...")
        playwright = self._get_playwright()
        result = await playwright.scrape_url(url, formats, only_main_content, wait_for, max_age)
        result["backend"] = "playwright"
        
        if result.get("success"):
            logger.info(f"[SCRAPER] ✅ Playwright success: {url}")
        else:
            logger.error(f"[SCRAPER] ❌ Playwright failed: {result.get('error')}")
            
        return result

    async def map_site(
        self,
        url: str,
        limit: int = 100,
        include_subdomains: bool = False,
        search: Optional[str] = None
    ) -> List[str]:
        """Map all URLs on a website with automatic backend selection."""
        logger.info(f"[SCRAPER] 🗺️ Request to map site: {url}")
        
        if self._should_use_firecrawl():
            logger.info("[SCRAPER] 🔥 Attempting Firecrawl map...")
            firecrawl = self._get_firecrawl()
            result = await firecrawl.map_site(url, limit, include_subdomains, search)
            
            if result:  # map_site returns a list
                logger.info(f"[SCRAPER] ✅ Firecrawl found {len(result)} URLs")
                return result
                
            # Try Playwright as fallback
            logger.info("[SCRAPER] 🔄 Firecrawl map empty, trying Playwright...")
        
        logger.info("[SCRAPER] 🎭 Using Playwright mapper...")
        playwright = self._get_playwright()
        result = await playwright.map_site(url, limit, include_subdomains, search)
        logger.info(f"[SCRAPER] ✅ Playwright found {len(result)} URLs")
        return result

    async def search_web(
        self,
        query: str,
        limit: int = 10,
        lang: str = "en",
        country: str = "us",
        scrape_options: Optional[Dict[str, Any]] = None,
        max_age: int = 86400
    ) -> Dict[str, Any]:
        """Search the web with automatic backend selection and fallback."""
        logger.info(f"[SCRAPER] 🔍 Web search request: '{query}'")
        
        if self._should_use_firecrawl():
            logger.info("[SCRAPER] 🔥 Attempting Firecrawl search...")
            firecrawl = self._get_firecrawl()
            result = await firecrawl.search_web(query, limit, lang, country, scrape_options, max_age)
            
            if result.get("success"):
                logger.info(f"[SCRAPER] ✅ Firecrawl search returned {result.get('total_results', 0)} results")
                result["backend"] = "firecrawl"
                return result
                
            if self._handle_firecrawl_error(result):
                logger.info("[SCRAPER] 🔄 Falling back to Playwright search...")
            else:
                logger.error(f"[SCRAPER] ❌ Firecrawl search failed: {result.get('error')}")
                # Still try Playwright
        
        logger.info("[SCRAPER] 🎭 Using Playwright/DuckDuckGo search...")
        playwright = self._get_playwright()
        result = await playwright.search_web(query, limit, lang, country, scrape_options, max_age)
        result["backend"] = "playwright"
        
        if result.get("success"):
            logger.info(f"[SCRAPER] ✅ Playwright search returned {result.get('total_results', 0)} results")
        else:
            logger.error(f"[SCRAPER] ❌ Playwright search failed: {result.get('error')}")
            
        return result

    async def scrape_multiple(
        self,
        urls: List[str],
        formats: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """Scrape multiple URLs with automatic backend selection."""
        logger.info(f"[SCRAPER] 📚 Request to scrape {len(urls)} URLs")
        
        if self._should_use_firecrawl():
            logger.info("[SCRAPER] 🔥 Attempting Firecrawl batch scrape...")
            firecrawl = self._get_firecrawl()
            results = await firecrawl.scrape_multiple(urls, formats)
            
            # Check if any failed with payment error
            for result in results:
                if self._handle_firecrawl_error(result):
                    break
            
            if not self._firecrawl_failed:
                for r in results:
                    r["backend"] = "firecrawl"
                return results
                
            logger.info("[SCRAPER] 🔄 Firecrawl failed, switching to Playwright...")
        
        logger.info("[SCRAPER] 🎭 Using Playwright for batch scrape...")
        playwright = self._get_playwright()
        results = await playwright.scrape_multiple(urls, formats)
        for r in results:
            r["backend"] = "playwright"
        return results

    async def close(self):
        """Close all scraper connections."""
        logger.info("[SCRAPER] 🛑 Closing scraper connections...")
        if self._firecrawl:
            await self._firecrawl.close()
        if self._playwright:
            await self._playwright.close()

    def get_status(self) -> Dict[str, Any]:
        """Get current scraper status for diagnostics."""
        return {
            "preferred_backend": self.preferred_backend.value,
            "firecrawl_configured": self._firecrawl_available,
            "firecrawl_failed": self._firecrawl_failed,
            "active_backend": "playwright" if self._firecrawl_failed or not self._firecrawl_available else "firecrawl"
        }


# Singleton instance
_unified_scraper: Optional[UnifiedScraper] = None


def get_unified_scraper(preferred_backend: ScraperBackend = ScraperBackend.AUTO) -> UnifiedScraper:
    """Get singleton instance of UnifiedScraper."""
    global _unified_scraper
    if _unified_scraper is None:
        _unified_scraper = UnifiedScraper(preferred_backend)
    return _unified_scraper
