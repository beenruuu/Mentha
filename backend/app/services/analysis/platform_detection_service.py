"""
Platform Detection Service - Detects CMS/platform and maps capabilities.

Supports: WordPress, Shopify, Wix, Squarespace, Webflow, Custom Code
"""

import re
import logging
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


@dataclass
class PlatformCapabilities:
    """Defines what's technically possible on each platform."""
    can_edit_html: bool
    can_add_plugins: bool
    can_add_schema: bool
    schema_method: str  # "plugin", "app", "code", "limited", "none"
    difficulty_base: str  # "easy", "medium", "hard"
    tutorial_url: Optional[str] = None


# Platform capabilities mapping
PLATFORM_CAPABILITIES: Dict[str, PlatformCapabilities] = {
    "wordpress": PlatformCapabilities(
        can_edit_html=False,
        can_add_plugins=True,
        can_add_schema=True,
        schema_method="plugin",
        difficulty_base="easy",
        tutorial_url="https://yoast.com/help/how-to-use-schema-markup/"
    ),
    "shopify": PlatformCapabilities(
        can_edit_html=False,
        can_add_plugins=True,
        can_add_schema=True,
        schema_method="app",
        difficulty_base="medium",
        tutorial_url="https://apps.shopify.com/json-ld-for-seo"
    ),
    "wix": PlatformCapabilities(
        can_edit_html=False,
        can_add_plugins=False,
        can_add_schema=False,
        schema_method="limited",
        difficulty_base="hard",
        tutorial_url="https://support.wix.com/en/article/adding-structured-data-markup"
    ),
    "squarespace": PlatformCapabilities(
        can_edit_html=True,  # Limited via code injection
        can_add_plugins=False,
        can_add_schema=True,
        schema_method="code",
        difficulty_base="medium",
        tutorial_url="https://support.squarespace.com/hc/en-us/articles/206543167"
    ),
    "webflow": PlatformCapabilities(
        can_edit_html=True,
        can_add_plugins=False,
        can_add_schema=True,
        schema_method="code",
        difficulty_base="medium",
        tutorial_url="https://university.webflow.com/lesson/custom-code"
    ),
    "prestashop": PlatformCapabilities(
        can_edit_html=True,
        can_add_plugins=True,
        can_add_schema=True,
        schema_method="plugin",
        difficulty_base="medium",
        tutorial_url="https://addons.prestashop.com/en/seo-search-engine-optimization/"
    ),
    "magento": PlatformCapabilities(
        can_edit_html=True,
        can_add_plugins=True,
        can_add_schema=True,
        schema_method="plugin",
        difficulty_base="hard",
        tutorial_url="https://marketplace.magento.com/"
    ),
    "drupal": PlatformCapabilities(
        can_edit_html=True,
        can_add_plugins=True,
        can_add_schema=True,
        schema_method="plugin",
        difficulty_base="hard",
        tutorial_url="https://www.drupal.org/project/schema_metatag"
    ),
    "joomla": PlatformCapabilities(
        can_edit_html=True,
        can_add_plugins=True,
        can_add_schema=True,
        schema_method="plugin",
        difficulty_base="medium",
        tutorial_url="https://extensions.joomla.org/"
    ),
    "custom": PlatformCapabilities(
        can_edit_html=True,
        can_add_plugins=True,
        can_add_schema=True,
        schema_method="code",
        difficulty_base="easy",
        tutorial_url=None
    ),
    "unknown": PlatformCapabilities(
        can_edit_html=True,
        can_add_plugins=True,
        can_add_schema=True,
        schema_method="code",
        difficulty_base="medium",
        tutorial_url=None
    )
}


