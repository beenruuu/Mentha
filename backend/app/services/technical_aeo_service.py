"""
Technical AEO Service - Analyzes technical signals that affect AI engine optimization.
Checks AI crawler permissions, structured data, and technical readiness for GEO.
"""

from typing import Dict, Any, List, Optional
import httpx
from bs4 import BeautifulSoup
import json
import re
from urllib.parse import urljoin, urlparse


class TechnicalAEOService:
    """Service for analyzing technical AEO/GEO signals."""
    
    # AI Crawlers to check in robots.txt
    AI_CRAWLERS = {
        'GPTBot': 'OpenAI (ChatGPT)',
        'ChatGPT-User': 'OpenAI (ChatGPT)',
        'CCBot': 'Common Crawl (used by many LLMs)',
        'anthropic-ai': 'Anthropic (Claude)',
        'ClaudeBot': 'Anthropic (Claude)',
        'Google-Extended': 'Google (Bard/Gemini)',
        'PerplexityBot': 'Perplexity AI',
        'Amazonbot': 'Amazon (Alexa)',
        'cohere-ai': 'Cohere AI',
        'Bytespider': 'ByteDance (used for AI training)'
    }
    
    # Schema.org types relevant for AEO
    AEO_SCHEMA_TYPES = {
        'FAQPage': 'Frequently Asked Questions',
        'QAPage': 'Question and Answer Page',
        'HowTo': 'How-to Instructions',
        'Article': 'Article/Blog Post',
        'NewsArticle': 'News Article',
        'Organization': 'Organization Info',
        'Product': 'Product Information',
        'BreadcrumbList': 'Navigation Breadcrumbs',
        'SearchAction': 'Site Search',
        'WebSite': 'Website Info'
    }
    
    def __init__(self):
        """Initialize the technical AEO service."""
        self.client = httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
            headers={
                'User-Agent': 'Mentha-AEO-Analyzer/1.0'
            }
        )
    
    async def audit_domain(self, domain: str) -> Dict[str, Any]:
        """
        Perform complete technical AEO audit for a domain.
        
        Args:
            domain: Domain to audit (e.g., 'example.com')
            
        Returns:
            Dictionary with audit results
        """
        # Ensure domain has protocol
        if not domain.startswith(('http://', 'https://')):
            domain = f'https://{domain}'
        
        print(f"Starting technical AEO audit for: {domain}")
        
        # Perform all checks
        crawler_permissions = await self._check_robots_txt(domain)
        structured_data = await self._extract_structured_data(domain)
        technical_signals = await self._check_technical_signals(domain)
        
        # Calculate overall AEO readiness score
        aeo_score = self._calculate_aeo_score(
            crawler_permissions,
            structured_data,
            technical_signals
        )
        
        return {
            'domain': domain,
            'ai_crawler_permissions': crawler_permissions,
            'structured_data': structured_data,
            'technical_signals': technical_signals,
            'aeo_readiness_score': aeo_score,
            'recommendations': self._generate_recommendations(
                crawler_permissions, structured_data, technical_signals
            )
        }
    
    async def _check_robots_txt(self, domain: str) -> Dict[str, Any]:
        """
        Check robots.txt for AI crawler permissions.
        
        Args:
            domain: Domain to check
            
        Returns:
            Dictionary with crawler permissions
        """
        robots_url = urljoin(domain, '/robots.txt')
        
        try:
            response = await self.client.get(robots_url)
            if response.status_code == 404:
                print(f"robots.txt not found for {domain}")
                return {
                    'found': False,
                    'crawlers': {bot: 'not_specified' for bot in self.AI_CRAWLERS.keys()},
                    'note': 'No robots.txt found - all crawlers allowed by default'
                }
            
            robots_content = response.text
            permissions = self._parse_robots_txt(robots_content)
            
            return {
                'found': True,
                'url': robots_url,
                'crawlers': permissions,
                'sitemap': self._extract_sitemap_from_robots(robots_content)
            }
            
        except Exception as e:
            print(f"Error checking robots.txt: {e}")
            return {
                'found': False,
                'error': str(e),
                'crawlers': {bot: 'unknown' for bot in self.AI_CRAWLERS.keys()}
            }
    
    def _parse_robots_txt(self, content: str) -> Dict[str, str]:
        """
        Parse robots.txt content to extract AI crawler permissions.
        
        Args:
            content: robots.txt file content
            
        Returns:
            Dictionary mapping bot names to permissions (allowed/disallowed/not_specified)
        """
        permissions = {}
        current_agents = []
        
        for line in content.split('\n'):
            line = line.strip()
            
            # Skip comments and empty lines
            if not line or line.startswith('#'):
                continue
            
            # Check for User-agent directive
            if line.lower().startswith('user-agent:'):
                agent = line.split(':', 1)[1].strip()
                current_agents.append(agent)
            
            # Check for Disallow directive
            elif line.lower().startswith('disallow:'):
                disallow_path = line.split(':', 1)[1].strip()
                for agent in current_agents:
                    if agent in self.AI_CRAWLERS or agent == '*':
                        # If disallowing root, bot is blocked
                        if disallow_path == '/' or disallow_path == '':
                            for bot in self.AI_CRAWLERS.keys():
                                if agent == bot or agent == '*':
                                    permissions[bot] = 'disallowed'
            
            # Check for Allow directive
            elif line.lower().startswith('allow:'):
                for agent in current_agents:
                    if agent in self.AI_CRAWLERS:
                        permissions[agent] = 'allowed'
            
            # Reset current agents on empty line or new user-agent
            if not line or line.lower().startswith('user-agent:'):
                if line.lower().startswith('user-agent:'):
                    current_agents = []
        
        # Set default for bots not explicitly mentioned
        for bot in self.AI_CRAWLERS.keys():
            if bot not in permissions:
                # Check if there's a wildcard disallow
                if '*' in permissions and permissions['*'] == 'disallowed':
                    permissions[bot] = 'disallowed'
                else:
                    permissions[bot] = 'not_specified'  # Allowed by default
        
        return permissions
    
    def _extract_sitemap_from_robots(self, content: str) -> Optional[str]:
        """Extract sitemap URL from robots.txt"""
        for line in content.split('\n'):
            if line.lower().startswith('sitemap:'):
                return line.split(':', 1)[1].strip()
        return None
    
    async def _extract_structured_data(self, domain: str) -> Dict[str, Any]:
        """
        Extract and analyze JSON-LD structured data from domain.
        
        Args:
            domain: Domain to analyze
            
        Returns:
            Dictionary with structured data analysis
        """
        try:
            response = await self.client.get(domain)
            soup = BeautifulSoup(response.text, 'lxml')
            
            # Find all JSON-LD script tags
            jsonld_scripts = soup.find_all('script', type='application/ld+json')
            
            schemas_found = []
            schema_types = set()
            
            for script in jsonld_scripts:
                try:
                    data = json.loads(script.string)
                    
                    # Handle both single objects and arrays
                    if isinstance(data, list):
                        for item in data:
                            schema_type = item.get('@type', 'Unknown')
                            schema_types.add(schema_type)
                            schemas_found.append({
                                'type': schema_type,
                                'data': item
                            })
                    else:
                        schema_type = data.get('@type', 'Unknown')
                        schema_types.add(schema_type)
                        schemas_found.append({
                            'type': schema_type,
                            'data': data
                        })
                        
                except json.JSONDecodeError as e:
                    print(f"Error parsing JSON-LD: {e}")
                    continue
            
            # Check for AEO-relevant schemas
            aeo_schemas = {}
            for schema_type, description in self.AEO_SCHEMA_TYPES.items():
                aeo_schemas[schema_type] = {
                    'present': schema_type in schema_types,
                    'description': description
                }
            
            return {
                'total_schemas': len(schemas_found),
                'schema_types': list(schema_types),
                'aeo_schemas': aeo_schemas,
                'schemas_detail': schemas_found,
                'has_faq': 'FAQPage' in schema_types or 'QAPage' in schema_types,
                'has_howto': 'HowTo' in schema_types,
                'has_article': 'Article' in schema_types or 'NewsArticle' in schema_types
            }
            
        except Exception as e:
            print(f"Error extracting structured data: {e}")
            return {
                'total_schemas': 0,
                'schema_types': [],
                'aeo_schemas': {},
                'error': str(e)
            }
    
    async def _check_technical_signals(self, domain: str) -> Dict[str, Any]:
        """
        Check various technical signals important for AEO.
        
        Args:
            domain: Domain to check
            
        Returns:
            Dictionary with technical signals
        """
        signals = {}
        
        try:
            response = await self.client.get(domain)
            
            # HTTPS check
            signals['https'] = domain.startswith('https://')
            
            # Response time
            signals['response_time_ms'] = int(response.elapsed.total_seconds() * 1000)
            
            # Mobile responsiveness (basic check via viewport meta tag)
            soup = BeautifulSoup(response.text, 'lxml')
            viewport_meta = soup.find('meta', attrs={'name': 'viewport'})
            signals['has_viewport'] = viewport_meta is not None
            
            # Check for RSS/Atom feeds
            rss_link = soup.find('link', attrs={'type': 'application/rss+xml'})
            atom_link = soup.find('link', attrs={'type': 'application/atom+xml'})
            signals['has_rss_feed'] = rss_link is not None or atom_link is not None
            
            # Check for API indicators (common API endpoints)
            signals['potential_api'] = await self._check_api_endpoints(domain)
            
            # Meta tags for social/search
            signals['has_meta_description'] = soup.find('meta', attrs={'name': 'description'}) is not None
            signals['has_og_tags'] = soup.find('meta', property=re.compile('^og:')) is not None
            
        except Exception as e:
            print(f"Error checking technical signals: {e}")
            signals['error'] = str(e)
        
        return signals
    
    async def _check_api_endpoints(self, domain: str) -> bool:
        """Check if domain has accessible API endpoints"""
        api_paths = ['/api', '/api/v1', '/api/v2', '/graphql', '/rest']
        
        for path in api_paths:
            try:
                url = urljoin(domain, path)
                response = await self.client.head(url)
                if response.status_code < 500:  # API exists if not server error
                    return True
            except:
                continue
        
        return False
    
    def _calculate_aeo_score(
        self,
        crawlers: Dict[str, Any],
        schemas: Dict[str, Any],
        technical: Dict[str, Any]
    ) -> float:
        """
        Calculate overall AEO readiness score (0-100).
        
        Scoring breakdown:
        - Crawler permissions: 40 points
        - Structured data: 40 points
        - Technical signals: 20 points
        """
        score = 0.0
        
        # Crawler permissions (40 points max)
        if crawlers.get('found'):
            allowed_count = sum(
                1 for status in crawlers.get('crawlers', {}).values()
                if status in ('allowed', 'not_specified')
            )
            total_crawlers = len(self.AI_CRAWLERS)
            score += (allowed_count / total_crawlers) * 40
        else:
            score += 30  # No robots.txt = allowed by default, but not optimal
        
        # Structured data (40 points max)
        total_schemas = schemas.get('total_schemas', 0)
        if total_schemas > 0:
            # Base points for having schemas
            score += 15
            
            # Bonus for AEO-specific schemas
            if schemas.get('has_faq'):
                score += 10
            if schemas.get('has_howto'):
                score += 8
            if schemas.get('has_article'):
                score += 7
        
        # Technical signals (20 points max)
        if technical.get('https'):
            score += 5
        if technical.get('has_viewport'):
            score += 4
        if technical.get('has_rss_feed'):
            score += 3
        if technical.get('potential_api'):
            score += 4
        if technical.get('has_meta_description'):
            score += 2
        if technical.get('has_og_tags'):
            score += 2
        
        return min(round(score, 1), 100.0)
    
    def _generate_recommendations(
        self,
        crawlers: Dict[str, Any],
        schemas: Dict[str, Any],
        technical: Dict[str, Any]
    ) -> List[Dict[str, str]]:
        """Generate actionable AEO recommendations"""
        recommendations = []
        
        # Crawler recommendations
        if crawlers.get('found'):
            disallowed = [
                f"{bot} ({self.AI_CRAWLERS[bot]})"
                for bot, status in crawlers.get('crawlers', {}).items()
                if status == 'disallowed'
            ]
            if disallowed:
                recommendations.append({
                    'priority': 'high',
                    'category': 'crawler_access',
                    'title': 'AI Crawlers Blocked',
                    'description': f"The following AI crawlers are blocked: {', '.join(disallowed)}. Consider allowing them in robots.txt."
                })
        
        # Schema recommendations
        if not schemas.get('has_faq'):
            recommendations.append({
                'priority': 'high',
                'category': 'structured_data',
                'title': 'Add FAQ Schema',
                'description': 'Implement FAQPage schema.org markup to increase chances of being cited by AI engines for Q&A queries.'
            })
        
        if not schemas.get('has_howto'):
            recommendations.append({
                'priority': 'medium',
                'category': 'structured_data',
                'title': 'Add HowTo Schema',
                'description': 'Add HowTo schema for instructional content to help AI engines understand and cite your guides.'
            })
        
        if schemas.get('total_schemas', 0) == 0:
            recommendations.append({
                'priority': 'critical',
                'category': 'structured_data',
                'title': 'No Structured Data Found',
                'description': 'Implement JSON-LD structured data (schema.org) to help AI engines understand your content better.'
            })
        
        # Technical recommendations
        if not technical.get('https'):
            recommendations.append({
                'priority': 'critical',
                'category': 'technical',
                'title': 'Enable HTTPS',
                'description': 'Switch to HTTPS for security and better AI crawler trust.'
            })
        
        if not technical.get('has_rss_feed'):
            recommendations.append({
                'priority': 'low',
                'category': 'technical',
                'title': 'Add RSS Feed',
                'description': 'Provide an RSS/Atom feed to make content updates easily discoverable.'
            })
        
        return recommendations
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()
