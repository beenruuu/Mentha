# Flujo Completo: Onboarding → Análisis

## Descripción General

Este documento describe el flujo completo desde que un usuario inicia el onboarding hasta que se completa el análisis de visibilidad en motores de IA (AEO/GEO). El proceso está dividido en fases frontend y backend, con integración de servicios de scraping, IA y base de datos.

---

## Resumen Ejecutivo: La Economía de Citaciones

La transición del SEO tradicional al **AEO (Answer Engine Optimization)** y **GEO (Generative Engine Optimization)** implica un cambio fundamental:

> **En la Economía de Citaciones, la visibilidad es binaria**: las marcas son sintetizadas en la respuesta o son invisibles. La autoridad se deriva de la **proximidad vectorial semántica**, no del volumen de backlinks.

### Métricas Clave AEO/GEO

| Métrica | Definición | Implementación |
|---------|------------|----------------|
| **Semantic Share of Voice (SSoV)** | % de menciones de marca ponderadas por sentimiento y autoridad | `(Brand Mentions / Total Mentions) * Sentiment Weight` |
| **Citation Frequency** | Frecuencia de citación como fuente en respuestas IA | Extracción regex de links/citas en texto generado |
| **Retrieval Confidence** | Probabilidad de que el contenido sea seleccionado para el contexto | Similitud coseno entre query y vectores de contenido |
| **Hallucination Rate** | % de respuestas con información incorrecta sobre la marca | Detección reference-free (consistencia vs ground truth) |
| **Faithfulness Score** | ¿Las afirmaciones están soportadas por el contexto? | `Supported Claims / Total Claims` |

### Fórmula de Similitud Vectorial

$$\text{similarity} = \cos(\theta) = \frac{\mathbf{A} \cdot \mathbf{B}}{\|\mathbf{A}\| \|\mathbf{B}\|}$$

- **Similarity > 0.85**: Alta visibilidad, contenido semánticamente alineado
- **Similarity < 0.70**: Gap vectorial, contenido "invisible" para la IA

---

## FASE 1: ONBOARDING FRONTEND (7 pasos)

```
/onboarding → OnboardingClient.tsx → OnboardingProvider (contexto global)
```

| Paso | Componente | Datos Capturados | Acción Backend |
|------|------------|------------------|----------------|
| **1. About You** | `AboutYouStep.tsx` | `firstName`, `lastName`, `seoExperience` | Ninguna (solo estado local) |
| **2. Company** | `CompanyStep.tsx` | `websiteUrl`, `location`, `corporateDomain` | Validación URL y favicon |
| **3. Brand Profile** | `BrandProfileStep.tsx` | `name`, `domain`, `category`, `description`, `businessScope`, `city` | `GET /api/utils/brand-info?url=` → Crawl y análisis IA para extraer descripción/logo |
| **4. Competitors** | `CompetitorsStep.tsx` | Lista de competidores | `POST /api/competitors/discover` → Búsqueda web + filtrado IA |
| **5. Discovery Prompts** | `DiscoveryPromptsStep.tsx` | Consultas a monitorear | Ninguna (solo estado local) |
| **6. Schedule** | `ScheduleStep.tsx` | Modelos IA habilitados, días de análisis | Ninguna (solo estado local) |
| **7. Setup** | `SetupStep.tsx` | **EJECUCIÓN COMPLETA** | Ver FASE 2 |

## FASE 2: SETUP STEP (Creación automática)

