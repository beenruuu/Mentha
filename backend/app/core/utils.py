"""Core utility functions."""

from datetime import datetime, timezone


def utc_now() -> datetime:
    """Get current UTC datetime (timezone-aware)."""
    return datetime.now(timezone.utc)


def utc_now_iso() -> str:
    """Get current UTC datetime as ISO string with Z suffix."""
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
