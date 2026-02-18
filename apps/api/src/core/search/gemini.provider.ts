import { env } from '../../config/env';
import { logger } from '../logger';
import type { ISearchProvider, SearchOptions, SearchResult } from './types';

/**
 * Google Gemini API response format
 */
interface GeminiResponse {
    candidates: Array<{
        content: {
            parts: Array<{
                text: string;
            }>;
            role: string;
        };
        finishReason: string;
        index: number;
        safetyRatings: Array<{
            category: string;
            probability: string;
        }>;
    }>;
    usageMetadata?: {
        promptTokenCount: number;
        candidatesTokenCount: number;
        totalTokenCount: number;
    };
}

/**
 * Google Gemini search provider
 * Uses Gemini 1.5 Flash for cost-effective analysis
 */
export class GeminiProvider implements ISearchProvider {
    readonly name = 'gemini';

    private readonly apiKey: string;
    private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    private readonly defaultModel = 'gemini-1.5-flash-latest';

    constructor() {
        this.apiKey = env.GOOGLE_AI_KEY ?? '';
        if (!this.apiKey) {
            logger.warn('GOOGLE_AI_KEY not configured');
        }
    }

    /**
     * Execute a search query using Gemini API
     */
    async search(query: string, options?: SearchOptions): Promise<SearchResult> {
        if (!this.apiKey) {
            throw new Error('GOOGLE_AI_KEY is not configured');
        }

        const startTime = Date.now();

        const systemPrompt =
            options?.systemPrompt ??
            'You are a knowledgeable research assistant. Provide detailed, accurate information. Be thorough and objective in your analysis.';

        const requestBody = {
            contents: [
                {
                    parts: [{ text: `${systemPrompt}\n\nUser Query: ${query}` }],
                },
            ],
            generationConfig: {
                maxOutputTokens: options?.maxTokens ?? 4096,
                temperature: options?.temperature ?? 0.3,
            },
        };

        logger.debug('Gemini API request', {
            model: this.defaultModel,
            queryLength: query.length,
        });

        const controller = new AbortController();
        const timeout = options?.timeout ?? 60000;
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const url = `${this.baseUrl}/models/${this.defaultModel}:generateContent?key=${this.apiKey}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                logger.error('Gemini API error', {
                    status: response.status,
                    body: errorText,
                });
                throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
            }

            const data = (await response.json()) as GeminiResponse;
            const latencyMs = Date.now() - startTime;

            const content = data.candidates[0]?.content?.parts[0]?.text ?? '';

            logger.info('Gemini search completed', {
                model: this.defaultModel,
                latencyMs,
                tokenUsage: data.usageMetadata?.totalTokenCount,
            });

            return {
                content,
                citations: [], // Gemini doesn't provide structured citations
                model: this.defaultModel,
                usage: data.usageMetadata
                    ? {
                          promptTokens: data.usageMetadata.promptTokenCount,
                          completionTokens: data.usageMetadata.candidatesTokenCount,
                          totalTokens: data.usageMetadata.totalTokenCount,
                      }
                    : undefined,
                latencyMs,
            };
        } catch (error) {
            clearTimeout(timeoutId);

            if ((error as Error).name === 'AbortError') {
                throw new Error(`Gemini API timeout after ${timeout}ms`);
            }

            throw error;
        }
    }

    /**
     * Test API connectivity
     */
    async testConnection(): Promise<boolean> {
        if (!this.apiKey) {
            return false;
        }

        try {
            await this.search('Hello', { maxTokens: 10, timeout: 10000 });
            return true;
        } catch (error) {
            logger.error('Gemini connection test failed', {
                error: (error as Error).message,
            });
            return false;
        }
    }
}
