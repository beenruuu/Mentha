"""
Page Analyzer Service - Enhanced page analysis based on python-seo-analyzer.
Provides comprehensive SEO/AEO analysis for individual pages including:
- Metadata extraction
- Content analysis
- Link analysis
- Image analysis
- Heading structure
- OpenGraph validation
- Keyword extraction with n-grams
"""

import asyncio
import hashlib
import json
import re
from collections import Counter
from string import punctuation
from typing import Dict, Any, List, Optional, Set
from urllib.parse import urlsplit, urljoin
import httpx
from bs4 import BeautifulSoup
import lxml.html as lh

# English stop words for keyword filtering
ENGLISH_STOP_WORDS = frozenset({
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
    'any', 'are', "aren't", 'as', 'at', 'be', 'because', 'been', 'before', 'being',
    'below', 'between', 'both', 'but', 'by', "can't", 'cannot', 'could', "couldn't",
    'did', "didn't", 'do', 'does', "doesn't", 'doing', "don't", 'down', 'during',
    'each', 'few', 'for', 'from', 'further', 'had', "hadn't", 'has', "hasn't",
    'have', "haven't", 'having', 'he', "he'd", "he'll", "he's", 'her', 'here',
    "here's", 'hers', 'herself', 'him', 'himself', 'his', 'how', "how's", 'i',
    "i'd", "i'll", "i'm", "i've", 'if', 'in', 'into', 'is', "isn't", 'it', "it's",
    'its', 'itself', "let's", 'me', 'more', 'most', "mustn't", 'my', 'myself', 'no',
    'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our',
    'ours', 'ourselves', 'out', 'over', 'own', 'same', "shan't", 'she', "she'd",
    "she'll", "she's", 'should', "shouldn't", 'so', 'some', 'such', 'than', 'that',
    "that's", 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there',
    "there's", 'these', 'they', "they'd", "they'll", "they're", "they've", 'this',
    'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', "wasn't",
    'we', "we'd", "we'll", "we're", "we've", 'were', "weren't", 'what', "what's",
    'when', "when's", 'where', "where's", 'which', 'while', 'who', "who's", 'whom',
    'why', "why's", 'with', "won't", 'would', "wouldn't", 'you', "you'd", "you'll",
    "you're", "you've", 'your', 'yours', 'yourself', 'yourselves',
    # Spanish common words
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'en',
    'con', 'por', 'para', 'que', 'como', 'más', 'pero', 'sus', 'le', 'ya',
    'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas'
})

TOKEN_REGEX = re.compile(r"(?u)\b\w\w+\b")

IMAGE_EXTENSIONS = {'.img', '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.webp', '.avif'}

HEADING_TAGS_XPATHS = {
    "h1": "//h1",
    "h2": "//h2",
    "h3": "//h3",
    "h4": "//h4",
    "h5": "//h5",
    "h6": "//h6",
}

ADDITIONAL_TAGS_XPATHS = {
    "title": "//title/text()",
    "meta_desc": '//meta[@name="description"]/@content',
    "viewport": '//meta[@name="viewport"]/@content',
    "charset": "//meta[@charset]/@charset",
    "canonical": '//link[@rel="canonical"]/@href',
    "alt_href": '//link[@rel="alternate"]/@href',
    "alt_hreflang": '//link[@rel="alternate"]/@hreflang',
    "og_title": '//meta[@property="og:title"]/@content',
    "og_desc": '//meta[@property="og:description"]/@content',
    "og_url": '//meta[@property="og:url"]/@content',
    "og_image": '//meta[@property="og:image"]/@content',
}


