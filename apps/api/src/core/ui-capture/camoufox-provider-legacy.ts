import { execFile } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';

import { env } from '../../config/env';
import { type UiCaptureRequest, type UiCaptureResult } from './types';

const execFileAsync = promisify(execFile);
const CAMOUFOX_OPTIONS_TIMEOUT_MS = 30_000;

const CAMOUFOX_OPTIONS_SCRIPT = String.raw`
import json
import os
import sys

try:
    from browserforge.fingerprints import Screen
    from camoufox.utils import launch_options
except ModuleNotFoundError as exc:
    print(
        "Camoufox is not installed. Install it with 'pip install camoufox' and run 'python -m camoufox fetch', or set MENTHA_UI_CAPTURE_PROVIDER=playwright.",
        file=sys.stderr,
    )
    raise

payload = json.loads(os.environ["CAMOUFOX_OPTIONS_PAYLOAD"])
if isinstance(payload.get("screen"), dict):
    payload["screen"] = Screen(**payload["screen"])
if isinstance(payload.get("window"), list):
    payload["window"] = tuple(payload["window"])
print(json.dumps(launch_options(**payload)))
`;

type CamoufoxLaunchOptions = {
    args?: string[];
    env?: Record<string, string>;
    executablePath: string;
    firefoxUserPrefs?: Record<string, string | number | boolean>;
    headless?: boolean;
    proxy?: {
        server: string;
        username?: string;
        password?: string;
    };
    [key: string]: unknown;
};

type ProviderStrategy = {
    url: (prompt: string) => string;
    inputSelectors: string[];
    submitSelectors: string[];
    responseSelectors: string[];
    sourceSelectors: string[];
    requiresAuth?: boolean;
};

const PROVIDER_STRATEGIES: Record<UiCaptureRequest['provider'], ProviderStrategy> = {
    perplexity: {
        url: (prompt) => `https://www.perplexity.ai/search?q=${encodeURIComponent(prompt)}`,
        inputSelectors: ['textarea', '[contenteditable="true"]'],
        submitSelectors: ['button[aria-label*="Submit"]', 'button[aria-label*="send" i]'],
        responseSelectors: ['main', 'article', '[data-testid*="answer"]'],
        sourceSelectors: ['a[href^="http"]'],
    },
    'ai-overview': {
        url: (prompt) => `https://www.google.com/search?q=${encodeURIComponent(prompt)}`,
        inputSelectors: ['textarea[name="q"]', 'input[name="q"]'],
        submitSelectors: ['input[type="submit"]', 'button[type="submit"]'],
        responseSelectors: ['body'],
        sourceSelectors: ['a[href^="http"]'],
    },
    chatgpt: {
        url: () => 'https://chatgpt.com/',
        inputSelectors: ['#prompt-textarea', 'textarea', '[contenteditable="true"]'],
        submitSelectors: ['button[data-testid="send-button"]', 'button[aria-label*="Send" i]'],
        responseSelectors: ['[data-message-author-role="assistant"]', 'main'],
        sourceSelectors: ['a[href^="http"]'],
        requiresAuth: true,
    },
    gemini: {
        url: () => 'https://gemini.google.com/',
        inputSelectors: [
            'rich-textarea [contenteditable="true"]',
            '[contenteditable="true"]',
            'textarea',
        ],
        submitSelectors: ['button[aria-label*="Send" i]', 'button[aria-label*="Submit" i]'],
        responseSelectors: ['message-content', 'main'],
        sourceSelectors: ['a[href^="http"]'],
        requiresAuth: true,
    },
    claude: {
        url: () => 'https://claude.ai/new',
        inputSelectors: ['div[contenteditable="true"]', 'textarea'],
        submitSelectors: ['button[aria-label*="Send" i]', 'button[type="submit"]'],
        responseSelectors: ['[data-testid*="message"]', 'main'],
        sourceSelectors: ['a[href^="http"]'],
        requiresAuth: true,
    },
};

