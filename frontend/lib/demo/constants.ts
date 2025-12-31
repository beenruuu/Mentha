/**
 * Demo Mode Constants and Mockup Data
 */

// Demo identifiers
export const DEMO_BRAND_ID = 'demo-brand-001'
export const DEMO_USER_ID = 'demo-user-001'

// Demo brand info
export const DEMO_BRAND_NAME = 'TechVerde Solutions'
export const DEMO_BRAND_DOMAIN = 'techverde.es'

const DEMO_MODE_KEY = 'mentha_demo_mode'

// Demo mode detection
export const isDemoMode = (): boolean => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(DEMO_MODE_KEY) === 'true'
}

export const setDemoMode = (enabled: boolean): void => {
    if (typeof window === 'undefined') return
    localStorage.setItem(DEMO_MODE_KEY, enabled ? 'true' : 'false')
}

// Demo User
export const DEMO_USER = {
    id: DEMO_USER_ID,
    email: 'demo@mentha.ai',
    user_metadata: {
        full_name: 'Usuario Demo',
        avatar_url: undefined
    }
}

// Demo Brand
export const DEMO_BRAND = {
    id: DEMO_BRAND_ID,
    name: DEMO_BRAND_NAME,
    domain: DEMO_BRAND_DOMAIN,
    user_id: DEMO_USER_ID,
    created_at: new Date().toISOString(),
    category: 'Tecnología',
    industry: 'Software & SaaS',
    description: 'Empresa líder en soluciones tecnológicas sostenibles',
    business_scope: 'national' as const,
    city: 'Madrid',
    location: 'España',
}

// Demo Competitors
export const DEMO_COMPETITORS = [
    {
        id: 'demo-comp-001',
        brand_id: DEMO_BRAND_ID,
        name: 'GreenTech España',
        domain: 'greentech.es',
        source: 'discovered',
        visibility_score: 72,
        score: 72,
        created_at: new Date().toISOString(),
    },
    {
        id: 'demo-comp-002',
        brand_id: DEMO_BRAND_ID,
        name: 'EcoSoft Solutions',
        domain: 'ecosoft.io',
        source: 'discovered',
        visibility_score: 65,
        score: 65,
        created_at: new Date().toISOString(),
    },
    {
        id: 'demo-comp-003',
        brand_id: DEMO_BRAND_ID,
        name: 'Innovatech Verde',
        domain: 'innovatech-verde.com',
        source: 'manual',
        visibility_score: 58,
        score: 58,
        created_at: new Date().toISOString(),
    },
]

// Demo Visibility Data
export const DEMO_VISIBILITY = {
    history: [
        { id: '1', brand_id: DEMO_BRAND_ID, ai_model: 'openai', visibility_score: 78, mention_count: 12, measured_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), query_count: 20, metadata: {} },
        { id: '2', brand_id: DEMO_BRAND_ID, ai_model: 'anthropic', visibility_score: 72, mention_count: 8, measured_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), query_count: 15, metadata: {} },
        { id: '3', brand_id: DEMO_BRAND_ID, ai_model: 'perplexity', visibility_score: 85, mention_count: 18, measured_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), query_count: 25, metadata: {} },
        { id: '4', brand_id: DEMO_BRAND_ID, ai_model: 'openai', visibility_score: 82, mention_count: 15, measured_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), query_count: 22, metadata: {} },
        { id: '5', brand_id: DEMO_BRAND_ID, ai_model: 'anthropic', visibility_score: 75, mention_count: 10, measured_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), query_count: 18, metadata: {} },
        { id: '6', brand_id: DEMO_BRAND_ID, ai_model: 'gemini', visibility_score: 68, mention_count: 6, measured_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), query_count: 12, metadata: {} },
    ],
    latest_scores: [
        { id: '7', brand_id: DEMO_BRAND_ID, ai_model: 'openai', visibility_score: 82, mention_count: 15, measured_at: new Date().toISOString(), query_count: 22, inclusion_rate: 75, average_position: 2.3, metadata: {} },
        { id: '8', brand_id: DEMO_BRAND_ID, ai_model: 'anthropic', visibility_score: 75, mention_count: 10, measured_at: new Date().toISOString(), query_count: 18, inclusion_rate: 68, average_position: 3.1, metadata: {} },
        { id: '9', brand_id: DEMO_BRAND_ID, ai_model: 'perplexity', visibility_score: 88, mention_count: 20, measured_at: new Date().toISOString(), query_count: 28, inclusion_rate: 82, average_position: 1.8, metadata: {} },
        { id: '10', brand_id: DEMO_BRAND_ID, ai_model: 'gemini', visibility_score: 70, mention_count: 8, measured_at: new Date().toISOString(), query_count: 15, inclusion_rate: 60, average_position: 3.5, metadata: {} },
    ]
}

