"""
Entity Gap Analysis Service - Competitive Entity Comparison for GEO/AEO.

Traditional SEO uses "Keyword Gap Analysis." GEO requires Entity Gap Analysis.
This service compares the entity landscape between a brand and its competitors
to identify missing semantic connections.

Key Insight:
"What entities (topics, concepts, technologies) are competitors connected to
that the user's brand is not?"

This reveals:
- Topics competitors cover that you don't
- Technologies they mention that you ignore
- Authority signals they have that you lack
- Entity relationships that improve AI visibility

The analysis uses:
- spaCy NER for entity extraction
- Knowledge Graph comparison
- Semantic similarity for entity clustering
- Gap scoring for prioritization

Architecture:
- Async processing for multi-competitor analysis
- Integration with NER service
- Integration with Knowledge Graph service
- Visualization data generation for frontend
"""

import asyncio
import logging
from typing import Dict, Any, List, Optional, Set, Tuple
from dataclasses import dataclass, field
from datetime import datetime
from collections import defaultdict
import httpx

from app.core.config import settings
from app.services.nlp.entity_extraction_service import (
    get_entity_extraction_service,
    EntityType,
    ExtractedEntity,
    ExtractionResult,
)

logger = logging.getLogger(__name__)


@dataclass
class EntityProfile:
    """Entity profile for a brand/competitor."""
    name: str
    domain: str
    entities: List[ExtractedEntity] = field(default_factory=list)
    entity_counts: Dict[str, int] = field(default_factory=dict)
    unique_entities: Set[str] = field(default_factory=set)
    
    # Organized by type
    organizations: Set[str] = field(default_factory=set)
    persons: Set[str] = field(default_factory=set)
    products: Set[str] = field(default_factory=set)
    concepts: Set[str] = field(default_factory=set)
    places: Set[str] = field(default_factory=set)
    
    # Metadata
    content_word_count: int = 0
    extraction_timestamp: Optional[datetime] = None
    
    def __post_init__(self):
        if self.extraction_timestamp is None:
            self.extraction_timestamp = datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "domain": self.domain,
            "entity_counts": self.entity_counts,
            "unique_entities": list(self.unique_entities),
            "by_type": {
                "organizations": list(self.organizations),
                "persons": list(self.persons),
                "products": list(self.products),
                "concepts": list(self.concepts),
                "places": list(self.places),
            },
            "content_word_count": self.content_word_count,
            "extraction_timestamp": self.extraction_timestamp.isoformat() if self.extraction_timestamp else None,
        }


@dataclass
class EntityGap:
    """Represents a gap where competitor has entity but user doesn't."""
    entity_text: str
    entity_type: EntityType
    competitor_with_entity: List[str]
    competitor_count: int
    priority: str  # "high", "medium", "low"
    impact_score: float  # 0-100
    wikidata_id: Optional[str] = None
    description: Optional[str] = None
    recommendation: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "entity": self.entity_text,
            "type": self.entity_type.value,
            "competitors_with_entity": self.competitor_with_entity,
            "competitor_count": self.competitor_count,
            "priority": self.priority,
            "impact_score": round(self.impact_score, 1),
            "wikidata_id": self.wikidata_id,
            "description": self.description,
            "recommendation": self.recommendation,
        }


@dataclass
class EntityGapAnalysisResult:
    """Complete result of entity gap analysis."""
    brand_name: str
    brand_domain: str
    competitors_analyzed: List[str]
    
    # Gap metrics
    total_gaps: int = 0
    high_priority_gaps: int = 0
    medium_priority_gaps: int = 0
    low_priority_gaps: int = 0
    
    # Entity comparison
    exclusive_to_brand: Set[str] = field(default_factory=set)  # Only brand mentions
    shared_entities: Set[str] = field(default_factory=set)  # Both brand and competitors
    competitor_only: Set[str] = field(default_factory=set)  # Competitors but not brand
    
    # Detailed gaps
    gaps: List[EntityGap] = field(default_factory=list)
    
    # Coverage metrics
    entity_coverage_score: float = 0.0  # 0-100
    topic_diversity_score: float = 0.0
    
    # Profiles for reference
    brand_profile: Optional[EntityProfile] = None
    competitor_profiles: List[EntityProfile] = field(default_factory=list)
    
    # Visualization data
    graph_data: Dict[str, Any] = field(default_factory=dict)
    
    analysis_timestamp: Optional[datetime] = None
    
    def __post_init__(self):
        if self.analysis_timestamp is None:
            self.analysis_timestamp = datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "brand_name": self.brand_name,
            "brand_domain": self.brand_domain,
            "competitors_analyzed": self.competitors_analyzed,
            "summary": {
                "total_gaps": self.total_gaps,
                "high_priority": self.high_priority_gaps,
                "medium_priority": self.medium_priority_gaps,
                "low_priority": self.low_priority_gaps,
            },
            "entity_comparison": {
                "exclusive_to_brand": list(self.exclusive_to_brand)[:20],
                "shared_entities": list(self.shared_entities)[:20],
                "competitor_only": list(self.competitor_only)[:20],
            },
            "gaps": [gap.to_dict() for gap in self.gaps[:30]],
            "scores": {
                "entity_coverage": round(self.entity_coverage_score, 1),
                "topic_diversity": round(self.topic_diversity_score, 1),
            },
            "brand_profile": self.brand_profile.to_dict() if self.brand_profile else None,
            "competitor_profiles": [p.to_dict() for p in self.competitor_profiles],
            "graph_data": self.graph_data,
            "analysis_timestamp": self.analysis_timestamp.isoformat() if self.analysis_timestamp else None,
        }


