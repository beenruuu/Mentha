"""
Onboarding Services Module - Entity & Brand Voice Ingestion Engine for GEO/AEO.

This module handles the sophisticated onboarding process that goes beyond 
simple user registration. It captures:

1. Entity Resolution - Linkage to Knowledge Graph (Wikidata, Google KG)
2. Brand Voice Calibration - Digitizing the brand's semantic signature
3. Persona Management - User personas for prompt simulation
4. Competitor Entity Mapping - Semantic competitor discovery

These components form the "Ground Truth" foundation against which
all subsequent AI analysis is benchmarked.
"""

from app.services.onboarding.entity_resolution_service import (
    EntityResolutionService,
    get_entity_resolution_service,
    EntityResolutionResult,
    KnowledgeGraphIdentity,
)

from app.services.onboarding.brand_voice_profiler import (
    BrandVoiceProfiler,
    get_brand_voice_profiler,
    VoiceProfile,
    VoiceAnalysisResult,
)

from app.services.onboarding.persona_manager import (
    PersonaManager,
    get_persona_manager,
    UserPersona,
    PersonaType,
)

__all__ = [
    # Entity Resolution
    "EntityResolutionService",
    "get_entity_resolution_service",
    "EntityResolutionResult",
    "KnowledgeGraphIdentity",
    # Brand Voice
    "BrandVoiceProfiler",
    "get_brand_voice_profiler",
    "VoiceProfile",
    "VoiceAnalysisResult",
    # Persona Management
    "PersonaManager",
    "get_persona_manager",
    "UserPersona",
    "PersonaType",
]
