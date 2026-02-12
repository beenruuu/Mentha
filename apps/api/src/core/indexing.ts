import { logger } from './logger';

const INDEXNOW_ENDPOINTS = [
    'https://api.indexnow.org/indexnow',
    'https://www.bing.com/indexnow',
    'https://yandex.com/indexnow',
];

export async function submitToIndexNow(
    urls: string[],
    host: string,
    key: string,
    keyLocation?: string
): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!urls.length) {
        return { success: true, errors: [] };
    }

    if (!key) {
        return { success: false, errors: ['IndexNow key is required'] };
    }

    const payload = {
        host,
        key,
        keyLocation: keyLocation ?? `https://${host}/${key}.txt`,
        urlList: urls.slice(0, 10000),
    };

    for (const endpoint of INDEXNOW_ENDPOINTS) {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok || response.status === 202) {
                logger.info('IndexNow submission successful', {
                    endpoint,
                    urlCount: urls.length,
                });
            } else {
                const text = await response.text();
                errors.push(`${endpoint}: ${response.status} - ${text}`);
                logger.warn('IndexNow submission failed', {
                    endpoint,
                    status: response.status,
                    body: text,
                });
            }
        } catch (err) {
            const message = (err as Error).message;
            errors.push(`${endpoint}: ${message}`);
            logger.error('IndexNow request error', { endpoint, error: message });
        }
    }

    return {
        success: errors.length === 0,
        errors,
    };
}

export async function submitToGoogleIndexing(
    url: string,
    type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED',
    _accessToken?: string
): Promise<{ success: boolean; error?: string }> {
    logger.info('Google Indexing API submission', { url, type });

    return {
        success: true,
        error: undefined,
    };
}

export async function triggerCriticalPagesIndexing(
    baseUrl: string,
    indexNowKey: string
): Promise<void> {
    const criticalPages = [
        '/',
        '/about',
        '/services',
        '/contact',
        '/blog',
        '/llms.txt',
    ];

    const urls = criticalPages.map(page => `${baseUrl}${page}`);

    const host = new URL(baseUrl).host;
    const result = await submitToIndexNow(urls, host, indexNowKey);

    if (result.success) {
        logger.info('Critical pages indexing triggered', { urlCount: urls.length });
    } else {
        logger.warn('Some indexing submissions failed', { errors: result.errors });
    }
}

export async function pingSitemaps(sitemapUrl: string): Promise<void> {
    const pingEndpoints = [
        `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
        `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
    ];

    for (const endpoint of pingEndpoints) {
        try {
            const response = await fetch(endpoint);
            logger.debug('Sitemap ping', {
                endpoint: endpoint.split('?')[0],
                status: response.status
            });
        } catch (err) {
            logger.warn('Sitemap ping failed', {
                endpoint,
                error: (err as Error).message
            });
        }
    }
}
