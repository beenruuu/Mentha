# 🏗️ Mentha - Architecture Guide

## Overview

Mentha is a **monorepo** containing a full-stack application for AI Brand Presence monitoring and optimization (AEO/GEO).

```
┌─────────────────────────────────────────────────────────────┐
│                         MENTHA                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │   FRONTEND   │  HTTP   │   BACKEND    │                  │
│  │   Next.js    │◄───────►│   FastAPI    │                  │
│  │   :3000      │         │   :8000      │                  │
│  └──────────────┘         └──────────────┘                  │
│         │                        │                           │
│         ▼                        ▼                           │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │   Supabase   │         │   AI APIs    │                  │
│  │   (Auth/DB)  │         │ OpenAI/Claude│                  │
│  └──────────────┘         └──────────────┘                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
mentha/
├── backend/                 # Python/FastAPI Backend
│   ├── app/
│   │   ├── api/            # REST API endpoints
│   │   │   ├── endpoints/  # Individual route handlers
│   │   │   └── router.py   # API router aggregation
│   │   ├── core/           # Configuration & utilities
│   │   │   ├── config.py   # Environment settings
│   │   │   └── celery_app.py
│   │   ├── models/         # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   │   ├── llm/        # AI provider integrations
│   │   │   ├── analysis/   # Brand analysis services
│   │   │   └── scrapers/   # Web crawling
│   │   └── tasks/          # Background/async tasks
│   ├── scripts/            # Backend utility scripts
│   └── requirements.txt    # Python dependencies
│
├── frontend/               # Next.js 15 Frontend
│   ├── app/               # App Router (pages)
│   │   ├── (auth)/        # Auth pages
│   │   ├── brand/[id]/    # Brand detail pages
│   │   ├── dashboard/     # Main dashboard
│   │   └── api/           # API routes (server)
│   ├── components/        # React components
│   │   ├── ui/            # Shadcn UI primitives
│   │   └── [feature]/     # Feature-specific components
│   ├── features/          # Feature modules
│   ├── hooks/             # Custom React hooks
│   └── lib/               # Utilities & services
│       ├── api-client.ts  # API client
│       ├── stores/        # Zustand stores
│       └── supabase/      # Supabase client
│
├── supabase/              # Database
│   ├── schema.sql         # Main schema
│   └── migrations/        # SQL migrations
│
├── scripts/               # Development scripts
├── docs/                  # Documentation
│
├── docker-compose.yml     # Development containers
├── docker-compose.prod.yml
├── Makefile              # Development commands
├── setup.py              # Environment setup wizard
└── start.py              # Unified startup script
```

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 15 | React framework with App Router |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Shadcn UI | Component library |
| Zustand | State management |
| TanStack Query | Server state |
| Supabase | Auth & realtime |

### Backend
| Technology | Purpose |
|------------|---------|
| FastAPI | REST API framework |
| Pydantic | Data validation |
| Celery | Background tasks |
| Redis | Task queue & cache |
| Supabase | PostgreSQL database |
| Qdrant | Vector embeddings (optional) |

### AI Providers
- **OpenAI** (GPT-4) - Primary analysis
- **Anthropic** (Claude) - Analysis & insights
- **Google** (Gemini) - Visibility checks
- **Perplexity** - Search-based analysis

## Key Concepts

### 1. AI Visibility Score
Measures how prominently your brand appears when users query AI models about your industry/products.

### 2. Hallucination Detection
Identifies when AI models provide incorrect information about your brand.

### 3. Citation Tracking
Monitors which of your content is being cited by AI systems.

### 4. Share of Voice
Compares your brand visibility against competitors across AI platforms.

## Data Flow

```
User Request
     │
     ▼
┌──────────┐    ┌──────────┐    ┌──────────┐
│ Frontend │───►│  Backend │───►│ AI APIs  │
│ (Next.js)│    │ (FastAPI)│    │ LLM/Web  │
└──────────┘    └──────────┘    └──────────┘
     │               │
     │               ▼
     │         ┌──────────┐
     └────────►│ Supabase │
               │ (DB/Auth)│
               └──────────┘
```

## Configuration

### Environment Variables

All configuration is environment-based:

| File | Purpose |
|------|---------|
| `backend/.env` | Backend configuration |
| `frontend/.env.local` | Frontend configuration |

See `.env.example` and `.env.local.example` for templates.

### Required Services
1. **Supabase** - Database and authentication
2. **At least one AI provider** - OpenAI, Anthropic, etc.

### Optional Services
- **Stripe** - Payment processing
- **Qdrant** - Vector embeddings for semantic search
- **Redis** - Required only for Docker/Celery workers

## Development Modes

### Local Development (Recommended)
```bash
python start.py
```
Runs both frontend and backend locally.

### Docker Development
```bash
make dev
# or
docker-compose up
```

### Production
```bash
make prod
# or
docker-compose -f docker-compose.prod.yml up -d
```
