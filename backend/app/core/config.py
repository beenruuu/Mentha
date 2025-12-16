from typing import List, Union

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    # Application
    ENVIRONMENT: str = "development"

    # CORS
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:3000"]

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
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/gsc/callback"
    
    # AI Visibility Measurement
    AI_VISIBILITY_ENABLED: bool = True  # Enabled by default - uses available API keys for real visibility measurement
    PERPLEXITY_API_KEY: str = ""  # Optional: for Perplexity visibility checks
    
    # Advanced Crawling
    FIRECRAWL_API_KEY: str = ""
    FIRECRAWL_API_URL: str = "https://api.firecrawl.dev" # Can be changed for self-hosted
    
    # Demo mode (set in backend/.env)
    DEMO_MODE: bool = False
    
    # Admin access control - comma-separated list of allowed admin emails
    ADMIN_EMAILS: str = ""
    
    # GDPR / Data Privacy
    ENABLE_PII_REDACTION: bool = True

    # Redis / Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    class Config:
        env_file = ".env"
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