class EntityGapAnalyzer:
    """
    Entity Gap Analyzer - Compares entity coverage between brand and competitors.
    
    Usage:
        analyzer = get_entity_gap_analyzer()
        
        result = await analyzer.analyze(
            brand_name="Mentha",
            brand_content="...",
            competitor_contents=[
                {"name": "Semrush", "content": "..."},
                {"name": "Profound", "content": "..."},
            ]
        )
        
        # High-priority gaps to address
        for gap in result.gaps:
            if gap.priority == "high":
                print(f"Missing: {gap.entity_text} ({gap.entity_type})")
                print(f"  Recommendation: {gap.recommendation}")
    """
    
    _instance: Optional["EntityGapAnalyzer"] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if hasattr(self, "_initialized") and self._initialized:
            return
        self._ner_service = get_entity_extraction_service()
        self._http_client: Optional[httpx.AsyncClient] = None
        self._initialized = True
    
    async def _get_http_client(self) -> httpx.AsyncClient:
        if self._http_client is None:
            self._http_client = httpx.AsyncClient(timeout=30.0)
        return self._http_client
    
    async def extract_entity_profile(
        self,
        name: str,
        domain: str,
        content: str,
        enrich_entities: bool = True
    ) -> EntityProfile:
        """
        Extract entity profile from content.
        
        Args:
            name: Name of the brand/competitor
            domain: Domain URL
            content: Text content to analyze
            enrich_entities: Whether to link to Wikidata
            
        Returns:
            EntityProfile with all extracted entities
        """
        if not content.strip():
            return EntityProfile(name=name, domain=domain)
        
        # Extract entities using NER
        extraction = await self._ner_service.extract_entities(content)
        
        # Enrich with Wikidata
        if enrich_entities:
            extraction = await self._ner_service.enrich_with_wikidata(extraction, max_entities=20)
        
        # Build profile
        profile = EntityProfile(
            name=name,
            domain=domain,
            entities=extraction.entities,
            entity_counts=extraction.entity_counts,
            content_word_count=len(content.split()),
        )
        
        # Categorize entities
        for entity in extraction.get_unique_entities():
            text_lower = entity.text.lower()
            profile.unique_entities.add(text_lower)
            
            if entity.entity_type == EntityType.ORGANIZATION:
                profile.organizations.add(text_lower)
            elif entity.entity_type == EntityType.PERSON:
                profile.persons.add(text_lower)
            elif entity.entity_type == EntityType.PRODUCT:
                profile.products.add(text_lower)
            elif entity.entity_type == EntityType.CONCEPT:
                profile.concepts.add(text_lower)
            elif entity.entity_type == EntityType.PLACE:
                profile.places.add(text_lower)
        
        return profile
    
    async def analyze(
        self,
        brand_name: str,
        brand_domain: str,
        brand_content: str,
        competitor_contents: List[Dict[str, str]],  # [{"name": "", "domain": "", "content": ""}]
        enrich_entities: bool = True
    ) -> EntityGapAnalysisResult:
        """
        Analyze entity gaps between brand and competitors.
        
        Args:
            brand_name: Name of the brand
            brand_domain: Brand's domain
            brand_content: Brand's page content
            competitor_contents: List of competitor content dicts
            enrich_entities: Whether to link to Wikidata
            
        Returns:
            EntityGapAnalysisResult with all gaps and recommendations
        """
        logger.info(f"Starting entity gap analysis for {brand_name} vs {len(competitor_contents)} competitors")
        
        # Extract brand profile
        brand_profile = await self.extract_entity_profile(
            brand_name, brand_domain, brand_content, enrich_entities
        )
        
        # Extract competitor profiles in parallel
        competitor_tasks = [
            self.extract_entity_profile(
                comp.get("name", "Unknown"),
                comp.get("domain", ""),
                comp.get("content", ""),
                enrich_entities
            )
            for comp in competitor_contents
        ]
        competitor_profiles = await asyncio.gather(*competitor_tasks)
        
        # Combine all competitor entities
        all_competitor_entities: Dict[str, Dict[str, Any]] = {}  # entity -> {competitors, type, wikidata_id}
        
        for profile in competitor_profiles:
            for entity in profile.entities:
                key = entity.text.lower()
                if key not in all_competitor_entities:
                    all_competitor_entities[key] = {
                        "competitors": [],
                        "type": entity.entity_type,
                        "wikidata_id": entity.wikidata_id,
                        "entity_obj": entity,
                    }
                if profile.name not in all_competitor_entities[key]["competitors"]:
                    all_competitor_entities[key]["competitors"].append(profile.name)
        
        # Calculate entity sets
        brand_entities = brand_profile.unique_entities
        competitor_entity_set = set(all_competitor_entities.keys())
        
        exclusive_to_brand = brand_entities - competitor_entity_set
        shared_entities = brand_entities & competitor_entity_set
        competitor_only = competitor_entity_set - brand_entities
        
        # Generate gaps
        gaps = []
        for entity_text in competitor_only:
            entity_info = all_competitor_entities[entity_text]
            
            # Calculate priority based on how many competitors mention it
            competitor_count = len(entity_info["competitors"])
            total_competitors = len(competitor_profiles)
            
            if competitor_count >= total_competitors * 0.75:
                priority = "high"
                impact_score = 90 + (competitor_count * 2)
            elif competitor_count >= total_competitors * 0.5:
                priority = "medium"
                impact_score = 50 + (competitor_count * 5)
            else:
                priority = "low"
                impact_score = 20 + (competitor_count * 5)
            
            # Generate recommendation
            recommendation = self._generate_recommendation(
                entity_text,
                entity_info["type"],
                entity_info["competitors"]
            )
            
            gaps.append(EntityGap(
                entity_text=entity_text,
                entity_type=entity_info["type"],
                competitor_with_entity=entity_info["competitors"],
                competitor_count=competitor_count,
                priority=priority,
                impact_score=min(100, impact_score),
                wikidata_id=entity_info.get("wikidata_id"),
                recommendation=recommendation,
            ))
        
        # Sort gaps by impact
        gaps.sort(key=lambda x: x.impact_score, reverse=True)
        
        # Calculate coverage score
        total_entities = len(brand_entities | competitor_entity_set)
        coverage_score = (len(shared_entities) / max(1, total_entities)) * 100
        
        # Calculate topic diversity
        all_types = [e.entity_type for e in brand_profile.entities]
        type_diversity = len(set(all_types)) / max(1, len(EntityType)) * 100
        
        # Count priorities
        high_count = sum(1 for g in gaps if g.priority == "high")
        medium_count = sum(1 for g in gaps if g.priority == "medium")
        low_count = sum(1 for g in gaps if g.priority == "low")
        
        # Generate graph visualization data
        graph_data = self._generate_graph_data(brand_profile, competitor_profiles, gaps)
        
        result = EntityGapAnalysisResult(
            brand_name=brand_name,
            brand_domain=brand_domain,
            competitors_analyzed=[p.name for p in competitor_profiles],
            total_gaps=len(gaps),
            high_priority_gaps=high_count,
            medium_priority_gaps=medium_count,
            low_priority_gaps=low_count,
            exclusive_to_brand=exclusive_to_brand,
            shared_entities=shared_entities,
            competitor_only=competitor_only,
            gaps=gaps,
            entity_coverage_score=coverage_score,
            topic_diversity_score=type_diversity,
            brand_profile=brand_profile,
            competitor_profiles=list(competitor_profiles),
            graph_data=graph_data,
        )
        
        logger.info(f"Entity gap analysis complete: {len(gaps)} gaps found ({high_count} high priority)")
        
        return result
    
    def _generate_recommendation(
        self,
        entity_text: str,
        entity_type: EntityType,
        competitors: List[str]
    ) -> str:
        """Generate actionable recommendation for an entity gap."""
        base = f"Add content discussing '{entity_text}'"
        
        if entity_type == EntityType.CONCEPT:
            return f"{base}. Create dedicated pages or sections explaining this concept and its relevance to your solution."
        elif entity_type == EntityType.PRODUCT:
            return f"{base}. Consider integrations, comparisons, or how your solution addresses the same needs."
        elif entity_type == EntityType.ORGANIZATION:
            return f"{base}. If relevant, mention partnerships, integrations, or how you serve similar organizations."
        elif entity_type == EntityType.PERSON:
            return f"{base}. If this is an industry thought leader, reference their work or invite them for collaboration."
        else:
            return f"{base}. Mentioned by {len(competitors)} competitor(s): {', '.join(competitors[:3])}."
    
    def _generate_graph_data(
        self,
        brand_profile: EntityProfile,
        competitor_profiles: List[EntityProfile],
        gaps: List[EntityGap]
    ) -> Dict[str, Any]:
        """Generate data for entity graph visualization."""
        nodes = []
        edges = []
        
        # Add brand node
        nodes.append({
            "id": brand_profile.name,
            "label": brand_profile.name,
            "type": "brand",
            "size": 20,
        })
        
        # Add competitor nodes
        for profile in competitor_profiles:
            nodes.append({
                "id": profile.name,
                "label": profile.name,
                "type": "competitor",
                "size": 15,
            })
        
        # Add entity nodes and edges
        entity_nodes_added = set()
        
        # Add shared entities (connect to brand)
        for entity in brand_profile.unique_entities:
            if len(entity) < 3:
                continue
            
            if entity not in entity_nodes_added:
                nodes.append({
                    "id": f"entity:{entity}",
                    "label": entity.title(),
                    "type": "entity_shared",
                    "size": 8,
                })
                entity_nodes_added.add(entity)
            
            edges.append({
                "source": brand_profile.name,
                "target": f"entity:{entity}",
                "type": "mentions",
            })
        
        # Add gap entities (connect to competitors only)
        for gap in gaps[:20]:  # Limit for visualization
            entity_key = gap.entity_text
            if entity_key not in entity_nodes_added:
                nodes.append({
                    "id": f"entity:{entity_key}",
                    "label": gap.entity_text.title(),
                    "type": "entity_gap" if gap.priority == "high" else "entity_competitor",
                    "size": 10 if gap.priority == "high" else 6,
                    "priority": gap.priority,
                })
                entity_nodes_added.add(entity_key)
                
                # Connect to competitors
                for comp_name in gap.competitor_with_entity:
                    edges.append({
                        "source": comp_name,
                        "target": f"entity:{entity_key}",
                        "type": "mentions",
                    })
        
        return {
            "nodes": nodes,
            "edges": edges,
            "stats": {
                "total_nodes": len(nodes),
                "total_edges": len(edges),
            }
        }
    
    async def analyze_single_competitor(
        self,
        brand_profile: EntityProfile,
        competitor_content: Dict[str, str]
    ) -> Dict[str, Any]:
        """
        Analyze entity gap against a single competitor.
        
        Useful for detailed head-to-head comparison.
        """
        comp_profile = await self.extract_entity_profile(
            competitor_content.get("name", "Unknown"),
            competitor_content.get("domain", ""),
            competitor_content.get("content", ""),
        )
        
        brand_only = brand_profile.unique_entities - comp_profile.unique_entities
        competitor_only = comp_profile.unique_entities - brand_profile.unique_entities
        shared = brand_profile.unique_entities & comp_profile.unique_entities
        
        return {
            "competitor_name": comp_profile.name,
            "brand_unique_count": len(brand_only),
            "competitor_unique_count": len(competitor_only),
            "shared_count": len(shared),
            "brand_unique_entities": list(brand_only)[:10],
            "competitor_unique_entities": list(competitor_only)[:10],
            "shared_entities": list(shared)[:10],
            "gap_percentage": (len(competitor_only) / max(1, len(comp_profile.unique_entities))) * 100,
        }
    
    async def close(self):
        """Clean up resources."""
        if self._http_client:
            await self._http_client.aclose()
            self._http_client = None


# Singleton instance
_entity_gap_analyzer: Optional[EntityGapAnalyzer] = None


def get_entity_gap_analyzer() -> EntityGapAnalyzer:
    """Get singleton instance."""
    global _entity_gap_analyzer
    if _entity_gap_analyzer is None:
        _entity_gap_analyzer = EntityGapAnalyzer()
    return _entity_gap_analyzer
