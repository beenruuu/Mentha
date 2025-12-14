"""
Async utilities for running async code in sync contexts.
Primarily used by Celery workers which require synchronous task functions.
"""
import asyncio
from typing import TypeVar, Coroutine, Any

T = TypeVar('T')


def async_to_sync(awaitable: Coroutine[Any, Any, T]) -> T:
    """
    Run an async function in a sync context.
    
    Handles the case where we may or may not already have an event loop running.
    Used primarily in Celery tasks which are synchronous but need to call async code.
    
    Args:
        awaitable: The coroutine to execute
        
    Returns:
        The result of the coroutine
    """
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    if loop.is_running():
        # If running (e.g. uvicorn), create task (fire & forget)
        return loop.create_task(awaitable)
    else:
        return loop.run_until_complete(awaitable)
