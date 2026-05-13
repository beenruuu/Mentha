# 🌿 Mentha - Guía de Configuración y Despliegue

## 📋 Requisitos Previos

| Recurso | Para qué | Coste |
|---------|----------|-------|
| Node.js >=20 | Entorno | Gratis |
| pnpm 9.x | Gestor paquetes | Gratis |
| Supabase (gratis) | Base de datos PostgreSQL | Gratis 500MB |
| OpenRouter | APIs de IA (OpenAI, Claude, etc.) | Pago por uso (~$5-10) |
| Redis (opcional) | Background workers | Local gratis |

---

## ⚙️ Configuración Paso a Paso

### 1. Supabase (Base de Datos)

1. Ve a [supabase.com](https://supabase.com) → **Start your project**
2. Crea un proyecto → Copia la **Connection String**
3. Te dará algo como:
   ```
   postgresql://postgres.abcdefg:password@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
   ```
4. Pega eso en `apps/api/.env` → `DATABASE_URL`

### 2. OpenRouter (IA Centralizada)

1. Ve a [openrouter.ai/keys](https://openrouter.ai/keys)
2. Genera una API key → te dará algo como:
   ```
   sk-or-v1-abcdef123456789...
   ```
3. Pega en `apps/api/.env` → `OPENROUTER_API_KEY`

**¿Por qué OpenRouter?** Con UNA API key tienes acceso a:

| Modelo | Precio/1M tokens | Uso en Mentha |
|--------|-----------------|---------------|
| `perplexity/sonar-pro` | $5/$20 | Búsqueda con citas |
| `openai/gpt-4o` | $2.5/$10 | Evaluación general |
| `anthropic/claude-3.5-sonnet` | $3/$15 | Análisis profundo |
| `google/gemini-2.0-flash` | GRATIS | Rápido/barato |
| `meta-llama/llama-3.3-70b` | $0.25/$1 | Alternativa barata |

### 3. Redis (Background Jobs - Opcional en Dev)

```bash
# Windows: Descarga de https://redis.io/download
# O usa Docker:
docker run -d -p 6379:6379 redis
```

Si no tienes Redis, los workers no se ejecutarán, pero el resto funciona.

### 4. JWT Secret

Genera la clave secreta:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Pega el resultado en `apps/api/.env` → `JWT_SECRET`

---

## 🚀 Comandos para Ejecutar

```bash
# 1. Instalar dependencias (ya hecho ✓)
cd C:\Users\beenruuu\Downloads\Mentha
pnpm install

# 2. Aplicar migraciones a la base de datos
cd apps/api
pnpm drizzle-kit migrate

# 3. Poblar admin (opcional)
pnpm tsx seed-admin.ts

# 4. Iniciar el SERVER WEB (puerto 3000)
# Desde la raíz:
pnpm --filter mentha-web dev

# O desde la carpeta web:
cd apps/web && pnpm dev

# 5. Iniciar la API (en otra terminal, puerto 4000)
cd apps/api && pnpm dev

# 6. Iniciar workers (tercera terminal, opcional)
cd apps/api && pnpm start:worker

# 7. O todo a la vez (si no usas Redis)
pnpm dev  # Web + API
```

---

## 🌐 Resumen de Puertos

| App | Puerto | URL |
|-----|--------|-----|
| Web (Next.js) | 3000 | http://localhost:3000 |
| API (Hono) | 4000 | http://localhost:4000 |

---

## 🧩 Archivos .env Creados

| Archivo | Estado |
|---------|--------|
| `apps/api/.env` | ✅ Creado - **COMPLETAR DATABASE_URL, JWT_SECRET y OPENROUTER_API_KEY** |
| `apps/web/.env.local` | ✅ Creado |
| `apps/cli/.env` | ⚠️ Opcional (usa la API) |

---

## 🏗️ Arquitectura General

```
MENTHA MONOREPO
├── apps/web          → Frontend Next.js (React, Tailwind, Recharts)
├── apps/api          → Backend Hono + Drizzle ORM + PostgreSQL
│   ├── services/     → Lógica de negocio (keyword, analysis, scan...)
│   ├── core/search/  → Providers LLM (OpenAI, Perplexity, Gemini, Claude, OpenRouter)
│   └── workers/      → BullMQ para background jobs
├── apps/cli          → CLI interactiva 
├── apps/mcp          → Servidor MCP para Claude Code
└── packages/core     → Tipos y cliente RPC compartidos
```

## 🔄 Flujo de Uso Típico

1. **Registro/Login** → JWT token
2. **Crear Proyecto** → Añadir dominio y competidores
3. **Añadir Keywords** → Configurar qué buscar y en qué motores
4. **Ejecutar Scan** → Mentha consulta a los LLMs sobre tu marca
5. **Dashboard** → Resultados de visibilidad, share of model, sentimiento
6. **Authority** → Ver qué fuentes citan los LLMs
7. **Knowledge Graph** → Definir entidades para mejorar citaciones

---

## 💡 Tips Finales

- **OpenRouter es CLAVE**: Centraliza todos los LLMs en un solo API key
- **Sin Redis**: El sistema funciona sin workers (solo escaneos manuales)
- **Sin Datos Reales**: Si no configuras API keys, la app se ve vacía
- **La app ya está corriendo**: http://localhost:3000 🎉
