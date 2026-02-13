"""
Entity Resolution Service - Knowledge Graph Identity Establishment for GEO/AEO.

This service establishes the brand as a recognized entity in:
1. Wikidata (open knowledge base)
2. Google Knowledge Graph API
3. Internal Knowledge Graph

Entity resolution is critical because:
- LLMs use entity embeddings for recognition
- Ambiguous entities (e.g., "Apple" - tech vs fruit) cause confusion
- Clear entity links improve citation probability in AI responses

The service provides:
- Entity search across knowledge bases
- Disambiguation workflow (interactive or automatic)
- Entity creation guidance if brand is not yet recognized
- sameAs link generation for Schema.org JSON-LD

Architecture:
- Async interface for FastAPI
- Caching for expensive API calls
- Graceful degradation if external APIs unavailable
"""

import asyncio
import logging
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import hashlib
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class EntitySource(str, Enum):
    """Sources for entity resolution."""
    WIKIDATA = "wikidata"
    GOOGLE_KG = "google_kg"
    CRUNCHBASE = "crunchbase"
    LINKEDIN = "linkedin"
    INTERNAL = "internal"


@dataclass
class KnowledgeGraphIdentity:
    """
    Represents a brand's identity in external knowledge graphs.
    
    This is the "Ground Truth" for entity disambiguation.
    """
    entity_id: str  # e.g., "Q95" for Google
    source: EntitySource
    name: str
    description: Optional[str] = None
    url: Optional[str] = None
    entity_type: Optional[str] = None  # "Organization", "Brand", etc.
    confidence: float = 1.0
    properties: Dict[str, Any] = field(default_factory=dict)
    same_as_urls: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "entity_id": self.entity_id,
            "source": self.source.value,
            "name": self.name,
            "description": self.description,
            "url": self.url,
            "entity_type": self.entity_type,
            "confidence": self.confidence,
            "properties": self.properties,
            "same_as_urls": self.same_as_urls,
        }


@dataclass
class EntityResolutionResult:
    """
    Result of entity resolution process.
    
    Contains:
    - Matched identities from knowledge bases
    - Disambiguation status
    - Suggested Schema.org sameAs links
    """
    brand_name: str
    brand_domain: str
    is_known_entity: bool
    primary_identity: Optional[KnowledgeGraphIdentity] = None
    alternative_identities: List[KnowledgeGraphIdentity] = field(default_factory=list)
    ambiguity_level: str = "none"  # "none", "low", "moderate", "high"
    recommended_same_as: List[str] = field(default_factory=list)
    disambiguation_needed: bool = False
    disambiguation_options: List[Dict[str, Any]] = field(default_factory=list)
    resolution_timestamp: Optional[datetime] = None
    
    def __post_init__(self):
        if self.resolution_timestamp is None:
            self.resolution_timestamp = datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "brand_name": self.brand_name,
            "brand_domain": self.brand_domain,
            "is_known_entity": self.is_known_entity,
            "primary_identity": self.primary_identity.to_dict() if self.primary_identity else None,
            "alternative_identities": [i.to_dict() for i in self.alternative_identities],
            "ambiguity_level": self.ambiguity_level,
            "recommended_same_as": self.recommended_same_as,
            "disambiguation_needed": self.disambiguation_needed,
            "disambiguation_options": self.disambiguation_options,
            "resolution_timestamp": self.resolution_timestamp.isoformat() if self.resolution_timestamp else None,
        }


