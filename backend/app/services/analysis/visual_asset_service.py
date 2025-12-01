import logging
from typing import Dict, Any, List, Optional
import re
from app.core.config import settings
import httpx

logger = logging.getLogger(__name__)

class VisualAssetService:
    """
    Service to identify visual content gaps and generate image prompts
    optimized for SGE (Search Generative Experience) and 'Nano Banana' (Gemini 2.5 Flash Image).
    """
    
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
        # We'll use the main LLM (OpenAI/Anthropic) to generate the *prompts* for the image model
        self.llm_api_key = settings.OPENAI_API_KEY
        
    async def analyze_visual_gaps(self, content: str, content_type: str = "html") -> List[Dict[str, Any]]:
        """
        Analyze content to find sections that need visual enhancement.
        
        Args:
            content: The HTML or Markdown content.
            content_type: 'html' or 'markdown'.
            
        Returns:
            List of visual opportunities with context and generated prompts.
        """
        opportunities = []
        
        # Simple heuristic: Split by headers and check text length
        # This is a basic implementation; a more robust one would use the DOM/Markdown tree
        
        sections = self._split_into_sections(content)
        
        for section in sections:
            word_count = len(section['text'].split())
            
            # If section is substantial (> 150 words) and has no images
            if word_count > 150 and not self._has_images(section['content']):
                # Generate a prompt for this section
                prompt = await self._generate_nano_banana_prompt(section['text'][:500])
                
                opportunities.append({
                    "type": "missing_visual",
                    "location": section['header'],
                    "context": section['text'][:200] + "...",
                    "suggested_prompt": prompt,
                    "reason": "Long text block without visual support reduces SGE engagement."
                })
                
                if len(opportunities) >= 3: # Limit to 3 suggestions per page for now
                    break
                    
        return opportunities

    def _split_into_sections(self, content: str) -> List[Dict[str, str]]:
        """Split content into logical sections based on headers."""
        # Very basic regex splitting for now
        # Assumes Markdown-like structure or simple HTML headers
        sections = []
        
        # Regex for headers (Markdown # or HTML <h>)
        # This is simplified; robust parsing would use BeautifulSoup or a Markdown parser
        parts = re.split(r'(<h[1-6]>.*?<\/h[1-6]>|#{1,6}\s+.*)', content, flags=re.IGNORECASE)
        
        current_header = "Introduction"
        
        for i in range(len(parts)):
            part = parts[i].strip()
            if not part:
                continue
                
            if re.match(r'<h[1-6]>|#{1,6}', part):
                current_header = re.sub(r'<[^>]+>|#+\s+', '', part).strip()
            else:
                # This is content
                sections.append({
                    "header": current_header,
                    "content": part,
                    "text": re.sub(r'<[^>]+>', '', part).strip() # Strip HTML for text analysis
                })
                
        return sections

    def _has_images(self, content: str) -> bool:
        """Check if content block contains images."""
        return bool(re.search(r'<img|!\[', content, re.IGNORECASE))

    async def _generate_nano_banana_prompt(self, context: str) -> str:
        """
        Generate a 'Nano Banana' optimized image prompt using the LLM.
        """
        if not self.llm_api_key:
            return "Error: LLM API key not configured for prompt generation."
            
        system_prompt = """
        You are an expert prompt engineer for the 'Nano Banana' (Gemini 2.5 Flash Image) model.
        Your goal is to create highly detailed, photorealistic image prompts based on the provided text context.
        
        Nano Banana Prompting Style:
        - Focus on lighting, texture, and composition.
        - Use keywords like "photorealistic", "8k", "highly detailed", "cinematic lighting".
        - Describe the subject clearly.
        - Avoid negative prompts in the main description (unless specified).
        - Keep it under 50 words but packed with visual descriptors.
        
        Context from article:
        """
        
        try:
            # Using OpenAI for prompt generation (as the "brain" to drive the image model)
            response = await self.client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.llm_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o", # Or gpt-3.5-turbo
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"Generate a Nano Banana prompt for a visual to accompany this text: {context}"}
                    ],
                    "temperature": 0.7
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                return data['choices'][0]['message']['content'].strip()
            else:
                return "Failed to generate prompt via LLM."
                
        except Exception as e:
            logger.error(f"Error generating prompt: {e}")
            return "Error generating prompt."
