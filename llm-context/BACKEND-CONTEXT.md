# Backend Documentation

This document provides an overview of the backend API architecture, services, and endpoints.

## Architecture Overview

The backend is built using FastAPI, a modern, high-performance web framework for building APIs with Python. It integrates with Supabase for authentication, database, and storage services, provides multi-LLM support (OpenAI, Anthropic, Google), and includes vector database functionality with Qdrant.

### Tech Stack
- **FastAPI**: Fast API development with automatic OpenAPI documentation
- **Supabase**: For authentication, database, and storage
- **LLM Integration**: OpenAI, Anthropic Claude, Google Gemini, Perplexity
- **Vector Database**: Qdrant for vector search and storage
- **Task Queue**: Celery for background processing

## Module Structure

```
backend/
├── app/
│   ├── api/                  # API endpoints
│   │   ├── endpoints/        # API route handlers
│   │   │   ├── auth.py       # Authentication endpoints
│   │   │   ├── brands.py     # Brand management
│   │   │   ├── analysis.py   # Analysis endpoints
│   │   │   ├── competitors.py # Competitor discovery
│   │   │   ├── keywords.py   # Keyword tracking
│   │   │   ├── citations.py  # Citation tracking
│   │   │   ├── llm.py        # LLM service endpoints
│   │   │   └── vectordb.py   # Vector database endpoints
│   │   └── router.py         # API router configuration
│   ├── core/                 # Core application code
│   │   ├── config.py         # Application configuration
│   │   └── celery_app.py     # Celery configuration
│   ├── models/               # Data models
│   │   ├── auth.py           # Authentication models
│   │   ├── brand.py          # Brand models
│   │   ├── analysis.py       # Analysis models
│   │   └── llm.py            # LLM service models
│   ├── services/             # Service layer
│   │   ├── analysis/         # Analysis services
│   │   │   ├── analysis_service.py      # Main analysis orchestrator
│   │   │   ├── ai_visibility_service.py # AI visibility tracking
│   │   │   └── citation_service.py      # Citation tracking
│   │   ├── llm/              # LLM services
│   │   │   ├── openrouter_service.py    # Multi-LLM support
│   │   │   └── embedding_service.py     # Embedding service
│   │   ├── search/           # Search services
│   │   │   └── web_search_service.py    # Web search (DuckDuckGo)
│   │   ├── supabase/         # Supabase services
│   │   │   ├── auth.py       # Authentication service
│   │   │   └── database.py   # Database service
│   │   └── vectordb/         # Vector database services
│   │       └── qdrant_service.py        # Qdrant service
│   └── main.py               # Application entry point
├── Dockerfile                # Production Docker configuration
├── Dockerfile.dev            # Development Docker configuration
└── requirements.txt          # Python dependencies
```

## Key API Endpoints

### Authentication
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/provider-token` - Exchange provider token

### Brands
- `GET /api/brands` - List user brands
- `POST /api/brands` - Create new brand
- `PUT /api/brands/{brand_id}` - Update brand
- `DELETE /api/brands/{brand_id}` - Delete brand

### Analysis
- `POST /api/analysis/trigger/{brand_id}` - Trigger full analysis
- `GET /api/analysis/{brand_id}/results` - Get analysis results

### Competitors
- `POST /api/competitors/discover` - Discover competitors (LLM + Web Search)
- `GET /api/competitors/{brand_id}` - List brand competitors
- `POST /api/competitors` - Add competitor manually

### Keywords
- `GET /api/keywords/{brand_id}` - List tracked keywords
- `POST /api/keywords` - Add keyword to track
- `GET /api/keywords/{keyword_id}/rankings` - Get keyword rankings

### Utilities
- `POST /api/utils/generate-research-prompts` - Generate AI research prompts
- `POST /api/utils/analyze-website` - Analyze website content

## Services

### Analysis Services
- **AnalysisService**: Orchestrates full brand analysis
- **AIVisibilityService**: Tracks brand visibility across AI models
- **CitationTrackingService**: Monitors brand citations and sources
- **TechnicalAEOService**: Performs technical AEO audits

### LLM Services
- **OpenRouterService**: Multi-provider LLM abstraction (GPT-4, Claude, Gemini)
- **EmbeddingService**: Vector embeddings for semantic search

### Search Services
- **WebSearchService**: DuckDuckGo-based web search for competitor discovery
- **KeywordMetricsService**: Keyword metrics via Google Trends

## Configuration

Environment variables are managed through `app.core.config` using Pydantic settings.

Required environment variables:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_KEY` - Supabase service key
- `OPENAI_API_KEY` - OpenAI API key
- `ANTHROPIC_API_KEY` - Anthropic API key (optional)
- `GOOGLE_API_KEY` - Google Gemini API key (optional)
- `QDRANT_URL` - Qdrant vector database URL (optional)
- `QDRANT_API_KEY` - Qdrant API key (optional)
- `ENVIRONMENT` - Application environment (development, production)
- `CORS_ORIGINS` - Allowed CORS origins

## Docker Setup

- **Development**: Uses hot-reloading for faster development
- **Production**: Optimized for performance with health checks