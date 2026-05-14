import type { Context } from 'hono';

import { logger } from '../core/logger';
import { getLlmsTxtService } from '../services/llms-txt.service';

const llmsTxtService = getLlmsTxtService();

export const LlmsTxtController = {
    generate: async (c: Context) => {
        try {
            const content = await llmsTxtService.generate();

            if (!content) {
                return c.text(
                    '# llms.txt\n\nNo content available. Please configure your Knowledge Graph.',
                    200,
                    {
                        'Content-Type': 'text/plain; charset=utf-8',
                    },
                );
            }

            return c.text(content, 200, {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'public, max-age=3600',
            });
        } catch (error) {
            logger.error({ error: (error as Error).message }, 'llms.txt error');
            return c.text('# Error generating llms.txt', 500);
        }
    },

    generateFull: async (c: Context) => {
        try {
            const result = await llmsTxtService.generateMarkdown();

            return c.text(result.markdown, 200, {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'public, max-age=3600',
            });
        } catch (error) {
            logger.error({ error: (error as Error).message }, 'llms.txt/full error');
            return c.text('# Error generating llms.txt', 500);
        }
    },

    listArtifacts: async (c: Context) => {
        try {
            const artifacts = await llmsTxtService.generateArtifacts();
            return c.json({
                data: artifacts.map(({ name, mimeType, content }) => ({
                    name,
                    mimeType,
                    bytes: Buffer.byteLength(content, 'utf8'),
                })),
            });
        } catch (error) {
            logger.error({ error: (error as Error).message }, 'AI-readable artifact list error');
            return c.json({ error: 'Error listing AI-readable artifacts' }, 500);
        }
    },

    generateArtifact: async (c: Context) => {
        try {
            const artifact = await llmsTxtService.generateArtifact(c.req.param('name'));
            if (!artifact) {
                return c.json({ error: 'Unknown AI-readable artifact' }, 404);
            }

            return c.text(artifact.content, 200, {
                'Content-Type': artifact.mimeType,
                'Cache-Control': 'public, max-age=3600',
            });
        } catch (error) {
            logger.error({ error: (error as Error).message }, 'AI-readable artifact error');
            return c.text('Error generating AI-readable artifact', 500);
        }
    },

    downloadArtifactsZip: async (c: Context) => {
        try {
            const zip = await llmsTxtService.generateArtifactsZip();
            const body = new Uint8Array(zip.length);
            body.set(zip);

            return c.body(body, 200, {
                'Content-Type': 'application/zip',
                'Content-Disposition': 'attachment; filename="mentha-ai-readable-artifacts.zip"',
                'Cache-Control': 'no-store',
            });
        } catch (error) {
            logger.error({ error: (error as Error).message }, 'AI-readable artifact ZIP error');
            return c.json({ error: 'Error generating AI-readable artifact ZIP' }, 500);
        }
    },

    scoreUrl: async (c: Context) => {
        try {
            const url = c.req.query('url');
            if (!url) return c.json({ error: 'Missing url query parameter' }, 400);
            const score = await llmsTxtService.scoreUrl(url);
            return c.json({ data: score });
        } catch (error) {
            logger.error({ error: (error as Error).message }, 'AI-readiness score error');
            return c.json({ error: 'Error scoring AI readiness' }, 500);
        }
    },

    listFrameworkAdapters: async (c: Context) => {
        try {
            return c.json({ data: llmsTxtService.listFrameworkAdapters() });
        } catch (error) {
            logger.error({ error: (error as Error).message }, 'Framework adapter list error');
            return c.json({ error: 'Error listing framework adapters' }, 500);
        }
    },

    getFrameworkAdapter: async (c: Context) => {
        try {
            const adapter = llmsTxtService.getFrameworkAdapter(c.req.param('name'));
            if (!adapter) return c.json({ error: 'Unknown framework adapter' }, 404);
            return c.json({ data: adapter });
        } catch (error) {
            logger.error({ error: (error as Error).message }, 'Framework adapter error');
            return c.json({ error: 'Error reading framework adapter' }, 500);
        }
    },

    operationalReport: async (c: Context) => {
        try {
            const url = c.req.query('url');
            if (!url) return c.json({ error: 'Missing url query parameter' }, 400);
            const report = await llmsTxtService.generateOperationalReport(url);
            return c.json({ data: report });
        } catch (error) {
            logger.error({ error: (error as Error).message }, 'AEO operational report error');
            return c.json({ error: 'Error generating AEO operational report' }, 500);
        }
    },
} as const;
