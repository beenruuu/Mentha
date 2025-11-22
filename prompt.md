ROL: Eres un equipo completo (Product Manager senior, UX/UI lead, CRO copywriter, Growth marketer, Full-stack developer senior, DevOps, Data Engineer, Legal tech writer) que entrega un producto SaaS listo para lanzar.

PROYECTO: Mentha — Plataforma integral GEO (Generative Engine Optimization) para que marcas sean citadas por motores generativos de IA (ChatGPT, Gemini, Perplexity, Claude, Google SGE, etc.) y convertir esa visibilidad en negocio.

OBJETIVO DEL MODELO: Generar **todo** lo necesario para construir, lanzar y documentar Mentha (landing + producto + legal + diseño + código guía + plan GTM + contenido). Entregar el resultado dividido en secciones navegables.

ESTADO ACTUAL (NOV 2025):
- Ya existe un frontend completo en Next.js (App Router + Tailwind) dentro de `frontend/app/` y los componentes viven en `frontend/components/`. Incluye landing, dashboard, vistas de keywords, settings, flujos auth y navegación lateral (`AppSidebar`). Ese diseño debe mantenerse como base visual.
- El contenido actual es estático/demo. Falta conectar la UI a datos reales (Supabase, APIs Python) y completar docs, backend, legal y GTM.
- La raíz ya sigue la arquitectura del template Vibe (carpetas `frontend/`, `backend/`, `supabase/`, Makefile, docker-compose*, `.cursor/rules`). Mantén esa estructura como fuente de verdad.

LINEAMIENTOS DE ADAPTACIÓN:
- No reescribas el frontend desde cero. Propón solo mejoras puntuales (copy, microinteracciones, nuevos módulos que encajen con las pantallas existentes) y asegúrate de que cualquier snippet respete la estructura `app/<sección>` y los componentes actuales.
- Cuando generes wireframes, microcopy o especificaciones de UI, referencia explícitamente las pantallas ya implementadas (landing, dashboard, keywords, competitors, notifications, settings, auth) y explica cómo se alimentarán con datos reales.
- Centra el esfuerzo en definir backend (FastAPI + workers), Supabase schema, integraciones y documentación que conecten con el frontend actual.
- Describe cómo reemplazar los datos mock con consultas reales y qué hooks/servicios TypeScript se deben crear en `lib/` o `hooks/` para hablar con la API.

ALINEACIÓN CON VIBE CODING TEMPLATE:
- La repo ya replica la estructura del template (frontend/, backend/, supabase/, docker-compose, Makefile, Cursor rules). Cualquier propuesta debe indicar cómo se integra sin romper esa separación.
- Explica qué partes del template (backend FastAPI, configuración Supabase, scripts de Make) se extienden o modifican y cómo se conectarán con el frontend existente.
- Si propones automatizaciones CI/CD, toma como referencia los pipelines del template e indica ajustes necesarios para Mentha.

CONSTRAINTS TÉCNICAS OBLIGATORIAS:
- Frontend: Next.js (app router), React, Tailwind CSS (o CSS Modules), TypeScript.
- Backend: Python (FastAPI o Flask) como API principal + workers en Python (RQ o Celery) para tareas batch; autenticación con JWT/OAuth.
- Base de datos y hosting: Supabase (Postgres + Storage + Auth). Diseña esquemas concretos de tablas en SQL para Supabase.
- Integraciones: Shopify, WordPress, GA4, Slack, Google Search Console, y conectores para feeds y crawlers; webhooks y OAuth donde proceda.
- Infraestructura: Docker, CI/CD (GitHub Actions), deploy recomendado (Vercel para Next.js, Supabase Edge/Cloud Run for Python, o DigitalOcean App Platform).
- Seguridad: RBAC, rate limiting, rotating API keys, repository of secrets (Vault tip), DPA/GDPR compliance.

ENTREGABLES (detallados — producir cada uno al máximo nivel):
1) **NOMBRE + SLOGAN + POSICIONAMIENTO**
   - Nombre definitivo: Mentha (y 3 alternativas cortas).
   - Slogan principal (1 linea) y variaciones.
   - Elevator pitch (20 palabras).
   - Hero copy (principal + secundaria orientada a conversión).

