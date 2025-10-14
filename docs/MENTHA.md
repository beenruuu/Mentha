# Mentha — IA Visibility Platform

Mentha es un SaaS que analiza y mide la visibilidad de marcas dentro de respuestas generadas por inteligencias artificiales.

## Visión rápida
- Detectar si una marca aparece en respuestas de LLMs y motores conversacionales.
- Medir frecuencia, contexto y sentimiento de las menciones.
- Generar alertas, informes y recomendaciones para mejorar la aparición en motores de IA.

## Componentes principales
- Registro de marcas y competidores
- Scheduler de prompts hacia distintos motores de IA
- Almacenamiento histórico de respuestas y metadatos
- Parser/NLP para detección de menciones y sentimiento
- Métricas: Inclusion Rate, Visibility Score, Share of Voice, Tendencias
- Dashboard con visualizaciones y recomendaciones

## Prompts canon (ejemplos)
Los prompts deben ejecutarse con temperatura baja (0.0-0.2) para mayor determinismo.

1. Búsqueda general (contexto amplio)

```
Eres un asistente experto en [SECTOR]. Un usuario pregunta: "¿Qué empresas o herramientas conoces que ayuden con [PROBLEMA/NECESIDAD]?".
Responde con una lista corta (máx. 6) de empresas o herramientas relevantes, indicando brevemente por qué las recomiendas y proporcionando, si es posible, la URL oficial.
```

2. Búsqueda comparativa

```
Estoy investigando alternativas a [MARCA_OBJETIVO]. ¿Qué otras empresas o herramientas son comparables en funcionalidades, precio o público objetivo? Explica brevemente diferencias clave.
```

3. Búsqueda por solución específica

```
¿Qué proveedores ofrecen servicios de [SERVICIO_ESPECIFICO] para empresas como [TIPO_EMPRESA]? Menciona ejemplos y casos de uso.
```

## Métricas calculadas
- Tasa de inclusión (Inclusion Rate)
- Puntuación de visibilidad (Visibility Score) — ponderada por modelo
- Participación de voz (Share of Voice) frente a competidores
- Tendencia temporal (evolución de la Tasa de inclusión)

Nota: la UI de Mentha se integra en el panel principal bajo `/dashboard`.

## Roadmap MVP (resumen)
1. Modelos de datos y scheduler básico (checks periódicos)
2. Integración con un proveedor LLM (OpenAI) y un parser simple
3. UI de dashboard y página para administrar marcas/queries
4. Alerts por email y export CSV
5. Pricing simple: Free / Lite (€5) / Pro (€10)

---
_Documento inicial generado automáticamente. Actualizar con detalles de implementación y prompts refinados según se realicen pruebas._
