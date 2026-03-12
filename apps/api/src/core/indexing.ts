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
    keyLocation?: string,
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
                logger.info(
                    {
                        endpoint,
                        urlCount: urls.length,
                    },
                    'IndexNow submission successful',
                );
            } else {
                const text = await response.text();
                errors.push(`${endpoint}: ${response.status} - ${text}`);
                logger.warn(
                    {
                        endpoint,
                        status: response.status,
                        body: text,
                    },
                    'IndexNow submission failed',
                );
            }
        } catch (err) {
            const message = (err as Error).message;
            errors.push(`${endpoint}: ${message}`);
            logger.error({ endpoint, error: message }, 'IndexNow request error');
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
    _accessToken?: string,
): Promise<{ success: boolean; error?: string }> {
    logger.info({ url, type }, 'Google Indexing API submission');

    return {
        success: true,
        error: undefined,
    };
}

export async function triggerCriticalPagesIndexing(
    baseUrl: string,
    indexNowKey: string,
): Promise<void> {
    const criticalPages = ['/', '/about', '/services', '/contact', '/blog', '/llms.txt'];

    const urls = criticalPages.map((page) => `${baseUrl}${page}`);

    const host = new URL(baseUrl).host;
    const result = await submitToIndexNow(urls, host, indexNowKey);

    if (result.success) {
        logger.info({ urlCount: urls.length }, 'Critical pages indexing triggered');
    } else {
        logger.warn({ errors: result.errors }, 'Some indexing submissions failed');
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
            logger.debug(
                {
                    endpoint: endpoint.split('?')[0],
                    status: response.status,
                },
                'Sitemap ping',
            );
        } catch (err) {
            logger.warn(
                {
                    endpoint,
                    error: (err as Error).message,
                },
                'Sitemap ping failed',
            );
        }
    }
}
