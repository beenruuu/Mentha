import type { Context } from 'hono';

import { logger } from '../core/logger';
import {
    disconnectProvider,
    listProviderConnections,
    startProviderConnection,
} from '../core/ui-capture/provider-sessions';
import type { UiCaptureProvider } from '../core/ui-capture/types';
import { BadRequestException, handleHttpException } from '../exceptions/http';

const CONNECTABLE_PROVIDERS: UiCaptureProvider[] = [
    'perplexity',
    'chatgpt',
    'gemini',
    'claude',
    'ai-overview',
];

function parseProvider(provider: string): UiCaptureProvider {
    if (!CONNECTABLE_PROVIDERS.includes(provider as UiCaptureProvider)) {
        throw new BadRequestException(`Unsupported provider: ${provider}`);
    }
    return provider as UiCaptureProvider;
}

export const ProviderConnectionsController = {
    list: async (c: Context) => {
        try {
            const user = c.get('user');
            const connections = await listProviderConnections(user.id);
            return c.json({ data: connections });
        } catch (error) {
            logger.error(
                { error: (error as Error).message },
                'Failed to list provider connections',
            );
            return handleHttpException(c, error);
        }
    },

    connect: async (c: Context) => {
        try {
            const user = c.get('user');
            const providerParam = c.req.param('provider');
            if (!providerParam) throw new BadRequestException('Provider is required');
            const provider = parseProvider(providerParam);
            const result = await startProviderConnection(user.id, provider);
            return c.json({ data: result }, 202);
        } catch (error) {
            logger.error(
                { error: (error as Error).message },
                'Failed to start provider connection',
            );
            return handleHttpException(c, error);
        }
    },

    disconnect: async (c: Context) => {
        try {
            const user = c.get('user');
            const providerParam = c.req.param('provider');
            if (!providerParam) throw new BadRequestException('Provider is required');
            const provider = parseProvider(providerParam);
            await disconnectProvider(user.id, provider);
            return c.json({ data: { provider, connected: false } });
        } catch (error) {
            logger.error({ error: (error as Error).message }, 'Failed to disconnect provider');
            return handleHttpException(c, error);
        }
    },
} as const;
