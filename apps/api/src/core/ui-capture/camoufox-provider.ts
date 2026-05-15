import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { Browser, BrowserContext, Page } from 'playwright';

import { env } from '../../config/env';
import { logger } from '../../core/logger';
import { readProviderStorageState } from './provider-sessions';
import { PROVIDER_CONFIGS } from './providers/index';
import { trySubmitStrategies } from './submit-strategies';
import type { UiCaptureRequest, UiCaptureResult } from './types';

const execFileAsync = promisify(execFile);

const PYTHON_CANDIDATES = [
    process.env.CAMOUFOX_PYTHON_BIN,
    env.MENTHA_UI_CAPTURE_PYTHON,
    'python3.13',
    'python3.12',
    'python3.11',
    'python3.10',
    'python3',
    'python',
    'py',
].filter((c): c is string => Boolean(c));

const PYTHON_PROBE_TIMEOUT_MS = 5_000;
const CAMOUFOX_OPTIONS_TIMEOUT_MS = 30_000;
const NAVIGATION_ATTEMPTS = 3;

const PYTHON_PROBE_SCRIPT = `
import json, sys
print(json.dumps({"major": sys.version_info.major, "minor": sys.version_info.minor}))
`;

const CAMOUFOX_OPTIONS_SCRIPT = `
import json
import os
import sys

try:
    from browserforge.fingerprints import Screen
    from camoufox.utils import launch_options
except Exception as exc:
    print(f"CAMOUFOX_IMPORT_ERROR::{exc}", file=sys.stderr)
    raise

payload = json.loads(os.environ["CAMOUFOX_OPTIONS_PAYLOAD"])

if isinstance(payload.get("screen"), dict):
    payload["screen"] = Screen(**payload["screen"])

if isinstance(payload.get("window"), list):
    payload["window"] = tuple(payload["window"])

options = launch_options(**payload)
print(json.dumps(options))
`;

type HeadlessMode = 'headless' | 'headful' | 'virtual';
type PrimitiveLaunchValue = string | number | boolean;

type CamoufoxLaunchOptions = {
    args?: string[];
    env?: Record<string, string>;
    executablePath: string;
    firefoxUserPrefs?: Record<string, PrimitiveLaunchValue>;
    headless?: boolean;
    proxy?: {
        server: string;
        username?: string;
        password?: string;
    };
    [key: string]: unknown;
};

let cachedPythonBinary: string | null = null;
let playwrightPageErrorGuardInstalled = false;

function installPlaywrightPageErrorGuard() {
    if (playwrightPageErrorGuardInstalled) return;
    playwrightPageErrorGuardInstalled = true;

    process.prependListener('uncaughtException', (error) => {
        const message = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack || '' : '';
        const isMissingPageErrorLocation =
            message.includes("Cannot read properties of undefined (reading 'url')") &&
            stack.includes('playwright-core');

        if (isMissingPageErrorLocation) {
            logger.warn(
                { error: message },
                'Ignored Playwright Firefox pageerror without location metadata',
            );
            return;
        }

        throw error;
    });
}

async function canUsePythonBinary(candidate: string): Promise<boolean> {
    try {
        const { stdout } = await execFileAsync(candidate, ['-c', PYTHON_PROBE_SCRIPT], {
            encoding: 'utf8',
            timeout: PYTHON_PROBE_TIMEOUT_MS,
            maxBuffer: 32 * 1024,
        });
        const parsed = JSON.parse(stdout) as { major?: number; minor?: number };
        return (
            typeof parsed.major === 'number' &&
            (parsed.major > 3 || (parsed.major === 3 && (parsed.minor ?? 0) >= 10))
        );
    } catch {
        return false;
    }
}

