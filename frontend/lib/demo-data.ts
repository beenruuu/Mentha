/**
 * Comprehensive mock data for demo mode
 * Realistic Spanish tech consultancy example
 */

import { Brand } from './services/brands'
import { Analysis } from './services/analysis'
import { Competitor } from './services/competitors'
import { Notification } from './services/notifications'
import { TechnicalAEO } from './services/technical-aeo'
import { VisibilitySnapshot, GEOAnalysisResponse, Recommendation } from './services/geo-analysis'

// Demo brand ID (used across all mock data)
export const DEMO_BRAND_ID = 'demo-brand-001'
export const DEMO_USER_ID = 'demo-user-001'

// Generate dates for the last N days
function daysAgo(days: number): string {
    const date = new Date()
    date.setDate(date.getDate() - days)
    return date.toISOString()
}

// ============ BRANDS ============
export const demoBrand: Brand = {
    id: DEMO_BRAND_ID,
    name: 'TechVerde Solutions',
    domain: 'techverde.es',
    logo_url: undefined,
    description: 'Consultoría tecnológica especializada en transformación digital, desarrollo de software a medida y servicios cloud para empresas españolas.',
    industry: 'Technology',
    ai_providers: ['openai', 'anthropic', 'perplexity', 'gemini'],
    services: ['Desarrollo Web', 'Consultoría Cloud', 'IA & Machine Learning', 'Transformación Digital'],
    created_at: daysAgo(90),
}

export const demoBrands: Brand[] = [demoBrand]

// ============ COMPETITORS ============
export const demoCompetitors: Competitor[] = [
    {
        id: 'demo-comp-001',
        name: 'Paradigma Digital',
        domain: 'paradigmadigital.com',
        brand_id: DEMO_BRAND_ID,
        similarity_score: 0.85,
        visibility_score: 72,
        favicon: 'https://www.paradigmadigital.com/favicon.ico',
        tracked: true,
        metrics_breakdown: {
            openai: 68,
            anthropic: 75,
            perplexity: 70,
            gemini: 74
        },
        created_at: daysAgo(60),
        updated_at: daysAgo(1),
    },
    {
        id: 'demo-comp-002',
        name: 'Plain Concepts',
        domain: 'plainconcepts.com',
        brand_id: DEMO_BRAND_ID,
        similarity_score: 0.78,
        visibility_score: 65,
        favicon: 'https://www.plainconcepts.com/favicon.ico',
        tracked: true,
        metrics_breakdown: {
            openai: 62,
            anthropic: 68,
            perplexity: 64,
            gemini: 66
        },
        created_at: daysAgo(55),
        updated_at: daysAgo(1),
    },
    {
        id: 'demo-comp-003',
        name: 'Sngular',
        domain: 'sngular.com',
        brand_id: DEMO_BRAND_ID,
        similarity_score: 0.72,
        visibility_score: 58,
        favicon: 'https://www.sngular.com/favicon.ico',
        tracked: true,
        metrics_breakdown: {
            openai: 55,
            anthropic: 60,
            perplexity: 58,
            gemini: 59
        },
        created_at: daysAgo(50),
        updated_at: daysAgo(1),
    },
]

// ============ ANALYSES ============
export const demoAnalyses: Analysis[] = [
    {
        id: 'demo-analysis-001',
        brand_id: DEMO_BRAND_ID,
        analysis_type: 'geo_full',
        input_data: { domain: 'techverde.es', brand_name: 'TechVerde Solutions' },
        results: {
            overall_score: 67,
            grade: 'B',
            modules: {
                ai_visibility: { overall_score: 67, mention_count: 23 },
                citations: { citation_score: 45, total_citations: 8 },
            }
        },
        score: 67,
        status: 'completed',
        ai_model: 'multi-model',
        created_at: daysAgo(1),
        completed_at: daysAgo(1),
        avg_position: 3.2,
        inclusion_rate: 0.68,
    },
    {
        id: 'demo-analysis-002',
        brand_id: DEMO_BRAND_ID,
        analysis_type: 'geo_full',
        input_data: { domain: 'techverde.es', brand_name: 'TechVerde Solutions' },
        results: {
            overall_score: 62,
            grade: 'B-',
        },
        score: 62,
        status: 'completed',
        ai_model: 'multi-model',
        created_at: daysAgo(7),
        completed_at: daysAgo(7),
        avg_position: 3.5,
        inclusion_rate: 0.62,
    },
    {
        id: 'demo-analysis-003',
        brand_id: DEMO_BRAND_ID,
        analysis_type: 'geo_full',
        input_data: { domain: 'techverde.es', brand_name: 'TechVerde Solutions' },
        results: {
            overall_score: 55,
            grade: 'C+',
        },
        score: 55,
        status: 'completed',
        ai_model: 'multi-model',
        created_at: daysAgo(14),
        completed_at: daysAgo(14),
        avg_position: 4.1,
        inclusion_rate: 0.55,
    },
]

