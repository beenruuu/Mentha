# 🚀 Mentha AEO/GEO - Plan de Mejoras

> **Análisis exhaustivo del repositorio y roadmap para convertirlo en la mejor plataforma AEO/GEO**

---

## 📊 Estado Actual del Repositorio

### ✅ Fortalezas (Nivel Senior)

| Aspecto | Evaluación | Archivos |
|---------|------------|----------|
| **Monorepo + Turborepo** | Correctamente estructurado con paquetes compartidos | `turbo.json`, `pnpm-workspace.yaml` |
| **Type Safety E2E** | Zod → TypeScript → Drizzle → Hono RPC. Flujo tipado completo | `apps/api/src/schemas/`, `packages/core/` |
| **Multi-LLM Integration** | Factory pattern + caching para 4 providers | `apps/api/src/core/search/` |
| **Database Schema** | Schemas bien diseñados con CHECKs, índices, y relaciones | `apps/api/src/db/schema/` |
| **Knowledge Graph** | Entidades, claims, FAQs, action schemas | `knowledge-graph.ts` |
| **Red Team Service** | Ataques adversariales + CI check para "brand defense" | `apps/api/src/core/redteam.ts` |
| **RAG Simulator** | Embeddings + cosine similarity para QA testing | `apps/api/src/core/rag.ts` |
| **Evaluation Service** | LLM-as-Judge con schema Zod + auto-correction | `apps/api/src/services/evaluation.service.ts` |
| **BullMQ Queues** | Job scheduling con jitter, retries, y backoff | `apps/api/src/core/queue.ts` |
| **CLI + MCP** | Integración con Claude Desktop via Model Context Protocol | `apps/cli/`, `apps/mcp/` |

### ⚠️ Problemas Críticos

| Problema | Ubicación | Severidad | Issue |
|----------|-----------|-----------|-------|
| Sin tests | 0% coverage | 🔴 Crítico | `#TEST-001` |
| Workers no implementados | Falta `src/workers/` | 🔴 Crítico | `#WORKER-001` |
| ScanService tiene placeholder | `scan.service.ts:39` | 🔴 Crítico | `#SCAN-001` |
| AnalysisService tiene placeholder | `analysis.service.ts:45-52` | 🔴 Crítico | `#ANALYSIS-001` |
| Auth sin middleware en rutas | `keywords.router.ts` no usa `requireAuth` | 🟡 Alto | `#AUTH-001` |
| Sin rate limiting en endpoints críticos | Solo auth tiene rate limit | 🟡 Alto | `#SEC-001` |
| No hay validación de proyecto-usuario | Cualquiera puede acceder a cualquier proyecto | 🟡 Alto | `#AUTH-002` |

### 🔧 Issues de Código (Biome)

```
- noNonNullAssertion: drizzle.config.ts:11, rag.ts:67
- noUnusedImports: TheShift.tsx:3
- noSvgWithoutTitle: Header.tsx:48
```

---

## 🏗️ Fase 1: Correcciones Críticas

### Issue #WORKER-001: Implementar Workers de BullMQ

**Prioridad:** Crítica  
**Estimación:** 4-6 horas  
**Labels:** `backend`, `critical`, `bullmq`

**Descripción:**
Los workers de BullMQ no están implementados. Necesitamos crear:

- [ ] `apps/api/src/workers/scraper.worker.ts`
- [ ] `apps/api/src/workers/analysis.worker.ts`
- [ ] `apps/api/src/workers/digest.worker.ts`
- [ ] `apps/api/src/workers/index.ts` (orchestrator)

**Implementación:**

```typescript
// scraper.worker.ts
import { Worker } from 'bullmq';
import { createProvider } from '../core/search/factory';
import { addAnalysisJob, getRedisConnection, QUEUE_NAMES } from '../core/queue';

const worker = new Worker<ScanJobData>(
    QUEUE_NAMES.SCRAPERS,
    async (job) => {
        const { engine, query, brand, competitors } = job.data;
        
        const provider = createProvider(engine);
        const result = await provider.search(query);
        
        // Save to scan_results
        // Trigger analysis job
        await addAnalysisJob({
            scanJobId: job.id,
            rawResponse: result.content,
            brand,
            competitors,
        });
        
        return result;
    },
    { connection: getRedisConnection(), concurrency: 5 }
);
```

---

### Issue #SCAN-001: Conectar ScanService con Providers Reales

**Prioridad:** Crítica  
**Estimación:** 2-3 horas  
**Labels:** `backend`, `critical`

**Descripción:**
`ScanService.executeScan()` tiene un placeholder. Debe usar los providers reales.

**Archivo:** `apps/api/src/services/scan.service.ts`

**Cambios:**
- Usar `createProvider(engine)` del factory
- Llamar `provider.search(query, options)`
- Guardar respuesta real en `scan_results`
- Disparar job de análisis con `addAnalysisJob()`

---

### Issue #ANALYSIS-001: Conectar AnalysisService con EvaluationService

