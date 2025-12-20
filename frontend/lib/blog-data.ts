
export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  author: string;
  category: string;
  readTime: string;
  image: string;
  featured?: boolean;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "que-es-aeo-guia-completa-2025",
    title: "Qué es AEO: La Guía Definitiva para 2025",
    excerpt: "Answer Engine Optimization (AEO) está transformando el SEO. Descubre cómo optimizar tu marca para aparecer en las respuestas de ChatGPT, Claude, Perplexity y otros motores de IA.",
    date: "19 de Diciembre, 2024",
    author: "Equipo Mentha",
    category: "Estrategia AEO",
    readTime: "8 min",
    image: "/blog/aeo-guide.jpg",
    featured: true,
    content: `
      <h2>🔄 La Revolución de la Búsqueda: De Keywords a Respuestas</h2>
      
      <p>Durante dos décadas, el SEO se ha centrado en posicionarse para palabras clave. Optimizas una página, consigues backlinks y esperas aparecer en los 10 enlaces azules. <strong>Pero el juego ha cambiado radicalmente.</strong></p>
      
      <p>Con el auge de los Modelos de Lenguaje Grande (LLMs) y motores de búsqueda potenciados por IA como <strong>ChatGPT, Claude y Perplexity</strong>, los usuarios ya no buscan enlaces—piden respuestas directas.</p>
      
      <blockquote>
        <p>💡 <strong>Dato clave:</strong> Más del 40% de la Generación Z utiliza TikTok o ChatGPT como su motor de búsqueda principal en lugar de Google.</p>
      </blockquote>
      
      <h2>🎯 ¿Qué es Answer Engine Optimization (AEO)?</h2>
      
      <p>AEO es el arte y la ciencia de optimizar tu presencia digital para ser citado como fuente principal de información por modelos de IA. A diferencia del SEO, que apunta al índice de un buscador, <strong>AEO apunta al "conocimiento" de una IA</strong>.</p>
      
      <h3>Diferencias Clave entre SEO y AEO</h3>
      
      <table>
        <thead>
          <tr>
            <th>Aspecto</th>
            <th>SEO Tradicional</th>
            <th>AEO</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Objetivo</strong></td>
            <td>Posicionamiento en SERPs</td>
            <td>Ser citado en respuestas de IA</td>
          </tr>
          <tr>
            <td><strong>Meta</strong></td>
            <td>Conseguir clics</td>
            <td>Obtener menciones y "share of voice"</td>
          </tr>
          <tr>
            <td><strong>Contenido</strong></td>
            <td>A veces premia contenido extenso</td>
            <td>Información concisa y estructurada</td>
          </tr>
          <tr>
            <td><strong>Métricas</strong></td>
            <td>Posiciones en rankings</td>
            <td>Frecuencia de citación y sentiment</td>
          </tr>
        </tbody>
      </table>

      <h2>📈 Por Qué AEO es Crítico en 2025</h2>
      
      <p>Las marcas que no optimicen para motores de respuesta están perdiendo una audiencia cada vez mayor que confía en las respuestas de IA para decisiones de compra.</p>
      
      <p>Los cambios clave que veremos este año incluyen:</p>
      
      <ul>
        <li>🚀 Mayor adopción de ChatGPT Search y Perplexity como alternativas a Google</li>
        <li>🤖 Integración de IA en más dispositivos y aplicaciones</li>
        <li>📱 Búsqueda por voz potenciada por LLMs</li>
        <li>🔗 Menor dependencia de los "10 enlaces azules" tradicionales</li>
      </ul>

      <h2>🛠️ Cómo Empezar con AEO</h2>
      
      <p>Para ganar en esta nueva era, necesitas enfocarte en <strong>Autoridad de Entidad</strong>. Asegúrate de que tu marca, productos y conceptos clave estén claramente definidos de forma que las máquinas puedan entender.</p>
      
      <blockquote>
        <p>✅ <strong>Pro tip:</strong> Tu página "Acerca de" es a menudo el primer lugar donde una IA busca para entender una entidad. Optimízala con definiciones claras.</p>
      </blockquote>
      
      <h3>5 Pasos Prácticos para Comenzar</h3>
      
      <ol>
        <li><strong>Audita tu presencia actual</strong> — Usa herramientas como Mentha para medir tu visibilidad en motores de IA</li>
        <li><strong>Implementa marcado estructurado</strong> — JSON-LD ayuda a las IAs a entender el contexto de tu contenido</li>
        <li><strong>Crea contenido que responda preguntas</strong> — Enfócate en preguntas específicas de tu industria</li>
        <li><strong>Monitorea a la competencia</strong> — Observa cómo aparecen tus competidores en respuestas de IA</li>
        <li><strong>Optimiza tu identidad de marca</strong> — Información clara y consistente sobre quién eres</li>
      </ol>
    `
  },
  {
    slug: "como-aparecer-en-chatgpt-perplexity",
    title: "7 Estrategias Probadas para Aparecer en ChatGPT y Perplexity",
    excerpt: "ChatGPT y Perplexity se están convirtiendo en las herramientas de búsqueda principales para millones de usuarios. Aquí tienes estrategias accionables para que tu marca sea recomendada.",
    date: "18 de Diciembre, 2024",
    author: "Equipo Mentha",
    category: "Guía SEO",
    readTime: "6 min",
    image: "/blog/chatgpt-search.jpg",
    content: `
      <h2>🎯 Por Qué ChatGPT y Perplexity Importan Para Tu Marca</h2>
      
      <p>ChatGPT no es solo un chatbot; con sus capacidades de navegación, es un <strong>motor de respuestas en tiempo real</strong>. Cuando un usuario pregunta "¿Cuál es el mejor CRM para pequeñas empresas?", quieres que ChatGPT diga <em>tu</em> nombre.</p>
      
      <p>Perplexity va un paso más allá, combinando búsqueda web en tiempo real con síntesis de IA, convirtiéndose en un competidor directo de Google para consultas informativas.</p>
      
      <blockquote>
        <p>📊 <strong>Estadística importante:</strong> Las búsquedas en Perplexity han crecido un 300% en el último año, especialmente para consultas de investigación y comparación de productos.</p>
      </blockquote>

      <h2>📋 Las 7 Estrategias Clave</h2>

      <h3>1. 👑 Sé la Autoridad en Tu Nicho</h3>
      
      <p>Publica <strong>whitepapers de alta calidad</strong> y estudios con datos originales. Los LLMs adoran citar fuentes de datos primarias.</p>
      
      <ul>
        <li>Crea estudios con estadísticas únicas de tu industria</li>
        <li>Publica investigaciones originales que otros puedan citar</li>
        <li>Actualiza regularmente tus datos para mantener relevancia</li>
      </ul>
      
      <h3>2. 🏗️ Estructura Tu Contenido para Máquinas</h3>
      
      <p>Si un LLM puede parsear tu contenido fácilmente, es más probable que lo use. Evita párrafos densos sin estructura.</p>
      
      <ul>
        <li>✓ Usa encabezados claros (H2, H3)</li>
        <li>✓ Incluye listas con viñetas</li>
        <li>✓ Añade tablas para comparaciones</li>
        <li>✗ Evita bloques de texto largos sin formato</li>
      </ul>
      
      <h3>3. 🤝 Trabaja la Co-ocurrencia de Marca</h3>
      
      <p>Haz que tu marca sea mencionada junto a líderes de la industria. Los LLMs entienden conceptos por asociación.</p>
      
      <blockquote>
        <p>💡 <strong>Ejemplo:</strong> Si vendes software de gestión de proyectos, aparecer en artículos que también mencionan a Asana, Monday o Trello te posiciona en la misma categoría.</p>
      </blockquote>
      
      <h3>4. 📝 Optimiza Tu Página "Acerca de"</h3>
      
      <p>Asegúrate de que tu página "Quiénes Somos" defina claramente quién eres y qué haces. A menudo es el <strong>primer lugar donde una IA busca</strong> para entender una entidad.</p>
      
      <h3>5. 🔧 Implementa Schema Markup Extensivo</h3>
      
      <p>El marcado estructurado es fundamental:</p>
      
      <ul>
        <li><code>Organization</code> — Para definir tu entidad</li>
        <li><code>Product</code> — Para tus productos/servicios</li>
        <li><code>FAQPage</code> — Para preguntas frecuentes</li>
        <li><code>HowTo</code> — Para guías y tutoriales</li>
      </ul>
      
      <h3>6. ❓ Responde Preguntas Específicas</h3>
      
      <p>Crea páginas de FAQ detalladas y artículos que respondan preguntas concretas. Los LLMs buscan respuestas directas a consultas de usuarios.</p>
      
      <h3>7. 📊 Monitorea Tus Menciones</h3>
      
      <p>Usa herramientas como <strong>Mentha</strong> para rastrear con qué frecuencia y en qué contexto tu marca es mencionada por modelos de IA. Esto te permite iterar y mejorar tu estrategia.</p>
    `
  },
  {
    slug: "tutorial-monitorear-marca-mentha",
    title: "Tutorial: Cómo Monitorear Tu Marca en IA con Mentha",
    excerpt: "Guía paso a paso para configurar el monitoreo de tu marca y rastrear tu visibilidad en ChatGPT, Claude, Gemini y Perplexity usando Mentha.",
    date: "17 de Diciembre, 2024",
    author: "Equipo Mentha",
    category: "Tutorial",
    readTime: "5 min",
    image: "/blog/mentha-tutorial.jpg",
    content: `
      <h2>🚀 Empezando con Mentha</h2>
      
      <p>Mentha es la plataforma líder de Answer Engine Optimization (AEO) que te permite monitorear cómo aparece tu marca en las respuestas de los principales modelos de IA. Esta guía te llevará desde el registro hasta tu primer análisis.</p>

      <h2>📝 Paso 1: Crear Tu Cuenta</h2>
      
      <p>Visita <strong>mentha.ai</strong> y haz clic en "Comenzar Gratis". Puedes registrarte con tu email o usar Google para un acceso más rápido.</p>
      
      <blockquote>
        <p>🎁 <strong>Plan gratuito:</strong> Incluye 10 análisis mensuales para empezar a explorar la plataforma.</p>
      </blockquote>

      <h2>➕ Paso 2: Añadir Tu Primera Marca</h2>
      
      <p>Una vez en el dashboard, haz clic en "Crear Marca" e introduce la siguiente información:</p>
      
      <table>
        <thead>
          <tr>
            <th>Campo</th>
            <th>Descripción</th>
            <th>Ejemplo</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Nombre</strong></td>
            <td>Nombre oficial de tu empresa</td>
            <td>Mi Empresa SL</td>
          </tr>
          <tr>
            <td><strong>Dominio</strong></td>
            <td>Tu sitio web principal</td>
            <td>miempresa.com</td>
          </tr>
          <tr>
            <td><strong>Descripción</strong></td>
            <td>Qué ofreces brevemente</td>
            <td>Software de gestión para pymes</td>
          </tr>
          <tr>
            <td><strong>Industria</strong></td>
            <td>Tu sector</td>
            <td>Tecnología B2B</td>
          </tr>
        </tbody>
      </table>

      <h2>🔍 Paso 3: Configurar Prompts de Investigación</h2>
      
      <p>Los prompts son las consultas que Mentha enviará a los modelos de IA. Tienes tres opciones:</p>
      
      <ol>
        <li><strong>Automáticos:</strong> Prompts sugeridos basados en tu industria</li>
        <li><strong>Personalizados:</strong> Crea tus propios prompts como "¿Cuál es la mejor herramienta de [tu categoría]?"</li>
        <li><strong>Importados:</strong> Basados en prompts de competidores conocidos</li>
      </ol>

      <h2>👥 Paso 4: Añadir Competidores</h2>
      
      <p>Para un análisis completo, añade <strong>3-5 competidores directos</strong>. Mentha comparará tu visibilidad con la de ellos en cada modelo de IA.</p>

      <h2>▶️ Paso 5: Ejecutar Tu Primer Análisis</h2>
      
      <p>Haz clic en "Ejecutar Análisis" para obtener tu primera evaluación. Mentha te mostrará:</p>
      
      <ul>
        <li>📊 <strong>Puntuación de visibilidad global</strong> — De 0 a 100</li>
        <li>📈 <strong>Tasa de inclusión</strong> — % de consultas donde apareces</li>
        <li>🎯 <strong>Posición promedio</strong> — Cuando eres mencionado</li>
        <li>🤖 <strong>Desglose por modelo de IA</strong> — ChatGPT, Claude, Gemini, Perplexity</li>
      </ul>

      <h2>📖 Paso 6: Interpretar los Resultados</h2>
      
      <p>El dashboard usa un sistema de colores intuitivo:</p>
      
      <ul>
        <li>🟢 <strong>Verde:</strong> Áreas donde dominas</li>
        <li>🟡 <strong>Amarillo:</strong> Oportunidades de mejora</li>
        <li>🔴 <strong>Rojo:</strong> Gaps críticos donde los competidores te superan</li>
      </ul>
      
      <blockquote>
        <p>⚡ <strong>Siguiente paso:</strong> Configura análisis automáticos semanales para rastrear tu progreso. Mentha te enviará alertas cuando haya cambios significativos.</p>
      </blockquote>
    `
  },
  {
    slug: "analisis-competidores-mentha",
    title: "Análisis de Competidores: Domina Tu Nicho en Búsquedas IA",
    excerpt: "Aprende a usar la inteligencia competitiva de Mentha para identificar brechas de contenido y superar a tus rivales en las respuestas de IA.",
    date: "16 de Diciembre, 2024",
    author: "Equipo Mentha",
    category: "Tutorial",
    readTime: "7 min",
    image: "/blog/competitor-analysis.jpg",
    content: `
      <h2>🔍 Por Qué el Análisis Competitivo en IA es Diferente</h2>
      
      <p>En SEO tradicional, analizas backlinks, rankings de keywords y autoridad de dominio. En AEO, el juego es completamente diferente: necesitas entender <strong>cómo y por qué los modelos de IA mencionan a tus competidores</strong>.</p>

      <h2>⚙️ Configurando el Análisis de Competidores</h2>
      
      <h3>Tipos de Competidores a Considerar</h3>
      
      <p>No solo añadas competidores directos. Considera estas tres categorías:</p>
      
      <table>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Descripción</th>
            <th>Por qué importa</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Directos</strong></td>
            <td>Mismo producto/servicio</td>
            <td>Compiten por las mismas consultas</td>
          </tr>
          <tr>
            <td><strong>De Contenido</strong></td>
            <td>Blogs y publicaciones del nicho</td>
            <td>Dominan el espacio informativo</td>
          </tr>
          <tr>
            <td><strong>Emergentes</strong></td>
            <td>Startups nuevas con tracción</td>
            <td>Pueden desplazarte rápidamente</td>
          </tr>
        </tbody>
      </table>

      <h2>📊 Métricas Clave a Monitorear</h2>
      
      <h3>Share of Voice</h3>
      
      <p>Porcentaje de veces que tu marca es mencionada vs. competidores en respuestas a los mismos prompts.</p>
      
      <blockquote>
        <p>🎯 <strong>Objetivo:</strong> Un share of voice del 30%+ en tu categoría es excelente.</p>
      </blockquote>
      
      <h3>Posición Relativa</h3>
      
      <p>Cuando múltiples marcas son mencionadas, ¿apareces primero, segundo o más atrás? Las posiciones 1-2 reciben significativamente más atención del usuario.</p>
      
      <h3>Sentiment</h3>
      
      <p>¿Cómo habla la IA de tu marca vs. competidores?</p>
      
      <ul>
        <li>😊 <strong>Positivo:</strong> "Excelente herramienta", "muy recomendado"</li>
        <li>😐 <strong>Neutro:</strong> Mención sin valoración</li>
        <li>😟 <strong>Negativo:</strong> Críticas o limitaciones destacadas</li>
      </ul>

      <h2>🕳️ Identificar Brechas de Contenido</h2>
      
      <p>El análisis de <strong>"Content Gap"</strong> de Mentha te muestra:</p>
      
      <ul>
        <li>📍 Consultas donde competidores aparecen y tú no</li>
        <li>📝 Temas donde tu cobertura es insuficiente</li>
        <li>💎 Keywords de alta oportunidad para nuevo contenido</li>
      </ul>

      <h2>🚀 Estrategias para Superar a Competidores</h2>
      
      <ol>
        <li><strong>Cubre los gaps</strong> — Crea contenido para los temas donde estás ausente</li>
        <li><strong>Estructura mejor</strong> — Mejora el markup y claridad de tu contenido</li>
        <li><strong>Actualiza frecuentemente</strong> — Los LLMs prefieren información reciente</li>
        <li><strong>Construye autoridad</strong> — Consigue menciones en fuentes que la IA ya cita</li>
      </ol>
    `
  },
  {
    slug: "tendencias-busqueda-ia-2025",
    title: "Tendencias de Búsqueda IA en 2025: Lo Que Viene",
    excerpt: "Desde la búsqueda multimodal hasta los agentes de IA, exploramos las tendencias que definirán la optimización para motores de respuesta en el próximo año.",
    date: "15 de Diciembre, 2024",
    author: "Equipo Mentha",
    category: "Tendencias",
    readTime: "6 min",
    image: "/blog/ai-trends-2025.jpg",
    content: `
      <h2>🌍 El Panorama de Búsqueda está Evolucionando</h2>
      
      <p>2024 marcó el año en que la búsqueda impulsada por IA pasó de novedad a mainstream. Google lanzó AI Overviews, OpenAI integró búsqueda web en ChatGPT, y Perplexity creció exponencialmente.</p>
      
      <blockquote>
        <p>🔮 <strong>Predicción:</strong> En 2025, esperamos cambios aún más significativos que transformarán cómo las marcas compiten por visibilidad.</p>
      </blockquote>

      <h2>🎯 Las 6 Tendencias Clave</h2>

      <h3>1. 🖼️ Búsqueda Multimodal</h3>
      
      <p>Los usuarios no solo escribirán consultas—usarán <strong>voz, imágenes y video</strong> para buscar. Las marcas deben optimizar:</p>
      
      <ul>
        <li>Alt text descriptivo y contextual en imágenes</li>
        <li>Transcripciones de videos y podcasts</li>
        <li>Contenido optimizado para búsqueda por voz</li>
      </ul>

      <h3>2. 🛒 Agentes de IA para Compras</h3>
      
      <p>Los "AI Shopping Agents" automatizarán la investigación de productos. Un usuario dirá "Encuentra el mejor software de facturación para mi startup" y un agente consultará múltiples fuentes.</p>
      
      <blockquote>
        <p>⚠️ <strong>Importante:</strong> Las marcas deben aparecer en estas comparaciones automatizadas o perderán oportunidades de venta.</p>
      </blockquote>

      <h3>3. 👤 Personalización Basada en Contexto</h3>
      
      <p>Los LLMs tendrán cada vez más contexto sobre el usuario: ubicación, historial, preferencias. La optimización local y por segmento será crítica.</p>

      <h3>4. ✓ Verificación de Información en Tiempo Real</h3>
      
      <p>Con el problema de las "alucinaciones", los motores de IA integrarán cada vez más verificación de fuentes. Las marcas con información verificable tendrán ventaja.</p>

      <h3>5. 🔀 Fragmentación de Plataformas</h3>
      
      <p>No habrá un solo "ganador" de la búsqueda IA:</p>
      
      <table>
        <thead>
          <tr>
            <th>Plataforma</th>
            <th>Uso Principal</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>ChatGPT</strong></td>
            <td>Consultas generales y razonamiento</td>
          </tr>
          <tr>
            <td><strong>Perplexity</strong></td>
            <td>Investigación con fuentes citadas</td>
          </tr>
          <tr>
            <td><strong>Claude</strong></td>
            <td>Análisis de documentos largos</td>
          </tr>
          <tr>
            <td><strong>Gemini</strong></td>
            <td>Integración con ecosistema Google</td>
          </tr>
        </tbody>
      </table>

      <h3>6. 📉 El Fin del "Contenido SEO"</h3>
      
      <p>El contenido hecho solo para posicionar (palabra clave repetida, relleno artificial) será penalizado. Los LLMs detectan contenido de baja calidad.</p>

      <h2>✅ Cómo Prepararse</h2>
      
      <p>Las marcas que quieran liderar en 2025 deben:</p>
      
      <ol>
        <li>🔍 Empezar a monitorear su visibilidad en IA ahora</li>
        <li>✍️ Invertir en contenido estructurado y de alta calidad</li>
        <li>🌐 Diversificar presencia en múltiples plataformas de IA</li>
        <li>🔄 Actualizar información regularmente</li>
      </ol>
    `
  },
  {
    slug: "schema-markup-para-ia",
    title: "Schema Markup para IA: Guía Técnica Completa",
    excerpt: "Implementación práctica de JSON-LD y Schema.org para mejorar cómo los modelos de IA entienden y citan tu contenido.",
    date: "14 de Diciembre, 2024",
    author: "Equipo Mentha",
    category: "Guía SEO",
    readTime: "10 min",
    image: "/blog/schema-markup.jpg",
    content: `
      <h2>🏗️ Por Qué Schema Importa para AEO</h2>
      
      <p>El marcado Schema (Schema.org) es un vocabulario estructurado que ayuda a las máquinas a entender el contenido de tu sitio. Para AEO es <strong>fundamental</strong>: proporciona a los LLMs contexto explícito sobre qué es tu marca.</p>
      
      <blockquote>
        <p>💡 <strong>Clave:</strong> Mientras que para SEO mejora los rich snippets, para AEO define tu identidad ante los modelos de IA.</p>
      </blockquote>

      <h2>📋 Tipos de Schema Esenciales</h2>

      <h3>Organization Schema</h3>
      
      <p>Define quién eres como entidad. Incluye nombre, URL, logo, descripción, fecha de fundación y perfiles sociales.</p>
      
      <pre><code>{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Tu Empresa",
  "url": "https://tuempresa.com",
  "logo": "https://tuempresa.com/logo.png",
  "description": "Descripción clara",
  "foundingDate": "2020"
}</code></pre>

      <h3>Product Schema</h3>
      
      <p>Para productos o servicios específicos. Incluye nombre, descripción, marca y ofertas con precios.</p>

      <h3>FAQPage Schema</h3>
      
      <p>Crítico para aparecer en respuestas de preguntas frecuentes. Estructura cada pregunta con su respuesta aceptada.</p>

      <h3>HowTo Schema</h3>
      
      <p>Para guías y tutoriales paso a paso. Aumenta significativamente las chances de ser citado en consultas de "cómo hacer".</p>

      <h3>Article Schema</h3>
      
      <p>Para contenido de blog y noticias. Incluye autor, fecha de publicación y fecha de modificación.</p>

      <h2>🔧 Implementación</h2>
      
      <h3>En WordPress</h3>
      
      <p>Usa plugins recomendados:</p>
      
      <ul>
        <li>✓ Yoast SEO (versión premium)</li>
        <li>✓ Rank Math</li>
        <li>✓ Schema Pro</li>
      </ul>
      
      <h3>En Código Custom</h3>
      
      <p>Añade el JSON-LD en el <code>&lt;head&gt;</code> de tus páginas o antes del cierre de <code>&lt;body&gt;</code>.</p>

      <h2>⚠️ Errores Comunes a Evitar</h2>
      
      <table>
        <thead>
          <tr>
            <th>Error</th>
            <th>Consecuencia</th>
            <th>Solución</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Schema incompleto</td>
            <td>La IA no entiende el contexto</td>
            <td>Incluye todos los campos importantes</td>
          </tr>
          <tr>
            <td>Información desactualizada</td>
            <td>Penaliza tu credibilidad</td>
            <td>Revisa y actualiza regularmente</td>
          </tr>
          <tr>
            <td>Markup invisible</td>
            <td>Puede ser ignorado</td>
            <td>El schema debe coincidir con el contenido visible</td>
          </tr>
          <tr>
            <td>Demasiados tipos</td>
            <td>Confunde a los crawlers</td>
            <td>Enfócate en el contenido principal</td>
          </tr>
        </tbody>
      </table>

      <h2>✅ Verificando Tu Implementación</h2>
      
      <p>Usa estas herramientas para validar:</p>
      
      <ol>
        <li><strong>Google Rich Results Test</strong> — Valida la sintaxis</li>
        <li><strong>Schema Markup Validator</strong> — Detecta errores de estructura</li>
        <li><strong>Mentha</strong> — Verifica que los crawlers de IA pueden acceder tu markup</li>
      </ol>
    `
  }
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getAllPosts(): BlogPost[] {
  return blogPosts;
}

export function getPostsByCategory(category: string): BlogPost[] {
  return blogPosts.filter((post) => post.category === category);
}

export function getFeaturedPosts(): BlogPost[] {
  return blogPosts.filter((post) => post.featured);
}

export function getCategories(): string[] {
  const categories = blogPosts.map((post) => post.category);
  return [...new Set(categories)];
}
