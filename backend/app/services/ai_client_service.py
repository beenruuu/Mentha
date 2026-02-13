"""
Unified AI Client Service - Single point for all AI model queries.

Consolidates duplicate code from:
- ai_visibility_service.py
- ai_search_simulator_service.py  
- sentiment_analysis_service.py

Cost optimization:
- Uses cheaper models by default (gpt-3.5-turbo, claude-3-haiku)
- Provides batch query methods to reduce latency
- Caches API configurations
"""

import asyncio
import re
from typing import Dict, Any, List, Optional, Literal
from dataclasses import dataclass
import httpx

from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


@dataclass
class AIProvider:
    """Configuration for an AI provider."""
    name: str
    base_url: str
    model: str
    api_key: str
    headers: Dict[str, str]


class AIClientService:
    """
    Unified client for querying AI models.
    
    Provides a single interface for:
    - OpenAI (ChatGPT)
    - Anthropic (Claude)
    - Perplexity
    - Google (Gemini) - when available
    """
    
    # Best models for enterprise AEO/GEO
    DEFAULT_MODELS = {
        "openai": "gpt-4o",  # Latest GPT-4 Omni
        "anthropic": "claude-sonnet-4-20250514",  # Claude 3.5 Sonnet
        "perplexity": "llama-3.1-sonar-large-128k-online",  # Pro model
        "gemini": "gemini-2.0-flash"  # Latest Gemini
    }
    
    def __init__(self):
        self.providers: Dict[str, AIProvider] = {}
        self._setup_providers()
        
    def _setup_providers(self):
        """Configure available AI providers based on API keys."""
        
        if settings.OPENAI_API_KEY:
            self.providers["openai"] = AIProvider(
                name="openai",
                base_url="https://api.openai.com/v1/chat/completions",
                model=self.DEFAULT_MODELS["openai"],
                api_key=settings.OPENAI_API_KEY,
                headers={
                    "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                }
            )
        
        if settings.ANTHROPIC_API_KEY:
            self.providers["anthropic"] = AIProvider(
                name="anthropic",
                base_url="https://api.anthropic.com/v1/messages",
                model=self.DEFAULT_MODELS["anthropic"],
                api_key=settings.ANTHROPIC_API_KEY,
                headers={
                    "x-api-key": settings.ANTHROPIC_API_KEY,
                    "Content-Type": "application/json",
                    "anthropic-version": "2023-06-01"
                }
            )
        
        perplexity_key = getattr(settings, 'PERPLEXITY_API_KEY', '')
        if perplexity_key:
            self.providers["perplexity"] = AIProvider(
                name="perplexity",
                base_url="https://api.perplexity.ai/chat/completions",
                model=self.DEFAULT_MODELS["perplexity"],
                api_key=perplexity_key,
                headers={
                    "Authorization": f"Bearer {perplexity_key}",
                    "Content-Type": "application/json"
                }
            )
        
        gemini_key = getattr(settings, 'GEMINI_API_KEY', '')
        if gemini_key:
            self.providers["gemini"] = AIProvider(
                name="gemini",
                base_url="https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
                model=self.DEFAULT_MODELS["gemini"],
                api_key=gemini_key,
                headers={
                    "Content-Type": "application/json"
                }
            )
    
    @property
    def available_providers(self) -> List[str]:
        """List of configured providers."""
        return list(self.providers.keys())
    
    async def query(
        self,
        prompt: str,
        provider: str = "openai",
        model: Optional[str] = None,
        max_tokens: int = 500,
        temperature: float = 0.7,
        timeout: float = 30.0
    ) -> Dict[str, Any]:
        """
        Query a single AI provider.
        
        Args:
            prompt: The query to send
            provider: Which provider to use (openai, anthropic, perplexity)
            model: Override default model
            max_tokens: Response token limit
            temperature: Randomness (0-1)
            timeout: Request timeout in seconds
            
        Returns:
            Dict with content, provider, model, and success status
        """
        if provider not in self.providers:
            return {
                "success": False, 
                "error": f"Provider {provider} not configured",
                "provider": provider
            }
        
        prov = self.providers[provider]
        used_model = model or prov.model
        
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                if provider == "anthropic":
                    payload = {
                        "model": used_model,
                        "max_tokens": max_tokens,
                        "messages": [{"role": "user", "content": prompt}]
                    }
                    url = prov.base_url
                elif provider == "gemini":
                    # Gemini uses different format
                    payload = {
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {
                            "maxOutputTokens": max_tokens,
                            "temperature": temperature
                        }
                    }
                    # Gemini uses query param for API key
                    url = f"{prov.base_url}?key={prov.api_key}"
                else:  # OpenAI and Perplexity share format
                    payload = {
                        "model": used_model,
                        "messages": [{"role": "user", "content": prompt}],
                        "max_tokens": max_tokens,
                        "temperature": temperature
                    }
                    url = prov.base_url
                
                response = await client.post(url, headers=prov.headers, json=payload)
                
                if response.status_code != 200:
                    return {
                        "success": False,
                        "provider": provider,
                        "model": used_model,
                        "error": f"HTTP {response.status_code}: {response.text[:200]}"
                    }
                
                data = response.json()
                content = self._extract_content(data, provider)
                
                result = {
                    "success": True,
                    "provider": provider,
                    "model": used_model,
                    "content": content
                }
                
                # Add citations for Perplexity
                if provider == "perplexity":
                    result["citations"] = data.get("citations", [])
                
                return result
                
        except Exception as e:
            logger.error(f"AI query error ({provider}): {e}")
            return {
                "success": False,
                "provider": provider,
                "model": used_model,
                "error": str(e)
            }
    
    async def query_all(
        self,
        prompt: str,
        max_tokens: int = 500,
        providers: List[str] = None
    ) -> Dict[str, Dict[str, Any]]:
        """
        Query all available providers in parallel.
        
        Args:
            prompt: The query to send
            max_tokens: Response token limit
            providers: Specific providers to query (default: all available)
            
        Returns:
            Dict mapping provider name to response
        """
        target_providers = providers or self.available_providers
        
        tasks = [
            self.query(prompt, provider=p, max_tokens=max_tokens)
            for p in target_providers
            if p in self.providers
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        return {
            r["provider"]: r 
            for r in results 
            if isinstance(r, dict) and r.get("provider")
        }
    
    async def query_batch(
        self,
        prompts: List[str],
        provider: str = "openai",
        max_concurrent: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Query multiple prompts on a single provider with concurrency limit.
        
        Args:
            prompts: List of prompts to send
            provider: Which provider to use
            max_concurrent: Max concurrent requests
            
        Returns:
            List of responses in same order as prompts
        """
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def limited_query(prompt: str) -> Dict[str, Any]:
            async with semaphore:
                return await self.query(prompt, provider=provider)
        
        return await asyncio.gather(*[limited_query(p) for p in prompts])
    
    def _extract_content(self, data: Dict, provider: str) -> str:
        """Extract text content from API response."""
        if provider == "anthropic":
            content = ""
            for block in data.get("content", []):
                if block.get("type") == "text":
                    content += block.get("text", "")
            return content
        elif provider == "gemini":
            # Gemini response format
            candidates = data.get("candidates", [])
            if candidates:
                content = candidates[0].get("content", {})
                parts = content.get("parts", [])
                if parts:
                    return parts[0].get("text", "")
            return ""
        else:  # OpenAI/Perplexity
            return data.get("choices", [{}])[0].get("message", {}).get("content", "")
    
    # ===== Brand Detection Utilities (from firegeo patterns) =====
    
    def detect_brand_mention(
        self,
        text: str,
        brand_name: str,
        domain: str = ""
    ) -> Dict[str, Any]:
        """
        Detect if a brand is mentioned in text.
        
        Args:
            text: Text to search
            brand_name: Brand name to look for
            domain: Optional domain to also check
            
        Returns:
            Dict with mentioned (bool), count, positions, context snippets
        """
        if not text:
            return {"mentioned": False, "count": 0, "positions": [], "snippets": []}
        
        text_lower = text.lower()
        brand_lower = brand_name.lower()
        
        # Find all positions
        positions = []
        start = 0
        while True:
            idx = text_lower.find(brand_lower, start)
            if idx == -1:
                break
            positions.append(idx)
            start = idx + 1
        
        # Also check domain
        if domain:
            domain_clean = domain.lower().replace('https://', '').replace('http://', '').replace('www.', '')
            start = 0
            while True:
                idx = text_lower.find(domain_clean, start)
                if idx == -1:
                    break
                if idx not in positions:
                    positions.append(idx)
                start = idx + 1
        
        # Extract context snippets
        snippets = []
        for pos in positions[:3]:  # Max 3 snippets
            start = max(0, pos - 50)
            end = min(len(text), pos + len(brand_name) + 50)
            snippet = text[start:end].strip()
            if start > 0:
                snippet = "..." + snippet
            if end < len(text):
                snippet = snippet + "..."
            snippets.append(snippet)
        
        return {
            "mentioned": len(positions) > 0,
            "count": len(positions),
            "positions": positions,
            "snippets": snippets
        }
    
    def analyze_sentiment(self, snippets: List[str]) -> str:
        """
        Quick keyword-based sentiment analysis.
        
        Returns: "positive", "negative", or "neutral"
        """
        if not snippets:
            return "neutral"
        
        positive = ['best', 'great', 'excellent', 'top', 'leading', 'innovative', 'trusted', 'recommended', 'popular']
        negative = ['bad', 'poor', 'worst', 'avoid', 'issues', 'problems', 'complaints', 'negative']
        
        text = ' '.join(snippets).lower()
        
        pos_count = sum(1 for word in positive if word in text)
        neg_count = sum(1 for word in negative if word in text)
        
        if pos_count > neg_count + 1:
            return "positive"
        elif neg_count > pos_count + 1:
            return "negative"
        return "neutral"


# Singleton
_ai_client: Optional[AIClientService] = None

def get_ai_client() -> AIClientService:
    """Get singleton instance of AIClientService."""
    global _ai_client
    if _ai_client is None:
        _ai_client = AIClientService()
    return _ai_client