**Prioridad:** Crítica  
**Estimación:** 2-3 horas  
**Labels:** `backend`, `critical`

**Descripción:**
`AnalysisService.analyzeResult()` tiene valores hardcodeados. Debe usar `EvaluationService`.

**Archivo:** `apps/api/src/services/analysis.service.ts`

**Cambios:**
- Importar `getEvaluationService()`
- Llamar `evaluationService.evaluate({ rawResponse, brand, competitors })`
- Guardar resultado real en DB

---

### Issue #AUTH-001: Añadir Middleware de Autenticación a Todos los Routers

**Prioridad:** Alta  
**Estimación:** 2-3 horas  
**Labels:** `security`, `backend`

**Descripción:**
Varios routers no tienen autenticación. Todos deben usar `requireAuth + attachUser`.

**Archivos a modificar:**
- `apps/api/src/routers/keywords.router.ts`
- `apps/api/src/routers/projects.router.ts`
- `apps/api/src/routers/scans.router.ts`
- `apps/api/src/routers/knowledge-graph.router.ts`
- `apps/api/src/routers/dashboard.router.ts`

**Ejemplo:**

```typescript
// Antes
const router = new Hono()
    .get('/', KeywordController.list)

// Después
const router = new Hono()
    .get('/', requireAuth, attachUser, KeywordController.list)
```

---

### Issue #AUTH-002: Validación de Propiedad de Proyecto

**Prioridad:** Alta  
**Estimación:** 3-4 horas  
**Labels:** `security`, `backend`

**Descripción:**
Cualquier usuario autenticado puede acceder a cualquier proyecto. Se debe validar que el proyecto pertenece al usuario.

**Solución:**
1. Añadir middleware `validateProjectOwnership`
2. Modificar services para filtrar por `user_id`
3. Añadir tests de autorización

**Middleware propuesto:**

```typescript
export const validateProjectOwnership = createMiddleware(async (c, next) => {
    const user = c.get('user');
    const projectId = c.req.param('projectId') || c.req.query('project_id');
    
    if (projectId) {
        const project = await projectService.getById(projectId);
        if (project.user_id !== user.id) {
            throw new ForbiddenException('Access denied to this project');
        }
    }
    
    await next();
});
```

---

### Issue #SEC-001: Rate Limiting Global

**Prioridad:** Alta  
**Estimación:** 2 horas  
**Labels:** `security`, `backend`

**Descripción:**
Solo el endpoint de auth tiene rate limiting. Se debe añadir rate limiting global.

**Solución:**
- Añadir rate limiting por usuario (usando `user.id` del JWT)
- Rate limiting por IP para endpoints públicos
- Diferentes límites según el plan (free/pro/enterprise)

---

## 🧪 Fase 2: Testing (0% → 80%)

### Issue #TEST-001: Implementar Suite de Tests

**Prioridad:** Alta  
**Estimación:** 8-10 horas  
**Labels:** `testing`, `quality`

**Estructura de tests:**

```
apps/api/src/
├── services/__tests__/
│   ├── keyword.service.test.ts
│   ├── project.service.test.ts
│   ├── evaluation.service.test.ts
│   ├── entity.service.test.ts
│   ├── dashboard.service.test.ts
│   └── scan.service.test.ts
├── controllers/__tests__/
│   ├── auth.controller.integration.test.ts
│   ├── keywords.controller.integration.test.ts
│   └── projects.controller.integration.test.ts
└── core/__tests__/
    ├── queue.test.ts
    ├── rag.test.ts
    └── redteam.test.ts
```

**Tests mínimos requeridos:**
- [ ] Unit tests para todos los services
- [ ] Integration tests para controllers principales
- [ ] Tests de autenticación y autorización
- [ ] Tests de providers de búsqueda (mockeados)

---

## 🚀 Fase 3: Features AEO Avanzadas

### Issue #FEATURE-001: Agentic Fan-Out

**Prioridad:** Media  
**Estimación:** 6-8 horas  
**Labels:** `feature`, `aeo`, `ai`

**Descripción:**
Implementar AI Personas que generen variaciones naturales de queries.

**Implementación:**
1. Crear `apps/api/src/services/persona.service.ts`
2. Definir personas: "Bargain Hunter", "Skeptic", "Local Shopper", "Tech Enthusiast"
3. Cada persona genera 5-10 variaciones de la query original
4. Ejecutar scans en paralelo con las variaciones
5. Agregar resultados para análisis de cobertura

**Persona Service:**

```typescript
interface Persona {
    name: string;
    traits: string[];
    queryModifiers: (baseQuery: string) => string[];
}

const PERSONAS: Persona[] = [
    {
        name: 'Bargain Hunter',
        traits: ['price-conscious', 'deal-seeker'],
        queryModifiers: (q) => [
            `${q} cheap`,
            `${q} best value`,
            `${q} affordable`,
            `${q} discount`,
        ],
    },
    // ...
];
```

---

### Issue #FEATURE-002: Geo-Spatial Intelligence

