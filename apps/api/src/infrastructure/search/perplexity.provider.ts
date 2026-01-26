import { ISearchProvider, SearchOptions, SearchResult, Citation } from '../../domain/search/types.js';
import { env } from '../../config/index.js';
import { logger } from '../logging/index.js';

/**
 * Perplexity API response format
 */
interface PerplexityResponse {
    id: string;
    model: string;
    object: string;
    created: number;
    citations?: string[];
    choices: Array<{
        index: number;
        finish_reason: string;
        message: {
            role: string;
            content: string;
        };
        delta?: {
            role: string;
            content: string;
        };
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace(/^www\./, '');
    } catch {
        return url;
    }
}

/**
 * Parse citation references from text (e.g., [1], [2])
 */
function extractCitationReferences(content: string): number[] {
    const regex = /\[(\d+)\]/g;
    const matches: number[] = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
        const num = parseInt(match[1] ?? '0', 10);
        if (!matches.includes(num)) {
            matches.push(num);
        }
    }
    return matches.sort((a, b) => a - b);
}

/**
 * Perplexity API search provider
 * Implements the ISearchProvider interface for Perplexity's sonar models
 */
export class PerplexityProvider implements ISearchProvider {
    readonly name = 'perplexity';

    private readonly apiKey: string;
    private readonly baseUrl = 'https://api.perplexity.ai';
    private readonly defaultModel = 'sonar';

    constructor() {
        this.apiKey = env.PERPLEXITY_API_KEY ?? '';
        if (!this.apiKey) {
            logger.warn('PERPLEXITY_API_KEY not configured');
        }
    }

    /**
     * Execute a search query using Perplexity API
     */
    async search(query: string, options?: SearchOptions): Promise<SearchResult> {
        if (!this.apiKey) {
            throw new Error('PERPLEXITY_API_KEY is not configured');
        }

        const startTime = Date.now();

        let systemPrompt = options?.systemPrompt ??
            'You are a helpful research assistant. Provide detailed, accurate answers with citations to sources. Be thorough and cite your sources using numbered references.';

        // Geo-Spatial Context Injection
        if (options?.geo) {
            const { country, location } = options.geo;
            const geoStr = location && location !== 'Global' ? `${location}, ${country}` : country;
            systemPrompt += `\n\nCONTEXT: You are simulating a user located in ${geoStr}. Bias your search results and citations to be relevant for this location.`;
        }

        const requestBody = {
            model: this.defaultModel,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: query },
            ],
            max_tokens: options?.maxTokens ?? 4096,
            temperature: options?.temperature ?? 0.2,
            return_citations: true,
        };

        logger.debug('Perplexity API request', { model: this.defaultModel, queryLength: query.length });

        const controller = new AbortController();
        const timeout = options?.timeout ?? 60000; // Default 60s timeout
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                logger.error('Perplexity API error', { status: response.status, body: errorText });
                throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json() as PerplexityResponse;
            const latencyMs = Date.now() - startTime;

            const content = data.choices[0]?.message?.content ?? '';

            // Extract and map citations
            const citations = this.mapCitations(content, data.citations ?? []);

            logger.info('Perplexity search completed', {
                model: data.model,
                latencyMs,
                citationsCount: citations.length,
                tokenUsage: data.usage?.total_tokens,
            });

            return {
                content,
                citations,
                model: data.model,
                usage: data.usage ? {
                    promptTokens: data.usage.prompt_tokens,
                    completionTokens: data.usage.completion_tokens,
                    totalTokens: data.usage.total_tokens,
                } : undefined,
                latencyMs,
            };

        } catch (error) {
            clearTimeout(timeoutId);

            if ((error as Error).name === 'AbortError') {
                throw new Error(`Perplexity API timeout after ${timeout}ms`);
            }

            throw error;
        }
    }

    /**
     * Map Perplexity citations array to Citation objects
     */
    private mapCitations(content: string, citationUrls: string[]): Citation[] {
        const referencedPositions = extractCitationReferences(content);

        return citationUrls.map((url, index): Citation => ({
            position: index,
            url,
            domain: extractDomain(url),
            title: undefined, // Perplexity doesn't always provide titles
        })).filter((_, index) =>
            // Only include citations that are actually referenced in the text
            referencedPositions.includes(index + 1)
        );
    }

    /**
     * Test API connectivity
     */
    async testConnection(): Promise<boolean> {
        if (!this.apiKey) {
            return false;
        }

        try {
            // Simple test query
            await this.search('What is 2+2?', { maxTokens: 50, timeout: 10000 });
            return true;
        } catch (error) {
            logger.error('Perplexity connection test failed', { error: (error as Error).message });
            return false;
        }
    }
}
