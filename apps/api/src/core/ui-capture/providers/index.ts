import type { UiCaptureProvider } from '../types';
import { aiOverviewConfig } from './ai-overview/index';
import { chatgptConfig } from './chatgpt/index';
import { claudeConfig } from './claude/index';
import { geminiConfig } from './gemini/index';
import { perplexityConfig } from './perplexity/index';
import type { ProviderConfig } from './types';

export type { ProviderConfig } from './types';

export const PROVIDER_CONFIGS: Record<UiCaptureProvider, ProviderConfig> = {
    chatgpt: chatgptConfig,
    claude: claudeConfig,
    gemini: geminiConfig,
    perplexity: perplexityConfig,
    'ai-overview': aiOverviewConfig,
};
