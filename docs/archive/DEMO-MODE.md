# ⚠️ ARCHIVED: Mentha AEO - Modo Demo

> **NOTA:** Este documento se mantiene solo como referencia histórica. El proyecto ha evolucionado para usar **servicios de datos reales**. El "Modo Demo" original ha sido **completamente descontinuado**.
>
> **Estado actual del proyecto:**
> - ✅ Autenticación real con Supabase
> - ✅ Análisis real con LLMs (OpenAI, Anthropic, Perplexity)
> - ✅ Métricas de keywords reales (Google Trends, SerpAPI)
> - ✅ Búsqueda web real (DuckDuckGo)
> - ✅ Cálculo de Authority Score en backend (`AnalysisService._calculate_authority_nexus`)
> - ✅ Persistencia completa en base de datos
>
> Ver `REAL_DATA_SERVICES_SUMMARY.md` para detalles de los servicios actuales.

---

## Información histórica (Legacy)

El proyecto originalmente estaba configurado para funcionar en **modo demo** sin necesidad de APIs reales. Esta funcionalidad ya **no está disponible** y ha sido reemplazada por una integración completa con servicios reales.

### Páginas actuales (con datos reales)

| Página | Ruta | Fuente de datos |
|--------|------|-----------------|
| Dashboard | `/dashboard` | brands, analyses, competitors |
| Keywords | `/keywords` | Google Trends, base de datos |
| Competidores | `/brand/[id]/competitors` | competitorsService, base de datos |
| Authority Nexus | `/brand/[id]` | Backend `AnalysisService` |

### Servicios de datos reales implementados

| Servicio | Descripción | Fuente |
|----------|-------------|--------|
| `KeywordMetricsService` | Métricas de keywords | Google Trends, SerpAPI |
| `AIVisibilityService` | Visibilidad en IA | ChatGPT, Claude, Perplexity |
| `CitationTrackingService` | Rastreo de citas | DuckDuckGo, LLMs |
| `TechnicalAEOService` | Auditoría técnica | robots.txt, schemas |
| `WebSearchService` | Búsqueda web | DuckDuckGo |

### Authority Score

El cálculo del Authority Score ahora se realiza exclusivamente en el backend:

```python
# backend/app/services/analysis/analysis_service.py
async def _calculate_authority_nexus(self, brand_name, brand_url):
    citations = await self.citation_service.check_authority_sources(brand_name, brand_url)
    present_count = len([c for c in citations if c.get("status") == "present"])
    score = min(present_count * 10, 100)
    high_impact_bonus = sum(5 for c in citations if c.get("status") == "present" and c.get("impact") == "high")
    return {"citations": citations, "score": min(score + high_impact_bonus, 100)}
```

El frontend (`AuthorityNexus.tsx`) solo muestra el valor `score` recibido del backend. Si el backend no proporciona un score, se muestra un fallback calculado localmente basado en las citas presentes.

---

## Configuración actual

El proyecto requiere las siguientes variables de entorno:

```env
# Supabase (requerido)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-key

# OpenAI (requerido para análisis)
OPENAI_API_KEY=sk-...

# Anthropic (opcional)
ANTHROPIC_API_KEY=sk-ant-...

# AI Visibility (opcional, cuesta dinero)
AI_VISIBILITY_ENABLED=false
PERPLEXITY_API_KEY=

# SerpAPI (opcional para métricas de keywords premium)
SERPAPI_KEY=
```

---

**Este documento es solo referencia histórica. El modo demo ya no existe.**
