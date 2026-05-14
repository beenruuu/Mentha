import type { Page } from 'playwright';

import { logger } from '../../core/logger';
import { randomBetween } from './human-behavior';

type ProviderKey = 'chatgpt' | 'claude' | 'gemini' | 'perplexity' | 'ai-overview';

const PROVIDER_WAIT_CONFIGS: Record<
    ProviderKey,
    {
        stopButtonSelectors: string[];
        responseSelector: string;
        noOutputTimeoutMs: number;
        forceExitStableMs: number;
    }
> = {
    chatgpt: {
        stopButtonSelectors: ['button[data-testid="stop-button"]', '[aria-label*="Stop" i]'],
        responseSelector: '[data-message-author-role="assistant"]',
        noOutputTimeoutMs: 60_000,
        forceExitStableMs: 30_000,
    },
    claude: {
        stopButtonSelectors: [
            'button[aria-label*="Stop" i]',
            '[role="button"][aria-label*="stop" i]',
        ],
        responseSelector: '[data-is-streaming="false"] .standard-markdown',
        noOutputTimeoutMs: 60_000,
        forceExitStableMs: 30_000,
    },
    gemini: {
        stopButtonSelectors: ['button[aria-label*="Stop" i]', 'button:has(svg[data-icon="stop"])'],
        responseSelector: 'message-content .markdown',
        noOutputTimeoutMs: 60_000,
        forceExitStableMs: 35_000,
    },
    perplexity: {
        stopButtonSelectors: ['button[aria-label*="Stop" i]', '[data-testid="stop-generation"]'],
        responseSelector: 'div[id^="markdown-content-"]',
        noOutputTimeoutMs: 75_000,
        forceExitStableMs: 40_000,
    },
    'ai-overview': {
        stopButtonSelectors: [],
        responseSelector: '#main',
        noOutputTimeoutMs: 30_000,
        forceExitStableMs: 20_000,
    } as {
        stopButtonSelectors: string[];
        responseSelector: string;
        noOutputTimeoutMs: number;
        forceExitStableMs: number;
    },
};

function getResponseHash(text: string, childCount: number): string {
    return `${text.length}:${childCount}:${text.slice(-50)}`;
}

async function hasStopButton(
    page: Page,
    config: (typeof PROVIDER_WAIT_CONFIGS)[keyof typeof PROVIDER_WAIT_CONFIGS],
): Promise<boolean> {
    for (const selector of config.stopButtonSelectors) {
        const visible = await page
            .locator(selector)
            .first()
            .isVisible()
            .catch(() => false);
        if (visible) return true;
    }
    return false;
}

async function sampleResponseState(
    page: Page,
    selector: string,
): Promise<{ text: string; childCount: number } | null> {
    try {
        const locator = page.locator(selector).last();
        const visible = await locator
            .first()
            .isVisible()
            .catch(() => false);
        if (!visible) return null;

        const text = await locator.innerText().catch(() => '');
        const childCount = await locator
            .locator('> *')
            .count()
            .catch(() => 0);
        return { text, childCount };
    } catch {
        return null;
    }
}

async function randomSleep(page: Page, base: number, jitter: number): Promise<void> {
    await page.waitForTimeout(base + randomBetween(0, jitter));
}

export async function waitForAssistantToFinish(page: Page, provider: ProviderKey): Promise<void> {
    const config = PROVIDER_WAIT_CONFIGS[provider];
    const startTime = Date.now();
    let firstResponseTime: number | null = null;
    let lastStableHash: string | null = null;
    let stableSince: number | null = null;
    let lastLoggedStable = 0;

    while (true) {
        const elapsed = Date.now() - startTime;

        if (elapsed > config.noOutputTimeoutMs) {
            logger.warn(
                { provider, elapsed },
                'waitForAssistantToFinish: no output timeout reached',
            );
            return;
        }

        const isGenerating = await hasStopButton(page, config);
        const state = await sampleResponseState(page, config.responseSelector);

        if (state && state.text.trim().length > 0) {
            if (firstResponseTime === null) {
                firstResponseTime = Date.now();
            }

            const currentHash = getResponseHash(state.text, state.childCount);

            if (currentHash === lastStableHash) {
                if (stableSince === null) {
                    stableSince = Date.now();
                }

                const stableDuration = Date.now() - stableSince;

                if (stableDuration > 1500 && !isGenerating) {
                    const totalWait = Date.now() - startTime;
                    logger.info(
                        { provider, totalWait, stableDuration },
                        'waitForAssistantToFinish: response stable, done',
                    );
                    return;
                }

                const forceExitElapsed = Date.now() - startTime;
                if (forceExitElapsed > config.forceExitStableMs) {
                    logger.info(
                        { provider, forceExitElapsed },
                        'waitForAssistantToFinish: force exit timeout reached',
                    );
                    return;
                }

                if (Math.floor(stableDuration / 5000) > lastLoggedStable) {
                    lastLoggedStable = Math.floor(stableDuration / 5000);
                    logger.debug(
                        { provider, stableDuration, isGenerating },
                        'waitForAssistantToFinish: still waiting for stability',
                    );
                }
            } else {
                lastStableHash = currentHash;
                stableSince = null;
            }
        }

        if (elapsed > config.forceExitStableMs && firstResponseTime !== null) {
            logger.info(
                { provider, elapsed },
                'waitForAssistantToFinish: force exit after response received',
            );
            return;
        }

        const firstResponseTimeDiff =
            firstResponseTime !== null ? Date.now() - firstResponseTime : 0;
        const waitBase = firstResponseTime !== null && firstResponseTimeDiff > 10000 ? 400 : 200;
        await randomSleep(page, waitBase, 100);
    }
}
