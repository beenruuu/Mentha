/**
 * Domain types for search providers
 * This module defines the interface that all LLM search providers must implement
 */

/**
 * Options for search requests
 */
export interface SearchOptions {
    /** Maximum tokens in response */
    maxTokens?: number;
    /** Temperature for response generation */
    temperature?: number;
    /** Timeout in milliseconds */
    timeout?: number;
    /** System prompt override */
    systemPrompt?: string;
    /** Geo-Spatial Context */
    geo?: {
        country?: string; // e.g. "ES"
        location?: string; // e.g. "Madrid"
    };
}

/**
 * A citation/source from the LLM response
 */
export interface Citation {
    /** Zero-indexed position in the response */
    position: number;
    /** Source URL */
    url: string;
    /** Extracted domain name */
    domain: string;
    /** Title of the source (if available) */
    title?: string;
    /** Snippet from the source (if available) */
    snippet?: string;
}

/**
 * Result of a search request
 */
export interface SearchResult {
    /** The raw text response from the LLM */
    content: string;
    /** Extracted citations/sources */
    citations: Citation[];
    /** Model used for the response */
    model: string;
    /** Token usage information */
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    /** Response latency in milliseconds */
    latencyMs: number;
}

/**
 * Search provider interface
 * All LLM providers (Perplexity, OpenAI, Gemini) must implement this
 */
export interface ISearchProvider {
    /** Provider name for logging/identification */
    readonly name: string;

    /**
     * Execute a search query
     * @param query - The user's search query
     * @param options - Optional configuration
     * @returns Search result with content and citations
     */
    search(query: string, options?: SearchOptions): Promise<SearchResult>;

    /**
     * Test provider connectivity
     * @returns true if the provider is reachable
     */
    testConnection(): Promise<boolean>;
}

/**
 * Provider type enum
 */
export type ProviderType = 'perplexity' | 'openai' | 'gemini' | 'claude';
