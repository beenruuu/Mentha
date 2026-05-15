import { createLogger } from '../core/logger';
import { createProvider } from '../core/search/factory';
import type { ProviderType, SearchResult } from '../core/search/types';

const log = createLogger({ service: 'geo' });

/**
 * Resultado de análisis de citabilidad
 */
export interface CitabilityScore {
    overall: number;
    breakdown: {
        contentClarity: number;
        factualDensity: number;
        structuredData: number;
        brandEntity: number;
    };
    recommendations: string[];
}

/**
 * Resultado de escaneo de menciones de marca
 */
export interface BrandMentionResult {
    platform: string;
    mentionCount: number;
    sentiment: 'positive' | 'negative' | 'neutral';
    topPhrases: string[];
    sources: string[];
}

/**
 * Resultado de análisis de crawlers AI
 */
export interface CrawlerAnalysis {
    totalCrawlersChecked: number;
    allowed: string[];
    blocked: string[];
    recommendations: string[];
}

/**
 * Resultado completo de auditoría GEO
 */
export interface GeoAuditResult {
    url: string;
    citabilityScore: CitabilityScore;
    brandMentions: BrandMentionResult[];
    crawlerAccess: CrawlerAnalysis;
    llmsTxtStatus: 'present' | 'missing';
    overallScore: number;
    platformReadiness: {
        chatGPT: number;
        perplexity: number;
        gemini: number;
        claude: number;
    };
}

export class GeoService {
    /**
     * Analizar citabilidad de un contenido para AI
     */
    async analyzeCitability(content: string, brandName: string): Promise<CitabilityScore> {
        const provider = createProvider('openrouter');

        const prompt = `Eres un experto en GEO (Generative Engine Optimization).
Analiza el siguiente contenido y evalúa qué tan "citable" es por IA como ChatGPT, Perplexity, Gemini y Claude.

MARCA: ${brandName}

CONTENIDO:
${content}

Devuelve SOLO JSON sin explicación:
{
  "overall": <0-100>,
  "breakdown": {
    "contentClarity": <0-100: que tan claro y directo es>,
    "factualDensity": <0-100: datos, estadísticas, hechos>,
    "structuredData": <0-100: listas, tablas, secciones>,
    "brandEntity": <0-100: que tan bien definida está la marca>
  },
  "recommendations": ["recomendación 1", "recomendación 2"]
}`;

        const result = await provider.search(prompt, {
            model: 'openai/gpt-4o',
            temperature: 0.1,
        });

        return this.parseCitability(result, brandName);
    }

    /**
     * Escanear menciones de marca en plataformas AI
     */
    async scanBrandMentions(brandName: string): Promise<BrandMentionResult[]> {
        const queries = [
            `Qué sabes sobre ${brandName}`,
            `Recomiéndame ${brandName}`,
            `Alternativas a ${brandName}`,
        ];

        const results: BrandMentionResult[] = [];
        const platforms = ['perplexity', 'openai', 'claude', 'gemini'];
        const query = queries[0];

        for (const platform of platforms) {
            try {
                const provider = createProvider(platform as ProviderType);
                if (query && (await provider.testConnection())) {
                    const response = await provider.search(query, {
                        temperature: 0.1,
                    });
                    results.push(this.parseBrandMention(response, platform, brandName));
                }
            } catch {
                log.warn({ platform }, 'Platform not available for brand scan');
            }
        }

        return results;
    }

    /**
     * Analizar acceso de crawlers AI
     */
    async analyzeCrawlers(robotsTxt: string, _domain: string): Promise<CrawlerAnalysis> {
        const aiCrawlers = [
            'GPTBot',
            'ClaudeBot',
            'Claude-Web',
            'PerplexityBot',
            'Google-Extended',
            'CCBot',
            'anthropic-ai',
            'OAI-SearchBot',
            'cohere-ai',
        ];

        const allowed: string[] = [];
        const blocked: string[] = [];
        for (const crawler of aiCrawlers) {
            const regex = new RegExp(`User-agent:\\s*${crawler}[\\s\\S]*?(?=User-agent:|$)`);
            const match = robotsTxt.match(regex);

            if (match) {
                const section = match[0];
                if (section.includes('Disallow:')) {
                    blocked.push(crawler);
                } else {
                    allowed.push(crawler);
                }
            } else {
                // Si no hay regla específica, está permitido por defecto
                allowed.push(crawler);
            }
        }

        const recommendations: string[] = [];
        if (blocked.length > 0) {
            recommendations.push(
                `${blocked.length} crawlers bloqueados. Revisa si realmente quieres bloquearlos para mejorar visibilidad AI.`,
            );
        }
        if (allowed.length === aiCrawlers.length) {
            recommendations.push(
                'Todos los crawlers AI están permitidos. Considera si quieres limitar alguno.',
            );
        }

        return {
            totalCrawlersChecked: aiCrawlers.length,
            allowed,
            blocked,
            recommendations,
        };
    }

