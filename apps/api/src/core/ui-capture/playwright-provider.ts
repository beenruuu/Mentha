import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

import { env } from '../../config/env';
import { type UiCaptureRequest, type UiCaptureResult } from './types';

const PROVIDER_URLS: Record<UiCaptureRequest['provider'], (prompt: string) => string> = {
    perplexity: (prompt) => `https://www.perplexity.ai/search?q=${encodeURIComponent(prompt)}`,
    'ai-overview': (prompt) => `https://www.google.com/search?q=${encodeURIComponent(prompt)}`,
    chatgpt: () => 'https://chatgpt.com/',
    gemini: () => 'https://gemini.google.com/',
    claude: () => 'https://claude.ai/',
};

function normalizeCaptureUrl(request: UiCaptureRequest): string {
    if (request.targetUrl) {
        return new URL(request.targetUrl).toString();
    }

    return PROVIDER_URLS[request.provider](request.prompt);
}

function toMarkdown(title: string, url: string, text: string): string {
    const cleanText = text
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 30)
        .join('\n');

    return [`# ${title || 'UI capture'}`, '', `URL: ${url}`, '', cleanText].join('\n');
}

function classifyCapture(
    url: string,
    text: string,
): Pick<UiCaptureResult, 'status' | 'failureReason'> {
    const lowerUrl = url.toLowerCase();
    const lowerText = text.toLowerCase();

    if (lowerUrl.includes('/sorry/') || lowerText.includes('unusual traffic')) {
        return {
            status: 'blocked',
            failureReason: 'Provider returned bot-detection or unusual-traffic page.',
        };
    }
    if (lowerText.includes('log in') || lowerText.includes('sign in')) {
        return {
            status: 'auth_required',
            failureReason: 'Provider page requires an authenticated browser session.',
        };
    }
    if (!text.trim()) {
        return { status: 'partial', failureReason: 'No visible response text was extracted.' };
    }
    return { status: 'success' };
}

export async function runPlaywrightUiCapture(request: UiCaptureRequest): Promise<UiCaptureResult> {
    const start = Date.now();
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({
        headless: env.MENTHA_UI_CAPTURE_HEADLESS,
    });

    try {
        const page = await browser.newPage({
            viewport: { width: 1365, height: 900 },
            locale: request.language || 'en-US',
            timezoneId: request.location || 'UTC',
        });
        const url = normalizeCaptureUrl(request);

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
        await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);

        const title = await page.title();
        const bodyText = await page
            .locator('body')
            .innerText({ timeout: 10_000 })
            .catch(() => '');
        const sources = await page.locator('a[href]').evaluateAll((links) =>
            links
                .map((link, index) => {
                    const anchor = link as unknown as { href: string; innerText: string };
                    return {
                        url: anchor.href,
                        title: anchor.innerText.trim() || anchor.href,
                        domain: new URL(anchor.href).hostname,
                        position: index + 1,
                    };
                })
                .filter((source) => source.url.startsWith('http'))
                .slice(0, 12),
        );

        if (request.screenshotPath) {
            await mkdir(dirname(request.screenshotPath), { recursive: true });
            await page.screenshot({ path: request.screenshotPath, fullPage: true });
        }
        const captureStatus = classifyCapture(page.url() || url, bodyText);

        return {
            provider: request.provider,
            prompt: request.prompt,
            url,
            title,
            ...captureStatus,
            responseMarkdown: toMarkdown(title, url, bodyText),
            sources,
            screenshotPath: request.screenshotPath,
            capturedAt: new Date().toISOString(),
            latencyMs: Date.now() - start,
        };
    } finally {
        await browser.close();
    }
}
