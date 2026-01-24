import warnings

# Suppress noisy deprecation warnings from third-party libraries
warnings.filterwarnings("ignore", category=DeprecationWarning, module="supabase")
warnings.filterwarnings("ignore", category=DeprecationWarning, module="pytrends")
warnings.filterwarnings("ignore", category=FutureWarning, module="pytrends")
warnings.filterwarnings("ignore", category=ResourceWarning)

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.middleware.ai_content_negotiation import AIContentNegotiationMiddleware
from app.middleware.agent_analytics import (
    AgentAnalyticsMiddleware,
    set_agent_analytics_middleware
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup/shutdown events."""
    # Startup
    # Initialize services that need async setup
    # (Redis connections, etc. can be initialized here)
    yield
    # Shutdown
    # Cleanup resources
    from app.middleware.agent_analytics import get_agent_analytics_middleware
    middleware = get_agent_analytics_middleware()
    if middleware:
        await middleware.shutdown()


app = FastAPI(
    title="Mentha API",
    description="AI Brand Presence Platform - AEO/GEO Optimization",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)


# Set up CORS - Expanded configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", *settings.CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With", "X-CSRF-Token"],
    expose_headers=["Content-Type", "Authorization"],
    max_age=600,  # 10 minutes cache for preflight requests
)

# Agent Analytics Middleware - Tracks AI crawler visits server-side
# Captures GPTBot, ClaudeBot, PerplexityBot, etc. that don't execute JavaScript
_agent_middleware = AgentAnalyticsMiddleware(
    app.router,
    enabled=True,
    log_all_requests=False,
    excluded_paths=["/health", "/docs", "/redoc", "/openapi.json", "/_next/", "/static/"],
    buffer_size=100,
    flush_interval=5.0
)
app.add_middleware(AgentAnalyticsMiddleware)
set_agent_analytics_middleware(_agent_middleware)

# AI Content Negotiation Middleware - Serves Markdown to AI bots (GPTBot, ClaudeBot, etc.)
# This enables "Markdown Twins" pattern for GEO optimization
app.add_middleware(
    AIContentNegotiationMiddleware,
    enabled_paths=["/"],
    disabled_paths=["/api/", "/docs", "/redoc", "/openapi.json"],
)

# Include API router
app.include_router(api_router, prefix="/api")


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "online", "environment": settings.ENVIRONMENT, "version": "0.1.0"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=settings.ENVIRONMENT == "development")
