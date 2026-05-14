import type { Page } from 'playwright';

import { extractAssistantMarkdown } from '../../to-markdown';
import { waitForAssistantToFinish } from '../../wait-for-finish';
import type { ProviderConfig } from '../types';

const CLAUDE_URL = 'https://claude.ai/new';

async function extractSourcesFromClaude(page: Page) {
    try {
        const sources = await page
            .locator('[data-is-streaming="false"] .standard-markdown')
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
                () => [] as Array<{ url: string; title: string; domain: string; position: number }>,
            );

        return sources;
    } catch {
        return [];
    }
}

export const claudeConfig: ProviderConfig = {
    url: CLAUDE_URL,
    label: 'Claude',
    displayName: 'Claude',
    requiresAuth: true,
    editorSelectors: ['[data-testid="chat-input"]', 'div[contenteditable="true"]', 'textarea'],
    sendButtonSelectors: ['button[aria-label*="Send" i]', 'button[type="submit"]'],
    submitOrder: ['enter', 'native', 'force'],

    beforeRetryHook: async (page) => {
        await page
            .goto(CLAUDE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
            .catch(() => null);
        await page.waitForTimeout(2000);
    },

    waitForResponse: (page) => waitForAssistantToFinish(page, 'claude'),

    extractResponse: async (page) => {
        const html = await page
            .locator('[data-is-streaming="false"] .standard-markdown')
            .last()
            .innerHTML()
            .catch(() => '');
        if (!html) return '';
        return extractAssistantMarkdown(html);
    },

    extractSources: extractSourcesFromClaude,
};
