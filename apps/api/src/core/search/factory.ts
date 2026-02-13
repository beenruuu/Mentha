import type { ISearchProvider, ProviderType } from "./types";
import { logger } from "../logger";
import { AnthropicProvider } from "./anthropic.provider";
import { GeminiProvider } from "./gemini.provider";
import { OpenAIProvider } from "./openai.provider";
import { PerplexityProvider } from "./perplexity.provider";

/**
 * Provider instance cache (singleton pattern)
 */
const providerCache = new Map<ProviderType, ISearchProvider>();

/**
 * Factory function to create or retrieve search providers
 * Uses caching to reuse provider instances
 *
 * @param type - The provider type to create
 * @returns The search provider instance
 */
export function createProvider(type: ProviderType): ISearchProvider {
  let provider = providerCache.get(type);

  if (!provider) {
    switch (type) {
      case "perplexity":
        provider = new PerplexityProvider();
        break;
      case "openai":
        provider = new OpenAIProvider();
        break;
      case "gemini":
        provider = new GeminiProvider();
        break;
      case "claude":
        provider = new AnthropicProvider();
        break;
      default:
        throw new Error(`Unknown provider type: ${type}`);
    }

    providerCache.set(type, provider);
    logger.debug(`Created provider: ${type}`);
  }

  if (!provider) {
    throw new Error(`Failed to create provider: ${type}`);
  }

  return provider;
}

/**
 * Get all available providers
 */
export function getAvailableProviders(): ProviderType[] {
  return ["perplexity", "openai", "gemini", "claude"];
}

/**
 * Test all provider connections
 */
export async function testAllProviders(): Promise<
  Record<ProviderType, boolean>
> {
  const results: Record<ProviderType, boolean> = {
    perplexity: false,
    openai: false,
    gemini: false,
    claude: false,
  };

  for (const type of getAvailableProviders()) {
    try {
      const provider = createProvider(type);
      results[type] = await provider.testConnection();
    } catch (error) {
      logger.error(`Failed to test provider ${type}`, {
        error: (error as Error).message,
      });
      results[type] = false;
    }
  }

  return results;
}