function providerUrl(provider: UiCaptureRequest['provider'], prompt: string): string {
    return PROVIDER_STRATEGIES[provider].url(prompt);
}

function toMarkdown(title: string, url: string, text: string): string {
    const cleanText = text
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 30)
        .join('\n');

    return [`# ${title || 'Camoufox UI capture'}`, '', `URL: ${url}`, '', cleanText].join('\n');
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
    if (
        lowerText.includes('log in') ||
        lowerText.includes('sign in') ||
        lowerText.includes('continue with google')
    ) {
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

async function resolveCamoufoxLaunchOptions(
    request: UiCaptureRequest,
): Promise<CamoufoxLaunchOptions> {
    const proxy = env.MENTHA_UI_CAPTURE_PROXY_SERVER
        ? {
              proxy: {
                  server: env.MENTHA_UI_CAPTURE_PROXY_SERVER,
                  username: env.MENTHA_UI_CAPTURE_PROXY_USERNAME,
                  password: env.MENTHA_UI_CAPTURE_PROXY_PASSWORD,
              },
          }
        : {};

    const payload = {
        headless: env.MENTHA_UI_CAPTURE_HEADLESS,
        humanize: 1.5,
        locale: request.language || 'en-US',
        screen: { max_width: 1920, max_height: 1080 },
        window: [1365, 900],
        ...proxy,
    };

    const { stdout } = await execFileAsync(
        env.MENTHA_UI_CAPTURE_PYTHON,
        ['-c', CAMOUFOX_OPTIONS_SCRIPT],
        {
            encoding: 'utf8',
            timeout: CAMOUFOX_OPTIONS_TIMEOUT_MS,
            maxBuffer: 1024 * 1024,
            windowsHide: true,
            env: {
                ...process.env,
                CAMOUFOX_OPTIONS_PAYLOAD: JSON.stringify(payload),
            },
        },
    ).catch((error: Error & { stderr?: string }) => {
        const stderr = error.stderr?.trim();
        if (stderr?.includes('Camoufox is not installed')) {
            throw new Error(
                "Camoufox is not installed. Install it with 'pip install camoufox' and run 'python -m camoufox fetch', or set MENTHA_UI_CAPTURE_PROVIDER=playwright.",
            );
        }

        throw new Error(stderr || error.message);
    });

    const jsonLine = stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .reverse()
        .find((line) => line.startsWith('{') && line.endsWith('}'));

    if (!jsonLine) {
        throw new Error(`Camoufox did not return launch options JSON: ${stdout.slice(0, 500)}`);
    }

    return JSON.parse(jsonLine) as CamoufoxLaunchOptions;
}

async function navigateWithRetry(page: import('playwright').Page, url: string): Promise<void> {
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
            await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);
            return;
        } catch (error) {
            lastError = error as Error;
            await page.waitForTimeout(700 + attempt * 400);
        }
    }

    throw lastError ?? new Error(`Failed to navigate to ${url}`);
}

async function firstVisibleLocator(page: import('playwright').Page, selectors: string[]) {
    for (const selector of selectors) {
        const locator = page.locator(selector).first();
        if ((await locator.count()) > 0 && (await locator.isVisible().catch(() => false))) {
            return locator;
        }
    }

    return null;
}

async function submitPromptIfPossible(
    page: import('playwright').Page,
    strategy: ProviderStrategy,
    prompt: string,
): Promise<boolean> {
    const input = await firstVisibleLocator(page, strategy.inputSelectors);
    if (!input) return false;

    await page.waitForTimeout(150 + Math.floor(Math.random() * 250));
    await input.click({ timeout: 10_000 });
    await input.fill(prompt).catch(async () => {
        await page.keyboard.type(prompt, { delay: 16 });
    });
    await page.waitForTimeout(150 + Math.floor(Math.random() * 250));

    const button = await firstVisibleLocator(page, strategy.submitSelectors);
    if (button) {
        await button.click({ timeout: 10_000 }).catch(async () => page.keyboard.press('Enter'));
    } else {
        await page.keyboard.press('Enter');
    }

    await page.waitForTimeout(4_000);
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);
    return true;
}

