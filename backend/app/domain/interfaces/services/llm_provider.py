from abc import ABC, abstractmethod
from typing import Dict, Any, List

class LLMProvider(ABC):
    @abstractmethod
    async def generate_insights(self, prompt: str, context: Dict[str, Any], model: str) -> str:
        """Generates text analysis based on a prompt and context."""
        pass
    
    @abstractmethod
    async def analyze_sentiment(self, text: str) -> Dict[str, float]:
        """Returns sentiment scores (positive, negative, neutral)."""
        pass
