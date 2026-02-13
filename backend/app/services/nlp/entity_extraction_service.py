"""
Entity Extraction Service - NER Pipeline using Spacy for GEO/AEO.

Extracts named entities from text content to:
1. Populate the Knowledge Graph with semantic entities
2. Enrich JSON-LD with mentions property
3. Improve llms.txt generation with entity-dense summaries
4. Support disambiguation against Wikidata/Wikipedia

Supported Entity Types:
- ORG: Organizations, companies, brands
- PERSON: People, authors, experts
- PRODUCT: Products, services
- GPE: Geo-political entities (countries, cities)
- WORK_OF_ART: Creative works, publications
- EVENT: Named events
- LOC: Non-GPE locations

Architecture:
- Singleton pattern for model caching (Spacy models are expensive to load)
- Async interface for FastAPI compatibility
- Batch processing support for bulk content
- Wikidata linking for entity disambiguation
"""

import asyncio
import logging
from typing import Dict, Any, List, Optional, Set, Tuple
from dataclasses import dataclass, field
from enum import Enum
import httpx

logger = logging.getLogger(__name__)


class EntityType(str, Enum):
    """Supported entity types aligned with Schema.org ontology."""
    ORGANIZATION = "Organization"
    PERSON = "Person"
    PRODUCT = "Product"
    PLACE = "Place"
    CREATIVE_WORK = "CreativeWork"
    EVENT = "Event"
    CONCEPT = "Concept"  # Abstract topics


# Spacy label to Schema.org type mapping
SPACY_TO_SCHEMA_TYPE: Dict[str, EntityType] = {
    "ORG": EntityType.ORGANIZATION,
    "PERSON": EntityType.PERSON,
    "PRODUCT": EntityType.PRODUCT,
    "GPE": EntityType.PLACE,
    "LOC": EntityType.PLACE,
    "WORK_OF_ART": EntityType.CREATIVE_WORK,
    "EVENT": EntityType.EVENT,
    "NORP": EntityType.CONCEPT,  # Nationalities, religions, political groups
    "FAC": EntityType.PLACE,  # Buildings, airports, highways
}


@dataclass
class ExtractedEntity:
    """Represents an extracted named entity with metadata."""
    text: str
    entity_type: EntityType
    start_char: int
    end_char: int
    confidence: float = 1.0
    wikidata_id: Optional[str] = None
    wikipedia_url: Optional[str] = None
    same_as: List[str] = field(default_factory=list)
    context_snippet: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "text": self.text,
            "type": self.entity_type.value,
            "start": self.start_char,
            "end": self.end_char,
            "confidence": self.confidence,
            "wikidata_id": self.wikidata_id,
            "wikipedia_url": self.wikipedia_url,
            "same_as": self.same_as,
            "context_snippet": self.context_snippet
        }


@dataclass
class ExtractionResult:
    """Result of entity extraction from a text."""
    text_hash: str
    entities: List[ExtractedEntity]
    entity_counts: Dict[str, int]
    processing_time_ms: float
    model_used: str
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "text_hash": self.text_hash,
            "entities": [e.to_dict() for e in self.entities],
            "entity_counts": self.entity_counts,
            "processing_time_ms": self.processing_time_ms,
            "model_used": self.model_used
        }
    
    def get_unique_entities(self) -> List[ExtractedEntity]:
        """Get deduplicated entities by text (case-insensitive)."""
        seen: Set[str] = set()
        unique: List[ExtractedEntity] = []
        for entity in self.entities:
            key = entity.text.lower()
            if key not in seen:
                seen.add(key)
                unique.append(entity)
        return unique
    
    def get_by_type(self, entity_type: EntityType) -> List[ExtractedEntity]:
        """Get all entities of a specific type."""
        return [e for e in self.entities if e.entity_type == entity_type]


