# Mentha API Reference

Complete API documentation for the Mentha Answer Engine Optimization platform.

**Base URL:** `/api/v1`

**Auth:** Bearer JWT token via `Authorization: Bearer <token>` header.

---

## Authentication

### POST /auth/login
Authenticate user credentials.

**Body:**
```json
{ "email": "user@example.com", "password": "..." }
```
**Response:** `{ token, user }`

### GET /auth/me
Get current authenticated user profile.

---

## Projects

### POST /projects/analyze
Analyze a domain for brand information, keywords, and competitors.

**Body:** `{ domain: "https://example.com" }`

**Response:**
```json
{
  "name": "Brand Name",
  "description": "Brand description from AI analysis",
  "keywords": ["What is Brand?", "Brand alternatives", ...],
  "competitors": ["Competitor A", "Competitor B"]
}
```

### GET /projects
List all projects for authenticated user.

### POST /projects
Create a new project.

**Body:**
```json
{
  "name": "My Brand",
  "domain": "https://example.com",
  "description": "Brand description",
  "competitors": ["https://competitor.com"]
}
```

### GET /projects/:id
Get project details.

### PUT /projects/:id
Update project.

### DELETE /projects/:id
Delete project and all associated data.

---

## Keywords

### GET /keywords?project_id=xxx
List keywords for a project.

### POST /keywords
Create a keyword.

**Body:**
```json
{
  "project_id": "uuid",
  "query": "best AI tools 2026",
  "engines": ["perplexity", "openai", "gemini", "claude"],
  "intent": "commercial",
  "scan_frequency": "weekly"
}
```

### PUT /keywords/:id
Update keyword settings.

### DELETE /keywords/:id
Deactivate keyword.

---

## Scans

### POST /scans/trigger?project_id=xxx
Trigger a full scan run across all keywords and engines.

**Response:** `{ runId, jobCount }`

### GET /scans?project_id=xxx&limit=10
List recent scan results with AI responses, sentiment scores, and competitor mentions.

### GET /scans/:runId?project_id=xxx
Get scan run status and progress.

---

## Dashboard

### GET /dashboard/report-status?project_id=xxx
Get current scan run progress. Used by the frontend polling system.

**Response:** `{ status, totalJobs, completedJobs, visibleCount, progress, eta }`

### GET /dashboard/share-of-model?project_id=xxx
Get Share of Voice metrics across all AI engines.

**Response:**
```json
{
  "totalScans": 120,
  "visibleCount": 45,
  "visibilityRate": 37.5,
  "byEngine": { "perplexity": { ... }, "openai": { ... } },
  "avgSentiment": 0.72,
  "timeline": [...]
}
```

### GET /dashboard/keywords?project_id=xxx&limit=20
Get keyword performance metrics (visibility rate, sentiment, trend).

### GET /dashboard/top-brands?project_id=xxx&limit=10
Get Share of Voice ranking across brands and competitors.

### GET /dashboard/citations?project_id=xxx&limit=100
Get citation/source analysis grouped by domain.

---

## Provider Connections

### GET /provider-connections
List AI engine connection statuses.

### POST /provider-connections/:provider/connect
Initiate OAuth/login flow for an AI engine provider.

### DELETE /provider-connections/:provider
Disconnect provider session.

---

## Settings

### GET /settings
Get user settings.

### PUT /settings
Update user settings.

---

## LLMs.txt

### GET /llms.txt/score?url=https://example.com
Get AEO readiness score for a URL.

### GET /llms.txt/artifacts
List available AI-readable artifacts.

### GET /llms.txt/artifacts/:name
Download specific artifact (llms.txt, ai.txt, schema.json, etc.).

### GET /llms.txt/artifacts.zip
Download all artifacts as ZIP.

### GET /llms.txt/adapters
List framework adapter templates (Next.js, Astro, Nuxt, Remix, etc.).

---

## Webhooks

### POST /webhooks
Register a webhook endpoint.

### GET /webhooks
List registered webhooks.

### DELETE /webhooks/:id
Remove webhook.

---

## MCP Server

The Mentha MCP server exposes these tools for AI assistants:

- `get_brand_visibility` — Check brand presence across AI engines
- `analyze_sentiment` — Get sentiment analysis
- `track_competitors` — Monitor competitor mentions
- `get_optimization_tips` — Receive AI-powered improvement suggestions
- `generate_ai_readable_files` — Generate llms.txt artifacts
- `list_projects` / `create_keyword` / `trigger_scan` — Platform management

---

## Error Codes

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 400 | Bad request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

---

## Rate Limiting

- Auth endpoints: 5 requests/minute
- Scan triggers: 10 requests/minute
- Dashboard polling: 60 requests/minute
- General API: 120 requests/minute
