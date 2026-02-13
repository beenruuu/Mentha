import os
from typing import List, Union

from pydantic_settings import BaseSettings

# Robustly find the .env file (backend/.env) regardless of CWD
# __file__ = backend/app/core/config.py
# dirname = backend/app/core
# dirname = backend/app
# dirname = backend
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ENV_PATH = os.path.join(BASE_DIR, ".env")

class Settings(BaseSettings):
    """Application settings."""

    # Application
    ENVIRONMENT: str = "development"

    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "https://mentha-three.vercel.app",
        "https://mentha.vercel.app"
    ]

    # Supabase
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str

    # LLM
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""

    # Vector Database
    QDRANT_URL: str = ""
    QDRANT_API_KEY: str = ""
    QDRANT_COLLECTION_NAME: str = "default_collection"
    
    # Web Search (optional APIs for future paid services)
    TAVILY_API_KEY: str = ""
    SERPER_API_KEY: str = ""
    SERPAPI_KEY: str = ""
    WEB_SEARCH_ENABLED: bool = True
    WEB_SEARCH_PROVIDER: str = "duckduckgo"  # or "tavily", "serper", etc.
    
    # Google Search Console Integration
    # Removed Google Search Console integration as per pure AEO/GEO directive
    
    # AI Visibility Measurement
    AI_VISIBILITY_ENABLED: bool = True  # Enabled by default - uses available API keys for real visibility measurement
    PERPLEXITY_API_KEY: str = ""  # For Perplexity visibility checks
    GEMINI_API_KEY: str = ""  # For Google Gemini visibility checks
    
    # Advanced Crawling
    FIRECRAWL_API_KEY: str = ""
    FIRECRAWL_API_URL: str = "https://api.firecrawl.dev" # Can be changed for self-hosted
    FIRECRAWL_AGENT_ENABLED: bool = True  # FIRE-1 agent for autonomous data discovery
    FIRECRAWL_AGENT_MAX_PAGES: int = 20  # Max pages agent can visit per request
    
    # Demo mode (set in backend/.env)
    DEMO_MODE: bool = False
    
    # Admin access control - comma-separated list of allowed admin emails
    ADMIN_EMAILS: str = ""
    
    # GDPR / Data Privacy
    ENABLE_PII_REDACTION: bool = True
    
    # Feature Toggles - Analysis Services
    # Core (always enabled)
    FEATURE_AI_VISIBILITY: bool = True  # Core visibility measurement
    FEATURE_INSIGHTS: bool = True  # Dashboard insights
    
    # Advanced (enabled by default)
    FEATURE_HALLUCINATION_DETECTION: bool = True  # AI fabrication detection
    FEATURE_CITATION_TRACKING: bool = True  # Citation monitoring
    FEATURE_SENTIMENT_ANALYSIS: bool = True  # Brand sentiment
    FEATURE_PROMPT_TRACKING: bool = True  # Prompt discovery
    FEATURE_CONTENT_STRUCTURE: bool = True  # FAQ/HowTo analysis
    
    # Optional (disabled by default for performance)
    FEATURE_EEAT_ANALYSIS: bool = False  # E-E-A-T signals
    FEATURE_VISUAL_ASSETS: bool = False  # Image analysis


    # Redis / Celery
    CELERY_BROKER_URL: str = "redis://redis:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/0"

    class Config:
        env_file = ENV_PATH
        case_sensitive = True


# Initialize settings
settings = Settings()

# Parse CORS origins from comma-separated string if provided that way
if isinstance(settings.CORS_ORIGINS, str):
    # Handle potential issues with quotes and spacing
    origins_str = settings.CORS_ORIGINS.strip()
    if origins_str.startswith('"') and origins_str.endswith('"'):
        origins_str = origins_str[1:-1]
    elif origins_str.startswith("'") and origins_str.endswith("'"):
        origins_str = origins_str[1:-1]

    settings.CORS_ORIGINS = [origin.strip() for origin in origins_str.split(",")]
