# 🌿 Mentha AEO - Modo Demo

## 🎯 Funcionamiento sin APIs

El proyecto está configurado para funcionar en **modo demo** sin necesidad de APIs reales. Esto te permite:

- ✅ Ver toda la interfaz funcionando
- ✅ Probar todas las características
- ✅ Hacer análisis AEO (con datos simulados)
- ✅ Navegar por todas las secciones
- ✅ Ver resultados realistas

## 🚀 Inicio Rápido (Sin APIs)

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Iniciar el Servidor

```bash
npm run dev
```

### 3. Abrir en el Navegador

Visita [http://localhost:3000](http://localhost:3000)

## 📱 Páginas Disponibles en Modo Demo

### Análisis AEO (`/aeo-analysis`)
- Formulario de análisis completamente funcional
- Simula análisis con GPT-4 o Claude
- Muestra puntuaciones y recomendaciones realistas
- **Datos mock** - No requiere API de OpenAI/Anthropic

### Keywords IA (`/keywords`)
- Tabla con keywords trackeadas
- Métricas de visibilidad
- Tendencias y posiciones
- **Datos mock** - No requiere base de datos

### Competencia (`/competitors`)
- Comparación con competidores
- Análisis de brechas
- Métricas comparativas
- **Datos mock** - Todo funciona localmente

### Dashboard (`/dashboard`)
- Vista general de métricas
- Gráficos y estadísticas
- **Datos mock** - Funciona sin backend

## 🔧 Configuración Actual

El archivo `.env.local` está configurado con:

```env
NEXT_PUBLIC_DEMO_MODE=true
```

Esto hace que:
- ❌ No se llame a APIs de OpenAI
- ❌ No se llame a APIs de Anthropic  
- ❌ No se conecte a Supabase
- ❌ No se procesen pagos con Stripe
- ✅ Se usen datos mock realistas
- ✅ Todas las interfaces funcionen
- ✅ Se simulen delays de API

## 📊 Datos Mock Disponibles

### Análisis AEO
- Puntuaciones: 0-100
- Fortalezas y debilidades
- Recomendaciones detalladas
- Keywords sugeridas

### Keywords
- 5 keywords de ejemplo
- Métricas completas
- Tendencias variadas
- Menciones en diferentes modelos IA

### Competidores
- 4 competidores principales
- Scores de visibilidad
- Análisis comparativo
- Fortalezas identificadas

## 🎨 Características Funcionales

### ✅ Sin Autenticación Requerida
Las páginas están visibles sin necesidad de login. Para testing rápido.

### ✅ UI Completa
- Sidebar con navegación
- Modo oscuro funcional
- Diseño responsivo
- Animaciones y transiciones

### ✅ Interactividad
- Formularios funcionan
- Botones responden
- Tablas ordenables
- Cards clicables

## 🔄 Cuando Tengas las APIs

### 1. Cambiar Modo Demo

Edita `.env.local`:

```env
# Cambiar de true a false
NEXT_PUBLIC_DEMO_MODE=false
```

### 2. Agregar Credenciales Reales

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-key-real
SUPABASE_SERVICE_ROLE_KEY=tu-service-key

# OpenAI
OPENAI_API_KEY=sk-tu-key-real

# Anthropic
ANTHROPIC_API_KEY=sk-ant-tu-key-real

# Stripe
STRIPE_SECRET_KEY=sk_test_tu-key-real
```

### 3. Reiniciar Servidor

```bash
# Detener con Ctrl+C
# Iniciar de nuevo
npm run dev
```

## 📝 Notas Importantes

### Sin Persistencia
Los datos en modo demo **NO se guardan**. Al recargar la página, todo vuelve al estado inicial.

### Simulación Realista
Los delays están configurados para simular llamadas reales a APIs:
- Análisis AEO: 2 segundos
- Carga de datos: instantánea

### Navegación Completa
Puedes navegar por todas las secciones:
- `/` - Landing (si existe)
- `/dashboard` - Panel principal
- `/aeo-analysis` - Análisis AEO
- `/keywords` - Keywords IA
- `/competitors` - Análisis de competencia
- `/search` - Búsqueda de marcas
- `/notifications` - Notificaciones
- `/settings` - Configuración

## 🎯 Próximos Pasos

1. **Fase 1 - Demo (Actual)**
   - ✅ Ver todo el frontend
   - ✅ Probar la UX
   - ✅ Familiarizarse con features

2. **Fase 2 - Autenticación**
   - Configurar Supabase
   - Habilitar login/registro
   - Proteger rutas

3. **Fase 3 - Análisis Real**
   - Obtener APIs de OpenAI/Anthropic
   - Conectar endpoints reales
   - Guardar resultados en BD

4. **Fase 4 - Monetización**
   - Configurar Stripe
   - Habilitar suscripciones
   - Límites por plan

## 💡 Consejos

### Para Desarrollo
```bash
# Modo demo (actual)
NEXT_PUBLIC_DEMO_MODE=true

# Rápido, sin APIs, perfecto para diseño
```

### Para Testing
```bash
# Modo hybrid
NEXT_PUBLIC_DEMO_MODE=false

# Solo las APIs que tengas configuradas
# Supabase: autenticación real
# OpenAI: análisis real
# Stripe: deshabilitado
```

### Para Producción
```bash
# Modo completo
NEXT_PUBLIC_DEMO_MODE=false

# Todas las APIs configuradas
# Todo funcionando end-to-end
```

## 🐛 Troubleshooting

### "Module not found"
```bash
npm install
```

### Cambios no se reflejan
```bash
# Limpiar cache de Next.js
rm -rf .next
npm run dev
```

### Puerto 3000 ocupado
```bash
# Usar otro puerto
PORT=3001 npm run dev
```

## 📞 Soporte

¿Problemas con el modo demo?
1. Verifica que `.env.local` existe
2. Confirma `NEXT_PUBLIC_DEMO_MODE=true`
3. Reinicia el servidor
4. Limpia cache (`rm -rf .next`)

---

**¡Disfruta explorando Mentha AEO sin necesidad de APIs! 🌿**