**Prioridad:** Media  
**Estimación:** 4-5 horas  
**Labels:** `feature`, `aeo`, `geo`

**Descripción:**
Ya existe `options.geo` en los providers, pero no hay API/UI para configurarlo.

**Cambios necesarios:**
1. Añadir campos `geo_country`, `geo_location` a la tabla `projects`
2. Crear endpoint `POST /api/v1/projects/:id/geo-settings`
3. Modificar `ScanService` para inyectar contexto geo
4. Añadir UI en el dashboard para configurar ubicación

---

### Issue #FEATURE-003: Hallucination Dashboard

**Prioridad:** Media  
**Estimación:** 4-5 horas  
**Labels:** `feature`, `frontend`, `aeo`

**Descripción:**
El `hallucination_flag` existe en `EvaluationService` pero no hay visualización.

**Cambios necesarios:**
1. Añadir columna `hallucination_flag` a la respuesta del API
2. Crear componente `HallucinationAlert.tsx`
3. Mostrar en dashboard cuando se detecten alucinaciones
4. Añadir filtros para ver solo resultados con alucinaciones

---

### Issue #FEATURE-004: Competitor Intelligence Dashboard

**Prioridad:** Media  
**Estimación:** 6-8 horas  
**Labels:** `feature`, `frontend`, `aeo`

**Descripción:**
Tracking automático de menciones de competidores con alertas.

**Cambios necesarios:**
1. Crear endpoint `/api/v1/dashboard/competitor-intelligence`
2. Calcular "share of voice" por competidor
3. Detectar tendencias (competidor ganando/perdiendo)
4. Añadir gráficos de evolución temporal
5. Sistema de alertas cuando un competidor supera a la marca

---

## 🏢 Fase 4: Enterprise

### Issue #ENTERPRISE-001: Observabilidad con OpenTelemetry

**Prioridad:** Baja  
**Estimación:** 4-6 horas  
**Labels:** `enterprise`, `observability`

**Implementación:**
- Añadir `@opentelemetry` packages
- Instrumentar HTTP requests
- Instrumentar DB queries
- Instrumentar llamadas a LLM providers
- Exportar a Jaeger/Tempo

---

### Issue #ENTERPRISE-002: Multi-tenancy Completo

**Prioridad:** Baja  
**Estimación:** 8-10 horas  
**Labels:** `enterprise`, `multi-tenancy`

**Descripción:**
Ya existe `tenant_id` en schemas, pero no está implementado.

**Cambios:**
1. Middleware de tenant resolution
2. Filtrar todas las queries por `tenant_id`
3. Row-level security en PostgreSQL
4. UI para gestión de tenants

---

### Issue #ENTERPRISE-003: Webhooks

**Prioridad:** Baja  
**Estimación:** 4-5 horas  
**Labels:** `enterprise`, `integrations`

**Descripción:**
`webhooks.router.ts` existe pero está vacío.

**Eventos a soportar:**
- `scan.completed`
- `visibility.changed` (cambio significativo)
- `competitor.mentioned`
- `hallucination.detected`
- `sentiment.alert`

---

## 📋 Checklist de Issues por Prioridad

### Críticas (Hacer primero)
- [ ] `#WORKER-001` - Implementar Workers
- [ ] `#SCAN-001` - Conectar ScanService
- [ ] `#ANALYSIS-001` - Conectar AnalysisService

### Alta Prioridad
- [ ] `#AUTH-001` - Middleware de autenticación
- [ ] `#AUTH-002` - Validación de propiedad
- [ ] `#SEC-001` - Rate limiting global
- [ ] `#TEST-001` - Suite de tests

### Media Prioridad
- [ ] `#FEATURE-001` - Agentic Fan-Out
- [ ] `#FEATURE-002` - Geo-Spatial Intelligence
- [ ] `#FEATURE-003` - Hallucination Dashboard
- [ ] `#FEATURE-004` - Competitor Intelligence

### Baja Prioridad (Enterprise)
- [ ] `#ENTERPRISE-001` - OpenTelemetry
- [ ] `#ENTERPRISE-002` - Multi-tenancy
- [ ] `#ENTERPRISE-003` - Webhooks

---

## 🔧 Quick Fixes (Biome)

```bash
# Corregir automáticamente
pnpm check:fix

# Archivos específicos a revisar:
# - apps/api/drizzle.config.ts:11 - noNonNullAssertion
# - apps/api/src/core/rag.ts:67 - noNonNullAssertion  
# - apps/web/components/landing/Sections/TheShift.tsx:3 - noUnusedImports
# - apps/web/components/layout/Header.tsx:48 - noSvgWithoutTitle
```

---

## 📈 Métricas de Éxito

| Métrica | Actual | Target |
|---------|--------|--------|
| Test Coverage | 0% | 80% |
| Linting Errors | 4 | 0 |
| Workers Implementados | 0/4 | 4/4 |
| Endpoints con Auth | 40% | 100% |
| Placeholders | 2 | 0 |

---

*Generado automáticamente desde análisis del repositorio - Febrero 2026*
