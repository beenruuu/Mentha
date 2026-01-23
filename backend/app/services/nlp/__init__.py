"""
NLP Services Module - Natural Language Processing for GEO/AEO.

Provides:
- Entity Extraction (NER) using Spacy
- Text Analysis for semantic enrichment
- Knowledge Graph population support
"""

from .entity_extraction_service import EntityExtractionService, get_entity_extraction_service

__all__ = [
    "EntityExtractionService",
    "get_entity_extraction_service"
]