Desde [SetupStep.tsx](frontend/components/onboarding/steps/SetupStep.tsx#L105-L310), se ejecuta:

```
┌─────────────────────────────────────────────────────────────┐
│ FASE 1: Creación de Marca                                   │
│ POST /api/brands/ → CreateBrandUseCase                      │
│ - Verifica si ya existe (por dominio)                       │
│ - Crea nueva marca con: name, domain, industry, location,   │
│   businessScope, city                                       │
│ → Retorna brand_id                                          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ FASE 2: Configuración de Análisis                           │
│ PUT /api/brands/{id} → Guarda:                              │
│ - discovery_prompts: ["mejores herramientas...", ...]       │
│ - ai_providers: ["chatgpt", "claude", ...]                  │
│ - analysis_schedule: ["L", "M", "X", "J", "V"]              │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ FASE 3: Guardando Competidores                              │
│ POST /api/competitors/ (por cada uno)                       │
│ - brand_id, name, domain, favicon, source, confidence       │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ FASE 4: Iniciar Análisis                                    │
│ POST /api/analysis/onboarding/{brand_id}                    │
│ → Crea registro Analysis con status="pending"               │
│ → asyncio.create_task(service.run_analysis(analysis_id))    │
└─────────────────────────────────────────────────────────────┘
                           ↓
              Redirect: /dashboard?brandId=X
```

## FASE 3: ANÁLISIS BACKEND (AnalysisService)

Desde [analysis_service.py](backend/app/services/analysis/analysis_service.py#L48-L180):

```
run_analysis(analysis_id)
│
├── 📍 PHASE 1: Entity Resolution (5-15%)
│   ├── fetch_page_content(brand_url) → Descarga HTML
│   ├── infer_business_info_from_page() → Detecta:
│   │   - entity_type: business/media/ecommerce/etc.
│   │   - industry: Technology/SaaS/Consulting/etc.
│   └── Log: ActivityType.ANALYSIS_PHASE
│
├── 📍 PHASE 2: Real Data Acquisition (15-70%)
│   ├── Parallel Execution:
│   │   ├── UnifiedScraper.map_site() → Sitemap/páginas
│   │   ├── WebSearchService.discover_competitors()
│   │   ├── citation_service.analyze_citations()
│   │   ├── hallucination_service.detect_hallucinations()
│   │   └── sentiment_service.analyze()
│   │
│   ├── AI Visibility (para cada discovery_prompt):
│   │   ├── GET response from Perplexity/Gemini
│   │   ├── Check if brand is mentioned
│   │   └── Calculate visibility_score
│   │
│   └── Log: ActivityType.SCRAPE_*, ActivityType.LLM_*
│
├── 📍 PHASE 3: Result Assembly (70-85%)
│   ├── Construye AnalysisResult con:
│   │   - overall_visibility_score
│   │   - entity_alignment_score
│   │   - citation_rate
│   │   - hallucination_count
│   │   - competitor_analysis
│   └── Log: ActivityType.ANALYSIS_PHASE
│
├── 📍 PHASE 4: AI Synthesis (85-95%)
│   ├── LLM genera:
│   │   - executive_summary
│   │   - recommendations[]
│   │   - key_insights[]
│   └── Log: ActivityType.LLM_*
│
└── 📍 PHASE 5: Database Ingestion (95-100%)
    ├── UPDATE aeo_analyses SET status='completed', results={}
    ├── INSERT INTO geo_visibility (por cada provider)
    ├── INSERT INTO citations
    ├── INSERT INTO hallucinations
    └── Log: ActivityType.ANALYSIS_COMPLETE
```

## DIAGRAMA DE SERVICIOS INVOLUCRADOS

```
Frontend                   │   Backend API            │   Services
───────────────────────────┼──────────────────────────┼─────────────────────────
/onboarding                │                          │
  ├→ BrandProfileStep      │ /utils/brand-info        │ UnifiedScraper
  ├→ CompetitorsStep       │ /competitors/discover    │ WebSearchService
  └→ SetupStep             │ /analysis/onboarding     │ AnalysisService
                           │                          │   ├── UnifiedScraper
                           │                          │   ├── LLMService
                           │                          │   ├── CitationService
                           │                          │   ├── HallucinationService
                           │                          │   └── SentimentService
───────────────────────────┼──────────────────────────┼─────────────────────────
/dashboard                 │ /analysis/status/{id}    │ (Polling)
                           │ /activities/stream       │ ActivityLogger (SSE)
```

## LOGS DE ACTIVIDAD (ActivityLogger)

Cada paso genera logs en tiempo real vía [activity_logger.py](backend/app/services/logging/activity_logger.py):

```javascript
// SSE Stream: GET /api/activities/stream
{
  "type": "analysis_phase",
  "title": "Entity Resolution",
  "description": "Detecting business type...",
  "progress": 10,
  "analysis_id": "uuid-xxx"
}
```

## PUNTOS CRÍTICOS DE FALLO

| Punto | Error Común | Solución Implementada |
|-------|-------------|----------------------|
| Scraping | Firecrawl 402 | UnifiedScraper → fallback Playwright |
| LLM | No API key | [system-status](backend/app/api/endpoints/utils.py) endpoint para diagnóstico |
| Competidores | Ninguno encontrado | Búsqueda web via DuckDuckGo (gratis) |
| Análisis | audit_content TypeError | Parámetros corregidos |

## Archivos Clave

- **Frontend**: `frontend/components/onboarding/steps/`
- **Backend**: `backend/app/services/analysis/analysis_service.py`
- **API**: `backend/app/api/endpoints/analysis_onboarding.py`
- **Logs**: `backend/app/services/logging/activity_logger.py`
- **Scraping**: `backend/app/services/scraper/`

## Notas Técnicas

- **Async/Await**: Todo el backend usa asyncio para operaciones no bloqueantes
- **Fallbacks**: UnifiedScraper detecta errores 402/429 y cambia a Playwright
- **SSE**: Logs en tiempo real via Server-Sent Events
- **Pydantic**: Validación estricta de datos en todas las APIs
- **Supabase**: Base de datos principal para marcas, análisis y competidores

---

## ARQUITECTURA AVANZADA: Simulación RAG

### El Pipeline de Simulación RAG

Para explicar **por qué** una marca no aparece en respuestas IA, Mentha debe actuar como un motor de IA:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. INGESTION & CHUNKING                                     │
│    Crawl del sitio → Segmentos semánticos (50-150 palabras) │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. EMBEDDING                                                │
│    Chunks → Vectores (1536 dimensiones, OpenAI/HuggingFace) │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. RETRIEVAL TEST                                           │
│    Query del usuario → Vector Search → Cosine Similarity    │
│    Si similarity < 0.75 → Contenido "invisible" para IA     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. GENERATION                                               │
│    LLM genera respuesta usando chunks como contexto         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. EVALUATION (RAGAS)                                       │
│    - Faithfulness: ¿Claims soportadas por contexto?         │
│    - Answer Relevance: ¿Responde la intención del usuario?  │
└─────────────────────────────────────────────────────────────┘
```

### Detección de Alucinaciones

```python
# Implementación conceptual con RAGAS
from ragas.metrics import faithfulness, answer_relevancy
from ragas import evaluate

# Dataset de evaluación
dataset = {
    "question": ["¿Qué es Mentha?"],
    "answer": [generated_answer],
    "contexts": [[user_content_chunks]],
    "ground_truth": [brand_description]
}

# Calcular métricas
result = evaluate(dataset, metrics=[faithfulness, answer_relevancy])
# result.faithfulness → 0.0 a 1.0
# result.answer_relevancy → 0.0 a 1.0
```

---

## ENTITY GAP ANALYSIS

### Extracción de Entidades con spaCy

```python
import spacy
nlp = spacy.load("en_core_web_sm")

doc_user = nlp(user_content)
doc_competitor = nlp(competitor_content)

user_entities = {ent.text for ent in doc_user.ents}
comp_entities = {ent.text for ent in doc_competitor.ents}

# Entidades que el competidor menciona pero el usuario no
missing_entities = comp_entities - user_entities
# → ["LLMs", "Vector DBs", "RAG", "Knowledge Graph"]
```

**Insight generado**: "Tu competidor discute 'LLMs' y 'Vector DBs', mientras tú solo mencionas 'Search'."

---

## BRAND VOICE CALIBRATION

### Digitalización de la Voz de Marca

Durante el onboarding, capturamos la "firma de voz" de la marca:

```json
{
  "formality": 0.8,
  "humor": 0.2,
  "technical_depth": 0.9,
  "sentence_length_avg": 18,
  "vocabulary_level": "professional"
}
```

Este **Brand Voice Vector** se usa para:
1. Comparar cómo las IAs representan la marca
2. Detectar erosión de brand equity en respuestas generadas
3. Generar recomendaciones de contenido alineadas

---

## SCHEMA & STRUCTURED DATA

### Validación de Schema.org

```
┌─────────────────────────────────────────────────────────────┐
│ SCHEMA AUDIT                                                │
│                                                             │
│ ✅ Organization Schema detectado                            │
│ ✅ FAQ Schema en /preguntas-frecuentes                      │
│ ⚠️  Product Schema: Precio inconsistente (Schema: $50,      │
│    Visible: $100) → RIESGO DE ALUCINACIÓN                   │
│ ❌ LocalBusiness Schema no encontrado                       │
│                                                             │
│ ACCIÓN: Generar JSON-LD corregido ↓                         │
└─────────────────────────────────────────────────────────────┘
```

### Semantic Triples

El contenido debe estructurarse en triples claros (Subject-Predicate-Object):

| ❌ Malo | ✅ Bueno |
|---------|----------|
| "Nuestra solución ofrece una miríada de beneficios..." | "Mentha maximiza la visibilidad AEO." |
| Ambiguo, difícil de parsear | Triple claro: `Mentha → maximiza → visibilidad` |

---

## INFRAESTRUCTURA TÉCNICA

### Dependencias Python Requeridas

```toml
# pyproject.toml
[dependencies]
spacy = "^3.7"           # NLP y Entity Extraction
ragas = "^0.1"           # RAG metrics (Faithfulness, Relevance)
deepeval = "^0.21"       # Hallucination detection
celery = "^5.3"          # Async task queue
redis = "^5.0"           # Message broker
langchain = "^0.1"       # LLM orchestration
chromadb = "^0.4"        # Vector database
scikit-learn = "^1.4"    # Cosine similarity
playwright = "^1.40"     # Stealth scraping
```

### Estructura de Carpetas Propuesta

```
mentha/
├── onboarding/
│   ├── entity_resolution.py  # Knowledge Graph APIs
│   ├── voice_profiler.py     # Brand voice vector generation
│   └── persona_manager.py    # User personas for prompt simulation
├── analysis/
│   ├── crawler.py            # UnifiedScraper (Playwright/Firecrawl)
│   ├── embedding.py          # Vector embeddings (OpenAI/HuggingFace)
│   ├── rag_simulator.py      # Simulated retrieval (Vector Search)
│   ├── hallucination.py      # RAGAS/DeepEval integration
│   └── competitor_gap.py     # Entity gap analysis (spaCy)
├── tasks/
│   └── celery_worker.py      # Async analysis jobs
└── dashboard/
    └── metrics.py            # SSoV, Citation Freq, etc.
```

---

## ROADMAP ESTRATÉGICO

### Stage 1: Foundation (Actual + Mejoras)
- ✅ Onboarding con verificación de Schema
- ✅ Análisis básico con scraping + similarity vectorial
- ✅ Reporting de "Visibility Scores"

### Stage 2: Simulation Engine (Upgrade "Senior")
- 🔄 Simulación RAG con LangChain/OpenAI
- 🔄 Detección de alucinaciones con RAGAS
- 🔄 Grafos de entidades (usuario vs competidores)

### Stage 3: Closed Loop (Enterprise Grade)
- ⏳ Optimización automática (generar Schema JSON-LD)
- ⏳ Monitoreo continuo (SSoV semanal, trends)
- ⏳ Alertas proactivas de competidores

---

## LOCAL AEO

### Dimensión Olvidada: Búsquedas Locales

Las IAs como Gemini y Perplexity son context-aware respecto a ubicación:

```
Query: "¿Cuál es la mejor cafetería?"
     ↓
Query expandida: "¿Cuál es la mejor cafetería cerca de mí en [Ciudad]?"
```

**Métricas Locales**:
- Local Mention Frequency (Yelp, TripAdvisor, Google Maps)
- LocalBusiness Schema validation
- Geo-modified prompt simulation

---

## CONCLUSIÓN

El flujo `Onboarding → Analysis` es **conceptualmente adecuado** pero **estratégicamente insuficiente** para competir en la era GEO.

### Requerimientos para Nivel "Senior":

1. **Redefinir Onboarding**: Identidad y Voz de Marca, no solo registro
2. **Profundizar Analysis**: Simulación RAG + Detección de Alucinaciones
3. **Adoptar Asincronía**: Celery/Redis para cargas computacionales
4. **Métricas que Importan**: SSoV y Retrieval Confidence sobre rankings tradicionales

> Al implementar estos cambios arquitectónicos, Mentha se alineará con el estado del arte 2026, proporcionando insights para sobrevivir y prosperar en la **Economía de Citaciones**.