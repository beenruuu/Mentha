# Bug: Scroll por palabras no funciona en Introduction

Repositorio: `nextjs-saas-landing-page-main`
Archivo afectado: `src/sections/Introduction.tsx`

Descripción:
- Se esperaba que el texto "Your SEO deserves better. Search behavior is changing..." se vaya iluminando palabra por palabra conforme se hace scroll hacia abajo.
- Estado actual: el texto principal aparece en gris (opacidad reducida) y no se enciende palabra por palabra como se esperaba. El primer fragmento "Your" debería ponerse blanco al empezar el scroll, y luego el resto de palabras sucesivamente.

Implementación actual:
- Se intentó mapear `scrollYProgress` a un índice de palabra usando `useTransform` y actualizar un estado `currentWord` con `wordIndex.on("change")`.
- También se intentó una aproximación con `motion` + `useTransform` por palabra en otro archivo, pero el efecto no queda exactamente como se quería en este template.

Pasos para reproducir:
1. Ejecutar el frontend (`cd frontend && npm run dev`).
2. Abrir la landing y desplazarse hasta la sección "The Paradigm Shift" / "Introduction".
3. Observar que las palabras no se iluminan de forma incremental.

Notas:
- Archivo donde ya se aplicaron cambios: `frontend/components/landing/sections/Introduction.tsx` (se hicieron ediciones recientes intentando replicar la lógica del template original).
- Se necesita revisar offsets en `useScroll` (`offset`), la altura del `scrollTarget`, y la sincronización entre `useTransform` y el mapeo de índice a palabra.

Solicitado por: usuario — dejar esta incidencia subida en GitHub.

Fecha: 26 de noviembre de 2025
