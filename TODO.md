# Tareas Pendientes - Mentha

## 🔴 Urgente / En Progreso

### Base de Datos
- [ ] **Migración para columnas de competidores** (ejecutar en SQL Editor de Supabase):
  ```sql
  ALTER TABLE competitors ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual';
  ALTER TABLE competitors ADD COLUMN IF NOT EXISTS confidence VARCHAR(20) DEFAULT 'medium';
  ALTER TABLE competitors ADD COLUMN IF NOT EXISTS favicon TEXT;
  CREATE INDEX IF NOT EXISTS idx_competitors_source ON competitors(source);
  ```

## 📦 Mejoras Pendientes

### Competitor Discovery
- [ ] Añadir más fuentes de búsqueda de competidores
- [ ] Mejorar la validación de dominios duplicados
- [ ] Guardar el historial de búsquedas de competidores

### Research Prompts
- [ ] Guardar prompts generados por IA para analytics
- [ ] Permitir templates de prompts por industria
- [ ] Historial de prompts utilizados

### Panel de Admin
- [ ] Las categorías del Step 3 (BrandProfileStep) deben venir de la BD

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
