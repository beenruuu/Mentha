import { Hono } from 'hono';
import { eq, desc, sql } from 'drizzle-orm';
import { db, entities, claims, faqVectors } from '../infrastructure/database/index';
import { logger } from '../infrastructure/logging/index';

const app = new Hono()
    .get('/entities', async (c) => {
        try {
            const data = await db
                .select({
                    id: entities.id,
                    entity_type: entities.entity_type,
                    name: entities.name,
                    slug: entities.slug,
                    description: entities.description,
                    url: entities.url,
                    is_primary: entities.is_primary,
                    created_at: entities.created_at,
                })
                .from(entities)
                .orderBy(desc(entities.is_primary));

            return c.json({ data });
        } catch (error) {
            logger.error('Failed to list entities', { error: (error as Error).message });
            return c.json({ error: 'Failed to list entities' }, 500);
        }
    })
    .get('/entities/:slug/jsonld', async (c) => {
        const slug = c.req.param('slug');

        try {
            const result = await db.execute(
                sql`SELECT generate_entity_jsonld(${slug})`
            );

            const data = result[0] && typeof result[0] === 'object' && 'generate_entity_jsonld' in result[0]
                ? (result[0] as { generate_entity_jsonld: unknown }).generate_entity_jsonld
                : null;

            if (!data) {
                return c.json({ error: 'Entity not found' }, 404);
            }

            return c.json(data, 200, {
                'Content-Type': 'application/ld+json'
            });
        } catch (error) {
            logger.error('Failed to generate JSON-LD', { slug, error: (error as Error).message });
            return c.json({ error: 'Failed to generate JSON-LD' }, 500);
        }
    })
    .get('/entities/:slug/claims', async (c) => {
        const slug = c.req.param('slug');

        try {
            const entityData = await db
                .select({ id: entities.id })
                .from(entities)
                .where(eq(entities.slug, slug))
                .limit(1);

            if (entityData.length === 0) {
                return c.json({ error: 'Entity not found' }, 404);
            }

            const data = await db
                .select({
                    id: claims.id,
                    claim_text: claims.claim_text,
                    claim_type: claims.claim_type,
                    importance: claims.importance,
                    source_url: claims.source_url,
                    is_verified: claims.is_verified,
                })
                .from(claims)
                .where(eq(claims.entity_id, entityData[0]!.id))
                .orderBy(desc(claims.importance));

            return c.json({ data });
        } catch (error) {
            logger.error('Failed to get claims', { error: (error as Error).message });
            return c.json({ error: 'Failed to get claims' }, 500);
        }
    })
    .get('/entities/:slug/faqs', async (c) => {
        const slug = c.req.param('slug');
        const format = c.req.query('format');

        try {
            const entityData = await db
                .select({
                    id: entities.id,
                    name: entities.name,
                })
                .from(entities)
                .where(eq(entities.slug, slug))
                .limit(1);

            if (entityData.length === 0) {
                return c.json({ error: 'Entity not found' }, 404);
            }

            const entity = entityData[0]!;

            const data = await db
                .select({
                    question: faqVectors.question,
                    answer: faqVectors.answer,
                    category: faqVectors.category,
                })
                .from(faqVectors)
                .where(eq(faqVectors.entity_id, entity.id))
                .orderBy(desc(faqVectors.view_count));

            if (format === 'jsonld') {
                const faqJsonLd = {
                    '@context': 'https://schema.org',
                    '@type': 'FAQPage',
                    'name': `Preguntas frecuentes sobre ${entity.name}`,
                    'mainEntity': data.map((faq) => ({
                        '@type': 'Question',
                        'name': faq.question,
                        'acceptedAnswer': {
                            '@type': 'Answer',
                            'text': faq.answer,
                        },
                    })),
                };

                return c.json(faqJsonLd, 200, {
                    'Content-Type': 'application/ld+json'
                });
            }

            return c.json({ data });
        } catch (error) {
            logger.error('Failed to get FAQs', { error: (error as Error).message });
            return c.json({ error: 'Failed to get FAQs' }, 500);
        }
    });

export default app;
export type KnowledgeGraphAppType = typeof app;
