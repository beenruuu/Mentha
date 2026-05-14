import type { Page } from 'playwright';

import type { UiCaptureSource } from '../types';

export interface ProviderConfig {
    url: string;
    label: string;
    displayName: string;
    skipInitialNavigation?: boolean;
    requiresAuth?: boolean;
    navigateToPrompt?: (page: Page, prompt: string) => Promise<void>;
    preNavigationHook?: (page: Page) => Promise<void>;
    postNavigationHook?: (page: Page) => Promise<void>;
    beforePromptHook?: (page: Page) => Promise<void>;
    afterTypingHook?: (page: Page) => Promise<void>;
    beforeSubmitHook?: (page: Page) => Promise<void>;
    afterSubmitHook?: (page: Page) => Promise<void>;
    betweenPromptsHook?: (page: Page) => Promise<void>;
    beforeRetryHook?: (page: Page) => Promise<void>;
    waitForResponse: (page: Page) => Promise<void>;
    extractResponse: (page: Page) => Promise<string>;
    extractSources: (page: Page) => Promise<UiCaptureSource[]>;
    submitOrder?: Array<'native' | 'enter' | 'force' | 'dispatch'>;
    checkSubmitSuccess?: (
        page: Page,
        context: { preSubmitUrl: string },
    ) => Promise<boolean | undefined>;
    editorSelectors: string[];
    sendButtonSelectors: string[];
}
