import type { Page } from 'playwright';

import { extractAssistantMarkdown } from '../../to-markdown';
import { waitForAssistantToFinish } from '../../wait-for-finish';
import type { ProviderConfig } from '../types';

const CHATGPT_URL = 'https://chatgpt.com/';

async function dismissChatgptAuthModal(page: Page): Promise<void> {
    const dismissSelectors = [
        'button[data-testid="signup-button"]',
        'button:has-text("Log in")',
        'button:has-text("Stay logged out")',
        '[role="dialog"] button:has-text("Close")',
        '[role="dialog"] button[aria-label="Close"]',
    ];

    for (const selector of dismissSelectors) {
        try {
            const btn = page.locator(selector).first();
            if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
                await btn.click({ timeout: 3000, delay: 100 }).catch(() => null);
            }
        } catch {
            // ignore
        }
    }
}

async function extractSourcesFromChatgpt(page: Page) {
    const sourceButtonSelectors = [
        'button:has-text("Sources")',
        '[data-testid="sources-button"]',
        'button[aria-label*="Sources" i]',
    ];

    for (const selector of sourceButtonSelectors) {
        try {
            const btn = page.locator(selector).first();
            if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
                await btn.click({ timeout: 5000, delay: 100 });
                await page.waitForTimeout(1000);

                const sourceLinks = await page
                    .locator('[role="dialog"] a[href^="http"], .sources-panel a[href^="http"]')
                    .evaluateAll((links) =>
                        links
                            .map((link, i) => {
                                const a = link as HTMLAnchorElement;
                                try {
                                    return {
                                        url: a.href,
                                        title: a.innerText.trim() || a.href,
                                        domain: new URL(a.href).hostname,
                                        position: i + 1,
                                    };
                                } catch {
                                    return null;
                                }
                            })
                            .filter((s): s is NonNullable<typeof s> => s !== null),
                    );

                if (sourceLinks.length > 0) return sourceLinks;
            }
        } catch {
            // ignore
        }
    }

    return [];
}

export const chatgptConfig: ProviderConfig = {
    url: CHATGPT_URL,
    label: 'ChatGPT',
    displayName: 'ChatGPT',
    requiresAuth: true,
    editorSelectors: [
        '#prompt-textarea',
        'textarea[placeholder*="message" i]',
        '[contenteditable="true"]',
    ],
    sendButtonSelectors: ['button[data-testid="send-button"]', 'button[aria-label*="Send" i]'],
    submitOrder: ['enter', 'native', 'force', 'dispatch'],

    beforePromptHook: async (page) => {
        await dismissChatgptAuthModal(page);
    },

    afterTypingHook: async (page) => {
        await dismissChatgptAuthModal(page);
    },

    beforeSubmitHook: async (page) => {
        await dismissChatgptAuthModal(page);
    },

    afterSubmitHook: async (page) => {
        await dismissChatgptAuthModal(page);
    },

    beforeRetryHook: async (page) => {
        await page
            .goto(CHATGPT_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
            .catch(() => null);
        await page.waitForTimeout(2000);
    },

    waitForResponse: (page) => waitForAssistantToFinish(page, 'chatgpt'),

    extractResponse: async (page) => {
        const html = await page
            .locator('[data-message-author-role="assistant"]')
            .last()
            .innerHTML()
            .catch(() => '');
        if (!html) return '';
        return extractAssistantMarkdown(html);
    },

    extractSources: extractSourcesFromChatgpt,
};