// ============ VISIBILITY SNAPSHOTS (Historical data for charts) ============
function generateVisibilityHistory(): VisibilitySnapshot[] {
    const snapshots: VisibilitySnapshot[] = []
    // Include all 5 models: 4 AI + Google Search baseline
    const models: Array<'openai' | 'anthropic' | 'perplexity' | 'gemini' | 'google_search'> = ['openai', 'anthropic', 'perplexity', 'gemini', 'google_search']

    // Generate 30 days of history for each model
    for (let day = 30; day >= 0; day--) {
        models.forEach((model, index) => {
            // Base scores with wider gaps per model
            const baseScores: Record<string, number> = {
                openai: 58,
                anthropic: 75,
                perplexity: 24,
                gemini: 62,
                google_search: 50
            }

            // Add more aggressive trend and volatility
            // Perplexity is struggling, so it has no growth trend
            const isPerplexity = model === 'perplexity'
            const trend = isPerplexity ? 0 : (30 - day) * 0.5

            // High frequency variance
            const variance = Math.sin(day * 0.8 + index) * 8
            // Add some "shocks" (unexpected spikes or drops)
            const shock = (day % 7 === 0) ? (Math.random() > 0.5 ? 12 : -15) : 0
            // Random noise
            const noise = (Math.random() - 0.5) * 6

            let score = Math.min(95, Math.max(5, baseScores[model] + trend + variance + shock + noise))

            // Force exactly 25 for perplexity on the last day if needed, 
            // but let's just make it very likely to be around 25
            if (isPerplexity && day === 0) score = 25

            // Independent volatility for inclusion rate and position
            const inclusionBase = score / 100
            const inclusionNoise = (Math.random() - 0.5) * 0.15
            const inclusionRate = Math.min(0.95, Math.max(0.05, inclusionBase + inclusionNoise))

            const positionBase = 1 + (100 - score) / 20
            const positionNoise = (Math.random() - 0.5) * 1.5
            const averagePosition = Math.min(5, Math.max(1, positionBase + positionNoise))

            snapshots.push({
                id: `snapshot-${model}-${day}`,
                brand_id: DEMO_BRAND_ID,
                ai_model: model,
                visibility_score: Math.round(score),
                mention_count: Math.floor(5 + Math.random() * 20),
                sentiment: score > 65 ? 'positive' : score < 40 ? 'negative' : 'neutral',
                measured_at: daysAgo(day),
                query_count: 15,
                inclusion_rate: inclusionRate,
                average_position: averagePosition,
                metadata: {}
            })
        })
    }

    return snapshots
}

export const demoVisibilityHistory = generateVisibilityHistory()

export const demoLatestScores: VisibilitySnapshot[] = [
    {
        id: 'latest-openai',
        brand_id: DEMO_BRAND_ID,
        ai_model: 'openai',
        visibility_score: 64,
        mention_count: 14,
        sentiment: 'neutral',
        measured_at: daysAgo(0),
        query_count: 15,
        inclusion_rate: 0.68,
        average_position: 2.4,
        metadata: {}
    },
    {
        id: 'latest-anthropic',
        brand_id: DEMO_BRAND_ID,
        ai_model: 'anthropic',
        visibility_score: 82,
        mention_count: 18,
        sentiment: 'positive',
        measured_at: daysAgo(0),
        query_count: 15,
        inclusion_rate: 0.85,
        average_position: 1.8,
        metadata: {}
    },
    {
        id: 'latest-perplexity',
        brand_id: DEMO_BRAND_ID,
        ai_model: 'perplexity',
        visibility_score: 25,
        mention_count: 3,
        sentiment: 'negative',
        measured_at: daysAgo(0),
        query_count: 15,
        inclusion_rate: 0.25,
        average_position: 4.8,
        metadata: {}
    },
    {
        id: 'latest-gemini',
        brand_id: DEMO_BRAND_ID,
        ai_model: 'gemini',
        visibility_score: 55,
        mention_count: 8,
        sentiment: 'neutral',
        measured_at: daysAgo(0),
        query_count: 15,
        inclusion_rate: 0.52,
        average_position: 3.5,
        metadata: {}
    },
    {
        id: 'latest-google-search',
        brand_id: DEMO_BRAND_ID,
        ai_model: 'google_search',
        visibility_score: 71,
        mention_count: 15,
        sentiment: 'positive',
        measured_at: daysAgo(0),
        query_count: 15,
        inclusion_rate: 0.74,
        average_position: 2.1,
        metadata: {}
    },
]

