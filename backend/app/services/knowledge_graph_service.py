"""
Knowledge Graph Monitor Service - Monitor brand presence in knowledge graphs.

This service checks and monitors a brand's presence across various
knowledge bases and entity databases that AI models use for information.

Key Features:
- Google Knowledge Panel detection
- Wikidata entity lookup
- Wikipedia presence check
- Brand entity recognition by LLMs
- Knowledge graph completeness assessment
"""

import asyncio
import re
from typing import Dict, Any, List, Optional
from datetime import datetime
import httpx
from urllib.parse import quote

from app.core.config import settings

import logging

logger = logging.getLogger(__name__)


class KnowledgeGraphMonitorService:
    """
    Service to monitor brand presence in knowledge graphs.
    
    AI models derive much of their knowledge from structured knowledge
    bases. Being present in these databases increases AI visibility.
    """
    
    # Wikidata properties relevant for brands/organizations
    WIKIDATA_PROPERTIES = {
        'P31': 'instance_of',      # What type of entity
        'P856': 'official_website',
        'P154': 'logo',
        'P571': 'inception_date',
        'P17': 'country',
        'P452': 'industry',
        'P159': 'headquarters',
        'P169': 'ceo',
        'P1128': 'employees',
        'P2139': 'revenue',
        'P373': 'commons_category',
        'P18': 'image',
    }
    
    def __init__(self):
        self.client = httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
            headers={'User-Agent': 'Mentha-KG-Monitor/1.0'}
        )
        self.openai_key = settings.OPENAI_API_KEY
    
    async def monitor_knowledge_presence(
        self,
        brand_name: str,
        domain: str = "",
        aliases: List[str] = None
    ) -> Dict[str, Any]:
        """
        Monitor brand presence across knowledge graphs.
        
        Args:
            brand_name: Primary brand name
            domain: Brand's domain
            aliases: Alternative names/spellings
            
        Returns:
            Knowledge graph presence analysis
        """
        logger.info(f"[KG] Starting knowledge graph monitoring for: {brand_name}")
        logger.info(f"[KG] Domain: {domain}")
        
        results = {
            "brand_name": brand_name,
            "domain": domain,
            "monitored_at": datetime.utcnow().isoformat() + "Z",
            "knowledge_sources": {},
            "entity_recognition": {},
            "completeness_score": 0,
            "recommendations": [],
            "presence_score": 0
        }
        
        search_terms = [brand_name] + (aliases or [])
        
        # Check various knowledge sources
        tasks = [
            self._check_wikidata(brand_name, search_terms),
            self._check_wikipedia(brand_name),
            self._check_google_knowledge_panel(brand_name, domain),
            self._check_llm_entity_recognition(brand_name, domain),
        ]
        
        source_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results
        source_names = ['wikidata', 'wikipedia', 'google_kg', 'llm_recognition']
        
        for name, result in zip(source_names, source_results):
            if isinstance(result, Exception):
                results["knowledge_sources"][name] = {
                    "found": False,
                    "error": str(result)
                }
            else:
                results["knowledge_sources"][name] = result or {"found": False}
        
        # Calculate completeness and presence scores
        results["completeness_score"] = self._calculate_completeness(results)
        results["presence_score"] = self._calculate_presence_score(results)
        
        # Generate recommendations
        results["recommendations"] = self._generate_kg_recommendations(results)
        
        logger.info(f"[KG] Monitoring complete. Completeness: {results['completeness_score']}, Presence: {results['presence_score']}")
        logger.info(f"[KG] Sources checked: {list(results['knowledge_sources'].keys())}")
        
        return results
    
    async def _check_wikidata(
        self,
        brand_name: str,
        search_terms: List[str]
    ) -> Dict[str, Any]:
        """
        Check Wikidata for brand entity.
        
        Wikidata is a structured knowledge base that many AI models reference.
        """
        result = {
            "found": False,
            "entity_id": None,
            "properties": {},
            "labels": {},
            "descriptions": {},
            "sitelinks": 0
        }
        
        try:
            # Search for entity
            search_url = "https://www.wikidata.org/w/api.php"
            
            for term in search_terms[:3]:
                params = {
                    "action": "wbsearchentities",
                    "search": term,
                    "language": "en",
                    "format": "json",
                    "limit": 5
                }
                
                response = await self.client.get(search_url, params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    search_results = data.get("search", [])
                    
                    for item in search_results:
                        # Check if it's an organization/company/brand
                        entity_id = item.get("id")
                        description = item.get("description", "").lower()
                        
                        if any(word in description for word in 
                               ['company', 'corporation', 'brand', 'organization', 
                                'business', 'startup', 'enterprise', 'firm']):
                            result["found"] = True
                            result["entity_id"] = entity_id
                            result["labels"]["en"] = item.get("label")
                            result["descriptions"]["en"] = item.get("description")
                            
                            # Fetch full entity data
                            entity_data = await self._fetch_wikidata_entity(entity_id)
                            if entity_data:
                                result["properties"] = entity_data.get("properties", {})
                                result["sitelinks"] = entity_data.get("sitelinks", 0)
                            
                            return result
            
        except Exception as e:
            result["error"] = str(e)
        
        return result
    
    async def _fetch_wikidata_entity(self, entity_id: str) -> Optional[Dict]:
        """Fetch detailed entity data from Wikidata."""
        try:
            url = f"https://www.wikidata.org/wiki/Special:EntityData/{entity_id}.json"
            response = await self.client.get(url)
            
            if response.status_code == 200:
                data = response.json()
                entity = data.get("entities", {}).get(entity_id, {})
                
                # Extract relevant properties
                claims = entity.get("claims", {})
                properties = {}
                
                for prop_id, prop_name in self.WIKIDATA_PROPERTIES.items():
                    if prop_id in claims:
                        properties[prop_name] = True
                
                # Count sitelinks (Wikipedia pages in different languages)
                sitelinks = len(entity.get("sitelinks", {}))
                
                return {
                    "properties": properties,
                    "sitelinks": sitelinks
                }
                
        except Exception as e:
            print(f"Error fetching Wikidata entity: {e}")
        
        return None
    
    async def _check_wikipedia(self, brand_name: str) -> Dict[str, Any]:
        """
        Check Wikipedia for brand page.
        
        Wikipedia is a primary source for AI training data.
        """
        result = {
            "found": False,
            "page_exists": False,
            "page_url": None,
            "summary": None,
            "languages": 0,
            "categories": [],
            "infobox_present": False
        }
        
        try:
            # Use Wikipedia API
            api_url = "https://en.wikipedia.org/w/api.php"
            
            # Search for page
            params = {
                "action": "query",
                "list": "search",
                "srsearch": brand_name,
                "format": "json",
                "srlimit": 5
            }
            
            response = await self.client.get(api_url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                search_results = data.get("query", {}).get("search", [])
                
                for item in search_results:
                    title = item.get("title", "")
                    if brand_name.lower() in title.lower():
                        result["found"] = True
                        result["page_exists"] = True
                        result["page_url"] = f"https://en.wikipedia.org/wiki/{quote(title)}"
                        result["summary"] = item.get("snippet", "")[:200]
                        
                        # Get more page info
                        page_info = await self._get_wikipedia_page_info(title)
                        if page_info:
                            result["languages"] = page_info.get("languages", 0)
                            result["categories"] = page_info.get("categories", [])
                            result["infobox_present"] = page_info.get("has_infobox", False)
                        
                        return result
            
        except Exception as e:
            result["error"] = str(e)
        
        return result
    
    async def _get_wikipedia_page_info(self, title: str) -> Optional[Dict]:
        """Get additional Wikipedia page information."""
        try:
            api_url = "https://en.wikipedia.org/w/api.php"
            
            # Get page info including langlinks and categories
            params = {
                "action": "query",
                "titles": title,
                "prop": "langlinks|categories|revisions",
                "lllimit": "max",
                "cllimit": "max",
                "rvprop": "content",
                "rvslots": "main",
                "rvsection": 0,
                "format": "json"
            }
            
            response = await self.client.get(api_url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                pages = data.get("query", {}).get("pages", {})
                
                for page_id, page_data in pages.items():
                    if page_id == "-1":
                        continue
                    
                    langlinks = page_data.get("langlinks", [])
                    categories = [c.get("title", "") for c in page_data.get("categories", [])]
                    
                    # Check for infobox in content
                    content = ""
                    revisions = page_data.get("revisions", [])
                    if revisions:
                        slots = revisions[0].get("slots", {})
                        content = slots.get("main", {}).get("*", "")
                    
                    has_infobox = "{{infobox" in content.lower() or "{{Infobox" in content
                    
                    return {
                        "languages": len(langlinks),
                        "categories": categories[:10],
                        "has_infobox": has_infobox
                    }
                    
        except Exception as e:
            print(f"Error getting Wikipedia page info: {e}")
        
        return None
    
    async def _check_google_knowledge_panel(
        self,
        brand_name: str,
        domain: str
    ) -> Dict[str, Any]:
        """
        Check for Google Knowledge Panel presence.
        
        Uses web search as indicator (actual KG API requires auth).
        """
        result = {
            "found": False,
            "likely_has_panel": False,
            "supporting_signals": [],
            "brand_recognition": "unknown"
        }
        
        try:
            from duckduckgo_search import DDGS
            
            with DDGS() as ddgs:
                # Search for brand - KG panels often correlate with rich results
                query = f'"{brand_name}" company'
                search_results = list(ddgs.text(query, max_results=10))
                
                official_site_found = False
                social_profiles = 0
                news_coverage = 0
                
                for res in search_results:
                    url = res.get('href', '').lower()
                    title = res.get('title', '').lower()
                    
                    # Check for official site
                    if domain:
                        domain_clean = domain.lower().replace('https://', '').replace('http://', '')
                        if domain_clean in url:
                            official_site_found = True
                            result["supporting_signals"].append("Official site in results")
                    
                    # Check for social profiles
                    social_sites = ['linkedin.com', 'twitter.com', 'facebook.com', 'crunchbase.com']
                    if any(site in url for site in social_sites):
                        social_profiles += 1
                    
                    # Check for news coverage
                    news_sites = ['news.', 'techcrunch', 'forbes', 'bloomberg', 'reuters']
                    if any(site in url for site in news_sites):
                        news_coverage += 1
                
                # Brands with KG panels typically have:
                # - Official site ranking
                # - Multiple social profiles
                # - News coverage
                
                if official_site_found:
                    result["supporting_signals"].append("Official site ranks")
                
                if social_profiles >= 2:
                    result["supporting_signals"].append(f"{social_profiles} social profiles found")
                
                if news_coverage >= 1:
                    result["supporting_signals"].append(f"{news_coverage} news mentions found")
                
                # Estimate KG presence
                signals = len(result["supporting_signals"])
                if signals >= 3:
                    result["likely_has_panel"] = True
                    result["found"] = True
                    result["brand_recognition"] = "high"
                elif signals >= 2:
                    result["brand_recognition"] = "medium"
                elif signals >= 1:
                    result["brand_recognition"] = "low"
                    
        except ImportError:
            result["error"] = "duckduckgo_search not installed"
        except Exception as e:
            result["error"] = str(e)
        
        return result
    
    async def _check_llm_entity_recognition(
        self,
        brand_name: str,
        domain: str
    ) -> Dict[str, Any]:
        """
        Check if LLMs recognize the brand as a distinct entity.
        
        Tests whether AI models have internalized the brand identity.
        """
        result = {
            "found": False,
            "recognized_as_entity": False,
            "entity_type": None,
            "known_attributes": [],
            "confidence": 0
        }
        
        if not self.openai_key:
            result["error"] = "OpenAI API key not configured"
            return result
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                headers = {
                    "Authorization": f"Bearer {self.openai_key}",
                    "Content-Type": "application/json"
                }
                
                # Ask LLM to describe the brand as an entity
                prompt = f"""Analyze "{brand_name}" as a named entity. 
                
If you recognize this as a brand, company, or organization, respond with:
1. Entity type (e.g., "technology company", "startup", "brand")
2. 3-5 key attributes you know about it
3. Confidence level (high/medium/low/unknown)

If you don't recognize it or it's not a known entity, say "UNKNOWN".

Keep response brief and factual."""
                
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers=headers,
                    json={
                        "model": "gpt-3.5-turbo",
                        "messages": [{"role": "user", "content": prompt}],
                        "max_tokens": 200,
                        "temperature": 0
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    
                    if "UNKNOWN" not in content.upper():
                        result["found"] = True
                        result["recognized_as_entity"] = True
                        
                        # Extract entity type
                        type_patterns = [
                            r'entity type[:\s]+([^,\n]+)',
                            r'is\s+(?:a|an)\s+([^,\n.]+)',
                            r'type[:\s]+([^,\n]+)',
                        ]
                        for pattern in type_patterns:
                            match = re.search(pattern, content, re.I)
                            if match:
                                result["entity_type"] = match.group(1).strip()[:50]
                                break
                        
                        # Extract attributes (numbered items)
                        attr_matches = re.findall(r'\d+\.\s*([^\n]+)', content)
                        result["known_attributes"] = [a.strip()[:100] for a in attr_matches[:5]]
                        
                        # Extract confidence
                        if 'high' in content.lower():
                            result["confidence"] = 90
                        elif 'medium' in content.lower():
                            result["confidence"] = 60
                        elif 'low' in content.lower():
                            result["confidence"] = 30
                        else:
                            result["confidence"] = 50
                    
        except Exception as e:
            result["error"] = str(e)
        
        return result
    
    def _calculate_completeness(self, results: Dict[str, Any]) -> float:
        """Calculate knowledge graph completeness score."""
        sources = results.get("knowledge_sources", {})
        
        score = 0
        max_score = 100
        
        # Wikidata (30 points)
        wikidata = sources.get("wikidata", {})
        if wikidata.get("found"):
            score += 15
            properties = wikidata.get("properties", {})
            # Bonus for rich properties
            prop_count = len([p for p in properties.values() if p])
            score += min(prop_count * 2, 15)
        
        # Wikipedia (30 points)
        wikipedia = sources.get("wikipedia", {})
        if wikipedia.get("found"):
            score += 15
            if wikipedia.get("infobox_present"):
                score += 10
            if wikipedia.get("languages", 0) >= 5:
                score += 5
        
        # Google KG (20 points)
        google_kg = sources.get("google_kg", {})
        if google_kg.get("likely_has_panel"):
            score += 20
        elif google_kg.get("brand_recognition") == "medium":
            score += 10
        elif google_kg.get("brand_recognition") == "low":
            score += 5
        
        # LLM Recognition (20 points)
        llm = sources.get("llm_recognition", {})
        if llm.get("recognized_as_entity"):
            confidence = llm.get("confidence", 0)
            score += int(20 * (confidence / 100))
        
        return round(min(score, max_score), 1)
    
    def _calculate_presence_score(self, results: Dict[str, Any]) -> float:
        """Calculate overall knowledge graph presence score."""
        sources = results.get("knowledge_sources", {})
        
        # Count sources where brand is found
        found_count = sum(1 for s in sources.values() if s.get("found"))
        total_sources = len(sources)
        
        if total_sources == 0:
            return 0
        
        # Base presence score
        base_score = (found_count / total_sources) * 60
        
        # Add completeness bonus
        completeness = results.get("completeness_score", 0)
        completeness_bonus = completeness * 0.4
        
        return round(min(base_score + completeness_bonus, 100), 1)
    
    def _generate_kg_recommendations(self, results: Dict[str, Any]) -> List[Dict[str, str]]:
        """Generate recommendations for improving knowledge graph presence."""
        recommendations = []
        sources = results.get("knowledge_sources", {})
        
        # Wikipedia recommendations
        wikipedia = sources.get("wikipedia", {})
        if not wikipedia.get("found"):
            recommendations.append({
                "priority": "high",
                "category": "knowledge_base",
                "title": "Create Wikipedia Page",
                "description": "Your brand doesn't have a Wikipedia page. Consider creating one if your brand meets Wikipedia's notability guidelines. This significantly improves AI knowledge about your brand."
            })
        elif not wikipedia.get("infobox_present"):
            recommendations.append({
                "priority": "medium",
                "category": "knowledge_base",
                "title": "Add Wikipedia Infobox",
                "description": "Your Wikipedia page lacks an infobox. Adding structured infobox data improves how AI extracts information."
            })
        
        # Wikidata recommendations
        wikidata = sources.get("wikidata", {})
        if not wikidata.get("found"):
            recommendations.append({
                "priority": "high",
                "category": "knowledge_base",
                "title": "Create Wikidata Entry",
                "description": "Create a Wikidata entry for your brand. Wikidata is a primary structured knowledge source for AI models."
            })
        elif wikidata.get("found"):
            properties = wikidata.get("properties", {})
            missing = []
            if not properties.get("official_website"):
                missing.append("official website")
            if not properties.get("industry"):
                missing.append("industry")
            if not properties.get("inception_date"):
                missing.append("founding date")
            
            if missing:
                recommendations.append({
                    "priority": "medium",
                    "category": "knowledge_base",
                    "title": "Complete Wikidata Properties",
                    "description": f"Add missing Wikidata properties: {', '.join(missing)}. Complete data improves AI understanding."
                })
        
        # Google KG recommendations
        google_kg = sources.get("google_kg", {})
        if google_kg.get("brand_recognition") in ["low", "unknown"]:
            recommendations.append({
                "priority": "medium",
                "category": "web_presence",
                "title": "Improve Web Presence",
                "description": "Build presence on major platforms (LinkedIn, Crunchbase, social media) and seek press coverage to increase brand recognition."
            })
        
        # LLM recognition
        llm = sources.get("llm_recognition", {})
        if not llm.get("recognized_as_entity"):
            recommendations.append({
                "priority": "high",
                "category": "content",
                "title": "Improve Brand Clarity",
                "description": "AI models don't recognize your brand as a distinct entity. Ensure your website clearly defines who you are, what you do, and your unique value proposition."
            })
        
        return recommendations
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()


# Singleton instance
_kg_monitor: Optional[KnowledgeGraphMonitorService] = None

def get_knowledge_graph_monitor() -> KnowledgeGraphMonitorService:
    """Get singleton instance of KnowledgeGraphMonitorService."""
    global _kg_monitor
    if _kg_monitor is None:
        _kg_monitor = KnowledgeGraphMonitorService()
    return _kg_monitor