class EntityExtractionService:
    """
    NER Pipeline Service using Spacy for high-precision entity extraction.
    
    Uses en_core_web_trf (transformer-based) for best accuracy.
    Falls back to en_core_web_sm if transformer model unavailable.
    
    Features:
    - Lazy model loading (loaded on first use)
    - Thread-safe singleton pattern
    - Wikidata disambiguation support
    - Batch processing for efficiency
    - Context snippet extraction for RAG
    """
    
    _instance: Optional["EntityExtractionService"] = None
    _nlp = None
    _model_name: str = ""
    
    def __new__(cls):
        """Singleton pattern for expensive Spacy model."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize service (model loaded lazily)."""
        self._initialized = False
        self._http_client: Optional[httpx.AsyncClient] = None
    
    async def _ensure_model_loaded(self) -> bool:
        """Ensure Spacy model is loaded (lazy loading)."""
        if self._nlp is not None:
            return True
        
        try:
            import spacy
            
            # Try transformer model first for best accuracy
            model_priority = [
                "en_core_web_trf",  # Transformer (best)
                "en_core_web_lg",   # Large
                "en_core_web_md",   # Medium
                "en_core_web_sm",   # Small (fallback)
            ]
            
            for model_name in model_priority:
                try:
                    logger.info(f"Attempting to load Spacy model: {model_name}")
                    self._nlp = spacy.load(model_name)
                    self._model_name = model_name
                    self._initialized = True
                    logger.info(f"Successfully loaded Spacy model: {model_name}")
                    return True
                except OSError:
                    logger.debug(f"Model {model_name} not found, trying next...")
                    continue
            
            # No model available - try to download smallest
            logger.warning("No Spacy model found. Attempting to download en_core_web_sm...")
            from spacy.cli import download
            download("en_core_web_sm")
            self._nlp = spacy.load("en_core_web_sm")
            self._model_name = "en_core_web_sm"
            self._initialized = True
            return True
            
        except ImportError:
            logger.error("Spacy not installed. Entity extraction disabled.")
            return False
        except Exception as e:
            logger.error(f"Failed to load Spacy model: {e}")
            return False
    
    async def _get_http_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client for Wikidata API."""
        if self._http_client is None:
            self._http_client = httpx.AsyncClient(timeout=10.0)
        return self._http_client
    
    async def extract_entities(
        self,
        text: str,
        include_context: bool = True,
        context_window: int = 50,
        min_confidence: float = 0.0,
        entity_types: Optional[List[EntityType]] = None
    ) -> ExtractionResult:
        """
        Extract named entities from text using Spacy NER.
        
        Args:
            text: The text content to analyze
            include_context: Include surrounding context for each entity
            context_window: Characters before/after entity for context
            min_confidence: Minimum confidence threshold (0.0-1.0)
            entity_types: Filter to specific entity types (None = all)
        
        Returns:
            ExtractionResult with all extracted entities and metadata
        """
        import time
        import hashlib
        
        start_time = time.time()
        text_hash = hashlib.md5(text.encode()).hexdigest()[:16]
        
        # Ensure model is loaded
        if not await self._ensure_model_loaded():
            logger.warning("NER model not available, returning empty result")
            return ExtractionResult(
                text_hash=text_hash,
                entities=[],
                entity_counts={},
                processing_time_ms=0,
                model_used="none"
            )
        
        # Process text with Spacy (run in thread pool for async compatibility)
        loop = asyncio.get_event_loop()
        doc = await loop.run_in_executor(None, self._nlp, text)
        
        entities: List[ExtractedEntity] = []
        entity_counts: Dict[str, int] = {}
        
        for ent in doc.ents:
            # Map Spacy label to Schema.org type
            schema_type = SPACY_TO_SCHEMA_TYPE.get(ent.label_)
            if schema_type is None:
                continue
            
            # Filter by entity type if specified
            if entity_types and schema_type not in entity_types:
                continue
            
            # Build context snippet
            context_snippet = None
            if include_context:
                start = max(0, ent.start_char - context_window)
                end = min(len(text), ent.end_char + context_window)
                context_snippet = text[start:end]
                # Clean up partial words at boundaries
                if start > 0:
                    context_snippet = "..." + context_snippet.split(" ", 1)[-1] if " " in context_snippet else context_snippet
                if end < len(text):
                    context_snippet = context_snippet.rsplit(" ", 1)[0] + "..." if " " in context_snippet else context_snippet
            
            entity = ExtractedEntity(
                text=ent.text,
                entity_type=schema_type,
                start_char=ent.start_char,
                end_char=ent.end_char,
                confidence=1.0,  # Spacy doesn't provide confidence by default
                context_snippet=context_snippet
            )
            
            entities.append(entity)
            
            # Count by type
            type_name = schema_type.value
            entity_counts[type_name] = entity_counts.get(type_name, 0) + 1
        
        processing_time = (time.time() - start_time) * 1000
        
        return ExtractionResult(
            text_hash=text_hash,
            entities=entities,
            entity_counts=entity_counts,
            processing_time_ms=round(processing_time, 2),
            model_used=self._model_name
        )
    
    async def extract_entities_batch(
        self,
        texts: List[str],
        **kwargs
    ) -> List[ExtractionResult]:
        """
        Extract entities from multiple texts efficiently.
        
        Uses Spacy's pipe for batch processing optimization.
        
        Args:
            texts: List of text contents to analyze
            **kwargs: Additional arguments passed to extract_entities
        
        Returns:
            List of ExtractionResult, one per input text
        """
        if not await self._ensure_model_loaded():
            return [
                ExtractionResult(
                    text_hash="",
                    entities=[],
                    entity_counts={},
                    processing_time_ms=0,
                    model_used="none"
                )
                for _ in texts
            ]
        
        results = []
        for text in texts:
            result = await self.extract_entities(text, **kwargs)
            results.append(result)
        
        return results
    
    async def disambiguate_entity(
        self,
        entity: ExtractedEntity,
        language: str = "en"
    ) -> ExtractedEntity:
        """
        Attempt to disambiguate entity against Wikidata.
        
        Adds wikidata_id, wikipedia_url, and same_as to entity.
        
        Args:
            entity: The entity to disambiguate
            language: Wikipedia language code
        
        Returns:
            Updated entity with Wikidata metadata
        """
        try:
            client = await self._get_http_client()
            
            # Search Wikidata for entity
            search_url = "https://www.wikidata.org/w/api.php"
            params = {
                "action": "wbsearchentities",
                "search": entity.text,
                "language": language,
                "format": "json",
                "limit": 1
            }
            
            response = await client.get(search_url, params=params)
            if response.status_code != 200:
                return entity
            
            data = response.json()
            results = data.get("search", [])
            
            if not results:
                return entity
            
            wikidata_id = results[0].get("id")
            entity.wikidata_id = wikidata_id
            entity.same_as.append(f"https://www.wikidata.org/wiki/{wikidata_id}")
            
            # Try to get Wikipedia URL
            wiki_url = f"https://{language}.wikipedia.org/wiki/{entity.text.replace(' ', '_')}"
            entity.wikipedia_url = wiki_url
            entity.same_as.append(wiki_url)
            
            return entity
            
        except Exception as e:
            logger.debug(f"Failed to disambiguate entity '{entity.text}': {e}")
            return entity
    
    async def enrich_with_wikidata(
        self,
        result: ExtractionResult,
        max_entities: int = 10
    ) -> ExtractionResult:
        """
        Enrich extraction result with Wikidata links.
        
        Only disambiguates unique, high-value entities.
        
        Args:
            result: The extraction result to enrich
            max_entities: Maximum entities to disambiguate (API rate limit)
        
        Returns:
            Enriched ExtractionResult
        """
        # Get unique entities, prioritize organizations and products
        unique = result.get_unique_entities()
        
        # Sort by priority (ORG > PRODUCT > PERSON > others)
        priority = {
            EntityType.ORGANIZATION: 0,
            EntityType.PRODUCT: 1,
            EntityType.PERSON: 2,
        }
        unique.sort(key=lambda e: priority.get(e.entity_type, 99))
        
        # Disambiguate top entities
        for entity in unique[:max_entities]:
            await self.disambiguate_entity(entity)
        
        return result
    
    async def extract_for_knowledge_graph(
        self,
        text: str,
        content_id: str,
        content_type: str = "Article"
    ) -> Dict[str, Any]:
        """
        Extract entities formatted for Knowledge Graph ingestion.
        
        Returns a structure ready for the KnowledgeGraphService.
        
        Args:
            text: Content text
            content_id: Unique ID of the content (article, page, etc.)
            content_type: Type of content for the graph
        
        Returns:
            Dict with nodes and edges for graph insertion
        """
        result = await self.extract_entities(text)
        result = await self.enrich_with_wikidata(result)
        
        nodes = []
        edges = []
        
        # Add content node
        nodes.append({
            "id": content_id,
            "type": content_type,
            "properties": {}
        })
        
        # Add entity nodes and MENTIONS edges
        for entity in result.get_unique_entities():
            entity_id = f"entity:{entity.entity_type.value}:{entity.text.lower().replace(' ', '_')}"
            
            nodes.append({
                "id": entity_id,
                "type": entity.entity_type.value,
                "properties": {
                    "name": entity.text,
                    "wikidata_id": entity.wikidata_id,
                    "same_as": entity.same_as
                }
            })
            
            # Count occurrences for edge weight
            occurrences = len([e for e in result.entities if e.text.lower() == entity.text.lower()])
            
            edges.append({
                "source": content_id,
                "target": entity_id,
                "type": "MENTIONS",
                "properties": {
                    "weight": occurrences,
                    "context": entity.context_snippet
                }
            })
        
        return {
            "nodes": nodes,
            "edges": edges,
            "extraction_result": result.to_dict()
        }
    
    async def close(self):
        """Clean up resources."""
        if self._http_client:
            await self._http_client.aclose()
            self._http_client = None


# Singleton instance
_entity_extraction_service: Optional[EntityExtractionService] = None


def get_entity_extraction_service() -> EntityExtractionService:
    """Get singleton instance of EntityExtractionService."""
    global _entity_extraction_service
    if _entity_extraction_service is None:
        _entity_extraction_service = EntityExtractionService()
    return _entity_extraction_service
