"""
Playwright Scraper Service - Web scraping using Playwright (No external API dependency).

This is a local alternative to Firecrawl that runs headless browsers directly.
Implements stealth patterns for GEO monitoring as per architectural guidelines.
"""
import asyncio
import logging
import re
from typing import Dict, Any, List, Optional
from urllib.parse import urlparse, urljoin

from markdownify import markdownify as md
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class PlaywrightScraper:
    """
    Local web scraper using Playwright for headless browser automation.
    
    Features:
    - Stealth mode to avoid bot detection
    - JavaScript rendering for SPA/dynamic content
    - Markdown conversion for LLM ingestion
    - PII redaction integration
    - No external API costs
    """
    
    def __init__(self):
        self._browser = None
        self._context = None
        self._playwright = None
        self._initialized = False
        
        # Lazy import for PII service
        from app.services.processing.pii_service import PiiService
        self.pii_service = PiiService()

    async def _ensure_initialized(self) -> bool:
        """Lazy initialization of Playwright browser."""
        if self._initialized:
            return True
            
        try:
            from playwright.async_api import async_playwright
            
            logger.info("[PLAYWRIGHT] 🚀 Initializing headless browser...")
            self._playwright = await async_playwright().start()
            
            # Launch with stealth settings
            self._browser = await self._playwright.chromium.launch(
                headless=True,
                args=[
                    '--disable-blink-features=AutomationControlled',
                    '--disable-dev-shm-usage',
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-web-security',
                    '--disable-features=IsolateOrigins,site-per-process',
                ]
            )
            
            # Create context with realistic viewport and user agent
            self._context = await self._browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                locale='en-US',
                timezone_id='America/New_York',
                extra_http_headers={
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                }
            )
            
            # Remove webdriver indicator (stealth)
            await self._context.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                });
                Object.defineProperty(navigator, 'plugins', {
                    get: () => [1, 2, 3, 4, 5]
                });
            """)
            
            self._initialized = True
            logger.info("[PLAYWRIGHT] ✅ Browser initialized successfully")
            return True
            
        except ImportError:
            logger.error("[PLAYWRIGHT] ❌ Playwright not installed. Run: pip install playwright && playwright install chromium")
            return False
        except Exception as e:
            logger.error(f"[PLAYWRIGHT] ❌ Failed to initialize browser: {e}")
            return False

    async def scrape_url(
        self,
        url: str,
        formats: Optional[List[str]] = None,
        only_main_content: bool = True,
        wait_for: int = 2000,
        max_age: int = 0  # Not used locally but kept for API compatibility
    ) -> Dict[str, Any]:
        """
        Scrape a single URL and return clean markdown/HTML.
        
        Args:
            url: URL to scrape
            formats: Output formats (default: ["markdown"])
            only_main_content: Extract only main content, skip nav/footer
            wait_for: Wait time in ms for dynamic content
            max_age: Ignored (for Firecrawl API compatibility)
            
        Returns:
            Dictionary with success status, markdown content, and metadata
        """
        if not await self._ensure_initialized():
            return {"success": False, "error": "Failed to initialize Playwright browser"}
        
        if formats is None:
            formats = ["markdown"]
            
        # Normalize URL
        if not url.startswith(('http://', 'https://')):
            url = f'https://{url}'

        logger.info(f"[PLAYWRIGHT] 📄 Scraping URL: {url}")
        page = None
        
        try:
            page = await self._context.new_page()
            
            # Navigate with timeout
            await page.goto(url, wait_until='domcontentloaded', timeout=30000)
            
            # Wait for dynamic content
            if wait_for > 0:
                await asyncio.sleep(wait_for / 1000)
            
            # Get page title and metadata
            title = await page.title()
            
            # Extract content
            if only_main_content:
                html_content = await self._extract_main_content(page)
            else:
                html_content = await page.content()
            
            # Convert to markdown
            soup = BeautifulSoup(html_content, 'lxml')
            
            # Remove unwanted elements
            for tag in soup.find_all(['script', 'style', 'noscript', 'iframe']):
                tag.decompose()
            
            markdown = md(str(soup), heading_style="ATX", strip=['script', 'style'])
            
            # Clean up markdown
            markdown = self._clean_markdown(markdown)
            
            # Redact PII
            if markdown:
                markdown = self.pii_service.anonymize_text(markdown)
            
            # Get metadata
            meta_description = await page.locator('meta[name="description"]').get_attribute('content') if await page.locator('meta[name="description"]').count() > 0 else ""
            
            logger.info(f"[PLAYWRIGHT] ✅ Scraped {len(markdown)} chars from {url}")
            
            return {
                "success": True,
                "data": {
                    "markdown": markdown,
                    "html": html_content if "html" in formats else None,
                    "metadata": {
                        "title": title,
                        "description": meta_description,
                        "sourceURL": url,
                        "statusCode": 200
                    }
                },
                "markdown": markdown,
                "metadata": {
                    "title": title,
                    "description": meta_description,
                    "sourceURL": url
                }
            }
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"[PLAYWRIGHT] ❌ Error scraping {url}: {error_msg}")
            return {"success": False, "error": error_msg}
            
        finally:
            if page:
                await page.close()

    async def _extract_main_content(self, page) -> str:
        """Extract main content area, filtering out nav/header/footer."""
        # Try common main content selectors
        selectors = [
            'main',
            'article',
            '[role="main"]',
            '.main-content',
            '#main-content',
            '.content',
            '#content',
            '.post-content',
            '.article-content',
            '.entry-content'
        ]
        
        for selector in selectors:
            element = page.locator(selector).first
            if await element.count() > 0:
                return await element.inner_html()
        
        # Fallback: get body and remove common non-content elements
        body_html = await page.locator('body').inner_html()
        soup = BeautifulSoup(body_html, 'lxml')
        
        # Remove common non-content elements
        for tag in soup.find_all(['header', 'nav', 'footer', 'aside', 'menu']):
            tag.decompose()
        for tag in soup.find_all(class_=re.compile(r'(nav|menu|footer|header|sidebar|cookie|banner|popup|modal)', re.I)):
            tag.decompose()
        for tag in soup.find_all(id=re.compile(r'(nav|menu|footer|header|sidebar|cookie|banner|popup|modal)', re.I)):
            tag.decompose()
            
        return str(soup)

    def _clean_markdown(self, markdown: str) -> str:
        """Clean up markdown output."""
        # Remove excessive whitespace
        markdown = re.sub(r'\n{3,}', '\n\n', markdown)
        # Remove excessive spaces
        markdown = re.sub(r' {2,}', ' ', markdown)
        # Remove empty links
        markdown = re.sub(r'\[[\s]*\]\([^)]*\)', '', markdown)
        # Clean up line breaks
        markdown = markdown.strip()
        return markdown

    async def map_site(
        self,
        url: str,
        limit: int = 100,
        include_subdomains: bool = False,
        search: Optional[str] = None
    ) -> List[str]:
        """
        Discover all links from a website.
        
        Args:
            url: Base URL to map
            limit: Maximum number of URLs to return
            include_subdomains: Whether to include subdomain URLs
            search: Optional search query to filter URLs
            
        Returns:
            List of discovered URLs
        """
        if not await self._ensure_initialized():
            logger.warning("[PLAYWRIGHT] Cannot map site - browser not initialized")
            return []
            
        # Normalize URL
        if not url.startswith(('http://', 'https://')):
            url = f'https://{url}'
            
        parsed_base = urlparse(url)
        base_domain = parsed_base.netloc
        
        logger.info(f"[PLAYWRIGHT] 🗺️ Mapping site: {url} (limit: {limit})")
        page = None
        
        try:
            page = await self._context.new_page()
            await page.goto(url, wait_until='domcontentloaded', timeout=30000)
            await asyncio.sleep(1)  # Wait for any lazy-loaded links
            
            # Extract all links
            links = await page.eval_on_selector_all(
                'a[href]',
                """elements => elements.map(el => el.href).filter(href => 
                    href && 
                    !href.startsWith('javascript:') && 
                    !href.startsWith('mailto:') &&
                    !href.startsWith('#')
                )"""
            )
            
            # Filter and deduplicate
            seen = set()
            valid_links = []
            
            for link in links:
                if link in seen:
                    continue
                    
                parsed = urlparse(link)
                
                # Check domain match
                if include_subdomains:
                    if not parsed.netloc.endswith(base_domain.replace('www.', '')):
                        continue
                else:
                    if parsed.netloc != base_domain:
                        continue
                
                # Apply search filter if provided
                if search and search.lower() not in link.lower():
                    continue
                
                seen.add(link)
                valid_links.append(link)
                
                if len(valid_links) >= limit:
                    break
            
            logger.info(f"[PLAYWRIGHT] ✅ Found {len(valid_links)} links on {url}")
            return valid_links
            
        except Exception as e:
            logger.error(f"[PLAYWRIGHT] ❌ Error mapping {url}: {e}")
            return []
            
        finally:
            if page:
                await page.close()

    async def search_web(
        self,
        query: str,
        limit: int = 10,
        lang: str = "en",
        country: str = "us",
        scrape_options: Optional[Dict[str, Any]] = None,
        max_age: int = 0
    ) -> Dict[str, Any]:
        """
        Search the web using DuckDuckGo and scrape top results.
        
        Args:
            query: Search query string
            limit: Maximum number of results
            lang: Language code
            country: Country code
            scrape_options: Scraping options (optional)
            max_age: Ignored (for API compatibility)
            
        Returns:
            Dictionary with search results
        """
        logger.info(f"[PLAYWRIGHT] 🔍 Web search: '{query}' (limit: {limit})")
        
        try:
            # Use DuckDuckGo for free search
            from ddgs import DDGS
            
            with DDGS() as ddgs:
                raw_results = list(ddgs.text(query, max_results=limit, region=f"{country}-{lang}"))
            
            results = []
            for r in raw_results:
                result = {
                    "title": r.get("title", ""),
                    "url": r.get("href", r.get("link", "")),
                    "description": r.get("body", r.get("snippet", "")),
                    "markdown": None
                }
                
                # Optionally scrape the page for full content
                if scrape_options and scrape_options.get("scrapeContent"):
                    try:
                        scrape_result = await self.scrape_url(
                            result["url"],
                            formats=scrape_options.get("formats", ["markdown"]),
                            only_main_content=scrape_options.get("onlyMainContent", True)
                        )
                        if scrape_result.get("success"):
                            result["markdown"] = scrape_result.get("markdown")
                    except Exception as e:
                        logger.warning(f"[PLAYWRIGHT] Failed to scrape {result['url']}: {e}")
                
                results.append(result)
            
            logger.info(f"[PLAYWRIGHT] ✅ Found {len(results)} search results for '{query}'")
            
            return {
                "success": True,
                "data": results,
                "query": query,
                "total_results": len(results)
            }
            
        except ImportError:
            logger.error("[PLAYWRIGHT] ❌ ddgs not installed. Run: pip install ddgs")
            return {"success": False, "error": "DuckDuckGo search not available"}
        except Exception as e:
            logger.error(f"[PLAYWRIGHT] ❌ Search error: {e}")
            return {"success": False, "error": str(e)}

    async def scrape_multiple(
        self,
        urls: List[str],
        formats: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """Scrape multiple URLs concurrently."""
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
        """Close the browser and cleanup resources."""
        if self._context:
            await self._context.close()
        if self._browser:
            await self._browser.close()
        if self._playwright:
            await self._playwright.stop()
        self._initialized = False
        logger.info("[PLAYWRIGHT] 🛑 Browser closed")


# Singleton instance
_playwright_scraper: Optional[PlaywrightScraper] = None


def get_playwright_scraper() -> PlaywrightScraper:
    """Get singleton instance of PlaywrightScraper."""
    global _playwright_scraper
    if _playwright_scraper is None:
        _playwright_scraper = PlaywrightScraper()
    return _playwright_scraper