class PageAnalyzer:
    """
    Comprehensive page analyzer for SEO/AEO audits.
    Based on python-seo-analyzer with enhancements for GEO/AEO optimization.
    """
    
    def __init__(self):
        self.client = httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
            headers={'User-Agent': 'Mentha-SEO-Analyzer/1.0'}
        )
    
    async def analyze_page(
        self,
        url: str,
        analyze_headings: bool = True,
        analyze_extra_tags: bool = True,
        extract_links: bool = True
    ) -> Dict[str, Any]:
        """
        Perform comprehensive analysis of a single page.
        
        Args:
            url: URL to analyze
            analyze_headings: Whether to extract heading structure
            analyze_extra_tags: Whether to extract meta tags
            extract_links: Whether to extract and analyze links
            
        Returns:
            Dictionary with complete page analysis
        """
        result = {
            "url": url,
            "status": "success",
            "metadata": {},
            "content_analysis": {},
            "seo_warnings": [],
            "headings": {},
            "additional_tags": {},
            "links": [],
            "images": [],
            "keywords": {},
            "bigrams": {},
            "trigrams": {}
        }
        
        try:
            # Ensure URL has protocol
            if not url.startswith(('http://', 'https://')):
                url = f'https://{url}'
            
            # Fetch page
            response = await self.client.get(url)
            raw_html = response.text
            
            # Generate content hash for duplicate detection
            result["content_hash"] = hashlib.sha1(raw_html.encode('utf-8')).hexdigest()
            
            # Parse with BeautifulSoup
            soup = BeautifulSoup(raw_html, 'lxml')
            soup_lower = BeautifulSoup(raw_html.lower(), 'lxml')
            
            # Extract metadata
            result["metadata"] = self._extract_metadata(soup)
            
            # Validate metadata
            self._validate_metadata(result["metadata"], result["seo_warnings"])
            
            # Analyze content
            text_content = self._extract_text_content(soup)
            result["content_analysis"] = self._analyze_content(text_content)
            
            # Extract keywords with n-grams
            keywords, bigrams, trigrams = self._extract_keywords(text_content)
            result["keywords"] = keywords
            result["bigrams"] = bigrams
            result["trigrams"] = trigrams
            
            # Analyze headings
            if analyze_headings:
                result["headings"] = self._analyze_headings(soup, raw_html)
            
            # Extract additional tags
            if analyze_extra_tags:
                result["additional_tags"] = self._extract_additional_tags(raw_html)
            
            # Analyze OpenGraph tags
            self._analyze_og_tags(soup_lower, result["seo_warnings"])
            
            # Analyze images
            result["images"] = self._analyze_images(soup_lower, result["seo_warnings"])
            
            # Analyze links
            if extract_links:
                result["links"] = self._analyze_links(soup, url, result["seo_warnings"])
            
            # Check for H1 tags
            self._check_h1_tags(soup_lower, result["seo_warnings"])
            
            # AEO-specific checks
            result["aeo_signals"] = self._analyze_aeo_signals(soup, result)
            
        except Exception as e:
            result["status"] = "error"
            result["error"] = str(e)
        
        return result
    
    def _extract_metadata(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extract page metadata."""
        metadata = {
            "title": "",
            "description": "",
            "author": "",
            "keywords": "",
            "canonical": "",
            "robots": ""
        }
        
        # Title
        title_tag = soup.find('title')
        if title_tag:
            metadata["title"] = title_tag.get_text(strip=True)
        
        # Meta description
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc:
            metadata["description"] = meta_desc.get('content', '')
        
        # Author
        meta_author = soup.find('meta', attrs={'name': 'author'})
        if meta_author:
            metadata["author"] = meta_author.get('content', '')
        
        # Keywords (not recommended but tracked)
        meta_keywords = soup.find('meta', attrs={'name': 'keywords'})
        if meta_keywords:
            metadata["keywords"] = meta_keywords.get('content', '')
        
        # Canonical URL
        canonical = soup.find('link', attrs={'rel': 'canonical'})
        if canonical:
            metadata["canonical"] = canonical.get('href', '')
        
        # Robots meta
        robots = soup.find('meta', attrs={'name': 'robots'})
        if robots:
            metadata["robots"] = robots.get('content', '')
        
        return metadata
    
    def _validate_metadata(self, metadata: Dict[str, Any], warnings: List[str]):
        """Validate metadata and add warnings."""
        title = metadata.get("title", "")
        description = metadata.get("description", "")
        keywords = metadata.get("keywords", "")
        
        # Title validation
        if not title:
            warnings.append("Missing title tag")
        elif len(title) < 10:
            warnings.append(f"Title tag is too short (less than 10 characters): {title}")
        elif len(title) > 70:
            warnings.append(f"Title tag is too long (more than 70 characters): {title}")
        
        # Description validation
        if not description:
            warnings.append("Missing meta description")
        elif len(description) < 140:
            warnings.append(f"Description is too short (less than 140 characters): {description[:50]}...")
        elif len(description) > 255:
            warnings.append(f"Description is too long (more than 255 characters): {description[:50]}...")
        
        # Keywords warning (deprecated)
        if keywords:
            warnings.append("Keywords meta tag should be avoided as they are a spam indicator and no longer used by Search Engines")
    
    def _extract_text_content(self, soup: BeautifulSoup) -> str:
        """Extract visible text content from page."""
        # Remove script and style elements
        for element in soup(['script', 'style', 'nav', 'footer', 'header']):
            element.decompose()
        
        text = soup.get_text(separator=' ', strip=True)
        return text
    
    def _analyze_content(self, text: str) -> Dict[str, Any]:
        """Analyze text content."""
        words = text.split()
        word_count = len(words)
        
        # Calculate readability (simple metric)
        sentences = re.split(r'[.!?]+', text)
        sentence_count = len([s for s in sentences if s.strip()])
        
        avg_words_per_sentence = word_count / max(sentence_count, 1)
        
        return {
            "word_count": word_count,
            "sentence_count": sentence_count,
            "avg_words_per_sentence": round(avg_words_per_sentence, 2),
            "content_length": len(text)
        }
    
    def _extract_keywords(self, text: str) -> tuple:
        """Extract keywords, bigrams, and trigrams from text."""
        # Tokenize
        raw_tokens = TOKEN_REGEX.findall(text.lower())
        tokens = [w for w in raw_tokens if w not in ENGLISH_STOP_WORDS]
        
        # Count words
        word_freq = Counter(tokens)
        
        # Generate bigrams
        bigrams = Counter()
        for i in range(len(raw_tokens) - 1):
            bigram = f"{raw_tokens[i]} {raw_tokens[i+1]}"
            bigrams[bigram] += 1
        
        # Generate trigrams
        trigrams = Counter()
        for i in range(len(raw_tokens) - 2):
            trigram = f"{raw_tokens[i]} {raw_tokens[i+1]} {raw_tokens[i+2]}"
            trigrams[trigram] += 1
        
        # Filter by frequency
        keywords = {w: c for w, c in word_freq.most_common(50) if c > 2}
        bigrams_filtered = {w: c for w, c in bigrams.most_common(30) if c > 2}
        trigrams_filtered = {w: c for w, c in trigrams.most_common(20) if c > 2}
        
        return keywords, bigrams_filtered, trigrams_filtered
    
    def _analyze_headings(self, soup: BeautifulSoup, raw_html: str) -> Dict[str, List[str]]:
        """Analyze heading structure."""
        headings = {}
        
        try:
            dom = lh.fromstring(raw_html)
            for tag, xpath in HEADING_TAGS_XPATHS.items():
                values = [h.text_content().strip() for h in dom.xpath(xpath)]
                if values:
                    headings[tag] = values
        except Exception:
            # Fallback to BeautifulSoup
            for i in range(1, 7):
                tag = f"h{i}"
                found = soup.find_all(tag)
                if found:
                    headings[tag] = [h.get_text(strip=True) for h in found]
        
        return headings
    
    def _extract_additional_tags(self, raw_html: str) -> Dict[str, Any]:
        """Extract additional meta and link tags."""
        additional = {}
        
        try:
            dom = lh.fromstring(raw_html)
            for tag, xpath in ADDITIONAL_TAGS_XPATHS.items():
                values = dom.xpath(xpath)
                if values:
                    additional[tag] = values if len(values) > 1 else values[0]
        except Exception as e:
            additional["error"] = str(e)
        
        return additional
    
    def _analyze_og_tags(self, soup: BeautifulSoup, warnings: List[str]):
        """Validate OpenGraph tags."""
        og_title = soup.find_all("meta", attrs={"property": "og:title"})
        og_description = soup.find_all("meta", attrs={"property": "og:description"})
        og_image = soup.find_all("meta", attrs={"property": "og:image"})
        
        if not og_title:
            warnings.append("Missing og:title - Important for social sharing and AI citation")
        if not og_description:
            warnings.append("Missing og:description - Important for social sharing and AI citation")
        if not og_image:
            warnings.append("Missing og:image - Important for social sharing visibility")
    
    def _analyze_images(self, soup: BeautifulSoup, warnings: List[str]) -> List[Dict[str, Any]]:
        """Analyze images and check for alt tags."""
        images = []
        img_tags = soup.find_all("img")
        
        for img in img_tags:
            src = img.get("src") or img.get("data-src") or ""
            alt = img.get("alt", "")
            
            image_info = {
                "src": src,
                "alt": alt,
                "has_alt": bool(alt)
            }
            images.append(image_info)
            
            if not alt:
                warnings.append(f"Image missing alt tag: {src[:100]}")
        
        return images
    
    def _analyze_links(
        self, 
        soup: BeautifulSoup, 
        base_url: str,
        warnings: List[str]
    ) -> List[Dict[str, Any]]:
        """Analyze anchor links."""
        links = []
        parsed_base = urlsplit(base_url)
        anchors = soup.find_all("a", href=True)
        
        for anchor in anchors:
            href = anchor["href"]
            text = anchor.get_text(strip=True).lower()
            title = anchor.get("title", "")
            
            # Check for missing title
            if not title:
                warnings.append(f"Anchor missing title tag: {href[:100]}")
            
            # Check for generic text
            if text in ["click here", "page", "article", "read more", "here", "link"]:
                warnings.append(f"Anchor text contains generic text: {text}")
            
            # Determine if internal or external
            is_external = bool(urlsplit(href).netloc and urlsplit(href).netloc != parsed_base.netloc)
            
            links.append({
                "href": href,
                "text": text,
                "title": title,
                "is_external": is_external,
                "nofollow": "nofollow" in anchor.get("rel", [])
            })
        
        return links
    
    def _check_h1_tags(self, soup: BeautifulSoup, warnings: List[str]):
        """Check for H1 tag presence."""
        h1_tags = soup.find_all("h1")
        if not h1_tags:
            warnings.append("Each page should have at least one h1 tag")
        elif len(h1_tags) > 1:
            warnings.append(f"Multiple h1 tags found ({len(h1_tags)}). Consider using only one h1 per page.")
    
    def _analyze_aeo_signals(self, soup: BeautifulSoup, result: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze signals specific to AI Engine Optimization."""
        signals = {
            "has_faq_structure": False,
            "has_how_to_structure": False,
            "has_article_structure": False,
            "question_content_ratio": 0,
            "has_clear_entity_references": False,
            "conversational_readiness_score": 0
        }
        
        # Check for FAQ-like content patterns
        text = soup.get_text().lower()
        question_patterns = re.findall(r'\b(what|how|why|when|where|who|which|can|is|are|do|does)\b[^.?!]*\?', text)
        signals["question_content_ratio"] = len(question_patterns)
        signals["has_faq_structure"] = len(question_patterns) >= 3
        
        # Check for how-to patterns
        how_to_patterns = re.findall(r'(step \d|paso \d|\d\.\s|first,|second,|then,|finally,|primero|segundo|luego|finalmente)', text)
        signals["has_how_to_structure"] = len(how_to_patterns) >= 3
        
        # Check for article structure
        headings = result.get("headings", {})
        if headings.get("h1") and headings.get("h2") and len(headings.get("h2", [])) >= 2:
            signals["has_article_structure"] = True
        
        # Check for entity references (proper nouns, brand mentions)
        proper_nouns = re.findall(r'\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b', soup.get_text())
        signals["has_clear_entity_references"] = len(set(proper_nouns)) >= 5
        
        # Calculate conversational readiness score
        score = 0
        if signals["has_faq_structure"]:
            score += 30
        if signals["has_how_to_structure"]:
            score += 20
        if signals["has_article_structure"]:
            score += 20
        if signals["has_clear_entity_references"]:
            score += 15
        if result.get("metadata", {}).get("description"):
            score += 15
        
        signals["conversational_readiness_score"] = min(score, 100)
        
        return signals
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()


class WebsiteCrawler:
    """
    Website crawler for multi-page SEO analysis.
    Based on python-seo-analyzer Website class.
    """
    
    def __init__(
        self,
        max_pages: int = 50,
        follow_links: bool = True,
        concurrent_requests: int = 5
    ):
        self.max_pages = max_pages
        self.follow_links = follow_links
        self.concurrent_requests = concurrent_requests
        self.page_analyzer = PageAnalyzer()
        self.crawled_urls: Set[str] = set()
        self.page_queue: List[str] = []
        self.wordcount = Counter()
        self.bigrams = Counter()
        self.trigrams = Counter()
        self.content_hashes: Dict[str, Set[str]] = {}
    
    async def crawl(
        self,
        base_url: str,
        sitemap_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Crawl a website starting from base URL.
        
        Args:
            base_url: Starting URL for crawl
            sitemap_url: Optional sitemap URL to seed pages
            
        Returns:
            Complete crawl results
        """
        results = {
            "base_url": base_url,
            "pages": [],
            "total_pages": 0,
            "keywords": [],
            "duplicate_pages": [],
            "errors": []
        }
        
        # Ensure base URL has protocol
        if not base_url.startswith(('http://', 'https://')):
            base_url = f'https://{base_url}'
        
        # Seed from sitemap if provided
        if sitemap_url:
            sitemap_urls = await self._parse_sitemap(sitemap_url)
            self.page_queue.extend(sitemap_urls)
        
        # Add base URL
        self.page_queue.append(base_url)
        
        # Crawl pages
        parsed_base = urlsplit(base_url)
        
        while self.page_queue and len(results["pages"]) < self.max_pages:
            # Get batch of URLs to process
            batch = []
            while self.page_queue and len(batch) < self.concurrent_requests:
                url = self.page_queue.pop(0)
                if url not in self.crawled_urls:
                    # Ensure URL is on same domain
                    parsed_url = urlsplit(url)
                    if parsed_url.netloc == parsed_base.netloc:
                        batch.append(url)
                        self.crawled_urls.add(url)
            
            if not batch:
                continue
            
            # Analyze pages concurrently
            tasks = [self.page_analyzer.analyze_page(url) for url in batch]
            page_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for page_result in page_results:
                if isinstance(page_result, Exception):
                    results["errors"].append(str(page_result))
                    continue
                
                if page_result.get("status") == "success":
                    results["pages"].append(page_result)
                    
                    # Track content hashes for duplicate detection
                    content_hash = page_result.get("content_hash")
                    if content_hash:
                        if content_hash not in self.content_hashes:
                            self.content_hashes[content_hash] = set()
                        self.content_hashes[content_hash].add(page_result["url"])
                    
                    # Aggregate keywords
                    self.wordcount.update(page_result.get("keywords", {}))
                    self.bigrams.update(page_result.get("bigrams", {}))
                    self.trigrams.update(page_result.get("trigrams", {}))
                    
                    # Add discovered links to queue
                    if self.follow_links:
                        for link in page_result.get("links", []):
                            if not link.get("is_external"):
                                href = link.get("href", "")
                                if href and href not in self.crawled_urls:
                                    # Convert relative to absolute
                                    if not href.startswith('http'):
                                        href = urljoin(base_url, href)
                                    self.page_queue.append(href)
                else:
                    results["errors"].append(page_result.get("error", "Unknown error"))
        
        # Compile final results
        results["total_pages"] = len(results["pages"])
        
        # Identify duplicates
        results["duplicate_pages"] = [
            list(urls) for urls in self.content_hashes.values() if len(urls) > 1
        ]
        
        # Compile top keywords
        for word, count in self.wordcount.most_common(100):
            if count > 4:
                results["keywords"].append({"word": word, "count": count})
        
        for bigram, count in self.bigrams.most_common(50):
            if count > 4:
                results["keywords"].append({"word": bigram, "count": count})
        
        for trigram, count in self.trigrams.most_common(30):
            if count > 4:
                results["keywords"].append({"word": trigram, "count": count})
        
        # Sort all keywords by count
        results["keywords"].sort(key=lambda x: x["count"], reverse=True)
        
        return results
    
    async def _parse_sitemap(self, sitemap_url: str) -> List[str]:
        """Parse sitemap.xml or sitemap.txt to get URLs."""
        urls = []
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(sitemap_url)
                
                if sitemap_url.endswith('.xml'):
                    # Parse XML sitemap
                    from xml.dom import minidom
                    xmldoc = minidom.parseString(response.text)
                    loc_tags = xmldoc.getElementsByTagName("loc")
                    for loc in loc_tags:
                        url = "".join(
                            node.data for node in loc.childNodes 
                            if node.nodeType == node.TEXT_NODE
                        )
                        urls.append(url)
                elif sitemap_url.endswith('.txt'):
                    # Parse text sitemap
                    urls = [u.strip() for u in response.text.split('\n') if u.strip()]
                    
        except Exception as e:
            print(f"Error parsing sitemap: {e}")
        
        return urls
    
    async def close(self):
        """Close resources."""
        await self.page_analyzer.close()
