import type { ISearchProvider, SearchOptions, SearchResult } from './types';

export class MockSearchProvider implements ISearchProvider {
    readonly name: string;

    constructor(name = 'mock') {
        this.name = name;
    }

    async search(query: string, _options?: SearchOptions): Promise<SearchResult> {
        const start = Date.now();
        const brandMatch = query.match(
            /(?:marca|brand|domain|dominio|sobre|about)\s*:?\s*["“]?([^"\n.]+)["”]?/i,
        );
        const brand = brandMatch?.[1]?.trim() || 'Mentha QA Brand';

        return {
            content: [
                `Mock QA response for ${brand}.`,
                `The brand is visible for the query: ${query.slice(0, 160)}.`,
                'Mentha QA mode avoids external model calls and returns deterministic evidence.',
                '[QA citation](https://example.com/qa-source)',
            ].join('\n\n'),
            citations: [
                {
                    position: 1,
                    url: 'https://example.com/qa-source',
                    domain: 'example.com',
                    title: 'QA citation',
                },
            ],
            model: 'mentha/mock-provider',
            usage: {
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0,
            },
            latencyMs: Date.now() - start,
        };
    }

    async testConnection(): Promise<boolean> {
        return true;
    }
}
