"""
Semantic Cache Service - LLM Response Caching for Cost Optimization.

Caches LLM responses based on semantic similarity of prompts, not exact matches.
This dramatically reduces API costs for similar queries.

Example:
- "What is Mentha?" and "Tell me about Mentha" are semantically similar
- If cached, the second query returns the cached response instantly

Architecture:
- Embedding-based similarity using OpenAI text-embedding-3-small
- Redis for fast key-value storage
- Configurable similarity threshold (default 0.95)
- TTL-based cache expiration

Cost Savings:
- GPT-4o: ~$0.01/1K tokens
- Embedding: ~$0.00002/1K tokens (500x cheaper)
- Cache hit: $0 (except Redis storage)

Usage:
    cache = get_semantic_cache_service()
    
    # Check cache before calling LLM
    cached = await cache.get_similar(prompt, threshold=0.95)
    if cached:
        return cached.response
    
    # Call LLM and cache result
    response = await llm.generate(prompt)
    await cache.set(prompt, response, ttl_hours=24)
"""

import asyncio
import hashlib
import json
import logging
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple
import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class CacheEntry:
    """A single cache entry with metadata."""
    prompt: str
    prompt_hash: str
    embedding: List[float]
    response: str
    model: str
    provider: str
    created_at: datetime
    expires_at: datetime
    hit_count: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "prompt": self.prompt,
            "prompt_hash": self.prompt_hash,
            "embedding": self.embedding,
            "response": self.response,
            "model": self.model,
            "provider": self.provider,
            "created_at": self.created_at.isoformat(),
            "expires_at": self.expires_at.isoformat(),
            "hit_count": self.hit_count,
            "metadata": self.metadata
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "CacheEntry":
        return cls(
            prompt=data["prompt"],
            prompt_hash=data["prompt_hash"],
            embedding=data["embedding"],
            response=data["response"],
            model=data.get("model", "unknown"),
            provider=data.get("provider", "unknown"),
            created_at=datetime.fromisoformat(data["created_at"]),
            expires_at=datetime.fromisoformat(data["expires_at"]),
            hit_count=data.get("hit_count", 0),
            metadata=data.get("metadata", {})
        )
    
    def is_expired(self) -> bool:
        return datetime.utcnow() > self.expires_at


@dataclass
class CacheStats:
    """Cache performance statistics."""
    total_requests: int = 0
    cache_hits: int = 0
    cache_misses: int = 0
    total_entries: int = 0
    total_tokens_saved: int = 0
    estimated_cost_saved: float = 0.0
    
    @property
    def hit_rate(self) -> float:
        if self.total_requests == 0:
            return 0.0
        return self.cache_hits / self.total_requests
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_requests": self.total_requests,
            "cache_hits": self.cache_hits,
            "cache_misses": self.cache_misses,
            "hit_rate": round(self.hit_rate, 3),
            "total_entries": self.total_entries,
            "total_tokens_saved": self.total_tokens_saved,
            "estimated_cost_saved_usd": round(self.estimated_cost_saved, 4)
        }


