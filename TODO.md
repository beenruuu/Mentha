# Tareas Pendientes - Mentha

## 🔴 Urgente / En Progreso

### Base de Datos - EJECUTAR EN SUPABASE
- [ ] **Migración para columnas de competidores** (ejecutar en SQL Editor de Supabase):
  ```sql
  ALTER TABLE competitors ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual';
  ALTER TABLE competitors ADD COLUMN IF NOT EXISTS confidence VARCHAR(20) DEFAULT 'medium';
  ALTER TABLE competitors ADD COLUMN IF NOT EXISTS favicon TEXT;
  CREATE INDEX IF NOT EXISTS idx_competitors_source ON competitors(source);
  ```

## 🟢 Completado Recientemente

- [x] **Step 6 (SetupStep)**: Añadido logging de debug y mejor manejo de errores
- [x] **Step 5 (ResearchPromptsStep)**: Mejorado el diseño visual
  - Loader animado con Sparkles
  - Sugerencias en lista vertical con gradiente
  - Badges de tipo más visibles
  - Botón de añadir custom más prominente
- [x] Modelo Brand actualizado con campos discovery_prompts, ai_providers, services, entity_type
- [x] Multi-source competitor discovery (LLM + Web Search)
- [x] Source tracking para competidores (🧠 AI, 🔍 Web, ✏️ Manual)
- [x] Generación de prompts con IA basados en marca/industria/competidores
- [x] Multi-categoría en BrandProfileStep con dropdown
- [x] Title Case para categorías personalizadas
- [x] Colored emoji logging en backend
- [x] Separación de descubrimiento de competidores (step 4) y análisis completo (step 7)

## ✅ Panel de Admin (Completado)
- [x] Crear tabla `categories` en base de datos para gestionar categorías dinámicamente
- [x] CRUD de categorías desde panel de admin  
- [x] Dashboard principal con métricas de usuarios, MRR, actividad
- [x] Gestión de usuarios (filtros, búsqueda, suspender, eliminar)
- [x] Panel de suscripciones con distribución por plan y revenue
- [x] Analíticas de onboarding (funnel, dropoff, completions)
- [x] Audit Log con historial de acciones administrativas
- [ ] Las categorías del Step 3 (BrandProfileStep) deben venir de la BD

## 📦 Mejoras Pendientes

### Competitor Discovery
- [ ] Añadir más fuentes de búsqueda de competidores
- [ ] Mejorar la validación de dominios duplicados
- [ ] Guardar el historial de búsquedas de competidores

### Research Prompts
- [ ] Guardar prompts generados por IA para analytics
- [ ] Permitir templates de prompts por industria
- [ ] Historial de prompts utilizados

## �📝 Notas Técnicas

### Estructura de Pasos del Onboarding
1. AboutYouStep - Info del usuario
2. CompanyStep - URL y nombre de empresa
3. BrandProfileStep - Perfil de marca + categorías
4. CompetitorsStep - Descubrimiento de competidores
5. ResearchPromptsStep - Prompts de investigación
6. ScheduleStep - Configuración de modelos IA
7. SetupStep - Guardado y trigger de análisis

### Endpoints Clave
- `POST /api/competitors/discover` - Busca competidores (LLM + Web)
- `POST /api/utils/generate-research-prompts` - Genera prompts con IA
- `POST /api/analysis/trigger/{brand_id}` - Inicia análisis completo
- `PUT /api/brands/{brand_id}` - Actualiza marca con prompts y providers
