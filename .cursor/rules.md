# Mentha - LLM Rules and Conventions

This document defines the rules, conventions, and configurations for any LLM interacting with the Mentha project.

---

## Project Overview

**Mentha** is an AI Brand Presence Platform focused exclusively on:
- **AEO (AI Engine Optimization)**: Optimizing brand visibility in AI responses
- **GEO (Generative Engine Optimization)**: Controlling how AI models cite and reference brands

### Core Focus
- Audit brand presence across AI models (ChatGPT, Claude, Perplexity, Gemini)
- Detect errors, omissions, and hallucinations in AI responses
- Optimize content for better AI citations
- Compare brand visibility against user-defined competitors

---

## Code Conventions

### Language
- **All code comments**: English only
- **Variable names**: English, camelCase for JS/TS, snake_case for Python
- **Function names**: English, descriptive verbs
- **Documentation**: English (README, inline docs, JSDoc/docstrings)
- **User-facing text**: ALWAYS use the i18n system (see Internationalization section)

### Frontend (Next.js/TypeScript)
```typescript
// Good: English comments
// Fetch brand visibility data from API
const fetchVisibility = async (brandId: string) => { ... }

// Bad: Non-English comments
// Obtener datos de visibilidad de la marca
```

### Backend (Python/FastAPI)
```python
# Good: English comments
# Calculate visibility score across AI models
def calculate_visibility_score(brand_id: str) -> float:
    ...

# Bad: Non-English comments
# Calcular puntuación de visibilidad
```

---

## Internationalization (i18n)

### Core Principle
The user interface language (Spanish/English) depends on the user's region and browser configuration. **NEVER** force a specific language without checking the active language setting.

### Critical Rules

1. **Respect User Language**
   - Always check the current language configuration before rendering text
   - Use the `t` translation function from `useTranslations()` hook
   - Never hardcode text in a single language

2. **All Visible Text Must Be Translated**
   - Labels, buttons, messages, placeholders
   - Error messages and toast notifications
   - Navigation items and tooltips
   - Any user-facing string

3. **Adding New Translations**
   - Add to both `en` and `es` objects in `lib/i18n.ts`
   - Use descriptive keys: `brandAnalysisComplete` not `msg1`
   - Test in both languages

### Code Patterns

```typescript
// ✅ CORRECT - Using translation system
import { useTranslations } from '@/lib/i18n'

function MyComponent() {
    const { t } = useTranslations()
    return <Button>{t.saveChanges}</Button>
}

// ❌ WRONG - Hardcoded text in one language
function MyComponent() {
    return <Button>Save Changes</Button>  // BAD!
}

// ❌ WRONG - Forcing English when user has Spanish
function MyComponent() {
    return <span>Settings</span>  // BAD - should be t.settings
}
```

### Translation File Structure (`lib/i18n.ts`)
```typescript
const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    settings: 'Settings',
    competitors: 'Competitors',
    optimization: 'Optimization',
    // Actions
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    // Messages
    analysisComplete: 'Analysis complete',
    ...
  },
  es: {
    // Navigation
    dashboard: 'Panel',
    settings: 'Configuración',
    competitors: 'Competidores',
    optimization: 'Optimización',
    // Actions
    saveChanges: 'Guardar cambios',
    cancel: 'Cancelar',
    // Messages
    analysisComplete: 'Análisis completado',
    ...
  }
}
```

### When Modifying UI Components
Before changing any visible text:
1. Check if a translation key exists
2. If yes, use `t.keyName`
3. If no, add the key to BOTH language objects
4. Never replace `t.something` with hardcoded text

---

## Exclusions - What Mentha is NOT

### Explicitly Excluded Features
1. **Traditional SEO**
   - No Google Search rankings
   - No SERP analysis
   - No keyword density optimization
   - No backlink analysis

2. **Google Search**
   - Remove ALL references to "Google Search"
   - No `google_search` model ID
   - No search engine performance metrics

3. **Generic Competitor Data**
   - No "Top 10 e-commerce companies" lists
   - No auto-generated competitor suggestions
   - Only user-defined competitors from onboarding

4. **Traditional Marketing Metrics**
   - No social media analytics
   - No web traffic analysis
   - No email marketing metrics