async function extractVisibleResponse(
    page: import('playwright').Page,
    strategy: ProviderStrategy,
): Promise<string> {
    for (const selector of strategy.responseSelectors) {
        const locator = page.locator(selector).last();
        if ((await locator.count()) > 0) {
            const text = await locator.innerText({ timeout: 5_000 }).catch(() => '');
            if (text.trim()) return text;
        }
    }

    return page
        .locator('body')
        .innerText({ timeout: 10_000 })
        .catch(() => '');
}

async function extractSources(
    page: import('playwright').Page,
    strategy: ProviderStrategy,
): Promise<UiCaptureResult['sources']> {
    for (const selector of strategy.sourceSelectors) {
        const sources = await page.locator(selector).evaluateAll((links) =>
            links
                .map((link, index) => {
                    const anchor = link as unknown as { href: string; innerText: string };
                    try {
                        return {
                            url: anchor.href,
                            title: anchor.innerText.trim() || anchor.href,
                            domain: new URL(anchor.href).hostname,
                            position: index + 1,
                        };
                    } catch {
                        return null;
                    }
                })
                .filter((source): source is NonNullable<typeof source> =>
                    Boolean(source?.url?.startsWith('http')),
                )
                .slice(0, 12),
        );
        if (sources.length > 0) return sources;
    }

    return [];
}

export async function runCamoufoxUiCapture(request: UiCaptureRequest): Promise<UiCaptureResult> {
    const start = Date.now();
    const { firefox } = await import('playwright');
    const strategy = PROVIDER_STRATEGIES[request.provider];
    const url = request.targetUrl
        ? new URL(request.targetUrl).toString()
        : providerUrl(request.provider, request.prompt);

    if (request.screenshotPath) {
        await mkdir(dirname(request.screenshotPath), { recursive: true });
    }

    const launchOptions = await resolveCamoufoxLaunchOptions(request);
    if (launchOptions.proxy === null) {
        delete launchOptions.proxy;
    }
    const browser = await firefox.launch({
        ...launchOptions,
        firefoxUserPrefs: launchOptions.firefoxUserPrefs,
        headless: Boolean(launchOptions.headless),
    });

    try {
        const storageState = strategy.requiresAuth
            ? join(env.MENTHA_UI_CAPTURE_STORAGE_DIR, `${request.provider}.json`)
            : undefined;
        const context = await browser.newContext({
            locale: request.language || 'en-US',
            timezoneId: request.location || 'UTC',
            viewport: { width: 1365, height: 900 },
            ...(storageState ? { storageState } : {}),
        });
        const page = await context.newPage();
        page.setDefaultTimeout(30_000);
        page.setDefaultNavigationTimeout(60_000);

        await navigateWithRetry(page, url);
        const submitted = request.targetUrl
            ? false
            : await submitPromptIfPossible(page, strategy, request.prompt).catch(() => false);
        const title = await page.title();
        const bodyText = await extractVisibleResponse(page, strategy);
        const sources = await extractSources(page, strategy);
        const captureStatus = classifyCapture(page.url() || url, bodyText);

        if (request.screenshotPath) {
            await page.screenshot({ path: request.screenshotPath, fullPage: true });
        }

        await context.close().catch(() => undefined);

        return {
            provider: request.provider,
            prompt: request.prompt,
            url: page.url() || url,
            title,
            ...captureStatus,
            responseMarkdown: [
                toMarkdown(title, page.url() || url, bodyText),
                '',
                submitted
                    ? '<!-- Prompt submitted through provider UI. -->'
                    : '<!-- Captured rendered UI without prompt submission. -->',
            ].join('\n'),
            sources,
            screenshotPath: request.screenshotPath,
            capturedAt: new Date().toISOString(),
            latencyMs: Date.now() - start,
        };
    } finally {
        await browser.close().catch(() => undefined);
    }
}
