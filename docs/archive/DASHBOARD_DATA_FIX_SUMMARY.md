# Dashboard Data Connection Fixes Summary

## Overview
This document summarizes the changes made to ensure all Mentha dashboard pages properly display data after the onboarding process.

## Database Migrations

### New Migration: `supabase/migrations/20251127_add_query_fields.sql`
Added missing columns to the `queries` table:
- `category` (TEXT) - Query category with default 'general'
- `priority` (TEXT) - Priority level (low, medium, high)
- `frequency` (TEXT) - Query frequency (daily, weekly, monthly)
- `analysis_id` (UUID) - Reference to the analysis that generated the query

## Frontend Service Updates

### `frontend/lib/services/keywords.ts`
Added optional fields to the Keyword interface:
- `position?: number`
- `trend?: 'up' | 'down' | 'stable'`
- `mentions?: Record<string, boolean>`

### `frontend/lib/services/queries.ts`
Updated Query interface with all required fields:
- `user_id?`, `analysis_id?`, `ai_models?`, `tracked?`, `updated_at?`

### `frontend/lib/services/technical-aeo.ts`
Added all technical AEO fields:
- `total_schemas`, `has_faq`, `has_howto`, `has_article`
- `https_enabled`, `response_time_ms`, `recommendations`, `created_at`

## Frontend Page Updates

### `frontend/app/keywords/page.tsx`
- Fixed stats calculation to derive from `ai_visibility_score`
- Added `TrendingDown`, `Minus` imports
- Changed `highPotential` to `top3` and `improvements` stats
- Added derived fields for position, trend, and mentions

### `frontend/app/competitors/page.tsx`
- Improved stats calculation
- Derived `mentions`, `avgPosition`, `trend`, `strengths` from `visibility_score`

### `frontend/app/brand/[id]/keywords/page.tsx`
- Fixed derived fields (estimatedPosition, derivedTrend, hasMentions)

### `frontend/app/brand/[id]/query/[queryId]/page.tsx`
- **Major rewrite**: Replaced hardcoded mock data with real API calls
- Added loading states and error handling
- Uses `queriesService.getById()` and `brandsService.getById()`
- Added "Coming Soon" placeholders for advanced features (position tracking, AI response analysis)

### `frontend/app/aeo-analysis/page.tsx`
- Enhanced `handleAnalyze()` to include proper `brand{}` and `objectives{}` structure

### `frontend/components/onboarding/steps/DiscoveryPromptsStep.tsx`
- Enhanced `handleFinish()` to pass comprehensive brand structure
- Added proper `input_data` with brand/objectives for analysis creation

## Backend Updates

### `backend/app/models/query.py`
Added new fields:
- `ai_models: Optional[List[str]]`
- `updated_at: Optional[datetime]`

### `backend/app/models/technical_aeo.py`
Added missing fields to match database schema:
- `total_schemas`, `has_faq`, `has_howto`, `has_article`
- `https_enabled`, `response_time_ms`, `recommendations`, `created_at`

### `backend/app/services/analysis_results_ingestion.py`
Enhanced `_ingest_queries()` method:
- Added `analysis_id` linkage
- Added category mapping with validation
- Added priority validation (low, medium, high)
- Added frequency validation (daily, weekly, monthly)

## Data Flow

The complete data flow after onboarding:

1. **Onboarding** → Creates brand with domain, industry, description
2. **Analysis Creation** → Triggers with input_data containing brand/objectives
3. **LLM Analysis** → Generates structured results (keywords, competitors, queries, technical AEO)
4. **Results Ingestion** → `AnalysisResultsIngestionService` populates:
   - `keywords` table
   - `competitors` table
   - `queries` table (with new fields)
   - `technical_aeo` table
   - `crawler_logs` table
   - `web_search_results` table
5. **Frontend Display** → Pages fetch data via API and display real values

## Pages Status

| Page | Status | Data Source |
|------|--------|-------------|
| Dashboard | ✅ Connected | brands, analyses, competitors |
| AEO Analysis | ✅ Connected | analyses |
| Keywords | ✅ Connected | keywords |
| Competitors | ✅ Connected | competitors |
| Search | ✅ Connected | brands |
| Brand Overview | ✅ Connected | brands, competitors, keywords, technical_aeo |
| Brand Keywords | ✅ Connected | keywords |
| Brand Queries | ✅ Connected | queries |
| Query Detail | ✅ Connected | queries, brands |
| AI Crawlers | ✅ Connected | technical_aeo |
| Notifications | ✅ Connected | notifications |

## How to Apply Changes

1. Run the database migration:
   ```bash
   # Apply the new migration through Supabase CLI or dashboard
   supabase db push
   ```

2. Restart the backend service:
   ```bash
   cd backend
   make dev
   ```

3. Restart the frontend service:
   ```bash
   cd frontend
   pnpm dev
   ```

4. Complete the onboarding flow to trigger data population.

## Notes

- The Query Detail page now shows "Coming Soon" placeholders for advanced features (position tracking across AI models, sentiment analysis, etc.) that require additional backend implementation
- All pages now gracefully handle loading and error states
- Mock/hardcoded data has been removed in favor of real API calls
