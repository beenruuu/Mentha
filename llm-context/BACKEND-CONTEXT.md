# Backend Documentation

This document provides an overview of the backend API architecture, services, and endpoints.

## Architecture Overview

The backend is built using FastAPI, a modern, high-performance web framework for building APIs with Python. It integrates with Supabase for authentication, database, and storage services, provides an abstraction layer for LLM services (OpenAI and Anthropic), and includes vector database functionality with Qdrant.

### Tech Stack
- **FastAPI**: Fast API development with automatic OpenAPI documentation
- **Supabase**: For authentication, database, and storage
- **LLM Integration**: OpenAI and Anthropic API integrations
- **Vector Database**: Qdrant for vector search and storage

## Module Structure

```
backend/
├── app/
│   ├── api/                  # API endpoints
│   │   ├── endpoints/        # API route handlers
│   │   │   ├── auth.py       # Authentication endpoints
│   │   │   ├── llm.py        # LLM service endpoints
│   │   │   └── vectordb.py   # Vector database endpoints
│   │   └── router.py         # API router configuration
│   ├── core/                 # Core application code
│   │   ├── config.py         # Application configuration
│   ├── models/               # Data models
│   │   ├── auth.py           # Authentication models
│   │   ├── llm.py            # LLM service models
│   │   └── vectordb.py       # Vector database models
│   ├── services/             # Service layer
│   │   ├── llm/              # LLM services
│   │   │   ├── llm_service.py      # Text generation service
│   │   │   └── embedding_service.py # Embedding service
│   │   ├── supabase/         # Supabase services
│   │   │   ├── auth.py       # Authentication service
│   │   │   ├── database.py   # Database service
│   │   │   └── storage.py    # Storage service
│   │   └── vectordb/         # Vector database services
│   │       └── qdrant_service.py # Qdrant service
│   └── main.py               # Application entry point
├── Dockerfile                # Production Docker configuration
├── Dockerfile.dev            # Development Docker configuration
├── Makefile                  # Commands for development
└── requirements.txt          # Python dependencies
```

## API Endpoints

### Authentication

- **GET /api/auth/me**: Get the current user profile
  - Requires: Bearer token authentication
  - Returns: User profile information

- **POST /api/auth/provider-token**: Exchange a provider token for a Supabase token
  - Requires: Provider name (google, linkedin) and token
  - Returns: Access token for authenticated API calls

### LLM Services

- **POST /api/llm/generate**: Generate text using an LLM
  - Requires: Bearer token authentication, prompt, and optional model parameters
  - Returns: Generated text and usage statistics

- **POST /api/llm/embedding**: Create an embedding vector for text
  - Requires: Bearer token authentication, text to embed, and optional model parameters
  - Returns: Embedding vector and usage statistics

### Vector Database

- **POST /api/vectordb/documents**: Add documents to the vector database
  - Requires: Bearer token authentication, documents with text content
  - Returns: Document IDs for the added documents

- **POST /api/vectordb/search**: Search for similar documents
  - Requires: Bearer token authentication, query text
  - Returns: Matching documents with similarity scores

- **DELETE /api/vectordb/documents**: Delete documents from the vector database
  - Requires: Bearer token authentication, document IDs
  - Returns: No content on success

## Services

### Supabase Services

#### Authentication Service
The SupabaseAuthService handles user authentication using Supabase Auth. It supports:
- Google and LinkedIn OAuth authentication
- JWT token validation and exchange

#### Database Service
The SupabaseDatabaseService provides generic CRUD operations with type safety:
- List records with filtering
- Get a single record by ID
- Create, update, and delete records

#### Storage Service
The SupabaseStorageService provides a high-level interface to Supabase Storage:
- Upload files
- Get public URLs for files
- Delete files
- List files in a directory

### LLM Services

#### LLM Service
Abstraction layer for text generation with multiple providers:
- OpenAI GPT models
- Anthropic Claude models
- Factory pattern for provider selection

#### Embedding Service
Abstraction layer for creating vector embeddings:
- OpenAI embeddings
- Placeholder for Anthropic embeddings (when available)
- Factory pattern for provider selection

### Vector Database Service

#### Qdrant Service
Vector database service for semantic search:
- Document storage with metadata
- Semantic search based on vector embeddings
- Filtering capabilities for metadata
- Document deletion and collection management

## Configuration

Environment variables are managed through the `app.core.config` module using Pydantic settings.

Required environment variables:
- `SUPABASE_URL`: URL of your Supabase project
- `SUPABASE_SERVICE_KEY`: Service key for Supabase project
- `OPENAI_API_KEY`: OpenAI API key (optional if not using OpenAI)
- `ANTHROPIC_API_KEY`: Anthropic API key (optional if not using Anthropic)
- `QDRANT_URL`: URL of your Qdrant vector database (optional for local testing)
- `QDRANT_API_KEY`: API key for Qdrant (optional for local testing)
- `ENVIRONMENT`: Application environment (development, production)
- `CORS_ORIGINS`: Comma-separated list of allowed CORS origins

## Docker Setup

- **Development**: Uses hot-reloading for faster development
- **Production**: Optimized for performance and security