# Detection patterns
PLATFORM_PATTERNS = {
    "wordpress": {
        "meta_generator": [r"wordpress", r"wp engine"],
        "scripts": [r"/wp-content/", r"/wp-includes/", r"wp-json"],
        "headers": {"X-Powered-By": r"php", "Link": r"wp-json"},
        "cookies": [r"wordpress_", r"wp-settings"],
        "html_patterns": [r'class="[^"]*wp-', r'id="wp-']
    },
    "shopify": {
        "meta_generator": [r"shopify"],
        "scripts": [r"cdn\.shopify\.com", r"myshopify\.com"],
        "headers": {"X-ShopId": r".*", "X-Shopify": r".*"},
        "cookies": [r"_shopify"],
        "html_patterns": [r'Shopify\.theme', r'shopify-section']
    },
    "wix": {
        "meta_generator": [r"wix\.com"],
        "scripts": [r"static\.wixstatic\.com", r"parastorage\.com", r"wix-code"],
        "headers": {"X-Wix-Request-Id": r".*"},
        "cookies": [],
        "html_patterns": [r'data-wix-type', r'wix-dropdown']
    },
    "squarespace": {
        "meta_generator": [r"squarespace"],
        "scripts": [r"static1\.squarespace\.com", r"squarespace-cdn"],
        "headers": {"X-ServedBy": r"squarespace"},
        "cookies": [],
        "html_patterns": [r'sqs-block', r'squarespace-announcement']
    },
    "webflow": {
        "meta_generator": [r"webflow"],
        "scripts": [r"webflow\.com", r"assets\.website-files\.com"],
        "headers": {"X-Webflow": r".*"},
        "cookies": [],
        "html_patterns": [r'w-nav', r'w-slider', r'data-wf-']
    },
    "prestashop": {
        "meta_generator": [r"prestashop"],
        "scripts": [r"modules.*prestashop", r"presta"],
        "headers": {},
        "cookies": [r"prestashop"],
        "html_patterns": [r'prestashop', r'blockcart']
    },
    "magento": {
        "meta_generator": [r"magento"],
        "scripts": [r"mage/", r"magento", r"requirejs-config"],
        "headers": {"X-Magento": r".*"},
        "cookies": [r"mage-cache"],
        "html_patterns": [r'Magento_', r'mage-init']
    },
    "drupal": {
        "meta_generator": [r"drupal"],
        "scripts": [r"drupal\.js", r"drupal\.settings"],
        "headers": {"X-Drupal-Cache": r".*", "X-Generator": r"drupal"},
        "cookies": [r"drupal", r"SSESS"],
        "html_patterns": [r'drupal-', r'views-row']
    },
    "joomla": {
        "meta_generator": [r"joomla"],
        "scripts": [r"/media/jui/", r"joomla"],
        "headers": {},
        "cookies": [],
        "html_patterns": [r'joomla', r'mod_']
    }
}


