import type { Page } from 'playwright';

import { extractAssistantMarkdown } from '../../to-markdown';
import type { ProviderConfig } from '../types';

const AI_OVERVIEW_URL = 'https://www.google.com/search?q=';

async function navigateToAiOverviewPrompt(page: Page, prompt: string): Promise<void> {
    const encoded = encodeURIComponent(prompt);
    await page.goto(`${AI_OVERVIEW_URL}${encoded}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
    });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => null);
    await page.waitForTimeout(2000);
}

async function waitForAiOverviewResponse(page: Page): Promise<void> {
    const start = Date.now();
    const timeout = 20000;

    while (Date.now() - start < timeout) {
        const hasResult = await page
            .locator('#main')
            .isVisible()
            .catch(() => false);
        if (hasResult) {
            const hasLoading = await page
                .locator('[aria-label="Loading"]')
                .isVisible()
                .catch(() => false);
            if (!hasLoading) return;
        }
        await page.waitForTimeout(500);
    }
}

async function extractAiOverviewResponse(page: Page): Promise<string> {
    const mainHtml = await page
        .locator('#main')
        .innerHTML()
        .catch(() => '');

    if (!mainHtml) {
        const bodyText = await page
            .locator('body')
            .innerText()
            .catch(() => '');
        return bodyText.trim();
    }

    const cleanHtml = mainHtml
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<svg[\s\S]*?<\/svg>/gi, '');

    return extractAssistantMarkdown(cleanHtml);
}

async function extractSourcesFromAiOverview(page: Page) {
    const expandSelectors = [
        '[aria-label*="Show more" i]',
        'a:has-text("Show more")',
        'g-expandable-content button',
    ];

    for (const selector of expandSelectors) {
        try {
            const btn = page.locator(selector).first();
            if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
                await btn.click({ timeout: 3000, delay: 100 }).catch(() => null);
            }
        } catch {
            // ignore
        }
    }

    await page.waitForTimeout(500);

    try {
        const sources = await page.locator('#main a[href^="http"]').evaluateAll((links) =>
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

        return sources;
    } catch {
        return [];
    }
}

export const aiOverviewConfig: ProviderConfig = {
    url: AI_OVERVIEW_URL,
    label: 'AI Overview',
    displayName: 'Google AI Overview',
    skipInitialNavigation: true,
    requiresAuth: false,
    editorSelectors: ['textarea[name="q"]', 'input[name="q"]'],
    sendButtonSelectors: ['input[type="submit"]', 'button[type="submit"]'],

    navigateToPrompt: navigateToAiOverviewPrompt,

    waitForResponse: waitForAiOverviewResponse,

    extractResponse: extractAiOverviewResponse,

    extractSources: extractSourcesFromAiOverview,
};
