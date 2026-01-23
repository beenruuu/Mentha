"""
Knowledge Graph Service - Graph-based Entity Relationship Management for GEO/AEO.

This service implements a proprietary Knowledge Graph that acts as the
semantic truth layer for the brand. It enables:

1. Entity Relationship Modeling:
   - Organizations (brands, companies)
   - Concepts (topics, themes, categories)
   - Articles (content pieces)
   - Persons (authors, experts)
   - Products (offerings)

2. Graph Algorithms for SEO/AEO:
   - PageRank: Identify most authoritative content/entities
   - Betweenness Centrality: Find bridge nodes between topic clusters
   - Community Detection: Identify content silos

3. Link Optimization:
   - Suggest internal links based on graph structure
   - Identify orphan content (low connectivity)
   - Optimize information architecture

4. llms.txt Integration:
   - Generate entity-rich descriptions
   - Order content by authority score
   - Include semantic relationships

Architecture:
- NetworkX for in-memory graph operations
- Redis for persistence (optional)
- Async interface for FastAPI compatibility
- Thread-safe singleton pattern

Schema.org Alignment:
Node types are designed to map directly to Schema.org types,
enabling seamless JSON-LD generation with proper ontology.
"""

import asyncio
import json
import logging
import pickle
from datetime import datetime
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, Any, List, Optional, Set, Tuple, Union
import hashlib

try:
    import networkx as nx
    NETWORKX_AVAILABLE = True
except ImportError:
    NETWORKX_AVAILABLE = False
    nx = None

try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    redis = None

logger = logging.getLogger(__name__)


class NodeType(str, Enum):
    """
    Knowledge Graph node types aligned with Schema.org ontology.
    
    These types map directly to Schema.org types for JSON-LD generation.
    """
    ORGANIZATION = "Organization"
    PERSON = "Person"
    ARTICLE = "Article"
    PRODUCT = "Product"
    CONCEPT = "Concept"  # Topic/theme (maps to DefinedTerm or Thing)
    WEBPAGE = "WebPage"
    FAQ = "FAQPage"
    HOWTO = "HowTo"
    EVENT = "Event"
    PLACE = "Place"


class EdgeType(str, Enum):
    """
    Relationship types between nodes.
    
    Designed for semantic clarity and LLM comprehension.
    """
    # Authorship
    AUTHORED = "authored"  # (Person) --> (Article)
    REVIEWED = "reviewed"  # (Person) --> (Article)
    
    # Content relationships
    MENTIONS = "mentions"  # (Article) --> (Concept|Product|Person)
    ABOUT = "about"  # (Article) --> (Concept) - primary topic
    CITES = "cites"  # (Article) --> (Article) - citation
    RELATES_TO = "relates_to"  # (Concept) <--> (Concept)
    
    # Organizational
    OFFERS = "offers"  # (Organization) --> (Product)
    EMPLOYS = "employs"  # (Organization) --> (Person)
    SAME_AS = "same_as"  # Any --> External entity (Wikidata link)
    
    # Hierarchy
    PART_OF = "part_of"  # Child --> Parent
    HAS_PART = "has_part"  # Parent --> Child


@dataclass
class GraphNode:
    """
    Represents a node in the Knowledge Graph.
    
    Attributes:
        id: Unique identifier (typically brand_id:type:slug)
        node_type: The Schema.org-aligned type
        name: Human-readable name
        url: Canonical URL (for web content)
        properties: Additional metadata
        same_as: Links to external authorities (Wikidata, LinkedIn, etc.)
        created_at: Node creation timestamp
        updated_at: Last update timestamp
    """
    id: str
    node_type: NodeType
    name: str
    url: Optional[str] = None
    properties: Dict[str, Any] = field(default_factory=dict)
    same_as: List[str] = field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()
        if self.updated_at is None:
            self.updated_at = self.created_at
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "id": self.id,
            "type": self.node_type.value,
            "name": self.name,
            "url": self.url,
            "properties": self.properties,
            "same_as": self.same_as,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "GraphNode":
        """Create from dictionary."""
        return cls(
            id=data["id"],
            node_type=NodeType(data["type"]),
            name=data["name"],
            url=data.get("url"),
            properties=data.get("properties", {}),
            same_as=data.get("same_as", []),
            created_at=datetime.fromisoformat(data["created_at"]) if data.get("created_at") else None,
            updated_at=datetime.fromisoformat(data["updated_at"]) if data.get("updated_at") else None
        )


