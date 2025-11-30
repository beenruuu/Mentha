# Real Data Services Implementation Summary

## Fecha: 2025-11-28

## Objetivo
Eliminar todos los datos ficticios generados por LLM y reemplazarlos con microservicios que obtienen datos reales.

## Servicios Creados/Modificados

### 1. KeywordMetricsService (NUEVO)
**Archivo:** `backend/app/services/keyword_metrics_service.py`

**Función:** Obtiene métricas REALES de keywords desde múltiples fuentes.

**Fuentes de datos:**
- **Google Trends** (gratis) - Tendencias, volumen relativo, interés geográfico
- **SerpAPI** (opcional, de pago) - Volumen de búsqueda real, dificultad SEO
- **Estimación inteligente** - Cuando no hay APIs de pago, estima basándose en trends

**Métodos principales:**
```python
get_keyword_metrics(keyword, geo) -> Dict  # Métricas de una keyword
get_related_keywords(seed_keyword, geo) -> List  # Keywords relacionadas
enrich_keywords(keywords, geo) -> List  # Enriquece lista de keywords
```

**Campos devueltos:**
- `search_volume`: Volumen de búsqueda (real o estimado)
- `difficulty`: Dificultad SEO (0-100)
- `trend_score`: Puntuación de tendencia de Google Trends (0-100)
- `trend_direction`: "rising", "stable", o "falling"
- `data_source`: Origen de los datos ("google_trends", "serpapi", "estimated")

### 2. AIVisibilityService (NUEVO)
**Archivo:** `backend/app/services/ai_visibility_service.py`

**Función:** Mide la visibilidad REAL de una marca en respuestas de AI.

**Cómo funciona:**
1. Envía queries reales a ChatGPT, Claude, Perplexity
2. Analiza las respuestas buscando menciones de la marca
3. Calcula score de visibilidad basado en frecuencia de menciones
4. Extrae snippets de contexto donde aparece la marca

**IMPORTANTE:** Deshabilitado por defecto porque hace llamadas reales a APIs de pago.
Para habilitar: `AI_VISIBILITY_ENABLED=true` en `.env`

**Métricas devueltas:**
- `overall_score`: Score ponderado de todos los modelos
- `mention_count`: Total de menciones encontradas
- `sentiment`: Sentimiento general (positive/neutral/negative)
- Por modelo: score individual, snippets de contexto

### 3. Servicios Existentes (ya eran reales)

**WebSearchService** (`web_search_service.py`)
- ✅ Ya obtenía datos REALES de DuckDuckGo
- Búsquedas de keywords, competidores, menciones

**TechnicalAEOService** (`technical_aeo_service.py`)
- ✅ Ya obtenía datos REALES
- robots.txt parsing
- JSON-LD schema extraction
- AI crawler permissions

## Cambios en AnalysisService

**Archivo:** `backend/app/services/analysis_service.py`

**Flujo actualizado:**
```
1. Gather Web Search Data (REAL - DuckDuckGo)
2. Technical AEO Audit (REAL - robots.txt/schemas)
3. Keyword Metrics (REAL - Google Trends/SerpAPI)
4. AI Visibility (REAL - ChatGPT/Claude queries) [opcional]
5. LLM Analysis (usa datos reales como contexto)
6. Ingestion (guarda datos con origen marcado)
```

**Cambios en el prompt:**
- El LLM ahora recibe datos REALES de keywords
- Se le instruye usar valores exactos de `search_volume` y `difficulty`
- Ya no inventa métricas de keywords

## Cambios en Base de Datos

**Nueva migración:** `supabase/migrations/20251128_add_keyword_real_metrics.sql`

**Nuevos campos en `keywords`:**
- `trend_score`: INTEGER (0-100)
- `trend_direction`: TEXT ('rising'|'stable'|'falling')
- `data_source`: TEXT ('google_trends'|'serpapi'|'estimated'|'llm_estimated'|'manual')

**Nueva tabla:** `web_search_results`
- Almacena resultados de búsquedas web para auditabilidad

## Dependencias Añadidas

**requirements.txt:**
```
pytrends>=4.9.2
```

## Configuración

**Nuevas variables de entorno:**
```env
# AI Visibility (disabled by default - costs money)
AI_VISIBILITY_ENABLED=false
PERPLEXITY_API_KEY=

# Keyword Metrics (optional paid APIs)
SERPAPI_KEY=
```

## Frontend Updates

**Keywords Service:** Actualizado interface para incluir nuevos campos
**Keywords Page:** Muestra indicador de datos reales (GT/API badge)

## Resumen de Fuentes de Datos

| Campo | Antes | Ahora |
|-------|-------|-------|
| search_volume | LLM inventado | Google Trends / SerpAPI |
| difficulty | LLM inventado | SerpAPI / Estimado de trends |
| trend | No existía | Google Trends REAL |
| ai_visibility_score | LLM inventado | ChatGPT/Claude/Perplexity queries REALES* |
| competitors | LLM inventado | DuckDuckGo búsquedas REALES |
| robots.txt | Ya era real | Ya era real |
| schemas | Ya era real | Ya era real |

*cuando `AI_VISIBILITY_ENABLED=true`

## Notas Importantes

1. **Costos**: El servicio de AI Visibility hace llamadas reales a APIs de pago. Por eso está deshabilitado por defecto.

2. **Rate Limiting**: Google Trends tiene límites. El servicio maneja errores gracefully.

3. **Datos Marcados**: Todos los datos ahora tienen `data_source` para saber su origen.

4. **Fallbacks**: Si Google Trends falla, el sistema usa estimaciones inteligentes basadas en los datos disponibles.
