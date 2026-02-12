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
            logger.error('llms.txt error', { error: (error as Error).message });
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
            logger.error('llms.txt/full error', { error: (error as Error).message });
            return c.text('# Error generating llms.txt', 500);
        }
    },
} as const;