async function resolvePythonBinary(): Promise<string> {
    if (cachedPythonBinary) return cachedPythonBinary;

    for (const candidate of [...new Set(PYTHON_CANDIDATES)]) {
        if (await canUsePythonBinary(candidate)) {
            cachedPythonBinary = candidate;
            return candidate;
        }
    }

    throw new Error(
        'Camoufox requires Python 3.10+ and the camoufox package. ' +
            'Install with: python -m pip install cloverlabs-camoufox && python -m camoufox fetch',
    );
}

function resolveHeadlessMode(): HeadlessMode {
    const value = process.env.CAMOUFOX_HEADLESS_MODE;
    if (value === 'headless' || value === 'headful' || value === 'virtual') return value;
    return env.MENTHA_UI_CAPTURE_HEADLESS ? 'headless' : 'headful';
}

function parseFingerprintPreset(): boolean {
    return process.env.CAMOUFOX_FINGERPRINT_PRESET !== 'false';
}

function buildCamoufoxPayload(headlessMode: HeadlessMode): Record<string, unknown> {
    const payload: Record<string, unknown> = {
        headless: headlessMode === 'headless',
        humanize: headlessMode === 'headful' ? false : 1.5,
        geoip: env.CAMOUFOX_GEOIP,
        locale: process.env.CAMOUFOX_LOCALE || 'en-US',
        block_images: process.env.CAMOUFOX_BLOCK_IMAGES === 'true',
        block_webrtc: process.env.CAMOUFOX_BLOCK_WEBRTC === 'true',
        block_webgl: process.env.CAMOUFOX_BLOCK_WEBGL === 'true',
        disable_coop: process.env.CAMOUFOX_DISABLE_COOP === 'true',
        enable_cache: process.env.CAMOUFOX_ENABLE_CACHE === 'true',
        fingerprint_preset: parseFingerprintPreset(),
        screen: { max_width: 1920, max_height: 1080 },
        window: [1365, 900],
    };

    if (process.env.CAMOUFOX_BROWSER) {
        payload.browser = process.env.CAMOUFOX_BROWSER;
    }
    if (process.env.CAMOUFOX_EXECUTABLE_PATH) {
        payload.executable_path = process.env.CAMOUFOX_EXECUTABLE_PATH;
    }
    if (env.MENTHA_UI_CAPTURE_PROXY_SERVER) {
        payload.proxy = {
            server: env.MENTHA_UI_CAPTURE_PROXY_SERVER,
            username: env.MENTHA_UI_CAPTURE_PROXY_USERNAME,
            password: env.MENTHA_UI_CAPTURE_PROXY_PASSWORD,
        };
    }

    return payload;
}

function stringifyEnv(value: unknown): Record<string, string> | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;

    const result: Record<string, string> = {};
    for (const [key, item] of Object.entries(value)) {
        if (item === undefined || item === null) continue;
        result[key] = String(item);
    }
    return result;
}

function toPrimitiveRecord(value: unknown): Record<string, PrimitiveLaunchValue> | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;

    const result: Record<string, PrimitiveLaunchValue> = {};
    for (const [key, item] of Object.entries(value)) {
        if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
            result[key] = item;
        }
    }
    return result;
}

