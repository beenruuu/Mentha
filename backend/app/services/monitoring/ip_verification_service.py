"""
Bot IP Verification Service - CIDR Range Validation for AI Crawlers.

Verifies that AI bot requests originate from legitimate IP ranges
published by the bot operators (OpenAI, Anthropic, Google, etc.).

This helps detect:
1. Spoofed User-Agents (fake bots from residential IPs)
2. Legitimate bots for accurate analytics
3. Potential security threats

Architecture:
- Redis cache for IP ranges (updated daily via Celery)
- In-memory fallback for development
- Async CIDR matching using ipaddress module

Usage:
    service = get_ip_verification_service()
    
    is_valid = await service.verify_bot_ip(
        bot_name="GPTBot",
        ip_address="52.152.100.50"
    )
"""

import asyncio
import ipaddress
import json
import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Set, Union
import httpx

logger = logging.getLogger(__name__)


# Known IP range sources for AI bots
# These are fetched and cached daily
BOT_IP_SOURCES: Dict[str, Dict[str, Any]] = {
    "GPTBot": {
        "provider": "OpenAI",
        "sources": [
            # OpenAI publishes their IP ranges
            "https://openai.com/gptbot-ranges.txt",
        ],
        # Fallback known ranges (may become outdated)
        "fallback_ranges": [
            "20.15.240.0/24",
            "20.15.241.0/24",
            "20.15.242.0/24",
            "52.152.96.0/24",
            "52.152.97.0/24",
            "52.152.98.0/24",
            "52.152.99.0/24",
            "52.152.100.0/24",
        ]
    },
    "ClaudeBot": {
        "provider": "Anthropic",
        "sources": [],  # Anthropic doesn't publish ranges yet
        "fallback_ranges": []  # Cannot verify
    },
    "GoogleBot": {
        "provider": "Google",
        "sources": [
            "https://developers.google.com/search/apis/ipranges/googlebot.json",
        ],
        "fallback_ranges": []
    },
    "Google-Extended": {
        "provider": "Google",
        "sources": [
            "https://developers.google.com/search/apis/ipranges/googlebot.json",
        ],
        "fallback_ranges": []
    },
    "BingBot": {
        "provider": "Microsoft",
        "sources": [
            "https://www.bing.com/toolbox/bingbot.json",
        ],
        "fallback_ranges": []
    },
    "PerplexityBot": {
        "provider": "Perplexity",
        "sources": [],  # No published ranges
        "fallback_ranges": []
    },
    "CCBot": {
        "provider": "Common Crawl",
        "sources": [],
        "fallback_ranges": []
    },
}


@dataclass
class IPRangeCache:
    """Cached IP ranges for a bot."""
    bot_name: str
    provider: str
    ranges: List[Union[ipaddress.IPv4Network, ipaddress.IPv6Network]]
    last_updated: datetime
    source: str  # "fetched", "fallback", "manual"
    
    def contains(self, ip: str) -> bool:
        """Check if IP is in any of the cached ranges."""
        try:
            ip_obj = ipaddress.ip_address(ip)
            for network in self.ranges:
                if ip_obj in network:
                    return True
            return False
        except ValueError:
            logger.warning(f"Invalid IP address: {ip}")
            return False


