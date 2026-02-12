import OpenAI from 'openai';

import { env } from '../../config/env';
import type { ISearchProvider, SearchOptions, SearchResult } from '../../services/search.types';
import { logger } from '../logger';

/**
 * OpenAI search provider
 * Uses GPT-4o for brand knowledge evaluation (no web search)
 * Useful for understanding what the model "knows" about a brand
 */
export class OpenAIProvider implements ISearchProvider {
    readonly name = 'openai';

    private readonly client: OpenAI | null;
    private readonly defaultModel = 'gpt-4o';

    constructor() {
        const apiKey = env.OPENAI_API_KEY;
        if (apiKey) {
            this.client = new OpenAI({ apiKey });
        } else {
            this.client = null;
            logger.warn('OPENAI_API_KEY not configured');
        }
    }

    /**
     * Execute a search query using OpenAI API
     * Note: This doesn't have web access, so it's based on training data
     */
    async search(query: string, options?: SearchOptions): Promise<SearchResult> {
        if (!this.client) {
            throw new Error('OPENAI_API_KEY is not configured');
        }

        const startTime = Date.now();

        let systemPrompt =
            options?.systemPrompt ??
            'You are a knowledgeable assistant helping with brand research. Provide detailed, accurate information based on your knowledge. When discussing products or services, be objective and thorough.';

        // Geo-Spatial Context Injection
        if (options?.geo) {
            const { country, location } = options.geo;
            const geoStr = location && location !== 'Global' ? `${location}, ${country}` : country;
            systemPrompt += `\n\nCONTEXT: You are simulating a user located in ${geoStr}. Bias your answers and entity retrieval to be relevant for this location.`;
        }

        logger.debug('OpenAI API request', { model: this.defaultModel, queryLength: query.length });

        try {
            const response = await this.client.chat.completions.create({
                model: this.defaultModel,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: query },
                ],
                max_tokens: options?.maxTokens ?? 4096,
                temperature: options?.temperature ?? 0.3,
            });

            const latencyMs = Date.now() - startTime;
            const content = response.choices[0]?.message?.content ?? '';

            logger.info('OpenAI search completed', {
                model: response.model,
                latencyMs,
                tokenUsage: response.usage?.total_tokens,
            });

            return {
                content,
                citations: [], // OpenAI doesn't provide citations
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
            logger.error('OpenAI API error', { error: (error as Error).message });
            throw error;
        }
    }

    /**
     * Test API connectivity
     */
    async testConnection(): Promise<boolean> {
        if (!this.client) {
            return false;
        }

        try {
            await this.search('Hello', { maxTokens: 10 });
            return true;
        } catch (error) {
            logger.error('OpenAI connection test failed', { error: (error as Error).message });
            return false;
        }
    }
}
