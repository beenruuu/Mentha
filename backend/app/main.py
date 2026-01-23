import warnings

# Suppress noisy deprecation warnings from third-party libraries
warnings.filterwarnings("ignore", category=DeprecationWarning, module="supabase")
warnings.filterwarnings("ignore", category=DeprecationWarning, module="pytrends")
warnings.filterwarnings("ignore", category=FutureWarning, module="pytrends")
warnings.filterwarnings("ignore", category=ResourceWarning)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings

app = FastAPI(
    title="Mentha API",
    description="AI Brand Presence Platform - AEO/GEO Optimization",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
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

# Include API router
app.include_router(api_router, prefix="/api")


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "online", "environment": settings.ENVIRONMENT, "version": "0.1.0"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=settings.ENVIRONMENT == "development")