### Code Patterns to Avoid
```typescript
// BAD - References Google Search
const models = ['openai', 'anthropic', 'google_search', 'perplexity']

// GOOD - Only AI conversational models
const models = ['openai', 'anthropic', 'perplexity', 'gemini']
```

```python
# BAD - Generic competitor list
competitors = get_top_industry_competitors(industry)

# GOOD - User-defined competitors only
competitors = get_user_competitors(brand_id)
```

---

## UI/UX Structure

### Navigation Hierarchy
```
Dashboard (General overview)
└── Brand [id]
    ├── Panel (Main) ← Primary view
    │   ├── AI Model Scores (ChatGPT, Claude, Perplexity, Gemini)
    │   ├── Citations & Mentions
    │   ├── Hallucinations/Errors
    │   └── Quick Insights
    ├── Competitors ← Submenu
    │   ├── Competitor comparison table
    │   └── Individual competitor dashboards
    └── Optimization ← Submenu
        ├── Recommendations
        ├── Technical AEO
        └── Content suggestions
```

### Panel Requirements
1. **AI Models Always Visible**
   - Show score for each AI model
   - Icons: ChatGPT, Claude, Perplexity, Gemini
   - No Google Search icon or score

2. **Competitor Section**
   - Only show user-defined competitors
   - Each competitor has its own dashboard (same structure as main panel)
   - Clear indication of which brand/competitor is being analyzed

3. **Clear Context**
   - Always show current brand name in header
   - Breadcrumb navigation
   - Visual distinction between own brand and competitor views

---

## API Response Guidelines

### AI Models Enumeration
```python
# Allowed AI models
class AIModel(str, Enum):
    OPENAI = "openai"      # ChatGPT
    ANTHROPIC = "anthropic" # Claude
    PERPLEXITY = "perplexity"
    GEMINI = "gemini"
    
# NOT allowed
# GOOGLE_SEARCH = "google_search"  ← Never include this
```

### Competitor Endpoints
```python
# Correct: Return only user-defined competitors
@router.get("/competitors/{brand_id}")
async def get_competitors(brand_id: UUID):
    return await service.list(filters={"brand_id": str(brand_id)})

# Wrong: Return generic/suggested competitors
# @router.get("/competitors/suggested/{industry}")  ← Don't implement this
```

---

## Response Style for LLM Assistants

When helping with Mentha code:

1. **Focus Areas**
   - AI visibility metrics
   - Citation tracking
   - Hallucination detection
   - Competitor analysis (user-defined only)

2. **Avoid Suggestions For**
   - SEO features
   - Google Search integration
   - Generic competitor discovery
   - Marketing automation

3. **Code Quality**
   - All comments in English
   - Type hints (TypeScript/Python)
   - Error handling
   - Consistent naming conventions

4. **Testing Considerations**
   - Mock AI provider responses
   - Test competitor filtering (no generics)
   - Verify Google Search exclusion

---

## File Structure Reference

```
mentha/
├── .cursor/                    # LLM rules (this folder)
│   └── rules.md
├── backend/
│   └── app/
│       ├── api/endpoints/      # REST API (no google_search)
│       ├── models/             # Pydantic models (AIModel enum)
│       └── services/
│           ├── analysis/       # AEO/GEO analysis
│           └── llm/            # AI provider integrations
├── frontend/
│   ├── app/
│   │   └── brand/[id]/         # Brand panel + submenus
│   ├── components/
│   │   ├── brand/              # Panel, Competitors, Optimization
│   │   └── layout/             # Sidebar navigation
│   └── lib/
│       └── demo/               # Demo mode (separate from prod)
└── supabase/                   # Database schema
```

---

## Quick Reference

| Do ✅ | Don't ❌ |
|-------|---------|
| English comments | Spanish/other language comments |
| User-defined competitors | Generic "top companies" lists |
| AI model scores visible | Hidden or removed AI scores |
| ChatGPT, Claude, Perplexity, Gemini | Google Search, Bing, Yahoo |
| AEO/GEO metrics | Traditional SEO metrics |
| Individual competitor dashboards | Combined/aggregated views |
| Clear brand context | Ambiguous "current analysis" |

---

## Version
- Last updated: 2025-12-26
- Mentha version: 1.0.0-restructure
