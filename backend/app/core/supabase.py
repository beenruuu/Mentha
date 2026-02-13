"""
Supabase Client Singleton

Provides a single, reusable Supabase client instance to avoid
creating new connections on every request.

Usage:
    from app.core.supabase import get_supabase_client
    
    client = get_supabase_client()
    result = client.table("brands").select("*").execute()
"""

from functools import lru_cache
from supabase import create_client, Client
from app.core.config import settings


@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    """
    Get a cached Supabase client instance.
    
    Uses lru_cache to ensure only one client is created per process.
    This is more efficient than creating a new client on every request.
    
    Returns:
        Client: Supabase client instance
    """
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)


def get_fresh_client() -> Client:
    """
    Get a fresh Supabase client instance (not cached).
    
    Use this only when you need a completely new connection,
    such as after a credential refresh.
    
    Returns:
        Client: New Supabase client instance
    """
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)


# Convenience alias
supabase = get_supabase_client()