// Demo Citations
export const DEMO_CITATIONS = [
    { model: 'ChatGPT', query: '¿Cuáles son las mejores empresas de tecnología verde en España?', context: 'TechVerde Solutions destaca por...', type: 'direct' },
    { model: 'Claude', query: 'Soluciones tecnológicas sostenibles', context: 'Entre las opciones más innovadoras está TechVerde...', type: 'indirect' },
    { model: 'Perplexity', query: 'Software ecológico empresarial', context: 'TechVerde Solutions ofrece una plataforma completa...', type: 'direct' },
]

// Demo Recommendations
export const DEMO_RECOMMENDATIONS = [
    { priority: 'high', category: 'content', title: 'Optimizar metadatos para IA', description: 'Añadir schema.org estructurado para mejor comprensión por modelos de IA' },
    { priority: 'medium', category: 'technical', title: 'Implementar llms.txt', description: 'Crear archivo llms.txt para guiar a los crawlers de IA' },
    { priority: 'medium', category: 'content', title: 'Expandir sección FAQ', description: 'Las FAQs bien estructuradas mejoran la visibilidad en respuestas de IA' },
    { priority: 'low', category: 'visibility', title: 'Monitorear menciones', description: 'Configurar alertas para nuevas menciones en modelos de IA' },
]

// Demo Technical AEO
export const DEMO_TECHNICAL_AEO = {
    id: 'demo-tech-001',
    brand_id: DEMO_BRAND_ID,
    domain: DEMO_BRAND_DOMAIN,
    ai_crawler_permissions: {
        crawlers: {
            'GPTBot': 'allowed',
            'ClaudeBot': 'allowed',
            'Google-Extended': 'allowed',
            'CCBot': 'blocked',
            'PerplexityBot': 'allowed',
        },
        summary: 'Tu sitio permite el acceso a los principales crawlers de IA, lo que mejora tu visibilidad.'
    },
    schema_types: ['Organization', 'WebSite', 'FAQPage', 'Article'],
    total_schemas: 4,
    has_faq: true,
    has_howto: false,
    has_article: true,
    has_rss: true,
    has_api: false,
    mobile_responsive: true,
    https_enabled: true,
    response_time_ms: 245,
    aeo_readiness_score: 78,
    voice_readiness_score: 65,
    recommendations: ['Añadir HowTo schema', 'Considerar API pública'],
    last_audit: new Date().toISOString(),
}

// Demo Sentiment
export const DEMO_SENTIMENT = {
    positive: 62,
    neutral: 28,
    negative: 10,
}

// Demo Insights
export const DEMO_INSIGHTS = [
    { type: 'trend', title: 'Incremento de menciones', message: 'Tus menciones en ChatGPT han aumentado un 15% esta semana', priority: 'info' },
    { type: 'alert', title: 'Nueva competencia detectada', message: 'EcoSoft Solutions está ganando visibilidad en tu sector', priority: 'warning' },
    { type: 'success', title: 'Mejor posicionamiento', message: 'Tu marca aparece ahora en el top 3 para consultas sobre "tecnología verde"', priority: 'success' },
]