export async function resolveCamoufoxLaunchOptions(options?: {
    forceHeadful?: boolean;
}): Promise<CamoufoxLaunchOptions> {
    const python = await resolvePythonBinary();
    const headlessMode = options?.forceHeadful ? 'headful' : resolveHeadlessMode();
    const payload = buildCamoufoxPayload(headlessMode);

    try {
        const { stdout } = await execFileAsync(python, ['-c', CAMOUFOX_OPTIONS_SCRIPT], {
            encoding: 'utf8',
            timeout: CAMOUFOX_OPTIONS_TIMEOUT_MS,
            maxBuffer: 512 * 1024,
            env: {
                ...process.env,
                CAMOUFOX_OPTIONS_PAYLOAD: JSON.stringify(payload),
                PYTHONIOENCODING: 'utf-8',
            },
            windowsHide: false,
        });

        const jsonLine =
            stdout
                .trim()
                .split('\n')
                .reverse()
                .find((line) => line.trimStart().startsWith('{')) || stdout.trim();

        const parsed = JSON.parse(jsonLine) as {
            args?: string[];
            env?: Record<string, unknown>;
            executable_path?: string;
            firefox_user_prefs?: Record<string, unknown>;
            headless?: boolean;
            proxy?: CamoufoxLaunchOptions['proxy'];
            [key: string]: unknown;
        };

        if (!parsed.executable_path) {
            throw new Error('Camoufox did not return an executable path.');
        }

        const {
            executable_path: executablePath,
            firefox_user_prefs: firefoxUserPrefs,
            env: browserEnv,
            ...rest
        } = parsed;

        return {
            ...rest,
            args: parsed.args ?? [],
            env: stringifyEnv(browserEnv),
            executablePath,
            firefoxUserPrefs: toPrimitiveRecord(firefoxUserPrefs) ?? {},
            headless: parsed.headless ?? headlessMode === 'headless',
            proxy: parsed.proxy,
        };
    } catch (error) {
        const stderr =
            typeof (error as { stderr?: unknown }).stderr === 'string'
                ? (error as { stderr: string }).stderr.trim()
                : '';
        const message = stderr || (error as Error).message;
        const installHint =
            'Install/fetch Camoufox with: python -m pip install cloverlabs-camoufox && python -m camoufox fetch';

        if (message.includes('CAMOUFOX_IMPORT_ERROR::')) {
            throw new Error(`Camoufox is not installed for ${python}. ${installHint}`);
        }
        if (message.includes('not installed') || message.includes('camoufox fetch')) {
            throw new Error(`Camoufox browser is not installed for ${python}. ${installHint}`);
        }

        throw new Error(`Failed to resolve Camoufox launch options: ${message}`);
    }
}

async function findVisible(page: Page, selectors: string[]) {
    for (const selector of selectors) {
        const locator = page.locator(selector).first();
        if (await locator.isVisible().catch(() => false)) return locator;
    }
    return null;
}

async function waitForEditor(page: Page, selectors: string[]) {
    const deadline = Date.now() + 15_000;

    while (Date.now() < deadline) {
        const pageStatus = await classifyCapture(page);
        if (
            pageStatus.status === 'auth_required' ||
            pageStatus.status === 'captcha_required' ||
            pageStatus.status === 'blocked'
        ) {
            throw new UiCaptureStatusError(
                pageStatus.status as 'auth_required' | 'captcha_required' | 'blocked',
                pageStatus.failureReason,
            );
        }

        const editor = await findVisible(page, selectors);
        if (editor && (await editor.isEnabled().catch(() => true))) return editor;
        await page.waitForTimeout(300);
    }

    throw new Error(`Editor not found with selectors: ${selectors.join(', ')}`);
}

class UiCaptureStatusError extends Error {
    constructor(
        readonly status: Exclude<UiCaptureResult['status'], 'success' | 'partial'>,
        message?: string,
    ) {
        super(message || status);
        this.name = 'UiCaptureStatusError';
    }
}

async function typePrompt(page: Page, selectors: string[], prompt: string) {
    const editor = await waitForEditor(page, selectors);
    await editor.click({ timeout: 10_000 });
    await page.waitForTimeout(250);
    await editor.fill(prompt).catch(async () => {
        await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
        await page.keyboard.type(prompt, { delay: 10 });
    });
    return editor;
}

async function extractFallbackSources(page: Page) {
    return page.locator('a[href^="http"]').evaluateAll((links) =>
        links
            .map((link, index) => {
                const anchor = link as HTMLAnchorElement;
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
            .filter((source): source is NonNullable<typeof source> => source !== null)
            .slice(0, 20),
    );
}

async function gotoWithRetries(page: Page, url: string): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= NAVIGATION_ATTEMPTS; attempt++) {
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
            return;
        } catch (error) {
            lastError = error as Error;
            logger.warn(
                { url, attempt, error: lastError.message },
                'Provider navigation attempt failed',
            );
            await page.waitForTimeout(1000 * attempt);
        }
    }

    throw lastError || new Error(`Failed to navigate to ${url}`);
}

