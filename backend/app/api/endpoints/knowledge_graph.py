"""
Knowledge Graph API Endpoints - Expose graph data for visualization.

Provides endpoints for:
- Fetching graph nodes and edges for visualization
- Graph statistics and metrics
- Entity lookups and relationships
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import logging

from app.api import deps

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/knowledge-graph", tags=["Knowledge Graph"])


class GraphNodeResponse(BaseModel):
    """Node in the knowledge graph."""
    id: str
    name: str
    type: str
    url: Optional[str] = None
    pagerank: Optional[float] = None
    properties: Optional[Dict[str, Any]] = None


class GraphEdgeResponse(BaseModel):
    """Edge/relationship in the knowledge graph."""
    source: str
    target: str
    type: str
    weight: Optional[float] = 1.0


class GraphStatsResponse(BaseModel):
    """Statistics about the knowledge graph."""
    total_nodes: int
    total_edges: int
    node_types: Dict[str, int]
    edge_types: Optional[Dict[str, int]] = None


class KnowledgeGraphResponse(BaseModel):
    """Complete graph data for visualization."""
    nodes: List[GraphNodeResponse]
    edges: List[GraphEdgeResponse]
    stats: GraphStatsResponse


@router.get("/{brand_id}", response_model=KnowledgeGraphResponse)
async def get_knowledge_graph(
    brand_id: str,
    limit: int = Query(default=200, le=500, description="Max nodes to return"),
    node_types: Optional[str] = Query(default=None, description="Comma-separated node types to filter"),
    current_user = Depends(deps.get_current_user)
):
    """
    GET /knowledge-graph/{brand_id}
    
    Fetch the knowledge graph for a brand, formatted for visualization.
    
    Returns nodes and edges suitable for react-force-graph rendering,
    with PageRank scores for node sizing.
    """
    try:
        from app.services.knowledge_graph import get_knowledge_graph_service
        
        kg_service = get_knowledge_graph_service()
        
        # Parse node type filter
        filter_types = None
        if node_types:
            filter_types = [t.strip() for t in node_types.split(",")]
        
        # Get graph data
        graph_data = await kg_service.export_for_visualization(
            brand_id=brand_id,
            limit=limit,
            node_types=filter_types
        )
        
        # Transform to response format
        nodes = [
            GraphNodeResponse(
                id=node.get("id", ""),
                name=node.get("name", node.get("id", "Unknown")),
                type=node.get("type", "Unknown"),
                url=node.get("url"),
                pagerank=node.get("pagerank", 0.0),
                properties=node.get("properties")
            )
            for node in graph_data.get("nodes", [])
        ]
        
        edges = [
            GraphEdgeResponse(
                source=edge.get("source", ""),
                target=edge.get("target", ""),
                type=edge.get("type", "RELATED"),
                weight=edge.get("weight", 1.0)
            )
            for edge in graph_data.get("edges", [])
        ]
        
        stats = GraphStatsResponse(
            total_nodes=graph_data.get("stats", {}).get("total_nodes", len(nodes)),
            total_edges=graph_data.get("stats", {}).get("total_edges", len(edges)),
            node_types=graph_data.get("stats", {}).get("node_types", {}),
            edge_types=graph_data.get("stats", {}).get("edge_types")
        )
        
        return KnowledgeGraphResponse(
            nodes=nodes,
            edges=edges,
            stats=stats
        )
        
    except ImportError:
        logger.warning("Knowledge Graph service not available")
        raise HTTPException(
            status_code=503,
            detail="Knowledge Graph service is not configured"
        )
    except Exception as e:
        logger.error(f"Failed to fetch knowledge graph: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch knowledge graph: {str(e)}"
        )


@router.get("/{brand_id}/stats", response_model=GraphStatsResponse)
async def get_graph_stats(
    brand_id: str,
    current_user = Depends(deps.get_current_user)
):
    """
    GET /knowledge-graph/{brand_id}/stats
    
    Get statistics about the brand's knowledge graph.
    """
    try:
        from app.services.knowledge_graph import get_knowledge_graph_service
        
        kg_service = get_knowledge_graph_service()
        stats = await kg_service.get_stats(brand_id)
        
        return GraphStatsResponse(
            total_nodes=stats.get("total_nodes", 0),
            total_edges=stats.get("total_edges", 0),
            node_types=stats.get("node_types", {}),
            edge_types=stats.get("edge_types")
        )
        
    except ImportError:
        raise HTTPException(
            status_code=503,
            detail="Knowledge Graph service is not configured"
        )
    except Exception as e:
        logger.error(f"Failed to get graph stats: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get graph statistics: {str(e)}"
        )


@router.get("/{brand_id}/entity/{entity_id}")
async def get_entity_details(
    brand_id: str,
    entity_id: str,
    include_neighbors: bool = Query(default=True, description="Include connected nodes"),
    current_user = Depends(deps.get_current_user)
):
    """
    GET /knowledge-graph/{brand_id}/entity/{entity_id}
    
    Get detailed information about a specific entity in the graph.
    """
    try:
        from app.services.knowledge_graph import get_knowledge_graph_service
        
        kg_service = get_knowledge_graph_service()
        
        entity_data = await kg_service.get_entity(
            brand_id=brand_id,
            entity_id=entity_id,
            include_neighbors=include_neighbors
        )
        
        if not entity_data:
            raise HTTPException(
                status_code=404,
                detail=f"Entity {entity_id} not found in graph"
            )
        
        return entity_data
        
    except ImportError:
        raise HTTPException(
            status_code=503,
            detail="Knowledge Graph service is not configured"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get entity: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get entity details: {str(e)}"
        )


@router.post("/{brand_id}/pagerank")
async def calculate_pagerank(
    brand_id: str,
    damping: float = Query(default=0.85, ge=0.0, le=1.0, description="PageRank damping factor"),
    current_user = Depends(deps.get_current_user)
):
    """
    POST /knowledge-graph/{brand_id}/pagerank
    
    Recalculate PageRank scores for all nodes in the brand's graph.
    This updates authority scores used for llms.txt ordering.
    """
    try:
        from app.services.knowledge_graph import get_knowledge_graph_service
        
        kg_service = get_knowledge_graph_service()
        
        result = await kg_service.calculate_pagerank(
            brand_id=brand_id,
            damping=damping
        )
        
        return {
            "success": True,
            "nodes_updated": result.get("nodes_updated", 0),
            "top_nodes": result.get("top_nodes", [])[:10]
        }
        
    except ImportError:
        raise HTTPException(
            status_code=503,
            detail="Knowledge Graph service is not configured"
        )
    except Exception as e:
        logger.error(f"Failed to calculate PageRank: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to calculate PageRank: {str(e)}"
        )
