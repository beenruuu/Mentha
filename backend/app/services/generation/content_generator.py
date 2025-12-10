from typing import List, Dict, Any, Optional
from app.services.llm.llm_service import OpenAIService, get_llm_service
from app.models.content import ContentGenerationRequest
import logging

logger = logging.getLogger(__name__)

class ContentGeneratorService:
    """
    Generates 'Machine Friendly' content optimized for AEO/GEO.
    Features:
    - FAQ Generation (Schema ready)
    - Glossary Terms
    - Direct Answer Blocks
    """
    
    def __init__(self, llm_service: OpenAIService = None):
        self.llm = llm_service or get_llm_service()

    async def generate_definition(self, term: str, context: str) -> Dict[str, Any]:
        """
        Generate a 'featured snippet' style definition (40-60 words).
        Optimized for: 'What is X?' queries and Direct Answers.
        """
        prompt = f"""Write a definitive answer for 'What is {term}?'.
        Context: {context}
        
        Requirements:
        1. Length: 40-60 words exactly.
        2. Style: Objective, encyclopedic, authoritative.
        3. Structure: Start with '{term} is...'
        4. No fluff, no marketing language.
        """
        try:
            definition = await self.llm.generate_text(prompt)
            return {"term": term, "definition": definition, "type": "featured_snippet"}
        except Exception as e:
            logger.error(f"Definition generation failed: {e}")
            raise

    async def structure_content(self, text: str) -> Dict[str, Any]:
        """
        Convert unstructured text into Machine-Friendly formats (Tables/Lists).
        """
        prompt = f"""Transform this text into structured formats.
        Input text: "{text}"
        
        Output JSON with:
        1. 'table_markdown': A markdown table if data compares items (else null).
        2. 'list': An ordered or unordered list of key points.
        3. 'summary': A one-sentence summary.
        """
        try:
            return await self.llm.generate_json(prompt)
        except Exception as e:
            logger.error(f"Structuring failed: {e}")
            raise

    async def enrich_entities(self, content: str, industry: str) -> Dict[str, Any]:
        """
        Suggest missing semantic entities to improve authority.
        """
        prompt = f"""Analyze this content for the '{industry}' industry.
        Content: "{content}"
        
        Identify gaps in semantic vocabulary. 
        Output JSON:
        1. 'missing_entities': List of 3-5 keywords/concepts that experts usually mention but are missing here.
        2. 'reason': Why adding them improves authority.
        """
        try:
            return await self.llm.generate_json(prompt)
        except Exception as e:
            logger.error(f"Entity enrichment failed: {e}")
            raise

# Singleton
_content_generator: Optional[ContentGeneratorService] = None

def get_content_generator() -> ContentGeneratorService:
    global _content_generator
    if _content_generator is None:
        _content_generator = ContentGeneratorService()
    return _content_generator
