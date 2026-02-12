import type { Context } from 'hono';

import { logger } from '../core/logger';
import { handleHttpException } from '../exceptions/http';
import { getEntityService } from '../services/entity.service';

const entityService = getEntityService();

export class KnowledgeGraphController {
    static async listEntities(c: Context) {
        try {
            const data = await entityService.list();
            return c.json({ data });
        } catch (error) {
            logger.error('Failed to list entities', { error: (error as Error).message });
            return handleHttpException(c, error);
        }
    }

    static async getEntityJsonLd(c: Context) {
        const slug = c.req.param('slug');

        try {
            const jsonld = await entityService.generateJsonLd(slug);
            return c.json(jsonld, 200, {
                'Content-Type': 'application/ld+json',
            });
        } catch (error) {
            logger.error('Failed to generate JSON-LD', { slug, error: (error as Error).message });
            return handleHttpException(c, error);
        }
    }

    static async getEntityClaims(c: Context) {
        const slug = c.req.param('slug');

        try {
            const entity = await entityService.getBySlug(slug);
            const claims = await entityService.getClaimsByEntity(entity.id);
            return c.json({ data: claims });
        } catch (error) {
            logger.error('Failed to list claims', { error: (error as Error).message });
            return handleHttpException(c, error);
        }
    }

    static async getEntityFaqs(c: Context) {
        const slug = c.req.param('slug');
        const format = c.req.query('format');

        try {
            const entity = await entityService.getBySlug(slug);
            const faqs = await entityService.getFaqsByEntity(entity.id);

            if (format === 'jsonld') {
                const faqJsonLd = {
                    '@context': 'https://schema.org',
                    '@type': 'FAQPage',
                    name: `Preguntas frecuentes sobre ${entity.name}`,
                    mainEntity: faqs.map((faq) => ({
                        '@type': 'Question',
                        name: faq.question,
                        acceptedAnswer: {
                            '@type': 'Answer',
                            text: faq.answer,
                        },
                    })),
                };

                return c.json(faqJsonLd, 200, {
                    'Content-Type': 'application/ld+json',
                });
            }

            return c.json({ data: faqs });
        } catch (error) {
            logger.error('Failed to list FAQs', { error: (error as Error).message });
            return handleHttpException(c, error);
        }
    }
}
