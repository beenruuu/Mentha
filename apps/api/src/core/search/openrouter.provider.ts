import OpenAI from 'openai';

import { env } from '../../config/env';
import { logger } from '../logger';
import type { Citation, ISearchProvider, SearchOptions, SearchResult } from './types';

type OpenRouterCitation = string | { url?: unknown; title?: unknown };
type OpenRouterResponseWithCitations = {
    citations?: unknown;
    choices?: Array<{
        message?: {
            citations?: unknown;
        };
    }>;
};

/**
 * OpenRouter Provider - Unifica todos los modelos LLM
 * Docs: https://openrouter.ai/docs
 */
export class OpenRouterProvider implements ISearchProvider {
    readonly name = 'openrouter';

    private readonly client: OpenAI | null;

    // Modelos disponibles en OpenRouter
    private readonly models: Record<string, string> = {
        // Mapeo por proveedor
        perplexity: 'perplexity/sonar-pro',
        openai: 'openai/gpt-4o',
        claude: 'anthropic/claude-3-haiku',
        gemini: 'google/gemini-2.5-flash-lite',

        // Mapeo por propósito
        search: 'perplexity/sonar-pro',
        analysis: 'openai/gpt-4o',
        reasoning: 'anthropic/claude-3-haiku',
        fast: 'google/gemini-2.5-flash-lite',
        coding: 'deepseek/deepseek-coder-v2',
    };

    constructor() {
        const apiKey = env.OPENROUTER_API_KEY;
        if (apiKey) {
            this.client = new OpenAI({
                apiKey,
                baseURL: 'https://openrouter.ai/api/v1',
            });
            logger.info('OpenRouter provider initialized');
        } else {
            this.client = null;
            logger.warn('OPENROUTER_API_KEY not configured');
        }
    }

    /**
     * Seleccionar modelo según el nombre del proveedor o el propósito
     */
    private getModel(key?: string): string {
        // First try the instance name (set by factory)
        const providerModel = this.models[this.name];
        if (providerModel && this.name !== 'openrouter') {
            return providerModel;
        }

        // Then try the purpose key
        return (key ? this.models[key] : undefined) ?? this.models.analysis ?? 'openai/gpt-4o';
    }

    /**
     * Ejecutar búsqueda usando OpenRouter
     */
    async search(query: string, options?: SearchOptions): Promise<SearchResult> {
        if (!this.client) {
            throw new Error('OPENROUTER_API_KEY is not configured');
        }

        const startTime = Date.now();
        const model = options?.model || this.getModel(options?.purpose);

        let systemPrompt =
            options?.systemPrompt ??
            'You are a helpful assistant with extensive knowledge about brands, companies, and products. Provide accurate, detailed information. When discussing products or services, be objective and cite sources when possible.';

        // Geo-Spatial Context Injection
        if (options?.geo) {
            const { country, location } = options.geo;
            const geoStr = location && location !== 'Global' ? `${location}, ${country}` : country;
            systemPrompt += `\n\nCONTEXT: You are simulating a user located in ${geoStr}. Bias your answers to be relevant for this location.`;
        }

        logger.debug(
            {
                model,
                queryLength: query.length,
            },
            'OpenRouter API request',
        );

        try {
            const response = await this.client.chat.completions.create({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: query },
                ],
                max_tokens: options?.maxTokens ?? 4096,
                temperature: options?.temperature ?? 0.3,
            });

            const latencyMs = Date.now() - startTime;
            const content = response.choices[0]?.message?.content ?? '';

            const extractedCitations: Citation[] = [];

            // Check for direct citations field (OpenRouter Perplexity models)
            const rawResponse = response as unknown as OpenRouterResponseWithCitations;
            if (Array.isArray(rawResponse.citations)) {
                rawResponse.citations.forEach((url: unknown, index: number) => {
                    if (typeof url !== 'string') return;
                    try {
                        const domain = new URL(url).hostname.replace(/^www\./, '');
                        extractedCitations.push({ position: index + 1, url, domain });
                    } catch {}
                });
            } else if (Array.isArray(rawResponse.choices?.[0]?.message?.citations)) {
                rawResponse.choices[0]?.message?.citations?.forEach(
                    (citation: OpenRouterCitation, index: number) => {
                        const url =
                            typeof citation === 'string'
                                ? citation
                                : typeof citation.url === 'string'
                                  ? citation.url
                                  : null;
                        if (!url) return;

                        const title =
                            typeof citation === 'object' && typeof citation.title === 'string'
                                ? citation.title
                                : undefined;

                        try {
                            const domain = new URL(url).hostname.replace(/^www\./, '');
                            extractedCitations.push({ position: index + 1, url, domain, title });
                        } catch {}
                    },
                );
            }

            // Fallback to Markdown URL extraction if no explicit citations found
            if (extractedCitations.length === 0) {
                const urlRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
                let match: RegExpExecArray | null;
                let pos = 1;
                while ((match = urlRegex.exec(content)) !== null) {
                    try {
                        const url = match[2];
                        if (!url || extractedCitations.find((citation) => citation.url === url)) {
                            continue;
                        }
                        const domain = new URL(url).hostname.replace(/^www\./, '');
                        extractedCitations.push({ position: pos++, url, domain, title: match[1] });
                    } catch {}
                }
            }

            logger.info(
                {
                    model: response.model,
                    latencyMs,
                    tokenUsage: response.usage?.total_tokens,
                    citationsCount: extractedCitations.length,
                },
                'OpenRouter search completed',
            );

            return {
                content,
                citations: extractedCitations,
                model: response.model,
                usage: response.usage
                    ? {
                          promptTokens: response.usage.prompt_tokens,
                          completionTokens: response.usage.completion_tokens,
                          totalTokens: response.usage.total_tokens,
                      }
                    : undefined,
                latencyMs,
            };
        } catch (error) {
            logger.error({ error: (error as Error).message }, 'OpenRouter API error');
            throw error;
        }
    }

    /**
     * Test de conectividad
     */
    async testConnection(): Promise<boolean> {
        if (!this.client) {
            return false;
        }

        try {
            await this.search('Hello', { maxTokens: 10 });
            return true;
        } catch (error) {
            logger.error(
                {
                    error: (error as Error).message,
                },
                'OpenRouter connection test failed',
            );
            return false;
        }
    }

    /**
     * Listar modelos disponibles
     */
    async listModels(): Promise<string[]> {
        if (!this.client) {
            return [];
        }

        try {
            const response = await this.client.models.list();
            return response.data.map((m) => m.id);
        } catch (error) {
            logger.error({ error: (error as Error).message }, 'Failed to list models');
            return [];
        }
    }
}
