from abc import ABC, abstractmethod
import openai
import anthropic
from pydantic import BaseModel
from functools import lru_cache

from app.core.config import settings
from app.models.llm import LLMUsage


class LLMResponse(BaseModel):
    """Response from an LLM service."""

    text: str
    model: str
    usage: LLMUsage


class LLMService(ABC):
    """Abstract base class for LLM services."""

    @abstractmethod
    async def generate_text(self, prompt: str, model: str, max_tokens: int = 500, temperature: float = 0.7, **kwargs) -> LLMResponse:
        """Generate text using the LLM."""
        pass


class OpenAIService(LLMService):
    """OpenAI implementation of the LLM service."""

    def __init__(self, api_key: str, base_url: str = None):
        """Initialize the OpenAI client."""
        self.client = openai.AsyncOpenAI(api_key=api_key, base_url=base_url)

    @staticmethod
    def _requires_completion_tokens(model: str) -> bool:
        """New GPT-5 models expect max_completion_tokens instead of max_tokens."""
        if not model:
            return False
        normalized = model.lower()
        return normalized.startswith("gpt-5") or "-gpt-5" in normalized

    @staticmethod
    def _supports_temperature(model: str) -> bool:
        """Some GPT-5 variants lock temperature to 1."""
        if not model:
            return True
        normalized = model.lower()
        return not (normalized.startswith("gpt-5") or "-gpt-5" in normalized)

    async def generate_text(self, prompt: str, model: str = "gpt-3.5-turbo", max_tokens: int = 500, temperature: float = 0.7, **kwargs) -> LLMResponse:
        """Generate text using OpenAI."""
        request_payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
        }
        request_payload.update(kwargs)

        override_temperature = request_payload.pop("temperature", temperature)

        explicit_completion = request_payload.pop("max_completion_tokens", None)
        explicit_tokens = request_payload.pop("max_tokens", None)

        if explicit_completion is not None:
            request_payload["max_completion_tokens"] = explicit_completion
        elif self._requires_completion_tokens(model):
            request_payload["max_completion_tokens"] = max_tokens
        else:
            request_payload["max_tokens"] = explicit_tokens if explicit_tokens is not None else max_tokens

        if self._supports_temperature(model):
            request_payload["temperature"] = override_temperature
        else:
            # GPT-5 nano ignores temperature customization; stick to default to avoid 400s.
            request_payload["temperature"] = 1

        response = await self.client.chat.completions.create(**request_payload)

        usage = LLMUsage(
            prompt_tokens=response.usage.prompt_tokens, completion_tokens=response.usage.completion_tokens, total_tokens=response.usage.total_tokens
        )

        return LLMResponse(text=response.choices[0].message.content, model=model, usage=usage)


class OpenRouterService(OpenAIService):
    """OpenRouter implementation of the LLM service (OpenAI compatible)."""

    def __init__(self, api_key: str):
        """Initialize the OpenRouter client."""
        super().__init__(api_key=api_key, base_url="https://openrouter.ai/api/v1")

    async def generate_text(self, prompt: str, model: str = "openai/gpt-3.5-turbo", max_tokens: int = 500, temperature: float = 0.7, **kwargs) -> LLMResponse:
        """Generate text using OpenRouter."""
        # OpenRouter requires the referer header for rankings, but the python client handles headers differently.
        # For basic usage, the base_url change is sufficient.
        # If we need custom headers, we might need to pass default_headers to AsyncOpenAI
        return await super().generate_text(prompt, model, max_tokens, temperature, **kwargs)


class AnthropicService(LLMService):
    """Anthropic (Claude) implementation of the LLM service."""

    def __init__(self, api_key: str):
        """Initialize the Anthropic client."""
        self.client = anthropic.AsyncAnthropic(api_key=api_key)

    async def generate_text(
        self, prompt: str, model: str = "claude-3-sonnet-20240229", max_tokens: int = 500, temperature: float = 0.7, **kwargs
    ) -> LLMResponse:
        """Generate text using Anthropic Claude."""
        response = await self.client.messages.create(
            model=model, max_tokens=max_tokens, temperature=temperature, messages=[{"role": "user", "content": prompt}], **kwargs
        )

        usage = LLMUsage(
            prompt_tokens=response.usage.input_tokens,
            completion_tokens=response.usage.output_tokens,
            total_tokens=response.usage.input_tokens + response.usage.output_tokens,
        )

        return LLMResponse(text=response.content[0].text, model=model, usage=usage)


class LLMServiceFactory:
    """Factory for creating LLM service instances."""

    @staticmethod
    def get_service(provider: str) -> LLMService:
        """Get an LLM service by provider name."""
        if provider == "openai":
            if not settings.OPENAI_API_KEY:
                raise ValueError("OpenAI API key not configured")
            return OpenAIService(api_key=settings.OPENAI_API_KEY)
        elif provider == "anthropic":
            if not settings.ANTHROPIC_API_KEY:
                raise ValueError("Anthropic API key not configured")
            return AnthropicService(api_key=settings.ANTHROPIC_API_KEY)
        elif provider == "openrouter":
            if not settings.OPENROUTER_API_KEY:
                raise ValueError("OpenRouter API key not configured")
            return OpenRouterService(api_key=settings.OPENROUTER_API_KEY)
        else:
            raise ValueError(f"Unsupported LLM provider: {provider}")


@lru_cache()
def get_llm_service(provider: str = "openai") -> LLMService:
    """Dependency to get an LLM service."""
    return LLMServiceFactory.get_service(provider)