class SemanticCacheService:
    """
    Semantic cache for LLM responses using embedding similarity.
    
    Features:
    - Cosine similarity matching for semantically similar prompts
    - Redis backend for persistence
    - In-memory fallback for development
    - Automatic cache invalidation via TTL
    - Cost tracking and statistics
    
    Threshold Guide:
    - 0.99: Nearly identical prompts only
    - 0.95: Very similar prompts (recommended)
    - 0.90: Moderately similar prompts
    - 0.85: Loosely similar prompts (risky)
    """
    
    _instance: Optional["SemanticCacheService"] = None
    
    def __new__(cls):
        """Singleton pattern."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize service."""
        if hasattr(self, "_initialized") and self._initialized:
            return
        
        self._redis_client = None
        self._memory_cache: Dict[str, CacheEntry] = {}
        self._embedding_model = "text-embedding-3-small"
        self._embedding_dimensions = 1536
        self._default_threshold = 0.95
        self._default_ttl_hours = 24
        self._stats = CacheStats()
        self._openai_client = None
        self._initialized = True
    
    async def connect_redis(self, redis_url: str) -> bool:
        """Connect to Redis for cache storage."""
        try:
            import redis.asyncio as redis
            self._redis_client = redis.from_url(redis_url)
            await self._redis_client.ping()
            logger.info("Connected to Redis for semantic cache")
            return True
        except Exception as e:
            logger.warning(f"Redis not available for semantic cache: {e}")
            return False
    
    def _get_openai_client(self):
        """Get or create OpenAI client for embeddings."""
        if self._openai_client is None:
            try:
                from openai import AsyncOpenAI
                from app.core.config import settings
                self._openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI client: {e}")
                return None
        return self._openai_client
    
    async def _get_embedding(self, text: str) -> Optional[List[float]]:
        """
        Get embedding vector for text using OpenAI.
        
        Uses text-embedding-3-small for cost efficiency:
        - ~$0.00002 per 1K tokens
        - 1536 dimensions
        """
        client = self._get_openai_client()
        if not client:
            return None
        
        try:
            response = await client.embeddings.create(
                model=self._embedding_model,
                input=text,
                dimensions=self._embedding_dimensions
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Failed to get embedding: {e}")
            return None
    
    def _cosine_similarity(self, a: List[float], b: List[float]) -> float:
        """Calculate cosine similarity between two vectors."""
        a_np = np.array(a)
        b_np = np.array(b)
        
        dot_product = np.dot(a_np, b_np)
        norm_a = np.linalg.norm(a_np)
        norm_b = np.linalg.norm(b_np)
        
        if norm_a == 0 or norm_b == 0:
            return 0.0
        
        return float(dot_product / (norm_a * norm_b))
    
    def _hash_prompt(self, prompt: str) -> str:
        """Create a hash of the prompt for exact matching."""
        return hashlib.sha256(prompt.lower().strip().encode()).hexdigest()[:32]
    
    def _estimate_tokens(self, text: str) -> int:
        """Rough estimate of token count (4 chars per token)."""
        return len(text) // 4
    
    async def get_exact(self, prompt: str) -> Optional[CacheEntry]:
        """
        Get cache entry by exact prompt match.
        
        Fast path - no embedding needed.
        """
        prompt_hash = self._hash_prompt(prompt)
        
        # Check Redis first
        if self._redis_client:
            try:
                key = f"semantic_cache:exact:{prompt_hash}"
                data = await self._redis_client.get(key)
                if data:
                    entry = CacheEntry.from_dict(json.loads(data))
                    if not entry.is_expired():
                        entry.hit_count += 1
                        self._stats.cache_hits += 1
                        return entry
            except Exception as e:
                logger.debug(f"Redis exact cache miss: {e}")
        
        # Check memory cache
        if prompt_hash in self._memory_cache:
            entry = self._memory_cache[prompt_hash]
            if not entry.is_expired():
                entry.hit_count += 1
                self._stats.cache_hits += 1
                return entry
            else:
                del self._memory_cache[prompt_hash]
        
        return None
    
    async def get_similar(
        self,
        prompt: str,
        threshold: Optional[float] = None,
        provider: Optional[str] = None,
        model: Optional[str] = None
    ) -> Optional[Tuple[CacheEntry, float]]:
        """
        Find semantically similar cached response.
        
        Args:
            prompt: The prompt to search for
            threshold: Minimum similarity (default 0.95)
            provider: Filter by provider (openai, anthropic, etc.)
            model: Filter by model name
        
        Returns:
            Tuple of (CacheEntry, similarity_score) or None if no match
        """
        self._stats.total_requests += 1
        threshold = threshold or self._default_threshold
        
        # Try exact match first (fast path)
        exact = await self.get_exact(prompt)
        if exact:
            tokens_saved = self._estimate_tokens(exact.response)
            self._stats.total_tokens_saved += tokens_saved
            self._stats.estimated_cost_saved += tokens_saved * 0.00001  # GPT-4o rough cost
            return (exact, 1.0)
        
        # Get embedding for semantic search
        prompt_embedding = await self._get_embedding(prompt)
        if not prompt_embedding:
            self._stats.cache_misses += 1
            return None
        
        best_match: Optional[CacheEntry] = None
        best_similarity = 0.0
        
        # Search Redis
        if self._redis_client:
            try:
                # Get all semantic cache keys
                keys = await self._redis_client.keys("semantic_cache:semantic:*")
                
                for key in keys:
                    try:
                        data = await self._redis_client.get(key)
                        if not data:
                            continue
                        
                        entry = CacheEntry.from_dict(json.loads(data))
                        
                        # Skip expired entries
                        if entry.is_expired():
                            await self._redis_client.delete(key)
                            continue
                        
                        # Filter by provider/model if specified
                        if provider and entry.provider != provider:
                            continue
                        if model and entry.model != model:
                            continue
                        
                        # Calculate similarity
                        similarity = self._cosine_similarity(prompt_embedding, entry.embedding)
                        
                        if similarity >= threshold and similarity > best_similarity:
                            best_similarity = similarity
                            best_match = entry
                    
                    except Exception as e:
                        logger.debug(f"Error processing cache entry: {e}")
                        continue
                
            except Exception as e:
                logger.warning(f"Redis semantic search failed: {e}")
        
        # Search memory cache
        for entry in list(self._memory_cache.values()):
            if entry.is_expired():
                del self._memory_cache[entry.prompt_hash]
                continue
            
            if provider and entry.provider != provider:
                continue
            if model and entry.model != model:
                continue
            
            similarity = self._cosine_similarity(prompt_embedding, entry.embedding)
            
            if similarity >= threshold and similarity > best_similarity:
                best_similarity = similarity
                best_match = entry
        
        if best_match:
            best_match.hit_count += 1
            self._stats.cache_hits += 1
            tokens_saved = self._estimate_tokens(best_match.response)
            self._stats.total_tokens_saved += tokens_saved
            self._stats.estimated_cost_saved += tokens_saved * 0.00001
            
            logger.debug(f"Semantic cache hit: similarity={best_similarity:.3f}")
            return (best_match, best_similarity)
        
        self._stats.cache_misses += 1
        return None
    
    async def set(
        self,
        prompt: str,
        response: str,
        provider: str = "openai",
        model: str = "gpt-4o",
        ttl_hours: Optional[float] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Cache a prompt-response pair.
        
        Args:
            prompt: The original prompt
            response: The LLM response
            provider: Provider name (openai, anthropic, etc.)
            model: Model name
            ttl_hours: Time to live in hours
            metadata: Additional metadata to store
        
        Returns:
            True if cached successfully
        """
        ttl_hours = ttl_hours or self._default_ttl_hours
        
        # Get embedding for semantic matching
        embedding = await self._get_embedding(prompt)
        if not embedding:
            logger.warning("Failed to get embedding for cache entry")
            return False
        
        prompt_hash = self._hash_prompt(prompt)
        now = datetime.utcnow()
        
        entry = CacheEntry(
            prompt=prompt,
            prompt_hash=prompt_hash,
            embedding=embedding,
            response=response,
            model=model,
            provider=provider,
            created_at=now,
            expires_at=now + timedelta(hours=ttl_hours),
            hit_count=0,
            metadata=metadata or {}
        )
        
        # Store in memory cache
        self._memory_cache[prompt_hash] = entry
        self._stats.total_entries = len(self._memory_cache)
        
        # Store in Redis
        if self._redis_client:
            try:
                ttl_seconds = int(ttl_hours * 3600)
                
                # Exact match key
                exact_key = f"semantic_cache:exact:{prompt_hash}"
                await self._redis_client.set(
                    exact_key,
                    json.dumps(entry.to_dict()),
                    ex=ttl_seconds
                )
                
                # Semantic search key (includes embedding)
                semantic_key = f"semantic_cache:semantic:{prompt_hash}"
                await self._redis_client.set(
                    semantic_key,
                    json.dumps(entry.to_dict()),
                    ex=ttl_seconds
                )
                
            except Exception as e:
                logger.warning(f"Failed to store in Redis: {e}")
        
        return True
    
    async def invalidate(self, prompt: str) -> bool:
        """
        Invalidate a cached entry.
        
        Args:
            prompt: The prompt to invalidate
        
        Returns:
            True if entry was found and removed
        """
        prompt_hash = self._hash_prompt(prompt)
        found = False
        
        # Remove from memory
        if prompt_hash in self._memory_cache:
            del self._memory_cache[prompt_hash]
            found = True
        
        # Remove from Redis
        if self._redis_client:
            try:
                exact_key = f"semantic_cache:exact:{prompt_hash}"
                semantic_key = f"semantic_cache:semantic:{prompt_hash}"
                
                await self._redis_client.delete(exact_key, semantic_key)
                found = True
            except Exception as e:
                logger.warning(f"Failed to invalidate in Redis: {e}")
        
        return found
    
    async def invalidate_by_pattern(self, pattern: str) -> int:
        """
        Invalidate all entries matching a pattern.
        
        Args:
            pattern: Substring to match in prompts
        
        Returns:
            Number of entries invalidated
        """
        count = 0
        pattern_lower = pattern.lower()
        
        # Remove from memory cache
        to_remove = []
        for hash_key, entry in self._memory_cache.items():
            if pattern_lower in entry.prompt.lower():
                to_remove.append(hash_key)
        
        for hash_key in to_remove:
            del self._memory_cache[hash_key]
            count += 1
        
        # Remove from Redis
        if self._redis_client:
            try:
                keys = await self._redis_client.keys("semantic_cache:*")
                for key in keys:
                    try:
                        data = await self._redis_client.get(key)
                        if data:
                            entry = json.loads(data)
                            if pattern_lower in entry.get("prompt", "").lower():
                                await self._redis_client.delete(key)
                                count += 1
                    except Exception:
                        continue
            except Exception as e:
                logger.warning(f"Failed to invalidate pattern in Redis: {e}")
        
        return count
    
    async def clear(self) -> int:
        """
        Clear all cache entries.
        
        Returns:
            Number of entries cleared
        """
        count = len(self._memory_cache)
        self._memory_cache.clear()
        
        if self._redis_client:
            try:
                keys = await self._redis_client.keys("semantic_cache:*")
                if keys:
                    await self._redis_client.delete(*keys)
                    count = len(keys) // 2  # Divided by 2 because exact + semantic
            except Exception as e:
                logger.warning(f"Failed to clear Redis cache: {e}")
        
        self._stats = CacheStats()
        return count
    
    def get_stats(self) -> CacheStats:
        """Get cache statistics."""
        self._stats.total_entries = len(self._memory_cache)
        return self._stats
    
    async def close(self):
        """Clean up resources."""
        if self._redis_client:
            await self._redis_client.close()
            self._redis_client = None


# Singleton instance
_semantic_cache_service: Optional[SemanticCacheService] = None


def get_semantic_cache_service() -> SemanticCacheService:
    """Get singleton instance of SemanticCacheService."""
    global _semantic_cache_service
    if _semantic_cache_service is None:
        _semantic_cache_service = SemanticCacheService()
    return _semantic_cache_service