2) **LANDING PAGE LARGA (copy completo, sección por sección)**:
   - Hero con 2 CTAs (Start free / Book demo).
   - Social proof (logos, métricas ejemplo).
   - Beneficios clave + bullets (comparación con AthenaHQ / Goodie).
   - GEO vs SEO tradicional — tabla comparativa.
   - Cómo funciona (diagrama en texto de 4 pasos).
   - Por qué ahora (datos y argumentos).
   - Casos de uso (ecommerce, SaaS, publishers, agencias).
   - Integraciones (lista y mini-descripciones).
   - Preview del dashboard (screenshots mockup describiéndolos).
   - Testimonios inventados realistas (4).
   - Pricing summary + CTA final.
   - Footer completo (links, contacto, redes).
   - Ajusta el copy al diseño existente en `app/page.tsx` (hero centrado + grid de 3 features) e indica cómo extenderlo con nuevas secciones scrollables mantenidas en la misma estética.

3) **SITEMAP / ARQUITECTURA DE LA WEB**:
   - Páginas públicas + internas + admin + docs + API.
   - Lista completa de endpoints REST/GraphQL públicos y privados (ruta, método, payload ejemplo).

4) **DASHBOARD DEL PRODUCTO — DESCRIPCIÓN MILIMÉTRICA DE CADA PANTALLA**:
   - **Panel Principal:** Geo Visibility Score (fórmula propuesta), AI Engine Share of Voice, trendlines, top prompts, competidores, alertas, timeline histórico, impacto por región/idioma.
   - **Prompt Volume:** lista de prompts, volumen (metric definition), tags, heatmap por engine, export CSV, filtros.
   - **Content Gaps:** queries no cubiertas, prioridad, plantilla de artículo GEO-ready, generador automático de contenido (prompt + parámetros), JSON-LD schema auto-generated.
   - **Action Center:** recomendaciones ejecutables (reescribir, añadir FAQ, schema, outreach), priorización automática (impacto × esfuerzo), tasks con asignación y deadlines.
   - **Backlink & Citation Engine:** lista de fuentes que alimentan modelos, autoridad, probabilidad de que IA cite, outreach automático (plantillas de email, seguimiento).
   - **Attribution & Conversion:** modelos de atribución (last AI-touch, multi-touch), funnels, integración con Shopify/GA4/CRM para medir leads/ventas atribuibles a citas IA.
   - **Settings:** equipos y roles, dominios, languages, API tokens, webhooks.
   - Para cada pantalla, especifica: componentes UI (tables, charts, cards), props principales, mock data example, y microcopy.
   - Mapear cada descripción a las rutas ya creadas (`/dashboard`, `/keywords`, `/competitors`, `/notifications`, `/settings`, `/brand/[id]`, `/search`, `/aeo-analysis`, `/auth/*`) detallando qué datos reales reemplazarán los mocks actuales.

5) **FEATURES AVANZADAS (cómo implementarlas técnicamente)**:
   - Crawling + ingestion pipeline: extractor de HTML, indexador semántico (embeddings), versionado de snapshots, y refresh cron jobs en workers.
   - Monitorización de modelos: cómo simular queries en diferentes AI engines (open APIs / scraping / SDKs), almacenar respuestas y extraer si citan el dominio.
   - Prompt Volume pipeline: instrumentación para capturar prompts (public datasets, browser extensions telemetry, partners) y normalización.
   - Action Center logic: reglas, scoring y templates generados por LLM (instrucciones para prompt engineering).
   - Outreach automation: flows, throttling, open/click tracking, templates dinámicos.

6) **ESQUEMA DE BASE DE DATOS (Supabase SQL)**:
   - Tablas principales con campos: organizations, users, projects, domains, prompts, prompt_volumes, citations, citations_sources, content_items, tasks, backlinks, audits, events, attributions, integrations.
   - Incluye SQL CREATE TABLE para cada tabla (clave primaria, índices, FK).
   - Ejemplos de queries analíticas (share of voice, top prompts, ROI).

7) **API / RUTAS (FastAPI ejemplo)**:
   - Rutas auth (signup, login, refresh), user (profile, roles), projects, domains, prompts, citations, tasks, report generation, webhook endpoints, admin endpoints.
   - Ejemplo de payloads JSON y respuestas.
   - Ejemplo de implementación de uno o dos endpoints en Python (esqueleto FastAPI).
   - Señala en qué módulos del backend del template (`backend/app/api/`) vivirán las rutas y cómo se conectarán con Supabase y con los servicios que consumirá el frontend actual.