class EntityResolutionService:
    """
    Entity Resolution Service for establishing Knowledge Graph identity.
    
    Usage:
        service = get_entity_resolution_service()
        result = await service.resolve_entity("Mentha", "mentha.ai")
        
        if result.disambiguation_needed:
            # Present options to user
            identity = await service.confirm_identity(result, user_choice=0)
        else:
            identity = result.primary_identity
    """
    
    _instance: Optional["EntityResolutionService"] = None
    _cache: Dict[str, Tuple[EntityResolutionResult, datetime]] = {}
    CACHE_TTL = timedelta(hours=24)
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if hasattr(self, "_initialized") and self._initialized:
            return
        self._http_client: Optional[httpx.AsyncClient] = None
        self._initialized = True
    
    async def _get_http_client(self) -> httpx.AsyncClient:
        if self._http_client is None:
            self._http_client = httpx.AsyncClient(timeout=15.0)
        return self._http_client
    
    def _cache_key(self, name: str, domain: str) -> str:
        return hashlib.md5(f"{name.lower()}:{domain.lower()}".encode()).hexdigest()
    
    async def resolve_entity(
        self,
        brand_name: str,
        brand_domain: str,
        industry: Optional[str] = None,
        force_refresh: bool = False
    ) -> EntityResolutionResult:
        """
        Resolve a brand to its Knowledge Graph identities.
        
        Args:
            brand_name: Name of the brand
            brand_domain: Domain (used for disambiguation)
            industry: Optional industry context
            force_refresh: Bypass cache
            
        Returns:
            EntityResolutionResult with matched identities
        """
        cache_key = self._cache_key(brand_name, brand_domain)
        
        # Check cache
        if not force_refresh and cache_key in self._cache:
            cached, timestamp = self._cache[cache_key]
            if datetime.utcnow() - timestamp < self.CACHE_TTL:
                logger.debug(f"Cache hit for entity resolution: {brand_name}")
                return cached
        
        logger.info(f"Resolving entity: {brand_name} ({brand_domain})")
        
        # Query multiple knowledge bases in parallel
        tasks = [
            self._search_wikidata(brand_name, industry),
            self._search_google_kg(brand_name),
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        wikidata_results = results[0] if not isinstance(results[0], Exception) else []
        google_kg_results = results[1] if not isinstance(results[1], Exception) else []
        
        # Combine and deduplicate
        all_identities = wikidata_results + google_kg_results
        
        # Score and rank identities
        scored_identities = await self._score_identities(
            all_identities, brand_name, brand_domain, industry
        )
        
        # Determine ambiguity level
        ambiguity = self._assess_ambiguity(scored_identities)
        
        # Build result
        result = EntityResolutionResult(
            brand_name=brand_name,
            brand_domain=brand_domain,
            is_known_entity=len(scored_identities) > 0,
            primary_identity=scored_identities[0] if scored_identities else None,
            alternative_identities=scored_identities[1:5] if len(scored_identities) > 1 else [],
            ambiguity_level=ambiguity,
            disambiguation_needed=ambiguity in ("moderate", "high"),
        )
        
        # Generate sameAs recommendations
        if result.primary_identity:
            result.recommended_same_as = self._generate_same_as(result.primary_identity)
        
        # Build disambiguation options
        if result.disambiguation_needed:
            result.disambiguation_options = [
                {
                    "index": i,
                    "name": identity.name,
                    "description": identity.description,
                    "source": identity.source.value,
                    "type": identity.entity_type,
                }
                for i, identity in enumerate(scored_identities[:5])
            ]
        
        # Cache result
        self._cache[cache_key] = (result, datetime.utcnow())
        
        return result
    
    async def _search_wikidata(
        self,
        query: str,
        industry: Optional[str] = None
    ) -> List[KnowledgeGraphIdentity]:
        """Search Wikidata for matching entities."""
        try:
            client = await self._get_http_client()
            
            # Wikidata search API
            url = "https://www.wikidata.org/w/api.php"
            params = {
                "action": "wbsearchentities",
                "search": query,
                "language": "en",
                "format": "json",
                "limit": 10,
            }
            
            response = await client.get(url, params=params)
            if response.status_code != 200:
                return []
            
            data = response.json()
            identities = []
            
            for item in data.get("search", []):
                wikidata_id = item.get("id")
                
                # Get detailed entity info
                details = await self._get_wikidata_entity(wikidata_id)
                
                identity = KnowledgeGraphIdentity(
                    entity_id=wikidata_id,
                    source=EntitySource.WIKIDATA,
                    name=item.get("label", query),
                    description=item.get("description"),
                    url=f"https://www.wikidata.org/wiki/{wikidata_id}",
                    entity_type=details.get("entity_type", "Thing"),
                    properties=details.get("properties", {}),
                    same_as_urls=[f"https://www.wikidata.org/wiki/{wikidata_id}"],
                )
                
                # Add Wikipedia link if exists
                if details.get("wikipedia_url"):
                    identity.same_as_urls.append(details["wikipedia_url"])
                
                identities.append(identity)
            
            return identities
            
        except Exception as e:
            logger.warning(f"Wikidata search failed: {e}")
            return []
    
    async def _get_wikidata_entity(self, entity_id: str) -> Dict[str, Any]:
        """Get detailed entity info from Wikidata."""
        try:
            client = await self._get_http_client()
            
            url = "https://www.wikidata.org/w/api.php"
            params = {
                "action": "wbgetentities",
                "ids": entity_id,
                "format": "json",
                "languages": "en",
                "props": "claims|sitelinks",
            }
            
            response = await client.get(url, params=params)
            if response.status_code != 200:
                return {}
            
            data = response.json()
            entity = data.get("entities", {}).get(entity_id, {})
            
            result = {"properties": {}}
            
            # Extract entity type from claims (P31 = instance of)
            claims = entity.get("claims", {})
            if "P31" in claims:
                instances = claims["P31"]
                if instances:
                    # Get the first instance type
                    instance_id = instances[0].get("mainsnak", {}).get("datavalue", {}).get("value", {}).get("id")
                    if instance_id:
                        result["entity_type"] = self._wikidata_type_to_schema(instance_id)
            
            # Get Wikipedia URL
            sitelinks = entity.get("sitelinks", {})
            if "enwiki" in sitelinks:
                title = sitelinks["enwiki"].get("title", "")
                result["wikipedia_url"] = f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}"
            
            # Extract useful properties
            property_map = {
                "P856": "official_website",
                "P571": "founded",
                "P159": "headquarters",
                "P169": "ceo",
                "P1128": "employees",
            }
            
            for prop_id, prop_name in property_map.items():
                if prop_id in claims:
                    claim = claims[prop_id][0]
                    value = claim.get("mainsnak", {}).get("datavalue", {}).get("value")
                    if value:
                        if isinstance(value, dict):
                            value = value.get("text") or value.get("time") or value.get("amount")
                        result["properties"][prop_name] = value
            
            return result
            
        except Exception as e:
            logger.debug(f"Failed to get Wikidata entity {entity_id}: {e}")
            return {}
    
    def _wikidata_type_to_schema(self, wikidata_id: str) -> str:
        """Map Wikidata entity types to Schema.org types."""
        mapping = {
            "Q4830453": "Organization",  # Business
            "Q783794": "Organization",   # Company
            "Q7275": "Organization",     # State
            "Q5": "Person",              # Human
            "Q11032": "Newspaper",
            "Q571": "Book",
            "Q5398426": "SoftwareApplication",
            "Q35127": "Website",
        }
        return mapping.get(wikidata_id, "Thing")
    
    async def _search_google_kg(self, query: str) -> List[KnowledgeGraphIdentity]:
        """Search Google Knowledge Graph API."""
        google_kg_key = getattr(settings, "GOOGLE_KG_API_KEY", None)
        if not google_kg_key:
            logger.debug("Google KG API key not configured")
            return []
        
        try:
            client = await self._get_http_client()
            
            url = "https://kgsearch.googleapis.com/v1/entities:search"
            params = {
                "query": query,
                "key": google_kg_key,
                "limit": 5,
                "languages": "en",
            }
            
            response = await client.get(url, params=params)
            if response.status_code != 200:
                return []
            
            data = response.json()
            identities = []
            
            for element in data.get("itemListElement", []):
                result = element.get("result", {})
                
                # Extract types
                types = result.get("@type", [])
                if isinstance(types, str):
                    types = [types]
                
                # Get primary type
                entity_type = "Thing"
                for t in types:
                    if t != "Thing":
                        entity_type = t
                        break
                
                identity = KnowledgeGraphIdentity(
                    entity_id=result.get("@id", "").replace("kg:", ""),
                    source=EntitySource.GOOGLE_KG,
                    name=result.get("name", query),
                    description=result.get("description"),
                    url=result.get("url") or result.get("detailedDescription", {}).get("url"),
                    entity_type=entity_type,
                    confidence=element.get("resultScore", 0) / 1000,
                    properties={
                        "types": types,
                        "detailed_description": result.get("detailedDescription", {}).get("articleBody"),
                    },
                )
                
                identities.append(identity)
            
            return identities
            
        except Exception as e:
            logger.warning(f"Google KG search failed: {e}")
            return []
    
    async def _score_identities(
        self,
        identities: List[KnowledgeGraphIdentity],
        brand_name: str,
        brand_domain: str,
        industry: Optional[str]
    ) -> List[KnowledgeGraphIdentity]:
        """Score and rank identities by relevance."""
        if not identities:
            return []
        
        scored = []
        
        for identity in identities:
            score = 0.0
            
            # Name match
            name_lower = identity.name.lower()
            brand_lower = brand_name.lower()
            
            if name_lower == brand_lower:
                score += 1.0
            elif brand_lower in name_lower or name_lower in brand_lower:
                score += 0.5
            
            # Domain match (if website property exists)
            website = identity.properties.get("official_website", "")
            if website and brand_domain.lower() in website.lower():
                score += 1.0
            
            # Entity type preference (Organizations rank higher)
            if identity.entity_type in ("Organization", "Corporation", "Company"):
                score += 0.3
            
            # Source preference
            if identity.source == EntitySource.WIKIDATA:
                score += 0.2  # Wikidata is more authoritative for entities
            
            # Existing confidence
            score += identity.confidence * 0.5
            
            identity.confidence = min(1.0, score / 3.0)  # Normalize
            scored.append(identity)
        
        # Sort by confidence
        scored.sort(key=lambda x: x.confidence, reverse=True)
        
        return scored
    
    def _assess_ambiguity(
        self,
        identities: List[KnowledgeGraphIdentity]
    ) -> str:
        """Assess the ambiguity level based on matched identities."""
        if not identities:
            return "none"
        
        if len(identities) == 1:
            return "none" if identities[0].confidence > 0.8 else "low"
        
        top_confidence = identities[0].confidence
        second_confidence = identities[1].confidence if len(identities) > 1 else 0
        
        # If top two are very close in confidence, there's ambiguity
        confidence_gap = top_confidence - second_confidence
        
        if confidence_gap > 0.5:
            return "none"
        elif confidence_gap > 0.3:
            return "low"
        elif confidence_gap > 0.1:
            return "moderate"
        else:
            return "high"
    
    def _generate_same_as(
        self,
        identity: KnowledgeGraphIdentity
    ) -> List[str]:
        """Generate sameAs URLs for Schema.org markup."""
        same_as = list(identity.same_as_urls)
        
        # Add standard URLs based on source
        if identity.source == EntitySource.WIKIDATA:
            same_as.append(f"https://www.wikidata.org/wiki/{identity.entity_id}")
        elif identity.source == EntitySource.GOOGLE_KG:
            same_as.append(f"https://www.google.com/search?kgmid={identity.entity_id}")
        
        # Deduplicate
        return list(set(same_as))
    
    async def confirm_identity(
        self,
        result: EntityResolutionResult,
        user_choice: int
    ) -> Optional[KnowledgeGraphIdentity]:
        """
        Confirm entity identity based on user's disambiguation choice.
        
        Args:
            result: The resolution result with options
            user_choice: Index of the chosen option
            
        Returns:
            The confirmed identity
        """
        all_identities = [result.primary_identity] + result.alternative_identities
        all_identities = [i for i in all_identities if i is not None]
        
        if user_choice < 0 or user_choice >= len(all_identities):
            return None
        
        confirmed = all_identities[user_choice]
        confirmed.confidence = 1.0  # User confirmed
        
        return confirmed
    
    async def create_entity_not_found_guidance(
        self,
        brand_name: str,
        brand_domain: str,
        industry: str
    ) -> Dict[str, Any]:
        """
        Provide guidance when brand is not found in knowledge bases.
        
        Returns actionable steps to establish entity presence.
        """
        return {
            "status": "entity_not_found",
            "brand_name": brand_name,
            "recommendations": [
                {
                    "priority": "high",
                    "action": "Create Wikipedia page",
                    "description": "A Wikipedia page is the primary source for entity recognition in LLMs",
                    "difficulty": "high",
                    "url": "https://en.wikipedia.org/wiki/Wikipedia:Your_first_article"
                },
                {
                    "priority": "high",
                    "action": "Create Wikidata entry",
                    "description": "Wikidata is the structured data source that Google uses for Knowledge Graph",
                    "difficulty": "medium",
                    "url": "https://www.wikidata.org/wiki/Wikidata:Tours/Creating_an_item"
                },
                {
                    "priority": "medium",
                    "action": "Claim Crunchbase profile",
                    "description": "Crunchbase is commonly used for company data by AI systems",
                    "difficulty": "low",
                    "url": "https://www.crunchbase.com/"
                },
                {
                    "priority": "medium",
                    "action": "Implement Organization Schema",
                    "description": "Add comprehensive Schema.org Organization markup to your website",
                    "schema_template": {
                        "@context": "https://schema.org",
                        "@type": "Organization",
                        "name": brand_name,
                        "url": f"https://{brand_domain}",
                        "sameAs": [],
                        "knowsAbout": []
                    }
                }
            ],
            "estimated_recognition_time": "2-6 months after Wikipedia/Wikidata creation"
        }
    
    async def close(self):
        """Clean up resources."""
        if self._http_client:
            await self._http_client.aclose()
            self._http_client = None


# Singleton instance
_entity_resolution_service: Optional[EntityResolutionService] = None


def get_entity_resolution_service() -> EntityResolutionService:
    """Get singleton instance."""
    global _entity_resolution_service
    if _entity_resolution_service is None:
        _entity_resolution_service = EntityResolutionService()
    return _entity_resolution_service
