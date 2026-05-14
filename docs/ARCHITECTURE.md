# Mentha Architecture Guide

Complete system design overview of the open-source Answer Engine Optimization (AEO) platform.

---

## System Overview

Mentha is a monorepo application that monitors brand visibility across AI answer engines (ChatGPT, Perplexity, Gemini, Claude) using real browser automation and LLM-as-Judge evaluation.

```
┌─────────────────────────────────────────────────────┐
│                    Users                            │
└──────────┬──────────┬──────────┬────────────────────┘
           │          │          │
     ┌─────▼──┐ ┌────▼───┐ ┌───▼────┐
     │  Web   │ │  CLI   │ │  MCP   │
     │ (Next) │ │(Commdr)│ │(Protocol)
     └────┬───┘ └────┬───┘ └───┬────┘
          └──────────┼──────────┘
                     │
              ┌──────▼──────┐
              │   Hono API  │
              │  (Backend)  │
              └──────┬──────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
   ┌─────▼────┐ ┌───▼────┐ ┌───▼──────┐
   │  PGlite  │ │ Redis  │ │BullMQ    │
   │(Postgres)│ │(Cache) │ │(Queues)  │
   └──────────┘ └────────┘ └───┬──────┘
                               │
                    ┌──────────┴──────────┐
                    │     Workers         │
                    │  (Scraper/Analysis) │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Camoufox/Playwright│
                    │  (Browser Automation)│
                    └──────────┬──────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
   ┌─────▼──────┐    ┌────────▼──────┐    ┌─────────▼──┐
   │  ChatGPT   │    │  Perplexity   │    │   Gemini   │
   │(chatgpt.com)│   │(perplexity.ai)│    │(gemini.com)│
   └────────────┘    └───────────────┘    └────────────┘
         ┌─────────────────────┐
         │      Claude        │
         │   (claude.ai)      │
         └────────────────────┘
```

---

## Frontend Architecture

### Next.js 14 App Router

```
apps/web/
├── app/
│   ├── page.tsx              # Landing page (public)
│   ├── onboarding/page.tsx   # Onboarding wizard (4 steps)
│   └── (platform)/           # Authenticated section
│       ├── layout.tsx        # Sidebar + header + auth guard
│       ├── dashboard/        # Main dashboard with widgets
│       ├── optimization/     # AEO optimization recommendations
│       ├── billing/          # Credit usage and plans
│       ├── settings/         # User profile and preferences
│       ├── playground/       # Interactive keyword testing
│       └── keywords/         # Keyword management
```

All interactive components use `'use client'`. State managed via React Context (no Redux). Data fetching via custom `fetchFromApi` helper.

### Key Components

| Component | Purpose |
|-----------|---------|
| `ReportStatusBanner` | Polls scan progress every 10s |
| `MetricCards` | SOV %, total scans, avg sentiment, brand mentions |
| `VisibilityChart` | 7-day line chart of visibility trends |
| `EngineBreakdown` | Per-engine performance (Perplexity, ChatGPT, Gemini, Claude) |
| `TopKeywords` | Top 5 keywords with visibility rate |
| `TopBrands` | Share of Voice ranking (brand vs competitors) |
| `RecentScans` | Expandable scan results with raw AI responses |

---

## Backend Architecture

### Hono Framework

```
apps/api/src/
├── app.ts                    # Server setup, route mounting
├── config/env.ts             # Zod-validated environment
├── controllers/              # 10 HTTP handlers
├── routers/                  # 10 route definitions
├── services/                 # 14 business logic services
├── workers/                  # 3 BullMQ workers
├── core/
│   ├── queue.ts              # BullMQ setup (4 queues)
│   ├── encryption.ts         # AES-256-GCM encryption
│   ├── search/               # Multi-LLM provider factory
│   │   ├── factory.ts        # Provider instantiation
│   │   ├── openrouter.provider.ts
│   │   └── mock.provider.ts  # QA mode provider
│   └── ui-capture/           # Browser automation system
│       ├── camoufox-provider.ts    # Camoufox browser automation
│       ├── playwright-provider.ts  # Playwright fallback
│       ├── provider-sessions.ts    # Session management
│       ├── human-behavior.ts       # Anti-detection behavior
│       └── providers/              # Engine-specific logic
│           ├── perplexity/index.ts
│           ├── chatgpt/index.ts
│           ├── gemini/index.ts
│           └── claude/index.ts
└── db/
    ├── index.ts              # PGlite database connection
    └── schema/
        ├── core.ts           # Main tables (projects, keywords, scans, etc.)
        └── knowledge-graph.ts # Entities, claims, relationships
```

