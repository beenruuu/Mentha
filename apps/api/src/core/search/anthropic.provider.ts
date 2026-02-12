import Anthropic from '@anthropic-ai/sdk';

import type { ISearchProvider, SearchOptions, SearchResult } from '../../services/search.types';

export class AnthropicProvider implements ISearchProvider {
    readonly name = 'claude';
    private client: Anthropic;
    private model: string;

    constructor(apiKey?: string, model: string = 'claude-3-5-sonnet-20240620') {
        this.client = new Anthropic({
            apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
        });
        this.model = model;
    }

    async search(query: string, options?: SearchOptions): Promise<SearchResult> {
        const startTime = Date.now();

        try {
            // Build system prompt with Geo-Spatial Context
            let systemPrompt = 'You are a helpful AI assistant providing accurate information.';
            if (options?.geo) {
                systemPrompt += `\nCRITICAL CONTEXT: The user is searching from ${options.geo.location} (${options.geo.country}). Provide results relevant to this specific location. Do NOT give US-centric answers if the user is in Europe.`;
            }

            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: 1024,
                system: systemPrompt,
                messages: [{ role: 'user', content: query }],
            });

            // Extract text from content blocks
            const textContent = response.content
                .filter((block) => block.type === 'text')
                .map((block) => (block as any).text)
                .join('\n');

            return {
                content: textContent,
                model: this.model,
                latencyMs: Date.now() - startTime,
                citations: [], // Claude API doesn't provide structured citations natively yet in this format
            };
        } catch (error) {
            throw new Error(`Anthropic search failed: ${(error as Error).message}`);
        }
    }

    async testConnection(): Promise<boolean> {
        try {
            await this.client.messages.create({
                model: this.model,
                max_tokens: 10,
                messages: [{ role: 'user', content: 'test' }],
            });
            return true;
        } catch {
            return false;
        }
    }
}
