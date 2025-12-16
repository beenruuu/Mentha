# Mentha - Project Summary & Developer Notes

> [!NOTE]
> This document consolidates information from previously existing reports (`Informe.md`, `informe2.md`, `informe3.md`), documentation (`MENTHA.md`), and task lists (`TODO.md`) that were removed during cleanup.

## 1. Project Overview (Mentha)
Mentha is an **AI Visibility Platform (SaaS)** designed to analyze and measure brand visibility within generative AI responses (AEO/GEO).
- **Goal**: Detect if a brand appears in LLM responses, measure frequency/sentiment, and provide optimization recommendations.
- **Key Metrics**: Inclusion Rate, Visibility Score, Share of Voice, Sentiment Analysis.

## 2. Strategic Context (AEO/GEO)
The web is shifting from "Search Engine Optimization" (SEO) to **"Answer Engine Optimization" (AEO)**.
- **Problem**: Traditional SEO tools track static links. Generative engines (ChatGPT, Perplexity, Google SGE) provide probabilistic, synthesized answers.
- **Solution**: A sovereign, self-hosted infrastructure is needed to query these engines, analyze the "Shadow DOM" (for Google SGE), and compute visibility scores without relying intrinsically on expensive, opaque 3rd party APIs for everything.

## 3. Architecture & Tech Stack

### Core Stack
- **Frontend**: Next.js (Radio/Shadcn UI) - Accessible, performant.
- **Backend**: Python (FastAPI) or Node.js - Python preferred for NLP/Scraping integration.
- **Database**: PostgreSQL + Supabase (Relational + Realtime).
- **Queues**: Redis / BullMQ for async scraping tasks.
- **Infrasctructure**: Docker & Docker Compose for easy deployment.

### Self-Hosted AEO Infrastructure (Advanced)
A fully sovereign stack to avoid high API costs:
- **Scraping**: **Playwright** (Python) for handling Shadow DOM and bypassing anti-bots (simulating user interactions).
- **Proxies**: **Scrapoxy** + Residential/4G proxies to avoid detection.
- **Inference**: **vLLM** + **Ollama** running local models (e.g., Llama 3 70B) on GPU hardware (RTX 3090/4090) for sentiment/entity analysis.
- **Storage**: **pgvector** (Supabase) for RAG and semantic history.
- **Orchestration**: **n8n** for connecting scraper, DB, and LLM workflows.

## 4. Pending Tasks & Roadmap

### 🔴 Urgent / In Progress
- [ ] **Database Migration (Competitors)**:
  Run this in Supabase SQL Editor:
  ```sql
  ALTER TABLE competitors ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual';
  ALTER TABLE competitors ADD COLUMN IF NOT EXISTS confidence VARCHAR(20) DEFAULT 'medium';
  ALTER TABLE competitors ADD COLUMN IF NOT EXISTS favicon TEXT;
  CREATE INDEX IF NOT EXISTS idx_competitors_source ON competitors(source);
  ```

### 📦 Improvements
- **Competitor Discovery**: Add more sources, improve validation, history.
- **Research Prompts**: Save generated prompts, templates by industry.
- **Admin**: Bind Step 3 categories to DB.

### 📝 Technical Notes
- **Onboarding Flow**:
  1. `AboutYouStep`
  2. `CompanyStep`
  3. `BrandProfileStep`
  4. `CompetitorsStep`
  5. `ResearchPromptsStep`
  6. `ScheduleStep`
  7. `SetupStep`
- **Key Endpoints**:
  - `POST /api/competitors/discover`
  - `POST /api/utils/generate-research-prompts`
  - `POST /api/analysis/trigger/{brand_id}`

### 📜 Legacy Scripts
- `backend/scripts/db/002_add_voice_score.sql` content (preserved):
  ```sql
  ALTER TABLE analysis_results 
  ADD COLUMN IF NOT EXISTS voice_score DECIMAL(5,2);
  
  COMMENT ON COLUMN analysis_results.voice_score IS 'Voice capability score';
  ```

## 5. Canon Prompts (Reference)
Use low temperature (0.0-0.2).
- **General**: "Eres un asistente experto en [SECTOR]. Un usuario pregunta: '¿Qué empresas... conoces?'. Responde con una lista corta..."
- **Comparative**: "Estoy investigando alternativas a [MARCA]. ¿Qué otras empresas son comparables...?"
- **Specific**: "¿Qué proveedores ofrecen servicios de [SERVICIO]...?"