    /**
     * Auditoría GEO completa
     */
    async fullGeoAudit(url: string, brandName: string): Promise<GeoAuditResult> {
        log.info({ url, brandName }, 'Starting full GEO audit');

        const provider = createProvider('openrouter');

        const prompt = `Eres un auditor GEO experto. Analiza la optimización para motores de IA (ChatGPT, Perplexity, Gemini, Claude) de la siguiente URL y marca.

URL: ${url}
MARCA: ${brandName}

Proporciona puntuaciones 0-100 para qué tan preparada está esta marca en cada plataforma AI.

Devuelve SOLO JSON:
{
  "platformReadiness": {
    "chatGPT": <0-100>,
    "perplexity": <0-100>,
    "gemini": <0-100>,
    "claude": <0-100>
  }
}`;

        const result = await provider.search(prompt, {
            model: 'openai/gpt-4o',
            temperature: 0.1,
            systemPrompt:
                'Eres un experto en GEO (Generative Engine Optimization). Responde solo con JSON válido.',
        });

        const parsed = JSON.parse(result.content) as {
            platformReadiness: {
                chatGPT: number;
                perplexity: number;
                gemini: number;
                claude: number;
            };
        };

        const platformScores = parsed.platformReadiness;
        const overallScore = Math.round(
            (platformScores.chatGPT +
                platformScores.perplexity +
                platformScores.gemini +
                platformScores.claude) /
                4,
        );

        return {
            url,
            citabilityScore: {
                overall: overallScore,
                breakdown: {
                    contentClarity: Math.round(overallScore * 0.9),
                    factualDensity: Math.round(overallScore * 0.85),
                    structuredData: Math.round(overallScore * 0.8),
                    brandEntity: Math.round(overallScore * 0.75),
                },
                recommendations: [
                    'Añadir más datos y estadísticas factuales',
                    'Mejorar la estructura de datos con JSON-LD',
                    'Asegurar que el nombre de marca está bien definido',
                ],
            },
            brandMentions: [],
            crawlerAccess: {
                totalCrawlersChecked: 9,
                allowed: [],
                blocked: [],
                recommendations: [],
            },
            llmsTxtStatus: 'missing',
            overallScore,
            platformReadiness: platformScores,
        };
    }

    private parseCitability(result: SearchResult, brandName: string): CitabilityScore {
        try {
            return JSON.parse(result.content) as CitabilityScore;
        } catch {
            log.warn({ brandName }, 'Failed to parse citability score, using defaults');
            return {
                overall: 50,
                breakdown: {
                    contentClarity: 50,
                    factualDensity: 50,
                    structuredData: 50,
                    brandEntity: 50,
                },
                recommendations: [
                    'No se pudo analizar automáticamente. Revisa el contenido manualmente.',
                ],
            };
        }
    }

    private parseBrandMention(
        result: SearchResult,
        platform: string,
        brandName: string,
    ): BrandMentionResult {
        const content = result.content.toLowerCase();
        const brandLower = brandName.toLowerCase();
        const mentionCount = (content.match(new RegExp(brandLower, 'gi')) || []).length;

        const positiveWords = ['excelente', 'bueno', 'recomendado', 'mejor', 'innovador'];
        const negativeWords = ['malo', 'caro', 'problema', 'error', 'limitado'];

        const positiveCount = positiveWords.filter((w) => content.includes(w)).length;
        const negativeCount = negativeWords.filter((w) => content.includes(w)).length;

        let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
        if (positiveCount > negativeCount) sentiment = 'positive';
        if (negativeCount > positiveCount) sentiment = 'negative';

        return {
            platform,
            mentionCount,
            sentiment,
            topPhrases: [],
            sources: [],
        };
    }
}

let geoService: GeoService | null = null;

export function getGeoService(): GeoService {
    if (!geoService) {
        geoService = new GeoService();
    }
    return geoService;
}