async function tryReadClipboardText(page: Page): Promise<string> {
    try {
        return await Promise.race([
            page.evaluate(async () => navigator.clipboard.readText()),
            new Promise<string>((resolve) => setTimeout(() => resolve(''), 1000)),
        ]);
    } catch {
        return '';
    }
}

async function extractResponseViaCopyButton(page: Page): Promise<string> {
    const copySelectors = [
        'button[aria-label*="Copy" i]',
        'button[data-testid*="copy" i]',
        'button:has-text("Copy")',
        '[role="button"][aria-label*="Copy" i]',
    ];

    for (const selector of copySelectors) {
        const buttons = page.locator(selector);
        const count = await buttons.count().catch(() => 0);
        if (count === 0) continue;

        for (let index = count - 1; index >= 0; index--) {
            const button = buttons.nth(index);
            if (!(await button.isVisible().catch(() => false))) continue;

            const before = await tryReadClipboardText(page);
            await button.click({ timeout: 3000, delay: 80 }).catch(() => null);
            await page.waitForTimeout(300);
            const after = await tryReadClipboardText(page);

            if (after && after !== before && after.trim().length > 20) {
                return after.trim();
            }
        }
    }

    return '';
}

async function classifyCapture(
    page: Page,
): Promise<Pick<UiCaptureResult, 'status' | 'failureReason'>> {
    const currentUrl = page.url().toLowerCase();
    const text = await page
        .locator('body')
        .innerText({ timeout: 5_000 })
        .catch(() => '');
    const lowerText = text.toLowerCase();

    if (
        currentUrl.includes('/sorry/') ||
        lowerText.includes('unusual traffic') ||
        lowerText.includes('verify you are human') ||
        lowerText.includes('complete the security check') ||
        lowerText.includes('captcha')
    ) {
        return {
            status: 'captcha_required',
            failureReason: 'Provider requires human verification or captcha.',
        };
    }
    if (lowerText.includes('blocked') || lowerText.includes('access denied')) {
        return { status: 'blocked', failureReason: 'Provider returned bot-detection page.' };
    }
    if (lowerText.includes('log in') || lowerText.includes('sign in')) {
        return { status: 'auth_required', failureReason: 'Provider requires login.' };
    }
    if (!text.trim()) {
        return { status: 'partial', failureReason: 'No visible response text extracted.' };
    }
    return { status: 'success' };
}

