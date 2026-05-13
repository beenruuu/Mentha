/**
 * Centralized engine display utilities.
 * Always show brand names — never expose the underlying model identifier.
 */

/** Map internal engine IDs to their public brand names */
export function getEngineDisplayName(engine: string): string {
    const names: Record<string, string> = {
        perplexity: 'Perplexity',
        openai: 'ChatGPT',
        gemini: 'Gemini',
        claude: 'Claude',
        openrouter: 'AI Engine',
    };
    return names[engine] || engine;
}

/** Brand colors per engine */
export const ENGINE_COLORS: Record<string, string> = {
    perplexity: '#20B2AA',
    openai: '#10a37f',
    gemini: '#4285f4',
    claude: '#d97757',
};