class BotIPVerificationService:
    """
    Service for verifying bot IPs against known CIDR ranges.
    
    Features:
    - Async HTTP fetching of IP range files
    - Redis caching with daily refresh
    - In-memory fallback cache
    - CIDR matching using Python's ipaddress module
    """
    
    _instance: Optional["BotIPVerificationService"] = None
    
    def __new__(cls):
        """Singleton pattern."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize service."""
        if hasattr(self, "_initialized") and self._initialized:
            return
        
        self._cache: Dict[str, IPRangeCache] = {}
        self._redis_client = None
        self._http_client: Optional[httpx.AsyncClient] = None
        self._cache_ttl = timedelta(hours=24)
        self._initialized = True
    
    async def _get_http_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._http_client is None:
            self._http_client = httpx.AsyncClient(
                timeout=30.0,
                headers={"User-Agent": "Mentha-IPVerifier/1.0"}
            )
        return self._http_client
    
    async def connect_redis(self, redis_url: str) -> bool:
        """
        Connect to Redis for IP range caching.
        
        Args:
            redis_url: Redis connection URL
        
        Returns:
            True if connected successfully
        """
        try:
            import redis.asyncio as redis
            self._redis_client = redis.from_url(redis_url)
            await self._redis_client.ping()
            logger.info("Connected to Redis for IP verification cache")
            return True
        except Exception as e:
            logger.warning(f"Redis not available for IP cache: {e}")
            return False
    
    async def _fetch_openai_ranges(self, url: str) -> List[str]:
        """Fetch OpenAI GPTBot IP ranges (plain text format)."""
        try:
            client = await self._get_http_client()
            response = await client.get(url)
            
            if response.status_code != 200:
                logger.warning(f"Failed to fetch OpenAI ranges: {response.status_code}")
                return []
            
            # OpenAI format: one CIDR per line
            lines = response.text.strip().split("\n")
            ranges = [line.strip() for line in lines if line.strip() and not line.startswith("#")]
            return ranges
            
        except Exception as e:
            logger.error(f"Error fetching OpenAI ranges: {e}")
            return []
    
    async def _fetch_google_ranges(self, url: str) -> List[str]:
        """Fetch Google bot IP ranges (JSON format)."""
        try:
            client = await self._get_http_client()
            response = await client.get(url)
            
            if response.status_code != 200:
                logger.warning(f"Failed to fetch Google ranges: {response.status_code}")
                return []
            
            # Google format: JSON with prefixes array
            data = response.json()
            ranges = []
            
            for prefix in data.get("prefixes", []):
                if "ipv4Prefix" in prefix:
                    ranges.append(prefix["ipv4Prefix"])
                if "ipv6Prefix" in prefix:
                    ranges.append(prefix["ipv6Prefix"])
            
            return ranges
            
        except Exception as e:
            logger.error(f"Error fetching Google ranges: {e}")
            return []
    
    async def _fetch_bing_ranges(self, url: str) -> List[str]:
        """Fetch Bing bot IP ranges (JSON format)."""
        try:
            client = await self._get_http_client()
            response = await client.get(url)
            
            if response.status_code != 200:
                logger.warning(f"Failed to fetch Bing ranges: {response.status_code}")
                return []
            
            data = response.json()
            ranges = []
            
            for prefix in data.get("prefixes", []):
                if "ipv4Prefix" in prefix:
                    ranges.append(prefix["ipv4Prefix"])
                if "ipv6Prefix" in prefix:
                    ranges.append(prefix["ipv6Prefix"])
            
            return ranges
            
        except Exception as e:
            logger.error(f"Error fetching Bing ranges: {e}")
            return []
    
    async def refresh_bot_ranges(self, bot_name: str) -> Optional[IPRangeCache]:
        """
        Refresh IP ranges for a specific bot.
        
        Args:
            bot_name: Name of the bot to refresh
        
        Returns:
            Updated IPRangeCache or None if failed
        """
        config = BOT_IP_SOURCES.get(bot_name)
        if not config:
            logger.warning(f"No IP source config for bot: {bot_name}")
            return None
        
        ranges_str: List[str] = []
        source = "fallback"
        
        # Try to fetch from sources
        for url in config.get("sources", []):
            if "openai.com" in url:
                ranges_str = await self._fetch_openai_ranges(url)
            elif "google.com" in url:
                ranges_str = await self._fetch_google_ranges(url)
            elif "bing.com" in url:
                ranges_str = await self._fetch_bing_ranges(url)
            else:
                # Generic fetch attempt
                try:
                    client = await self._get_http_client()
                    response = await client.get(url)
                    if response.status_code == 200:
                        ranges_str = response.text.strip().split("\n")
                except Exception:
                    pass
            
            if ranges_str:
                source = "fetched"
                break
        
        # Fall back to hardcoded ranges
        if not ranges_str:
            ranges_str = config.get("fallback_ranges", [])
            source = "fallback"
        
        if not ranges_str:
            logger.info(f"No IP ranges available for {bot_name}")
            return None
        
        # Parse CIDR ranges
        ranges = []
        for cidr in ranges_str:
            try:
                cidr = cidr.strip()
                if cidr:
                    ranges.append(ipaddress.ip_network(cidr, strict=False))
            except ValueError as e:
                logger.warning(f"Invalid CIDR {cidr}: {e}")
        
        if not ranges:
            return None
        
        # Create cache entry
        cache_entry = IPRangeCache(
            bot_name=bot_name,
            provider=config.get("provider", "Unknown"),
            ranges=ranges,
            last_updated=datetime.utcnow(),
            source=source
        )
        
        # Store in memory cache
        self._cache[bot_name] = cache_entry
        
        # Store in Redis if available
        if self._redis_client:
            try:
                key = f"bot_ip_ranges:{bot_name}"
                data = {
                    "bot_name": bot_name,
                    "provider": cache_entry.provider,
                    "ranges": [str(r) for r in ranges],
                    "last_updated": cache_entry.last_updated.isoformat(),
                    "source": source
                }
                await self._redis_client.set(
                    key,
                    json.dumps(data),
                    ex=int(self._cache_ttl.total_seconds())
                )
            except Exception as e:
                logger.warning(f"Failed to cache ranges in Redis: {e}")
        
        logger.info(f"Refreshed {len(ranges)} IP ranges for {bot_name} (source: {source})")
        return cache_entry
    
    async def refresh_all_ranges(self) -> Dict[str, bool]:
        """
        Refresh IP ranges for all known bots.
        
        Returns:
            Dict mapping bot_name to success status
        """
        results = {}
        
        for bot_name in BOT_IP_SOURCES.keys():
            cache = await self.refresh_bot_ranges(bot_name)
            results[bot_name] = cache is not None
        
        return results
    
    async def _load_from_redis(self, bot_name: str) -> Optional[IPRangeCache]:
        """Load cached ranges from Redis."""
        if not self._redis_client:
            return None
        
        try:
            key = f"bot_ip_ranges:{bot_name}"
            data = await self._redis_client.get(key)
            
            if not data:
                return None
            
            parsed = json.loads(data)
            ranges = [ipaddress.ip_network(r, strict=False) for r in parsed.get("ranges", [])]
            
            if not ranges:
                return None
            
            return IPRangeCache(
                bot_name=parsed["bot_name"],
                provider=parsed.get("provider", "Unknown"),
                ranges=ranges,
                last_updated=datetime.fromisoformat(parsed["last_updated"]),
                source=parsed.get("source", "cached")
            )
            
        except Exception as e:
            logger.warning(f"Failed to load from Redis: {e}")
            return None
    
    async def get_bot_ranges(self, bot_name: str) -> Optional[IPRangeCache]:
        """
        Get cached IP ranges for a bot.
        
        Checks in order:
        1. Memory cache
        2. Redis cache
        3. Refresh from source
        
        Args:
            bot_name: Name of the bot
        
        Returns:
            IPRangeCache or None if no ranges available
        """
        # Check memory cache
        if bot_name in self._cache:
            cache = self._cache[bot_name]
            if datetime.utcnow() - cache.last_updated < self._cache_ttl:
                return cache
        
        # Check Redis
        redis_cache = await self._load_from_redis(bot_name)
        if redis_cache:
            self._cache[bot_name] = redis_cache
            return redis_cache
        
        # Refresh from source
        return await self.refresh_bot_ranges(bot_name)
    
    async def verify_bot_ip(self, bot_name: str, ip_address: str) -> Optional[bool]:
        """
        Verify if an IP address belongs to a known bot.
        
        Args:
            bot_name: Name of the bot claiming the request
            ip_address: IP address to verify
        
        Returns:
            True if verified, False if spoofed, None if cannot verify
        """
        cache = await self.get_bot_ranges(bot_name)
        
        if cache is None:
            # Cannot verify - no ranges available for this bot
            return None
        
        return cache.contains(ip_address)
    
    async def identify_bot_by_ip(self, ip_address: str) -> Optional[str]:
        """
        Identify which bot an IP belongs to (if any).
        
        Useful for detecting bots that don't set proper User-Agent.
        
        Args:
            ip_address: IP address to check
        
        Returns:
            Bot name if found, None otherwise
        """
        for bot_name in BOT_IP_SOURCES.keys():
            cache = await self.get_bot_ranges(bot_name)
            if cache and cache.contains(ip_address):
                return bot_name
        
        return None
    
    def get_supported_bots(self) -> List[Dict[str, Any]]:
        """Get list of bots with IP verification support."""
        result = []
        
        for bot_name, config in BOT_IP_SOURCES.items():
            has_sources = bool(config.get("sources"))
            has_fallback = bool(config.get("fallback_ranges"))
            
            result.append({
                "name": bot_name,
                "provider": config.get("provider"),
                "verifiable": has_sources or has_fallback,
                "source_type": "live" if has_sources else ("fallback" if has_fallback else "none")
            })
        
        return result
    
    async def close(self):
        """Clean up resources."""
        if self._http_client:
            await self._http_client.aclose()
            self._http_client = None
        
        if self._redis_client:
            await self._redis_client.close()
            self._redis_client = None


# Singleton instance
_ip_verification_service: Optional[BotIPVerificationService] = None


def get_ip_verification_service() -> BotIPVerificationService:
    """Get singleton instance of BotIPVerificationService."""
    global _ip_verification_service
    if _ip_verification_service is None:
        _ip_verification_service = BotIPVerificationService()
    return _ip_verification_service