---

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User accounts and settings |
| `projects` | Brand projects with domain and description |
| `keywords` | Search queries to track per project |
| `scan_runs` | Scan execution batches |
| `scan_jobs` | Individual keyword+engine scan tasks |
| `scan_results` | Raw AI responses and analysis |
| `citations` | Extracted sources from AI responses |
| `knowledge_entities` | Extracted brand entities |
| `knowledge_claims` | Extracted claims about entities |
| `provider_connections` | AI engine session credentials |

---

## Queue System

### BullMQ Queues

| Queue | Purpose | Concurrency |
|-------|---------|-------------|
| `scrapers-queue` | Browser automation scraping jobs | 1-5 |
| `analysis-queue` | LLM evaluation jobs | 2 |
| `notifications-queue` | Email/digest notifications | 1 |
| `scheduled-queue` | Cron-triggered recurring scans | 1 |

### Job Flow

```
Keyword + Engine
  → BullMQ scrapers-queue
    → Scraper Worker
      → Camoufox browser automation
        → Navigate to AI engine UI
        → Submit query
        → Capture Markdown response
        → Extract sources/citations
      → AnalysisService.analyzeResult() (inline)
        → EvaluationService.evaluate()
          → GPT-4o-mini (LLM-as-Judge)
            OR heuristic fallback
        → Update scan_results
        → Populate knowledge graph
      → Mark scan_job complete
      → Update scan_run progress
```

---

## UI Capture System

### Camoufox Browser Automation

The UI capture system uses Camoufox (a Firefox-based Playwright wrapper with anti-detection):

1. **Launch**: Spawns a Firefox browser with randomized fingerprint (viewport, user agent, locale, timezone)
2. **Navigate**: Opens the target AI engine's web UI (chatgpt.com, perplexity.ai, etc.)
3. **Submit**: Uses `trySubmitStrategies()` to find the prompt input, type the query, and click send
4. **Wait**: Monitors for response generation completion
5. **Capture**: Extracts the rendered Markdown response and any source citations
6. **Session**: Manages login sessions with health checks and reconnection

### Provider Modules

Each AI engine has a dedicated provider module with engine-specific logic:

- **Perplexity**: Source extraction, navigation
- **ChatGPT**: Auth modal dismissal, source extraction, page lifecycle
- **Gemini**: Session management, source extraction, page lifecycle
- **Claude**: Source extraction, page lifecycle
- **AI Overviews**: Expand interactions, source extraction

---

## LLM-as-Judge Evaluation

### GPT-4o-mini Pipeline

The evaluation service uses GPT-4o-mini via OpenRouter with structured JSON output:

**System prompt:** Acts as a brand reputation analyst evaluating AI responses for:
- Brand visibility (is the brand mentioned?)
- Sentiment score (-1.0 to 1.0)
- Recommendation type (direct recommendation, neutral comparison, negative mention, absent)
- Competitor detection
- Hallucination flagging (did the AI invent facts?)
- Keyword intent classification (informational, transactional, navigational, commercial)
- Entity extraction (for knowledge graph population)
- Compliance warnings (scam/legal flags)

**Fallback:** When no API key is configured, a heuristic system uses keyword counting for basic visibility and sentiment analysis.

---

## API Flow Summary

```
Landing Page (/)
  → Sign In
  → Onboarding Wizard
    → Domain Analysis (POST /projects/analyze)
    → Project Creation (POST /projects)
    → Keyword Setup (POST /keywords x N)
    → Scan Trigger (POST /scans/trigger)
  → Dashboard (GET /dashboard/*)
    → Report Status (polling every 10s)
    → Share of Model (visibility metrics)
    → Keyword Performance
    → Competitor Analysis (Share of Voice)
    → Recent Scan Results
```

---

## Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | Next.js 14, React 18, TailwindCSS | Web UI with SSR |
| Backend | Hono v4, TypeScript | High-performance API |
| Database | PGlite (in-process PostgreSQL) | Zero-config database |
| Cache/Queue | Redis + BullMQ | Background job processing |
| Browser Automation | Camoufox + Playwright (Firefox) | AI engine UI scraping |
| AI Evaluation | OpenRouter / OpenAI (GPT-4o-mini) | Brand sentiment analysis |
| Authentication | BetterAuth | User management |
| Monorepo | Turborepo + pnpm | Multi-package management |
| Linting | Biome | Fast code formatting |
| CLI | Commander.js, Inquirer | Terminal interface |
| MCP | Model Context Protocol SDK | AI assistant integration |
