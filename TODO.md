# Tareas Pendientes - Mentha

## 🔴 Urgente / En Progreso

### Onboarding Flow
- [ ] **Step 6 (SetupStep)**: Se queda en 30% "Guardando prompts de investigación..."
  - Verificar que el endpoint `PUT /api/brands/{id}` acepta `discovery_prompts` y `ai_providers`
  - La tabla `brands` en Supabase necesita columnas: `discovery_prompts` (text[]) y `ai_providers` (text[])
  - Añadir logs de debug en el backend para ver qué está fallando

- [ ] **Step 5 (ResearchPromptsStep)**: Mejorar el diseño visual
  - Actualmente funciona pero el diseño necesita pulirse más

### Base de Datos
- [ ] **Migración para columnas de competidores**:
  ```sql
  ALTER TABLE competitors ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual';
  ALTER TABLE competitors ADD COLUMN IF NOT EXISTS confidence VARCHAR(20) DEFAULT 'medium';
  ```

- [ ] **Migración para columnas de brands**:
  ```sql
  ALTER TABLE brands ADD COLUMN IF NOT EXISTS discovery_prompts TEXT[];
  ALTER TABLE brands ADD COLUMN IF NOT EXISTS ai_providers TEXT[];
  ```

## 🟡 Mejoras Pendientes

### Panel de Admin (Futuro)
- [ ] Crear tabla `categories` en base de datos para gestionar categorías dinámicamente
- [ ] CRUD de categorías desde panel de admin
- [ ] Las categorías del Step 3 (BrandProfileStep) deben venir de la BD

### Competitor Discovery
- [ ] Añadir más fuentes de búsqueda de competidores
- [ ] Mejorar la validación de dominios duplicados
- [ ] Guardar el historial de búsquedas de competidores

### Research Prompts
- [ ] Guardar prompts generados por IA para analytics
- [ ] Permitir templates de prompts por industria
- [ ] Historial de prompts utilizados

## 🟢 Completado Recientemente

- [x] Multi-source competitor discovery (LLM + Web Search)
- [x] Source tracking para competidores (🧠 AI, 🔍 Web, ✏️ Manual)
- [x] Generación de prompts con IA basados en marca/industria/competidores
- [x] Multi-categoría en BrandProfileStep con dropdown
- [x] Title Case para categorías personalizadas
- [x] Colored emoji logging en backend
- [x] Separación de descubrimiento de competidores (step 4) y análisis completo (step 7)

## 📝 Notas Técnicas

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
