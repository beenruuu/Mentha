export interface SearchOptions {
    maxTokens?: number;
    temperature?: number;
    timeout?: number;
    systemPrompt?: string;
    geo?: {
        country?: string;
        location?: string;
    };
}

export interface Citation {
    position: number;
    url: string;
    domain: string;
    title?: string;
    snippet?: string;
}

export interface SearchResult {
    content: string;
    citations: Citation[];
    model: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    latencyMs: number;
}

export interface ISearchProvider {
    readonly name: string;
    search(query: string, options?: SearchOptions): Promise<SearchResult>;
    testConnection(): Promise<boolean>;
}

export type ProviderType = 'perplexity' | 'openai' | 'gemini' | 'claude';
