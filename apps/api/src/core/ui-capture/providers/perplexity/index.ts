import type { Page } from 'playwright';

import { extractAssistantMarkdown } from '../../to-markdown';
import { waitForAssistantToFinish } from '../../wait-for-finish';
import type { ProviderConfig } from '../types';

const PERPLEXITY_URL = 'https://www.perplexity.ai/';
const PERPLEXITY_SEARCH_PATTERN = '/search/';

async function waitForPerplexitySearchUrl(
    page: Page,
    context: { preSubmitUrl: string },
): Promise<boolean | undefined> {
    const preSubmitUrl = context.preSubmitUrl;
    const currentUrl = page.url();
    if (currentUrl.includes(PERPLEXITY_SEARCH_PATTERN) || currentUrl !== preSubmitUrl) {
        return true;
    }
    return undefined;
}

async function resetPerplexityPage(page: Page): Promise<void> {
    await page
        .goto(PERPLEXITY_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
        .catch(() => null);
    await page.waitForTimeout(2000);
}

async function extractSourcesFromPerplexity(page: Page) {
    const sourceCardSelectors = [
        'div[id^="markdown-content-"]',
        '[data-testid="answer"]',
        'article',
    ];

    for (const selector of sourceCardSelectors) {
        try {
            const sources = await page
                .locator(selector)
                .last()
                .evaluate((el) => {
                    const anchors = el.querySelectorAll('a[href^="http"]');
                    const results: Array<{
                        url: string;
                        title: string;
                        domain: string;
                        position: number;
                    }> = [];
                    const seen = new Set<string>();

                    anchors.forEach((a, i) => {
                        const href = (a as HTMLAnchorElement).href;
                        if (seen.has(href)) return;
                        seen.add(href);
                        try {
                            results.push({
                                url: href,
                                title: (a as HTMLAnchorElement).innerText.trim() || href,
                                domain: new URL(href).hostname,
                                position: i + 1,
                            });
                        } catch {
                            // ignore invalid URLs
                        }
                    });

                    return results;
                })
                .catch(
                    () =>
                        [] as Array<{
                            url: string;
                            title: string;
                            domain: string;
                            position: number;
                        }>,
                );

            if (sources.length > 0) return sources;
        } catch {
            // ignore
        }
    }

    return [];
}

export const perplexityConfig: ProviderConfig = {
    url: PERPLEXITY_URL,
    label: 'Perplexity',
    displayName: 'Perplexity',
    requiresAuth: false,
    editorSelectors: ['#ask-input', 'textarea[placeholder*="Ask" i]', '[contenteditable="true"]'],
    sendButtonSelectors: [
        'button[aria-label*="Submit" i]',
        'button[aria-label*="Search" i]',
        'button[type="submit"]',
    ],
    submitOrder: ['enter', 'native', 'force', 'dispatch'],

    checkSubmitSuccess: waitForPerplexitySearchUrl,

    betweenPromptsHook: resetPerplexityPage,

    beforeRetryHook: resetPerplexityPage,

    waitForResponse: (page) => waitForAssistantToFinish(page, 'perplexity'),

    extractResponse: async (page) => {
        const html = await page
            .locator('div[id^="markdown-content-"]')
            .last()
            .innerHTML()
            .catch(() => '');
        if (!html) {
            const fallback = await page
                .locator('main')
                .innerHTML()
                .catch(() => '');
            if (!fallback) return '';
            return extractAssistantMarkdown(fallback);
        }
        return extractAssistantMarkdown(html);
    },

    extractSources: extractSourcesFromPerplexity,
};