@dataclass
class GraphEdge:
    """
    Represents a directed edge (relationship) in the Knowledge Graph.
    
    Attributes:
        source_id: Source node ID
        target_id: Target node ID
        edge_type: The relationship type
        weight: Strength of relationship (0.0 - 1.0)
        properties: Additional metadata (e.g., context snippet)
        created_at: Edge creation timestamp
    """
    source_id: str
    target_id: str
    edge_type: EdgeType
    weight: float = 1.0
    properties: Dict[str, Any] = field(default_factory=dict)
    created_at: Optional[datetime] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "source_id": self.source_id,
            "target_id": self.target_id,
            "type": self.edge_type.value,
            "weight": self.weight,
            "properties": self.properties,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "GraphEdge":
        """Create from dictionary."""
        return cls(
            source_id=data["source_id"],
            target_id=data["target_id"],
            edge_type=EdgeType(data["type"]),
            weight=data.get("weight", 1.0),
            properties=data.get("properties", {}),
            created_at=datetime.fromisoformat(data["created_at"]) if data.get("created_at") else None
        )


@dataclass
class CentralityResult:
    """Result of centrality analysis for a node."""
    node_id: str
    node_name: str
    node_type: NodeType
    pagerank: float
    betweenness: float
    degree: int
    in_degree: int
    out_degree: int
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "node_id": self.node_id,
            "node_name": self.node_name,
            "node_type": self.node_type.value,
            "pagerank": round(self.pagerank, 6),
            "betweenness": round(self.betweenness, 6),
            "degree": self.degree,
            "in_degree": self.in_degree,
            "out_degree": self.out_degree
        }


@dataclass
class LinkSuggestion:
    """A suggested internal link to improve graph structure."""
    source_id: str
    source_name: str
    target_id: str
    target_name: str
    reason: str
    priority: str  # "high", "medium", "low"
    expected_impact: float
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "source_id": self.source_id,
            "source_name": self.source_name,
            "target_id": self.target_id,
            "target_name": self.target_name,
            "reason": self.reason,
            "priority": self.priority,
            "expected_impact": round(self.expected_impact, 4)
        }


