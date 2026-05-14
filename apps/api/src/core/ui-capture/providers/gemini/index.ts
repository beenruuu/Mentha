import type { Page } from 'playwright';

import { extractAssistantMarkdown } from '../../to-markdown';
import { waitForAssistantToFinish } from '../../wait-for-finish';
import type { ProviderConfig } from '../types';

const GEMINI_URL = 'https://gemini.google.com/';

async function handleGeminiConsentPage(page: Page): Promise<void> {
    const consentSelectors = [
        'form[action*="consent"] button:has-text("Accept all")',
        'form[action*="consent"] button:has-text("I agree")',
        'button:has-text("Accept all")',
        '[aria-label*="Accept all" i]',
    ];

    for (const selector of consentSelectors) {
        try {
            const btn = page.locator(selector).first();
            if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
                await btn.click({ timeout: 5000, delay: 100 }).catch(() => null);
                await page.waitForTimeout(2000);
                return;
            }
        } catch {
            // ignore
        }
    }
}

async function waitForGeminiConversationUrl(
    page: Page,
    context: { preSubmitUrl: string },
): Promise<boolean | undefined> {
    const preSubmitUrl = context.preSubmitUrl;
    const currentUrl = page.url();
    if (currentUrl !== preSubmitUrl && currentUrl.includes('/app/')) {
        return true;
    }
    return undefined;
}

async function extractSourcesFromGemini(page: Page) {
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

                const sourceLinks = await page.locator('a[href^="http"]').evaluateAll((links) =>
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

export const geminiConfig: ProviderConfig = {
    url: GEMINI_URL,
    label: 'Gemini',
    displayName: 'Gemini',
    requiresAuth: true,
    editorSelectors: [
        'div[aria-label="Enter a prompt for Gemini"]',
        'rich-textarea [contenteditable="true"]',
        '[contenteditable="true"]',
    ],
    sendButtonSelectors: ['button[aria-label*="Send" i]', 'button[aria-label*="Submit" i]'],

    postNavigationHook: async (page) => {
        await handleGeminiConsentPage(page);
    },

    beforePromptHook: async (page) => {
        await handleGeminiConsentPage(page);
    },

    checkSubmitSuccess: waitForGeminiConversationUrl,

    waitForResponse: (page) => waitForAssistantToFinish(page, 'gemini'),

    extractResponse: async (page) => {
        const html = await page
            .locator('message-content .markdown')
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

    extractSources: extractSourcesFromGemini,
};