// ============ TECHNICAL AEO ============
export const demoTechnicalAeo: TechnicalAEO = {
    id: 'demo-taeo-001',
    user_id: DEMO_USER_ID,
    brand_id: DEMO_BRAND_ID,
    domain: 'techverde.es',
    aeo_readiness_score: 72,
    voice_readiness_score: 65,
    ai_crawler_permissions: {
        crawlers: {
            'GPTBot': 'allowed',
            'Google-Extended': 'allowed',
            'Anthropic-AI': 'allowed',
            'CCBot': 'blocked',
            'PerplexityBot': 'allowed'
        },
        summary: '4/5 principales crawlers de IA permitidos'
    },
    structured_data: {
        total_schemas: 8,
        schema_types: ['Organization', 'WebSite', 'Article', 'FAQPage', 'BreadcrumbList'],
        has_faq: true,
        has_howto: false,
        has_article: true,
        details: {}
    },
    schema_types: ['Organization', 'WebSite', 'Article', 'FAQPage', 'BreadcrumbList'],
    total_schemas: 8,
    has_faq: true,
    has_howto: false,
    has_article: true,
    technical_signals: {
        https: true,
        mobile_viewport: true,
        rss_feed: false,
        api_available: false,
        response_time_ms: 245
    },
    has_rss: false,
    has_api: false,
    mobile_responsive: true,
    https_enabled: true,
    response_time_ms: 245,
    recommendations: [
        {
            title: 'Añadir feed RSS',
            description: 'Un feed RSS permite a los modelos de IA descubrir tu contenido nuevo automáticamente.',
            priority: 'high',
            category: 'Content Distribution'
        },
        {
            title: 'Implementar schema HowTo',
            description: 'Los tutoriales y guías con schema HowTo tienen mayor probabilidad de aparecer en respuestas de IA.',
            priority: 'medium',
            category: 'Structured Data'
        },
        {
            title: 'Permitir CCBot',
            description: 'CommonCrawl es usado por varios modelos de IA para entrenamiento. Considera permitir su acceso.',
            priority: 'low',
            category: 'AI Crawlers'
        }
    ],
    last_audit: daysAgo(1),
    created_at: daysAgo(1),
}

// ============ NOTIFICATIONS ============
export const demoNotifications: Notification[] = [
    {
        id: 'demo-notif-001',
        brand_id: DEMO_BRAND_ID,
        title: 'Análisis completado',
        message: 'El análisis de visibilidad IA para TechVerde Solutions ha finalizado. Score: 67/100',
        type: 'analysis_complete',
        status: 'unread',
        metadata: { analysis_id: 'demo-analysis-001', score: 67 },
        created_at: daysAgo(0),
    },
    {
        id: 'demo-notif-002',
        brand_id: DEMO_BRAND_ID,
        title: 'Nuevo competidor detectado',
        message: 'Hemos identificado a Sngular como posible competidor en el espacio de IA.',
        type: 'system',
        status: 'unread',
        metadata: { competitor_id: 'demo-comp-003' },
        created_at: daysAgo(2),
    },
    {
        id: 'demo-notif-003',
        brand_id: DEMO_BRAND_ID,
        title: 'Mejora en visibilidad',
        message: 'Tu visibilidad en Claude ha aumentado un 8% esta semana.',
        type: 'system',
        status: 'read',
        metadata: { model: 'anthropic', change: 8 },
        created_at: daysAgo(5),
        read_at: daysAgo(4),
    },
]