class KnowledgeGraphService:
    """
    Knowledge Graph Service using NetworkX with optional Redis persistence.
    
    Provides:
    - CRUD operations for nodes and edges
    - Graph algorithms (PageRank, betweenness centrality)
    - Link optimization suggestions
    - Export for llms.txt generation
    - Multi-tenant support (graphs per brand)
    
    Usage:
        service = get_knowledge_graph_service()
        await service.add_node(brand_id, node)
        await service.add_edge(brand_id, edge)
        top_content = await service.get_top_by_pagerank(brand_id, limit=100)
    """
    
    _instance: Optional["KnowledgeGraphService"] = None
    
    def __new__(cls):
        """Singleton pattern."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize the service."""
        if hasattr(self, "_initialized") and self._initialized:
            return
        
        self._graphs: Dict[str, nx.DiGraph] = {}  # brand_id -> graph
        self._redis_client: Optional[Any] = None
        self._redis_enabled = False
        self._initialized = True
        
        if not NETWORKX_AVAILABLE:
            logger.error("NetworkX not installed. Knowledge Graph service disabled.")
    
    async def _ensure_networkx(self) -> bool:
        """Verify NetworkX is available."""
        return NETWORKX_AVAILABLE
    
    async def connect_redis(self, redis_url: str) -> bool:
        """
        Connect to Redis for persistence.
        
        Args:
            redis_url: Redis connection URL
        
        Returns:
            True if connection successful
        """
        if not REDIS_AVAILABLE:
            logger.warning("Redis not available. Using in-memory only.")
            return False
        
        try:
            self._redis_client = redis.from_url(redis_url)
            await self._redis_client.ping()
            self._redis_enabled = True
            logger.info("Connected to Redis for Knowledge Graph persistence")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            return False
    
    def _get_graph(self, brand_id: str) -> "nx.DiGraph":
        """Get or create graph for a brand."""
        if brand_id not in self._graphs:
            self._graphs[brand_id] = nx.DiGraph()
        return self._graphs[brand_id]
    
    async def _save_to_redis(self, brand_id: str) -> bool:
        """Persist graph to Redis."""
        if not self._redis_enabled or not self._redis_client:
            return False
        
        try:
            graph = self._get_graph(brand_id)
            key = f"kg:{brand_id}"
            data = pickle.dumps(graph)
            await self._redis_client.set(key, data)
            return True
        except Exception as e:
            logger.error(f"Failed to save graph to Redis: {e}")
            return False
    
    async def _load_from_redis(self, brand_id: str) -> bool:
        """Load graph from Redis."""
        if not self._redis_enabled or not self._redis_client:
            return False
        
        try:
            key = f"kg:{brand_id}"
            data = await self._redis_client.get(key)
            if data:
                self._graphs[brand_id] = pickle.loads(data)
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to load graph from Redis: {e}")
            return False
    
    # ==================== CRUD Operations ====================
    
    async def add_node(
        self,
        brand_id: str,
        node: GraphNode,
        persist: bool = True
    ) -> bool:
        """
        Add or update a node in the graph.
        
        Args:
            brand_id: Brand/tenant identifier
            node: The node to add
            persist: Whether to save to Redis
        
        Returns:
            True if successful
        """
        if not await self._ensure_networkx():
            return False
        
        graph = self._get_graph(brand_id)
        node.updated_at = datetime.utcnow()
        
        graph.add_node(
            node.id,
            type=node.node_type.value,
            name=node.name,
            url=node.url,
            properties=node.properties,
            same_as=node.same_as,
            created_at=node.created_at.isoformat() if node.created_at else None,
            updated_at=node.updated_at.isoformat() if node.updated_at else None
        )
        
        if persist:
            await self._save_to_redis(brand_id)
        
        return True
    
    async def add_nodes_batch(
        self,
        brand_id: str,
        nodes: List[GraphNode]
    ) -> int:
        """
        Add multiple nodes efficiently.
        
        Returns:
            Number of nodes added
        """
        count = 0
        for node in nodes:
            if await self.add_node(brand_id, node, persist=False):
                count += 1
        
        await self._save_to_redis(brand_id)
        return count
    
    async def add_edge(
        self,
        brand_id: str,
        edge: GraphEdge,
        persist: bool = True
    ) -> bool:
        """
        Add or update an edge (relationship) in the graph.
        
        Args:
            brand_id: Brand/tenant identifier
            edge: The edge to add
            persist: Whether to save to Redis
        
        Returns:
            True if successful
        """
        if not await self._ensure_networkx():
            return False
        
        graph = self._get_graph(brand_id)
        
        # Ensure both nodes exist
        if not graph.has_node(edge.source_id) or not graph.has_node(edge.target_id):
            logger.warning(f"Cannot add edge: source or target node not found")
            return False
        
        graph.add_edge(
            edge.source_id,
            edge.target_id,
            type=edge.edge_type.value,
            weight=edge.weight,
            properties=edge.properties,
            created_at=edge.created_at.isoformat() if edge.created_at else None
        )
        
        if persist:
            await self._save_to_redis(brand_id)
        
        return True
    
    async def add_edges_batch(
        self,
        brand_id: str,
        edges: List[GraphEdge]
    ) -> int:
        """
        Add multiple edges efficiently.
        
        Returns:
            Number of edges added
        """
        count = 0
        for edge in edges:
            if await self.add_edge(brand_id, edge, persist=False):
                count += 1
        
        await self._save_to_redis(brand_id)
        return count
    
    async def get_node(self, brand_id: str, node_id: str) -> Optional[GraphNode]:
        """Get a node by ID."""
        if not await self._ensure_networkx():
            return None
        
        graph = self._get_graph(brand_id)
        
        if not graph.has_node(node_id):
            return None
        
        attrs = graph.nodes[node_id]
        return GraphNode(
            id=node_id,
            node_type=NodeType(attrs.get("type", "Concept")),
            name=attrs.get("name", ""),
            url=attrs.get("url"),
            properties=attrs.get("properties", {}),
            same_as=attrs.get("same_as", []),
            created_at=datetime.fromisoformat(attrs["created_at"]) if attrs.get("created_at") else None,
            updated_at=datetime.fromisoformat(attrs["updated_at"]) if attrs.get("updated_at") else None
        )
    
    async def get_nodes_by_type(
        self,
        brand_id: str,
        node_type: NodeType
    ) -> List[GraphNode]:
        """Get all nodes of a specific type."""
        if not await self._ensure_networkx():
            return []
        
        graph = self._get_graph(brand_id)
        nodes = []
        
        for node_id in graph.nodes():
            attrs = graph.nodes[node_id]
            if attrs.get("type") == node_type.value:
                nodes.append(GraphNode(
                    id=node_id,
                    node_type=node_type,
                    name=attrs.get("name", ""),
                    url=attrs.get("url"),
                    properties=attrs.get("properties", {}),
                    same_as=attrs.get("same_as", [])
                ))
        
        return nodes
    
    async def remove_node(self, brand_id: str, node_id: str) -> bool:
        """Remove a node and all its edges."""
        if not await self._ensure_networkx():
            return False
        
        graph = self._get_graph(brand_id)
        
        if graph.has_node(node_id):
            graph.remove_node(node_id)
            await self._save_to_redis(brand_id)
            return True
        
        return False
    
    async def get_neighbors(
        self,
        brand_id: str,
        node_id: str,
        edge_type: Optional[EdgeType] = None,
        direction: str = "out"  # "in", "out", "both"
    ) -> List[GraphNode]:
        """
        Get neighboring nodes.
        
        Args:
            brand_id: Brand identifier
            node_id: The node to find neighbors for
            edge_type: Filter by edge type (None = all)
            direction: "in" (predecessors), "out" (successors), "both"
        
        Returns:
            List of neighboring nodes
        """
        if not await self._ensure_networkx():
            return []
        
        graph = self._get_graph(brand_id)
        
        if not graph.has_node(node_id):
            return []
        
        neighbor_ids = set()
        
        if direction in ("out", "both"):
            for _, target, data in graph.out_edges(node_id, data=True):
                if edge_type is None or data.get("type") == edge_type.value:
                    neighbor_ids.add(target)
        
        if direction in ("in", "both"):
            for source, _, data in graph.in_edges(node_id, data=True):
                if edge_type is None or data.get("type") == edge_type.value:
                    neighbor_ids.add(source)
        
        neighbors = []
        for nid in neighbor_ids:
            node = await self.get_node(brand_id, nid)
            if node:
                neighbors.append(node)
        
        return neighbors
    
    # ==================== Graph Algorithms ====================
    
    async def calculate_pagerank(
        self,
        brand_id: str,
        alpha: float = 0.85,
        max_iter: int = 100
    ) -> Dict[str, float]:
        """
        Calculate PageRank for all nodes.
        
        Args:
            brand_id: Brand identifier
            alpha: Damping factor (default 0.85)
            max_iter: Maximum iterations
        
        Returns:
            Dict mapping node_id to PageRank score
        """
        if not await self._ensure_networkx():
            return {}
        
        graph = self._get_graph(brand_id)
        
        if graph.number_of_nodes() == 0:
            return {}
        
        try:
            pagerank = nx.pagerank(graph, alpha=alpha, max_iter=max_iter)
            return pagerank
        except nx.PowerIterationFailedConvergence:
            logger.warning("PageRank did not converge, returning empty")
            return {}
    
    async def calculate_betweenness(self, brand_id: str) -> Dict[str, float]:
        """
        Calculate betweenness centrality for all nodes.
        
        Identifies nodes that act as bridges between communities.
        High betweenness = important connector content.
        
        Returns:
            Dict mapping node_id to betweenness score
        """
        if not await self._ensure_networkx():
            return {}
        
        graph = self._get_graph(brand_id)
        
        if graph.number_of_nodes() == 0:
            return {}
        
        return nx.betweenness_centrality(graph)
    
    async def get_centrality_report(
        self,
        brand_id: str,
        node_types: Optional[List[NodeType]] = None,
        limit: int = 50
    ) -> List[CentralityResult]:
        """
        Generate a comprehensive centrality report.
        
        Args:
            brand_id: Brand identifier
            node_types: Filter by node types (None = all)
            limit: Maximum results
        
        Returns:
            List of CentralityResult sorted by PageRank
        """
        if not await self._ensure_networkx():
            return []
        
        graph = self._get_graph(brand_id)
        
        pagerank = await self.calculate_pagerank(brand_id)
        betweenness = await self.calculate_betweenness(brand_id)
        
        results = []
        
        for node_id in graph.nodes():
            attrs = graph.nodes[node_id]
            node_type = NodeType(attrs.get("type", "Concept"))
            
            if node_types and node_type not in node_types:
                continue
            
            results.append(CentralityResult(
                node_id=node_id,
                node_name=attrs.get("name", node_id),
                node_type=node_type,
                pagerank=pagerank.get(node_id, 0),
                betweenness=betweenness.get(node_id, 0),
                degree=graph.degree(node_id),
                in_degree=graph.in_degree(node_id),
                out_degree=graph.out_degree(node_id)
            ))
        
        # Sort by PageRank descending
        results.sort(key=lambda x: x.pagerank, reverse=True)
        return results[:limit]
    
    async def get_top_by_pagerank(
        self,
        brand_id: str,
        node_type: Optional[NodeType] = None,
        limit: int = 100
    ) -> List[Tuple[GraphNode, float]]:
        """
        Get top nodes by PageRank score.
        
        Primary use case: Generating llms.txt with most authoritative content.
        
        Returns:
            List of (node, pagerank_score) tuples
        """
        if not await self._ensure_networkx():
            return []
        
        pagerank = await self.calculate_pagerank(brand_id)
        graph = self._get_graph(brand_id)
        
        results = []
        
        for node_id, score in pagerank.items():
            attrs = graph.nodes[node_id]
            nt = NodeType(attrs.get("type", "Concept"))
            
            if node_type and nt != node_type:
                continue
            
            node = GraphNode(
                id=node_id,
                node_type=nt,
                name=attrs.get("name", ""),
                url=attrs.get("url"),
                properties=attrs.get("properties", {}),
                same_as=attrs.get("same_as", [])
            )
            results.append((node, score))
        
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:limit]
    
    # ==================== Link Optimization ====================
    
    async def suggest_internal_links(
        self,
        brand_id: str,
        limit: int = 20
    ) -> List[LinkSuggestion]:
        """
        Suggest internal links to improve graph structure.
        
        Strategies:
        1. Connect orphan content (low in-degree) to high-authority nodes
        2. Bridge disconnected communities
        3. Strengthen paths to important Concepts
        
        Returns:
            List of LinkSuggestion ordered by priority
        """
        if not await self._ensure_networkx():
            return []
        
        graph = self._get_graph(brand_id)
        pagerank = await self.calculate_pagerank(brand_id)
        
        suggestions = []
        
        # Strategy 1: Find orphan articles (low in-degree, not connected to concepts)
        articles = await self.get_nodes_by_type(brand_id, NodeType.ARTICLE)
        concepts = await self.get_nodes_by_type(brand_id, NodeType.CONCEPT)
        
        high_pr_articles = sorted(
            [(a, pagerank.get(a.id, 0)) for a in articles],
            key=lambda x: x[1],
            reverse=True
        )[:10]
        
        for article in articles:
            in_degree = graph.in_degree(article.id)
            
            if in_degree < 2:
                # Orphan - suggest link from high-PR article
                for high_pr_article, pr_score in high_pr_articles:
                    if high_pr_article.id != article.id:
                        # Check if edge already exists
                        if not graph.has_edge(high_pr_article.id, article.id):
                            suggestions.append(LinkSuggestion(
                                source_id=high_pr_article.id,
                                source_name=high_pr_article.name,
                                target_id=article.id,
                                target_name=article.name,
                                reason=f"Orphan content with only {in_degree} incoming links",
                                priority="high",
                                expected_impact=pr_score * 0.15  # Approximate PR transfer
                            ))
                            break
        
        # Strategy 2: Connect articles to relevant concepts they don't link to
        for article in articles:
            current_concepts = set()
            for _, target, data in graph.out_edges(article.id, data=True):
                if data.get("type") in (EdgeType.ABOUT.value, EdgeType.MENTIONS.value):
                    current_concepts.add(target)
            
            # Find high-PR concepts not connected
            for concept in concepts:
                if concept.id not in current_concepts:
                    concept_pr = pagerank.get(concept.id, 0)
                    if concept_pr > 0.01:  # Only suggest for important concepts
                        suggestions.append(LinkSuggestion(
                            source_id=article.id,
                            source_name=article.name,
                            target_id=concept.id,
                            target_name=concept.name,
                            reason=f"High-authority concept (PR: {concept_pr:.4f}) not linked",
                            priority="medium",
                            expected_impact=concept_pr * 0.1
                        ))
        
        # Sort by expected impact
        suggestions.sort(key=lambda x: x.expected_impact, reverse=True)
        return suggestions[:limit]
    
    async def find_orphan_content(
        self,
        brand_id: str,
        min_in_degree: int = 1
    ) -> List[GraphNode]:
        """
        Find content with insufficient incoming links.
        
        Returns:
            List of nodes with in-degree <= min_in_degree
        """
        if not await self._ensure_networkx():
            return []
        
        graph = self._get_graph(brand_id)
        orphans = []
        
        content_types = {NodeType.ARTICLE.value, NodeType.WEBPAGE.value}
        
        for node_id in graph.nodes():
            attrs = graph.nodes[node_id]
            if attrs.get("type") in content_types:
                if graph.in_degree(node_id) <= min_in_degree:
                    orphans.append(GraphNode(
                        id=node_id,
                        node_type=NodeType(attrs.get("type")),
                        name=attrs.get("name", ""),
                        url=attrs.get("url"),
                        properties=attrs.get("properties", {}),
                        same_as=attrs.get("same_as", [])
                    ))
        
        return orphans
    
    # ==================== Export for llms.txt ====================
    
    async def export_for_llms_txt(
        self,
        brand_id: str,
        limit: int = 100,
        include_concepts: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Export top content for llms.txt generation.
        
        Returns nodes ordered by PageRank with semantic metadata.
        
        Returns:
            List of dicts with title, url, description, concepts
        """
        if not await self._ensure_networkx():
            return []
        
        graph = self._get_graph(brand_id)
        pagerank = await self.calculate_pagerank(brand_id)
        
        # Get articles and webpages
        content_types = {NodeType.ARTICLE.value, NodeType.WEBPAGE.value, NodeType.FAQ.value, NodeType.HOWTO.value}
        content_nodes = []
        
        for node_id in graph.nodes():
            attrs = graph.nodes[node_id]
            if attrs.get("type") in content_types:
                pr_score = pagerank.get(node_id, 0)
                
                # Find related concepts
                concepts = []
                if include_concepts:
                    for _, target, data in graph.out_edges(node_id, data=True):
                        if data.get("type") in (EdgeType.ABOUT.value, EdgeType.MENTIONS.value):
                            target_attrs = graph.nodes.get(target, {})
                            if target_attrs.get("type") == NodeType.CONCEPT.value:
                                concepts.append(target_attrs.get("name", target))
                
                content_nodes.append({
                    "id": node_id,
                    "title": attrs.get("name", ""),
                    "url": attrs.get("url", ""),
                    "description": attrs.get("properties", {}).get("description", ""),
                    "pagerank": pr_score,
                    "concepts": concepts[:5],  # Top 5 concepts
                    "type": attrs.get("type")
                })
        
        # Sort by PageRank
        content_nodes.sort(key=lambda x: x["pagerank"], reverse=True)
        return content_nodes[:limit]
    
    # ==================== Statistics ====================
    
    async def get_stats(self, brand_id: str) -> Dict[str, Any]:
        """Get graph statistics."""
        if not await self._ensure_networkx():
            return {"error": "NetworkX not available"}
        
        graph = self._get_graph(brand_id)
        
        # Count by type
        type_counts = {}
        for node_id in graph.nodes():
            node_type = graph.nodes[node_id].get("type", "Unknown")
            type_counts[node_type] = type_counts.get(node_type, 0) + 1
        
        # Edge type counts
        edge_counts = {}
        for _, _, data in graph.edges(data=True):
            edge_type = data.get("type", "Unknown")
            edge_counts[edge_type] = edge_counts.get(edge_type, 0) + 1
        
        return {
            "brand_id": brand_id,
            "total_nodes": graph.number_of_nodes(),
            "total_edges": graph.number_of_edges(),
            "node_types": type_counts,
            "edge_types": edge_counts,
            "is_connected": nx.is_weakly_connected(graph) if graph.number_of_nodes() > 0 else False,
            "density": nx.density(graph) if graph.number_of_nodes() > 0 else 0
        }
    
    async def clear_graph(self, brand_id: str) -> bool:
        """Clear all data for a brand."""
        if brand_id in self._graphs:
            self._graphs[brand_id] = nx.DiGraph() if NETWORKX_AVAILABLE else None
            await self._save_to_redis(brand_id)
            return True
        return False


# Singleton instance
_knowledge_graph_service: Optional[KnowledgeGraphService] = None


def get_knowledge_graph_service() -> KnowledgeGraphService:
    """Get singleton instance of KnowledgeGraphService."""
    global _knowledge_graph_service
    if _knowledge_graph_service is None:
        _knowledge_graph_service = KnowledgeGraphService()
    return _knowledge_graph_service
