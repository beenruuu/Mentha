import { env } from '../../config/env';
import { logger } from '../logger';
import { MockSearchProvider } from './mock.provider';
import { OpenRouterProvider } from './openrouter.provider';
import type { ISearchProvider, ProviderType } from './types';

/**
 * Provider instance cache (singleton pattern)
 */
const providerCache = new Map<ProviderType, ISearchProvider>();

/**
 * Factory function to create or retrieve search providers
 * Uses caching to reuse provider instances
 *
 * ALL models are now routed through OpenRouter
 *
 * @param type - The provider type to create
 * @returns The search provider instance
 */
export function createProvider(type: ProviderType): ISearchProvider {
    let provider = providerCache.get(type);

    if (!provider) {
        if (env.MENTHA_QA_MODE) {
            provider = new MockSearchProvider(type);
            providerCache.set(type, provider);
            logger.debug(`Created QA mock provider: ${type}`);
            return provider;
        }

        // Redirect ALL providers to OpenRouter
        provider = new OpenRouterProvider();

        // Ensure the provider knows its original requested type to pick the right model
        Object.defineProperty(provider, 'name', { value: type });

        providerCache.set(type, provider);
        logger.debug(`Created OpenRouter proxy for provider: ${type}`);
    }

    return provider;
}

/**
 * Get all available providers
 */
export function getAvailableProviders(): ProviderType[] {
    return ['perplexity', 'openai', 'gemini', 'claude', 'openrouter'];
}

/**
 * Test all provider connections
 */
export async function testAllProviders(): Promise<Record<ProviderType, boolean>> {
    const results: Record<ProviderType, boolean> = {
        perplexity: false,
        openai: false,
        gemini: false,
        claude: false,
        openrouter: false,
    };

    for (const type of getAvailableProviders()) {
        try {
            const provider = createProvider(type);
            results[type] = await provider.testConnection();
        } catch (error) {
            logger.error(
                {
                    error: (error as Error).message,
                },
                `Failed to test provider ${type}`,
            );
            results[type] = false;
        }
    }

    return results;
}
