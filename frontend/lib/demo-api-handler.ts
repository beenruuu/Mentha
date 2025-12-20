/**
 * Demo API Handler
 * Intercepts API calls when in demo mode and returns mock data
 */

import {
    DEMO_BRAND_ID,
    demoBrand,
    demoBrands,
    demoCompetitors,
    demoAnalyses,
    demoVisibilityHistory,
    demoLatestScores,
    demoTechnicalAeo,
    demoNotifications,
    demoGeoAnalysis,
    demoShareOfModel,
    demoQueries,
    demoCitations,
    demoUser,
    demoInsights,
    demoHallucinations,
    demoLanguageComparison,
    demoRegionalComparison,
} from './demo-data'

type MockResponse = any

/**
 * Handle demo mode API requests
 * Returns mock data based on the endpoint pattern
 */
export function handleDemoRequest(endpoint: string, options?: RequestInit): MockResponse {
    const method = options?.method?.toUpperCase() || 'GET'

    // Normalize endpoint (remove leading slash and query params for matching)
    const [path, queryString] = endpoint.split('?')
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path
    const segments = normalizedPath.split('/')

    // Log for debugging
    console.log(`[Demo Mode] ${method} ${endpoint}`)

    // ============ BRANDS ============
    if (normalizedPath === 'brands/' || normalizedPath === 'brands') {
        if (method === 'GET') return demoBrands
        if (method === 'POST') {
            // Simulate creating a brand - return the demo brand with updated fields
            const body = options?.body ? JSON.parse(options.body as string) : {}
            return { ...demoBrand, ...body, id: 'demo-new-brand-' + Date.now() }
        }
    }

    if (segments[0] === 'brands' && segments[1]) {
        const brandId = segments[1]
        if (method === 'GET') return demoBrand
        if (method === 'PUT') {
            const body = options?.body ? JSON.parse(options.body as string) : {}
            return { ...demoBrand, ...body }
        }
        if (method === 'DELETE') return undefined
    }

    // ============ COMPETITORS ============
    if (normalizedPath.startsWith('competitors')) {
        if (segments.length === 1 || normalizedPath === 'competitors/') {
            if (method === 'GET') return demoCompetitors
            if (method === 'POST') {
                const body = options?.body ? JSON.parse(options.body as string) : {}
                return { ...demoCompetitors[0], ...body, id: 'demo-comp-new-' + Date.now() }
            }
        }
        if (segments[1]) {
            const compId = segments[1]
            const comp = demoCompetitors.find(c => c.id === compId) || demoCompetitors[0]
            if (method === 'GET') return comp
            if (method === 'DELETE') return undefined
        }
    }

    // ============ ANALYSIS ============
    if (normalizedPath.startsWith('analysis')) {
        if (segments.length === 1 || normalizedPath === 'analysis/') {
            if (method === 'GET') return demoAnalyses
            if (method === 'POST') {
                return { ...demoAnalyses[0], id: 'demo-analysis-new-' + Date.now(), status: 'processing' }
            }
        }

        // Analysis status endpoint - for progress toast
        if (segments[1] === 'status' && segments[2]) {
            return {
                status: 'completed',
                progress: 100,
                phase: 'Completado',
                started_at: new Date(Date.now() - 120000).toISOString(),
                completed_at: new Date().toISOString(),
                has_data: true,
                analysis_id: 'demo-analysis-1'
            }
        }

        // Share of model
        if (segments[1] === 'share_of_model') {
            return demoShareOfModel
        }

        // Trigger analysis
        if (segments[1] === 'trigger' && segments[2]) {
            return { ...demoAnalyses[0], id: 'demo-analysis-' + Date.now(), status: 'processing' }
        }

        if (segments[1]) {
            return demoAnalyses.find(a => a.id === segments[1]) || demoAnalyses[0]
        }
    }

    // ============ GEO ANALYSIS ============
    if (normalizedPath.startsWith('geo-analysis')) {
        // POST /geo-analysis/analyze
        if (segments[1] === 'analyze' && method === 'POST') {
            return { ...demoGeoAnalysis, id: 'demo-geo-new-' + Date.now(), status: 'processing' }
        }

        // GET /geo-analysis/analyze/:id
        if (segments[1] === 'analyze' && segments[2]) {
            return demoGeoAnalysis
        }

        // GET /geo-analysis/brands/:brandId/latest
        if (segments[1] === 'brands' && segments[3] === 'latest') {
            return demoGeoAnalysis
        }

        // GET /geo-analysis/brands/:brandId/history
        if (segments[1] === 'brands' && segments[3] === 'history') {
            return [demoGeoAnalysis]
        }

        // GET /geo-analysis/brands/:brandId/visibility
        if (segments[1] === 'brands' && segments[3] === 'visibility') {
            // Transform backend model IDs to frontend IDs for proper display
            // This bypasses the MODEL_ID_MAP remapping in the dashboard
            const modelMapping: Record<string, string> = {
                'openai': 'chatgpt',
                'anthropic': 'claude',
                'perplexity': 'perplexity',
                'gemini': 'gemini',  // Keep gemini as gemini for Gemini AI
                'google_search': 'google'  // Map to google for Google Search
            }

            const mappedHistory = demoVisibilityHistory.map(s => ({
                ...s,
                ai_model: modelMapping[s.ai_model] || s.ai_model
            }))

            const mappedLatestScores = demoLatestScores.map(s => ({
                ...s,
                ai_model: modelMapping[s.ai_model] || s.ai_model
            }))

            return {
                history: mappedHistory,
                latest_scores: mappedLatestScores
            }
        }

        // GET /geo-analysis/brands/:brandId/citations
        if (segments[1] === 'brands' && segments[3] === 'citations') {
            return demoCitations
        }

        // GET /geo-analysis/modules
        if (segments[1] === 'modules') {
            return ['ai_visibility', 'citations', 'technical_aeo', 'content_structure']
        }

        // POST /geo-analysis/quick-check
        if (segments[1] === 'quick-check' && method === 'POST') {
            return { score: 67, grade: 'B', quick: true }
        }
    }

    // ============ TECHNICAL AEO ============
    if (normalizedPath.startsWith('technical-aeo')) {
        return [demoTechnicalAeo]
    }

    // ============ NOTIFICATIONS ============
    if (normalizedPath.startsWith('notifications')) {
        if (segments[1] === 'mark-all-read' && method === 'POST') {
            return { updated: demoNotifications.filter(n => n.status === 'unread').length }
        }
        if (segments[1]) {
            if (method === 'PUT') {
                const notif = demoNotifications.find(n => n.id === segments[1])
                return notif ? { ...notif, status: 'read', read_at: new Date().toISOString() } : null
            }
            return demoNotifications.find(n => n.id === segments[1]) || demoNotifications[0]
        }
        return demoNotifications
    }

    // ============ QUERIES / PROMPTS ============
    if (normalizedPath.startsWith('prompts') || normalizedPath.startsWith('queries')) {
        if (method === 'DELETE') return undefined
        if (method === 'POST') {
            const body = options?.body ? JSON.parse(options.body as string) : {}
            return { ...demoQueries[0], ...body, id: 'demo-query-new-' + Date.now() }
        }
        return demoQueries
    }

    // ============ INSIGHTS ============
    if (normalizedPath.startsWith('insights')) {
        // GET /insights/:brandId/languages
        if (segments[2] === 'languages') {
            return demoLanguageComparison
        }
        // GET /insights/:brandId/regions
        if (segments[2] === 'regions') {
            return demoRegionalComparison
        }
        // GET /insights/:brandId
        if (segments[1]) {
            return demoInsights
        }
        return demoInsights
    }

    // ============ HALLUCINATIONS ============
    if (normalizedPath.startsWith('hallucinations')) {
        // GET /hallucinations?brand_id=xxx
        return demoHallucinations
    }

    // ============ LANGUAGE COMPARISON ============
    if (normalizedPath.startsWith('language-comparison') || normalizedPath.includes('languages')) {
        return demoLanguageComparison
    }

    // ============ REGIONAL COMPARISON ============
    if (normalizedPath.startsWith('regional-comparison') || normalizedPath.includes('regions')) {
        return demoRegionalComparison
    }

    // ============ AUTH ============
    if (normalizedPath === 'auth/me' || normalizedPath === 'auth/profile') {
        if (method === 'GET') return demoUser
        if (method === 'PUT') {
            const body = options?.body ? JSON.parse(options.body as string) : {}
            return { ...demoUser, ...body }
        }
    }

    // ============ KEYWORDS ============
    if (normalizedPath.startsWith('keywords')) {
        return [
            { id: 'kw-1', keyword: 'transformación digital', brand_id: DEMO_BRAND_ID, volume: 12000, difficulty: 65 },
            { id: 'kw-2', keyword: 'consultoría tecnológica', brand_id: DEMO_BRAND_ID, volume: 8500, difficulty: 55 },
            { id: 'kw-3', keyword: 'desarrollo software empresas', brand_id: DEMO_BRAND_ID, volume: 6200, difficulty: 48 },
        ]
    }

    // ============ ADMIN ============
    if (normalizedPath.startsWith('admin')) {
        // Return minimal admin data for demo
        if (segments[1] === 'overview') {
            return { total_users: 150, total_brands: 89, total_analyses: 1245, active_subscriptions: 45 }
        }
        if (segments[1] === 'users') {
            return { total: 150, active: 132, new_this_month: 23, growth_rate: 15.2 }
        }
        if (segments[1] === 'subscriptions') {
            return { total: 45, mrr: 4500, growth: 12.5, churn: 2.1 }
        }
        if (segments[1] === 'categories') {
            return [
                { id: 'cat-1', name: 'Technology', slug: 'technology', is_active: true },
                { id: 'cat-2', name: 'E-commerce', slug: 'ecommerce', is_active: true },
            ]
        }
    }

    // ============ ORGANIZATION ============
    if (normalizedPath.startsWith('organization')) {
        if (segments[1] === 'members') {
            return [demoUser]
        }
    }

    // ============ EXPORT ============
    if (normalizedPath.startsWith('export')) {
        // For exports, we'd typically return a file, but in demo mode we'll return a message
        return { message: 'Export not available in demo mode', demo: true }
    }

    // Default fallback - return empty array or object based on endpoint
    console.warn(`[Demo Mode] Unhandled endpoint: ${endpoint}`)
    return normalizedPath.endsWith('/') ? [] : {}
}
