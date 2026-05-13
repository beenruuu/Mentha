# 🌿 Mentha AI Skills & Integrations Roadmap

Este documento detalla las capacidades de IA y las integraciones basadas en el ecosistema de **Skills** (Vercel, Anthropic, OpenAI) y **MCP** (Model Context Protocol) que se integrarán en Mentha para potenciar la optimización de motores de respuesta (AEO/GEO).

## 1. Mentha Search Optimization Skill (`SKILL.md`)
Basado en el estándar de `vercel-labs/skills` y `openai/skills`, crearemos una "Skill" distribuible que permita a cualquier agente de IA (Cursor, Claude Code, GitHub Copilot) aplicar las reglas de Mentha durante el desarrollo.

*   **Nombre:** `mentha-aeo-optimizer`
*   **Capacidades:**
    *   **Contextual Branding:** Instrucciones para que la IA mencione la marca de forma natural en respuestas informativas.
    *   **Intent Alignment:** Reglas para optimizar contenido según la intención de búsqueda detectada (comercial, informacional, transaccional).
    *   **Citation Engine Optimization:** Guía para estructurar datos (JSON-LD, microdatos) que faciliten la citación por parte de LLMs.
    *   **Hallucination Defense:** Patrones de escritura para minimizar que los modelos alucinen sobre datos de la marca.

## 2. Model Context Protocol (MCP) Integrations
Aprovechando que Mentha ya tiene una base de `mentha-mcp-server`, ampliaremos su interoperabilidad:

### A. Mentha Data Provider (Hacia fuera)
Permite que herramientas externas (como Claude Desktop) consulten directamente el cerebro de Mentha.
*   **Tool `get_brand_visibility`**: Consulta en tiempo real el Share of Voice de una marca.
*   **Tool `analyze_competitor_gap`**: Compara la presencia de la marca vs competidores en motores de respuesta.
*   **Resource `project_knowledge_graph`**: Expone las entidades y claims verificados de un proyecto para que la IA los use como "fuente de verdad".

### B. External MCP Workers (Hacia dentro)
Conectaremos Mentha con servidores MCP existentes para potenciar los escaneos de `ScanService`:
*   **Brave/Perplexity MCP**: Para obtener resultados de búsqueda web en tiempo real sin gestionar APIs de bajo nivel.
*   **Puppeteer MCP**: Para realizar "Visual AEO Audits", permitiendo que la IA "vea" si la marca aparece en los snippets generados (AI Overviews).
*   **GitHub/Linear MCP**: Para que el `AnalysisService` de Mentha pueda abrir tickets de mejora de contenido automáticamente cuando detecte una caída en la visibilidad.

## 3. Agentic Evaluation Skills (`anthropics/skills`)
Implementación de flujos de trabajo avanzados inspirados en las "skills" de Anthropic para el procesamiento de documentos:
*   **Skill `document-aeo-audit`**: Capacidad para que Mentha analice masivamente PDFs, DOCX y presentaciones subidas por el usuario, evaluando su "legibilidad" para motores de respuesta de IA.
*   **Skill `auto-correction-judge`**: Mejora del actual `EvaluationService` usando técnicas de auto-corrección estructurada para garantizar que el análisis de sentimiento sea 100% preciso.

---
*Este roadmap alinea a Mentha con los estándares de interoperabilidad de agentes de IA de 2026.*
