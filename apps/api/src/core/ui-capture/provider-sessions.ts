import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { env } from '../../config/env';
import { logger } from '../logger';
import type { UiCaptureProvider } from './types';

const PROVIDER_LOGIN_URLS: Partial<Record<UiCaptureProvider, string>> = {
    chatgpt: 'https://chatgpt.com/',
    gemini: 'https://gemini.google.com/app',
    perplexity: 'https://www.perplexity.ai/',
    claude: 'https://claude.ai/',
    'ai-overview': 'https://www.google.com/',
};

const SESSION_PROVIDERS: UiCaptureProvider[] = [
    'perplexity',
    'chatgpt',
    'gemini',
    'claude',
    'ai-overview',
];

type ProviderConnectionStatus = {
    provider: UiCaptureProvider;
    connected: boolean;
    connecting: boolean;
    updatedAt: string | null;
    error: string | null;
};

const connectingProviders = new Map<string, { startedAt: string; error: string | null }>();

function safeSegment(value: string): string {
    return value.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export function getProviderSessionPath(userId: string, provider: UiCaptureProvider): string {
    return join(env.MENTHA_UI_CAPTURE_STORAGE_DIR, safeSegment(userId), `${provider}.json`);
}

async function fileExists(path: string): Promise<boolean> {
    try {
        await stat(path);
        return true;
    } catch {
        return false;
    }
}

export async function readProviderStorageState(
    userId: string | undefined,
    provider: UiCaptureProvider,
) {
    if (!userId) return null;
    const path = getProviderSessionPath(userId, provider);
    if (!(await fileExists(path))) return null;

    try {
        return JSON.parse(await readFile(path, 'utf8'));
    } catch (error) {
        logger.warn(
            { provider, userId, error: (error as Error).message },
            'Failed to read provider storage state',
        );
        return null;
    }
}

export async function listProviderConnections(userId: string): Promise<ProviderConnectionStatus[]> {
    return Promise.all(
        SESSION_PROVIDERS.map(async (provider) => {
            const path = getProviderSessionPath(userId, provider);
            const file = await stat(path).catch(() => null);
            const connecting = connectingProviders.get(`${userId}:${provider}`);
            return {
                provider,
                connected: Boolean(file),
                connecting: Boolean(connecting),
                updatedAt: file?.mtime.toISOString() ?? connecting?.startedAt ?? null,
                error: connecting?.error ?? null,
            };
        }),
    );
}

export async function disconnectProvider(
    userId: string,
    provider: UiCaptureProvider,
): Promise<void> {
    connectingProviders.delete(`${userId}:${provider}`);
    await rm(getProviderSessionPath(userId, provider), { force: true });
}

export async function startProviderConnection(userId: string, provider: UiCaptureProvider) {
    if (env.MENTHA_DEPLOYMENT_MODE !== 'local') {
        throw new Error('Provider browser connection is only available in local/self-hosted mode.');
    }

    const loginUrl = PROVIDER_LOGIN_URLS[provider];
    if (!loginUrl) throw new Error(`Provider connection is not supported for ${provider}.`);

    const key = `${userId}:${provider}`;
    if (connectingProviders.has(key)) return { provider, connecting: true };

    connectingProviders.set(key, { startedAt: new Date().toISOString(), error: null });

    void (async () => {
        const { firefox } = await import('playwright');
        const { resolveCamoufoxLaunchOptions } = await import('./camoufox-provider');
        let browser: Awaited<ReturnType<typeof firefox.launch>> | null = null;

        try {
            const launchOptions = await resolveCamoufoxLaunchOptions({ forceHeadful: true });
            browser = await firefox.launch({ ...launchOptions, headless: false });
            const context = await browser.newContext({ viewport: null });
            const page = await context.newPage();

            await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
            await page.waitForEvent('close', { timeout: 30 * 60 * 1000 }).catch(() => null);

            const storageState = await context.storageState();
            const sessionPath = getProviderSessionPath(userId, provider);
            await mkdir(dirname(sessionPath), { recursive: true });
            await writeFile(sessionPath, JSON.stringify(storageState, null, 2), 'utf8');

            logger.info({ userId, provider }, 'Provider browser session saved');
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            connectingProviders.set(key, {
                startedAt: new Date().toISOString(),
                error: message,
            });
            logger.error({ userId, provider, error: message }, 'Provider connection failed');
        } finally {
            await browser?.close().catch(() => null);
            setTimeout(() => connectingProviders.delete(key), 5_000);
        }
    })();

    return { provider, connecting: true };
}