export async function runCamoufoxUiCapture(request: UiCaptureRequest): Promise<UiCaptureResult> {
    const start = Date.now();
    const config = PROVIDER_CONFIGS[request.provider];

    if (!config) {
        throw new Error(`Unknown provider: ${request.provider}`);
    }

    logger.info(
        { provider: request.provider, prompt: request.prompt?.slice(0, 80) },
        'Starting Camoufox Playwright capture',
    );

    const { firefox } = await import('playwright');
    installPlaywrightPageErrorGuard();
    const launchOptions = await resolveCamoufoxLaunchOptions();
    logger.debug(
        {
            executablePath: launchOptions.executablePath,
            headless: launchOptions.headless,
        },
        'Resolved Camoufox launch options',
    );

    const browser = (await firefox.launch(launchOptions)) as Browser;
    let context: BrowserContext | null = null;
    let page: Page | null = null;

    try {
        const storageState = await readProviderStorageState(request.userId, request.provider);
        context = await browser.newContext({
            viewport: launchOptions.headless ? { width: 1365, height: 900 } : null,
            locale: request.language || process.env.CAMOUFOX_LOCALE || 'en-US',
            timezoneId: request.location || 'UTC',
            ...(storageState ? { storageState } : {}),
        });
        await context
            .grantPermissions(['clipboard-read', 'clipboard-write'])
            .catch(() => null);
        page = await context.newPage();
        page.setDefaultTimeout(30_000);
        page.setDefaultNavigationTimeout(60_000);

        if (config.navigateToPrompt) {
            await config.navigateToPrompt(page, request.prompt);
        } else {
            await config.preNavigationHook?.(page);
            await gotoWithRetries(page, config.url);
            await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => null);
            await config.postNavigationHook?.(page);
            const prePromptStatus = await classifyCapture(page);
            const shouldStopBeforePrompt =
                prePromptStatus.status === 'captcha_required' ||
                prePromptStatus.status === 'blocked' ||
                (prePromptStatus.status === 'auth_required' && config.requiresAuth);

            if (shouldStopBeforePrompt) {
                return {
                    provider: request.provider,
                    prompt: request.prompt,
                    url: page.url() || config.url,
                    title: await page.title().catch(() => config.displayName),
                    ...prePromptStatus,
                    responseMarkdown: '',
                    sources: [],
                    screenshotPath: request.screenshotPath,
                    capturedAt: new Date().toISOString(),
                    latencyMs: Date.now() - start,
                };
            }
            await config.beforePromptHook?.(page);

            const editor = await typePrompt(page, config.editorSelectors, request.prompt);
            await config.afterTypingHook?.(page);

            const sendButton = await findVisible(page, config.sendButtonSelectors);
            const preSubmitUrl = page.url();
            await config.beforeSubmitHook?.(page);
            await trySubmitStrategies(
                page,
                editor,
                sendButton,
                config.submitOrder ?? ['native', 'enter', 'force', 'dispatch'],
                preSubmitUrl,
                config.checkSubmitSuccess,
            );
            await config.afterSubmitHook?.(page);
        }

        await config.waitForResponse(page);

        const title = await page.title();
        const extractedMarkdown = await config.extractResponse(page).catch(() => '');
        const copiedMarkdown = await extractResponseViaCopyButton(page).catch(() => '');
        const responseMarkdown =
            copiedMarkdown.length > extractedMarkdown.length ? copiedMarkdown : extractedMarkdown;
        const sources = await config
            .extractSources(page)
            .catch(() => extractFallbackSources(page as Page));
        const classifiedStatus = await classifyCapture(page);
        const captureStatus =
            classifiedStatus.status === 'auth_required' &&
            !config.requiresAuth &&
            responseMarkdown.trim().length > 0
                ? ({ status: 'success' } as const)
                : classifiedStatus;

        if (request.screenshotPath) {
            await page
                .screenshot({ path: request.screenshotPath, fullPage: true })
                .catch((error) => {
                    logger.warn({ error: (error as Error).message }, 'Screenshot capture failed');
                });
        }

        const latencyMs = Date.now() - start;
        logger.info(
            { provider: request.provider, status: captureStatus.status, latencyMs },
            'Camoufox Playwright capture completed',
        );

        return {
            provider: request.provider,
            prompt: request.prompt,
            url: page.url() || config.url,
            title,
            ...captureStatus,
            responseMarkdown,
            sources,
            screenshotPath: request.screenshotPath,
            capturedAt: new Date().toISOString(),
            latencyMs,
        };
    } catch (error) {
        if (error instanceof UiCaptureStatusError) {
            logger.info(
                { provider: request.provider, status: error.status },
                'Camoufox capture stopped by provider page status',
            );
            return {
                provider: request.provider,
                prompt: request.prompt,
                url: page?.url() || config.url,
                title: (await page?.title().catch(() => null)) || config.displayName,
                status: error.status,
                failureReason: error.message,
                responseMarkdown: '',
                sources: [],
                screenshotPath: request.screenshotPath,
                capturedAt: new Date().toISOString(),
                latencyMs: Date.now() - start,
            };
        }

        throw error;
    } finally {
        await context?.close().catch(() => null);
        await browser.close().catch(() => null);
    }
}