class PlatformDetectionService:
    """
    Service to detect website platform/CMS.
    
    Detection methods (in order of reliability):
    1. Meta generator tag
    2. HTTP response headers
    3. Scripts and stylesheets URLs
    4. HTML patterns and class names
    5. Cookies (if available)
    """
    
    def __init__(self):
        self.client = httpx.AsyncClient(
            timeout=20.0,
            follow_redirects=True,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
            }
        )
    
    async def detect_platform(self, url: str) -> Dict[str, Any]:
        """
        Detect the platform/CMS of a website.
        
        Args:
            url: URL to analyze
            
        Returns:
            Dict with platform info and capabilities
        """
        if not url.startswith(('http://', 'https://')):
            url = f'https://{url}'
        
        result = {
            "url": url,
            "detected_platform": "unknown",
            "platform_confidence": 0,
            "detection_signals": [],
            "capabilities": None,
            "manual_override": None  # User can override if detection is wrong
        }
        
        try:
            response = await self.client.get(url)
            html_content = response.text
            headers = dict(response.headers)
            cookies = response.cookies
            
            soup = BeautifulSoup(html_content, 'lxml')
            
            # Score each platform
            platform_scores: Dict[str, int] = {}
            platform_signals: Dict[str, List[str]] = {}
            
            for platform, patterns in PLATFORM_PATTERNS.items():
                score = 0
                signals = []
                
                # 1. Check meta generator (highest weight: 50 points)
                meta_gen = soup.find('meta', attrs={'name': 'generator'})
                if meta_gen:
                    gen_content = meta_gen.get('content', '').lower()
                    for pattern in patterns.get('meta_generator', []):
                        if re.search(pattern, gen_content, re.IGNORECASE):
                            score += 50
                            signals.append(f"Meta generator: {gen_content}")
                            break
                
                # 2. Check HTTP headers (30 points)
                for header_name, header_pattern in patterns.get('headers', {}).items():
                    header_value = headers.get(header_name, '')
                    if header_value and re.search(header_pattern, header_value, re.IGNORECASE):
                        score += 30
                        signals.append(f"Header {header_name}: {header_value[:50]}")
                
                # 3. Check scripts/CSS (20 points per match, max 40)
                scripts_found = 0
                for script in soup.find_all(['script', 'link']):
                    src = script.get('src') or script.get('href') or ''
                    for pattern in patterns.get('scripts', []):
                        if re.search(pattern, src, re.IGNORECASE):
                            score += 20
                            signals.append(f"Script/CSS: {src[:60]}...")
                            scripts_found += 1
                            if scripts_found >= 2:
                                break
                    if scripts_found >= 2:
                        break
                
                # 4. Check HTML patterns (10 points per match, max 20)
                html_lower = html_content[:50000].lower()  # Limit for performance
                html_matches = 0
                for pattern in patterns.get('html_patterns', []):
                    if re.search(pattern, html_lower, re.IGNORECASE):
                        score += 10
                        signals.append(f"HTML pattern: {pattern}")
                        html_matches += 1
                        if html_matches >= 2:
                            break
                
                if score > 0:
                    platform_scores[platform] = score
                    platform_signals[platform] = signals
            
            # Find best match
            if platform_scores:
                best_platform = max(platform_scores, key=platform_scores.get)
                best_score = platform_scores[best_platform]
                
                # Normalize confidence to 0-100
                confidence = min(best_score, 100)
                
                result["detected_platform"] = best_platform
                result["platform_confidence"] = confidence
                result["detection_signals"] = platform_signals.get(best_platform, [])
            else:
                # No patterns matched - likely custom code
                result["detected_platform"] = "custom"
                result["platform_confidence"] = 30
                result["detection_signals"] = ["No known CMS patterns detected"]
            
            # Add capabilities
            capabilities = PLATFORM_CAPABILITIES.get(
                result["detected_platform"],
                PLATFORM_CAPABILITIES["unknown"]
            )
            result["capabilities"] = {
                "can_edit_html": capabilities.can_edit_html,
                "can_add_plugins": capabilities.can_add_plugins,
                "can_add_schema": capabilities.can_add_schema,
                "schema_method": capabilities.schema_method,
                "difficulty_base": capabilities.difficulty_base,
                "tutorial_url": capabilities.tutorial_url
            }
            
        except Exception as e:
            logger.error(f"Platform detection failed for {url}: {e}")
            result["error"] = str(e)
        
        return result
    
    def get_recommendation_difficulty(
        self,
        platform: str,
        recommendation_category: str
    ) -> Dict[str, Any]:
        """
        Get difficulty level for a recommendation based on platform.
        
        Args:
            platform: Detected platform name
            recommendation_category: Category of recommendation
            
        Returns:
            Dict with difficulty info
        """
        capabilities = PLATFORM_CAPABILITIES.get(platform, PLATFORM_CAPABILITIES["unknown"])
        
        # Map recommendation categories to difficulty
        difficulty_mapping = {
            "structured_data": {
                "easy": capabilities.can_add_schema and capabilities.schema_method == "plugin",
                "medium": capabilities.can_add_schema and capabilities.schema_method in ["app", "code"],
                "hard": not capabilities.can_add_schema or capabilities.schema_method == "limited"
            },
            "crawler_access": {
                "easy": capabilities.can_edit_html or platform == "wordpress",
                "medium": not capabilities.can_edit_html and capabilities.can_add_plugins,
                "hard": not capabilities.can_edit_html and not capabilities.can_add_plugins
            },
            "technical": {
                "easy": capabilities.can_edit_html,
                "medium": capabilities.can_add_plugins,
                "hard": not capabilities.can_edit_html and not capabilities.can_add_plugins
            },
            "voice_search": {
                "easy": capabilities.can_add_schema and capabilities.schema_method == "plugin",
                "medium": capabilities.can_add_schema,
                "hard": not capabilities.can_add_schema
            }
        }
        
        category_rules = difficulty_mapping.get(recommendation_category, {})
        
        if category_rules.get("hard"):
            difficulty = "hard"
            estimated_time = "2+ horas (requiere desarrollador)"
            feasible = capabilities.can_add_schema or capabilities.can_edit_html
        elif category_rules.get("medium"):
            difficulty = "medium"
            estimated_time = "30-60 min"
            feasible = True
        else:
            difficulty = "easy"
            estimated_time = "5-15 min"
            feasible = True
        
        return {
            "difficulty": difficulty,
            "estimated_time": estimated_time,
            "feasible": feasible,
            "tutorial_url": capabilities.tutorial_url,
            "method": capabilities.schema_method if recommendation_category == "structured_data" else None
        }
    
    def filter_recommendations(
        self,
        recommendations: List[Dict[str, Any]],
        platform: str,
        include_unfeasible: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Filter and enrich recommendations based on platform capabilities.
        
        Args:
            recommendations: List of recommendation dicts
            platform: Detected platform
            include_unfeasible: Whether to include unfeasible recommendations
            
        Returns:
            Filtered and enriched recommendations
        """
        enriched = []
        
        for rec in recommendations:
            category = rec.get("category", "technical")
            difficulty_info = self.get_recommendation_difficulty(platform, category)
            
            if not include_unfeasible and not difficulty_info["feasible"]:
                continue
            
            enriched_rec = {
                **rec,
                "difficulty_level": difficulty_info["difficulty"],
                "estimated_time": difficulty_info["estimated_time"],
                "feasible_for_platform": difficulty_info["feasible"],
                "tutorial_url": difficulty_info["tutorial_url"],
                "implementation_method": difficulty_info["method"]
            }
            
            enriched.append(enriched_rec)
        
        # Sort by feasibility and priority
        priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        enriched.sort(key=lambda x: (
            not x["feasible_for_platform"],
            priority_order.get(x.get("priority", "medium"), 2)
        ))
        
        return enriched
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()


# Singleton instance
_platform_detection_service: Optional[PlatformDetectionService] = None


def get_platform_detection_service() -> PlatformDetectionService:
    """Get or create the singleton platform detection service."""
    global _platform_detection_service
    if _platform_detection_service is None:
        _platform_detection_service = PlatformDetectionService()
    return _platform_detection_service