// ============ GEO ANALYSIS RESPONSE ============
export const demoGeoAnalysis: GEOAnalysisResponse = {
    id: 'demo-geo-001',
    brand_name: 'TechVerde Solutions',
    domain: 'techverde.es',
    status: 'completed',
    created_at: daysAgo(1),
    completed_at: daysAgo(1),
    overall_score: 67,
    grade: 'B',
    modules: {
        ai_visibility: {
            overall_score: 67,
            mention_count: 46,
            models: {
                openai: { visibility_score: 71, mention_count: 12, sentiment: 'positive' },
                anthropic: { visibility_score: 78, mention_count: 14, sentiment: 'positive' },
                perplexity: { visibility_score: 65, mention_count: 9, sentiment: 'neutral' },
                gemini: { visibility_score: 72, mention_count: 11, sentiment: 'positive' }
            }
        },
        citations: {
            citation_score: 45,
            citations: [
                { model: 'anthropic', query: 'mejores consultoras tecnológicas España', context: 'TechVerde Solutions es reconocida por...' },
                { model: 'perplexity', query: 'empresas transformación digital Madrid', url: 'https://techverde.es/servicios' },
            ],
            total_citations: 8
        }
    },
    summary: 'TechVerde Solutions muestra una presencia sólida en modelos de IA, especialmente en Claude/Anthropic. Las principales oportunidades de mejora están en aumentar las citaciones directas y mejorar el contenido para búsquedas de voz.',
    recommendations: [
        {
            priority: 'critical',
            category: 'Content',
            title: 'Crear contenido optimizado para IA',
            description: 'Añadir secciones de FAQ estructuradas en las páginas principales para mejorar la extracción de información por modelos de IA.',
            translation_key: 'rec_create_ai_content',
            translation_key_desc: 'rec_create_ai_content_desc'
        },
        {
            priority: 'high',
            category: 'Citations',
            title: 'Aumentar presencia en fuentes autoritativas',
            description: 'Buscar menciones en medios especializados como ComputerWorld, El Economista Tech o Xataka.',
            translation_key: 'rec_increase_citations',
            translation_key_desc: 'rec_increase_citations_desc'
        },
        {
            priority: 'medium',
            category: 'Technical',
            title: 'Implementar feed RSS',
            description: 'Un feed RSS ayuda a los crawlers de IA a descubrir contenido nuevo más rápidamente.',
            translation_key: 'rec_implement_rss',
            translation_key_desc: 'rec_implement_rss_desc'
        },
        {
            priority: 'low',
            category: 'Schema',
            title: 'Añadir schema HowTo',
            description: 'Los tutoriales con markup HowTo tienen mayor probabilidad de aparecer en respuestas de asistentes de voz.',
            translation_key: 'rec_add_howto',
            translation_key_desc: 'rec_add_howto_desc'
        }
    ] as (Recommendation & { translation_key?: string; translation_key_desc?: string })[],
}

// ============ SHARE OF MODEL DATA ============
export const demoShareOfModel = {
    brand_id: DEMO_BRAND_ID,
    brand_name: 'TechVerde Solutions',
    // Fields required by ShareOfModelData interface in ShareOfModel.tsx
    brand_mentions: 82,
    competitor_mentions: {
        'Paradigma Digital': 65,
        'Plain Concepts': 22,
        'Sngular': 95,
        'Accenture': 142,
        'Indra': 18,
    } as Record<string, number>,
    total_mentions: 328,
    share_of_voice: 25,  // 82/328 = 25%
    trend: 'up' as const,
    last_updated: daysAgo(0),
    // Legacy fields for backward compatibility
    total_queries: 60,
    share_data: [
        { model: 'openai', share: 0.18, mentions: 15 },
        { model: 'anthropic', share: 0.42, mentions: 35 },
        { model: 'perplexity', share: 0.12, mentions: 10 },
        { model: 'gemini', share: 0.28, mentions: 22 },
    ],
    competitors_share: [
        { competitor: 'Paradigma Digital', share: 0.28 },
        { competitor: 'Plain Concepts', share: 0.22 },
        { competitor: 'Sngular', share: 0.18 },
    ]
}

// ============ QUERIES/PROMPTS ============
export const demoQueries = [
    {
        id: 'demo-query-001',
        brand_id: DEMO_BRAND_ID,
        prompt_text: 'mejores consultoras de transformación digital en España',
        category: 'product',
        last_run: daysAgo(1),
        results: {
            openai: { mentioned: true, position: 3, sentiment: 'positive' },
            anthropic: { mentioned: true, position: 2, sentiment: 'positive' },
            perplexity: { mentioned: true, position: 4, sentiment: 'neutral' },
            gemini: { mentioned: false, position: null, sentiment: null },
        }
    },
    {
        id: 'demo-query-002',
        brand_id: DEMO_BRAND_ID,
        prompt_text: 'empresas desarrollo software a medida Madrid',
        category: 'product',
        last_run: daysAgo(2),
        results: {
            openai: { mentioned: true, position: 2, sentiment: 'positive' },
            anthropic: { mentioned: true, position: 1, sentiment: 'positive' },
            perplexity: { mentioned: true, position: 3, sentiment: 'positive' },
            gemini: { mentioned: true, position: 2, sentiment: 'neutral' },
        }
    },
    {
        id: 'demo-query-003',
        brand_id: DEMO_BRAND_ID,
        prompt_text: 'alternativas a Accenture España',
        category: 'competitor',
        last_run: daysAgo(3),
        results: {
            openai: { mentioned: false, position: null, sentiment: null },
            anthropic: { mentioned: true, position: 5, sentiment: 'neutral' },
            perplexity: { mentioned: false, position: null, sentiment: null },
            gemini: { mentioned: true, position: 4, sentiment: 'neutral' },
        }
    },
]