8) **DISEÑO VISUAL + GUIDELINES**:
   - Paleta de colores (hex), tipografías, espaciados, ejemplos de cards, inputs, botones.
   - Specs para responsive (breakpoints).
   - Mini-design system: tokens, componentes clave (table, chart card, status badge, modal).
   - Accesibilidad (WCAG checklist).

9) **COPYWRITING + MICROCOPY**:
   - Todos los textos (hero, features, tooltips, errores, placeholders).
   - Emails automáticos (welcome, verify, onboarding steps, trial expiry, alerts IA).
   - 10 líneas para onboarding conversacional.

10) **BLOG: 10 ARTÍCULOS INICIALES (contenido completo)**:
    - Titulares SEO, meta description, estructura H2/H3, contenido ~800–1500 palabras cada uno, imágenes sugeridas y CTA.
    - Temas: Qué es GEO vs SEO, cómo aparecer en ChatGPT, medir Prompt Volume, caso ecommerce, etc.

11) **LEGAL**:
    - Aviso legal, Términos y condiciones, Política de privacidad, Cookie policy + banner text, DPA (Data Processing Agreement), GDPR & CCPA guidance, Security policy. (Escribir textos listos para copiar y adaptar por abogado.)

12) **ONBOARDING & PRODUCT TOUR**:
    - Flujo de onboarding con checklist (connect domain, connect CMS, run first scan, configure action center).
    - Contenido para tooltips y flows step-by-step.

13) **PRICING & PLANS**:
    - Plan freemium/lite, starter, growth, enterprise/agency, con feature matrix y límites (domains, seats, queries).
    - Upsell playbooks (agencia dashboard, white-label).

14) **GTM / LAUNCH STRATEGY**:
    - Targeting inicial (agencias, ecommerce, SaaS).
    - Lead magnets (auditorías gratis), webinars, partnerships, press outreach.
    - KPIs de lanzamiento y funnel.

15) **IMPLEMENTATION GUIDE (lista de tareas para devs con prioridad)**:
    - MVP scope (what to build first — e.g., monitoring + action center minimal + attribution).
    - Roadmap 3, 6, 12 meses.
    - Recomendaciones de librerías (embeddings, vector DB if needed — pero preferir Supabase full-text + pgvector extension), LLM providers, observability (Sentry, Prometheus).
   - Incluye un plan de migración para adoptar la estructura `vibe-coding-template-main` (frontend/, backend/, supabase/, docker-compose, Makefile) detallando dependencias y orden sugerido.

16) **ENTREGABLE FINAL + FORMATO**:
    - Generar todo como un documento estructurado y exportable a Markdown o HTML.
    - Proveer snippets listos para copiar (SQL, FastAPI skeleton, Next.js pages).

ESPECIFICACIONES ADICIONALES:
- Usa ejemplos y datos ficticios realistas (logos, cifras).
- Menciona claramente qué partes requieren revisión legal (textos legales).
- Prioriza usabilidad para pymes (plan freemium, plantillas automáticas).
- Incluye checklist de seguridad y privacidad por diseño (GDPR).
- Sé crítico con las soluciones existentes (AthenaHQ, Goodie, KAI Footprint) y describe mejoras concretas (más accesible, mejor atribución, outreach automatizado, planes asequibles).
- Al final, ofrece un **README** ejecutivo de 1 página que resuma lo esencial para un CTO que debe aprobar el presupuesto.

OUTPUT FORMAT:
- Divide en secciones numeradas.
- Al principio: TL;DR con 10 bullets clave.
- Incluir ejemplos de SQL y de código Python/Next.js (no archivos completos gigantescos, pero sí plantillas que se puedan pegar y ejecutar).
- Genera 5 tasks iniciales listos para asignar en Trello/Jira con estimates de complejidad (S/M/L).

META: Haz que Mentha sea la referencia GEO: **acciónable**, **demostrable** (attribution), **accesible** (freemium) y **escalable** (multidomain & multi-region).

FIN DEL PROMPT
