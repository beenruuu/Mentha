# Instrucciones para Aplicar la Migración

## 📋 Pasos para aplicar `001_add_geo_tables.sql` en Supabase

### Opción 1: Desde Supabase Dashboard (Recomendado)

1. **Accede a tu proyecto en Supabase**
   - Ve a https://supabase.com/dashboard
   - Selecciona tu proyecto Mentha

2. **Abre el SQL Editor**
   - En el menú lateral, haz clic en **SQL Editor**
   - Haz clic en **New Query**

3. **Copia y ejecuta la migración**
   - Abre el archivo `supabase/migrations/001_add_geo_tables.sql`
   - Copia todo el contenido
   - Pégalo en el editor SQL de Supabase
   - Haz clic en **Run** (o presiona Ctrl+Enter)

4. **Verifica el resultado**
   - Deberías ver un mensaje de éxito
   - Ve a **Table Editor** en el menú lateral
   - Confirma que aparecen las nuevas tablas:
     - `geo_analysis_results`
     - `ai_visibility_snapshots`
     - `citation_records`
     - `brand_mentions`
     - `model_rankings`
     - `query_responses`

### Opción 2: Usando Supabase CLI

Si tienes Supabase CLI instalado:

```bash
# Conecta a tu proyecto
supabase link --project-ref YOUR_PROJECT_REF

# Aplica la migración
supabase db push
```

---

## ✅ Qué hace esta migración

- ✅ Añade columna `similarity_score` a tabla `competitors` (si no existe)
- ✅ Crea 6 nuevas tablas GEO
- ✅ Configura Row Level Security (RLS) automáticamente
- ✅ Crea 18 índices para optimizar performance
- ✅ Crea 2 vistas útiles para consultas comunes
- ✅ **No afecta ninguna tabla existente** (usa `IF NOT EXISTS`)

---

## 🔍 Verificación Post-Migración

Ejecuta esta query para verificar que todo se creó correctamente:

```sql
-- Verifica que las tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'geo_analysis_results',
    'ai_visibility_snapshots', 
    'citation_records',
    'brand_mentions',
    'model_rankings',
    'query_responses'
  )
ORDER BY table_name;
```

Deberías ver las 6 tablas listadas.

---

## 🚨 Rollback (en caso de problemas)

Si necesitas deshacer la migración:

```sql
-- CUIDADO: Esto eliminará todas las tablas GEO y sus datos
DROP TABLE IF EXISTS public.query_responses CASCADE;
DROP TABLE IF EXISTS public.model_rankings CASCADE;
DROP TABLE IF EXISTS public.brand_mentions CASCADE;
DROP TABLE IF EXISTS public.citation_records CASCADE;
DROP TABLE IF EXISTS public.ai_visibility_snapshots CASCADE;
DROP TABLE IF EXISTS public.geo_analysis_results CASCADE;

-- Eliminar las vistas
DROP VIEW IF EXISTS public.latest_visibility_scores;
DROP VIEW IF EXISTS public.citation_rates;

-- Eliminar columna añadida (opcional)
ALTER TABLE public.competitors DROP COLUMN IF EXISTS similarity_score;
```
