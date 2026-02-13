"""
Features API - Endpoint for feature toggles.

Allows frontend to query which analysis features are enabled.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict

from app.core.config import settings


router = APIRouter(prefix="/features", tags=["features"])


class FeatureFlags(BaseModel):
    """Current feature flag states."""
    # Core
    ai_visibility: bool
    insights: bool
    
    # Advanced
    hallucination_detection: bool
    citation_tracking: bool
    sentiment_analysis: bool
    prompt_tracking: bool
    content_structure: bool
    
    # Optional
    eeat_analysis: bool
    technical_aeo: bool
    platform_detection: bool
    visual_assets: bool


@router.get("", response_model=FeatureFlags)
async def get_feature_flags():
    """
    Get current feature flag states.
    
    Returns which analysis features are enabled based on server configuration.
    """
    return FeatureFlags(
        # Core
        ai_visibility=settings.FEATURE_AI_VISIBILITY,
        insights=settings.FEATURE_INSIGHTS,
        
        # Advanced
        hallucination_detection=settings.FEATURE_HALLUCINATION_DETECTION,
        citation_tracking=settings.FEATURE_CITATION_TRACKING,
        sentiment_analysis=settings.FEATURE_SENTIMENT_ANALYSIS,
        prompt_tracking=settings.FEATURE_PROMPT_TRACKING,
        content_structure=settings.FEATURE_CONTENT_STRUCTURE,
        
        # Optional
        eeat_analysis=settings.FEATURE_EEAT_ANALYSIS,
        technical_aeo=getattr(settings, 'FEATURE_TECHNICAL_AEO', True),
        platform_detection=getattr(settings, 'FEATURE_PLATFORM_DETECTION', True),
        visual_assets=settings.FEATURE_VISUAL_ASSETS,
    )


@router.get("/descriptions")
async def get_feature_descriptions() -> Dict[str, Dict[str, str]]:
    """
    Get feature descriptions for settings UI.
    """
    return {
        "core": {
            "ai_visibility": "Medición de visibilidad en IA (ChatGPT, Claude, Perplexity)",
            "insights": "Insights dinámicos en el dashboard",
        },
        "advanced": {
            "hallucination_detection": "Detección de alucinaciones de IA",
            "citation_tracking": "Seguimiento de citas a tu sitio",
            "sentiment_analysis": "Análisis de sentimiento de marca",
            "prompt_tracking": "Descubrimiento de prompts relevantes",
            "content_structure": "Análisis de FAQ/HowTo/Schema",
        },
        "optional": {
            "eeat_analysis": "Análisis de señales E-E-A-T",
            "technical_aeo": "Auditoría técnica AEO",
            "visual_assets": "Análisis de imágenes y assets visuales",
        }
    }
