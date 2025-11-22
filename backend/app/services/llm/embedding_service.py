from abc import ABC, abstractmethod
from typing import List
import openai
import numpy as np
from pydantic import BaseModel
from functools import lru_cache

from app.core.config import settings
from app.models.llm import LLMUsage


class EmbeddingResponse(BaseModel):
    """Response from an embedding service."""

    embedding: List[float]
    model: str
    usage: LLMUsage


class EmbeddingService(ABC):
    """Abstract base class for embedding services."""

    @abstractmethod
    async def create_embedding(self, text: str, model: str) -> EmbeddingResponse:
        """Create an embedding vector for the text."""
        pass


class OpenAIEmbeddingService(EmbeddingService):
    """OpenAI implementation of the embedding service."""

    def __init__(self, api_key: str):
        """Initialize the OpenAI client."""
        self.client = openai.AsyncOpenAI(api_key=api_key)

    async def create_embedding(self, text: str, model: str = "text-embedding-ada-002") -> EmbeddingResponse:
        """Create an embedding using OpenAI."""
        response = await self.client.embeddings.create(model=model, input=text)

        embedding = response.data[0].embedding

        usage = LLMUsage(prompt_tokens=response.usage.prompt_tokens, completion_tokens=0, total_tokens=response.usage.total_tokens)

        return EmbeddingResponse(embedding=embedding, model=model, usage=usage)


class AnthropicEmbeddingService(EmbeddingService):
    """Anthropic implementation of the embedding service."""

    def __init__(self, api_key: str):
        """Initialize the Anthropic client."""
        # Note: Anthropic doesn't currently have a dedicated embeddings API,
        # so this is a placeholder for future implementation
        self.api_key = api_key

    async def create_embedding(self, text: str, model: str = "claude-embedding") -> EmbeddingResponse:
        """Create an embedding using Anthropic."""
        # This is a placeholder implementation
        # In a real implementation, you'd call the Anthropic embedding API when available

        # For now, return a random embedding as a placeholder
        # In production, you would replace this with the actual API call
        random_embedding = list(np.random.normal(0, 1, 1536))

        usage = LLMUsage(prompt_tokens=len(text.split()), completion_tokens=0, total_tokens=len(text.split()))

        return EmbeddingResponse(embedding=[float(x) for x in random_embedding], model=model, usage=usage)


class EmbeddingServiceFactory:
    """Factory for creating embedding service instances."""

    @staticmethod
    def get_service(provider: str) -> EmbeddingService:
        """Get an embedding service by provider name."""
        if provider == "openai":
            if not settings.OPENAI_API_KEY:
                raise ValueError("OpenAI API key not configured")
            return OpenAIEmbeddingService(api_key=settings.OPENAI_API_KEY)
        elif provider == "anthropic":
            if not settings.ANTHROPIC_API_KEY:
                raise ValueError("Anthropic API key not configured")
            return AnthropicEmbeddingService(api_key=settings.ANTHROPIC_API_KEY)
        else:
            raise ValueError(f"Unsupported embedding provider: {provider}")


@lru_cache()
def get_embedding_service(provider: str = "openai") -> EmbeddingService:
    """Dependency to get an embedding service."""
    return EmbeddingServiceFactory.get_service(provider)
