"""
Knowledge Graph Module - Semantic Entity Relationships for GEO/AEO.

Provides:
- NetworkX-based in-memory Knowledge Graph
- Entity relationship modeling (Organization, Concept, Article, Person)
- PageRank and centrality algorithms for link optimization
- Redis persistence for production
- Integration with NER pipeline and llms.txt generation
"""

from .knowledge_graph_service import (
    KnowledgeGraphService,
    get_knowledge_graph_service,
    NodeType,
    EdgeType,
    GraphNode,
    GraphEdge
)

__all__ = [
    "KnowledgeGraphService",
    "get_knowledge_graph_service",
    "NodeType",
    "EdgeType",
    "GraphNode",
    "GraphEdge"
]