// ============ CITATIONS ============
export const demoCitations = {
    citations: [
        {
            id: 'cit-001',
            model: 'anthropic',
            query: 'mejores consultoras tecnológicas España',
            context: 'Entre las consultoras tecnológicas destacadas en España se encuentra TechVerde Solutions, especializada en transformación digital...',
            url: 'https://techverde.es',
            type: 'direct' as const,
            created_at: daysAgo(1)
        },
        {
            id: 'cit-002',
            model: 'perplexity',
            query: 'empresas cloud computing Madrid',
            context: 'Fuentes: techverde.es, plainconcepts.com...',
            url: 'https://techverde.es/servicios/cloud',
            type: 'attribution' as const,
            created_at: daysAgo(3)
        },
        {
            id: 'cit-003',
            model: 'openai',
            query: 'desarrollo de aplicaciones empresariales',
            context: 'TechVerde Solutions ofrece servicios de desarrollo de aplicaciones...',
            url: undefined,
            type: 'indirect' as const,
            created_at: daysAgo(5)
        },
    ],
    citation_rates: [
        { brand_id: DEMO_BRAND_ID, ai_model: 'anthropic', total_citations: 14, direct_citations: 8, latest_citation: daysAgo(1) },
        { brand_id: DEMO_BRAND_ID, ai_model: 'perplexity', total_citations: 9, direct_citations: 3, latest_citation: daysAgo(2) },
        { brand_id: DEMO_BRAND_ID, ai_model: 'openai', total_citations: 12, direct_citations: 5, latest_citation: daysAgo(1) },
        { brand_id: DEMO_BRAND_ID, ai_model: 'gemini', total_citations: 11, direct_citations: 4, latest_citation: daysAgo(3) },
    ]
}

// ============ DEMO USER ============
export const demoUser = {
    id: DEMO_USER_ID,
    email: 'demo@mentha.ai',
    full_name: 'Usuario Demo',
    avatar_url: null,
    company_name: 'TechVerde Solutions',
    seo_experience: 'intermediate',
    created_at: daysAgo(90),
}

// ============ INSIGHTS ============
export const demoInsights = {
    brand_id: DEMO_BRAND_ID,
    generated_at: new Date().toISOString(),
    insights: [
        {
            type: 'consecutive_improvement',
            icon: '📈',
            title: 'Tendencia positiva',
            description: 'La puntuación mejoró 4 días consecutivos',
            priority: 'high',
            data: { days: 4, direction: 'up' }
        },
        {
            type: 'leading_model',
            icon: '🏆',
            title: 'Claude lidera',
            description: 'Claude lidera con una puntuación de 82/100',
            priority: 'medium',
            data: { model: 'anthropic', score: 82 }
        },
        {
            type: 'score_decrease',
            icon: '⚠️',
            title: 'Baja en Perplexity',
            description: 'La visibilidad en Perplexity cayó a 25/100',
            priority: 'high',
            data: { model: 'perplexity', change: -12, current: 25 }
        },
        {
            type: 'new_competitors',
            icon: '👥',
            title: 'Nuevos competidores',
            description: '2 nuevos competidores en los últimos 15 días',
            priority: 'medium',
            data: { count: 2, period_days: 15 }
        }
    ]
}

// ============ LANGUAGE COMPARISON ============
export const demoLanguageComparison = {
    brand_id: DEMO_BRAND_ID,
    languages: [
        { language: 'es', score: 82, mention_count: 54 },
        { language: 'en', score: 45, mention_count: 18 },
        { language: 'fr', score: 12, mention_count: 4 },
        { language: 'de', score: 92, mention_count: 65 },
        { language: 'pt', score: 28, mention_count: 9 },
    ],
    primary_language: 'es',
    generated_at: new Date().toISOString()
}

// ============ REGIONAL COMPARISON ============
export const demoRegionalComparison = {
    brand_id: DEMO_BRAND_ID,
    regions: [
        { region: 'ES', score: 88, mention_count: 72 },
        { region: 'US', score: 25, mention_count: 8 },
        { region: 'MX', score: 42, mention_count: 15 },
        { region: 'FR', score: 15, mention_count: 3 },
        { region: 'DE', score: 75, mention_count: 48 },
    ],
    primary_region: 'ES',
    generated_at: new Date().toISOString()
}
