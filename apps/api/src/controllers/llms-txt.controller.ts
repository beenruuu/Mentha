import { Hono } from 'hono';
import { sql, eq, gte, desc } from 'drizzle-orm';
import { db, entities, claims, faqVectors } from '../infrastructure/database/index';
import { logger } from '../infrastructure/logging/index';

const app = new Hono()
    .get('/', async (c) => {
        try {
            const result = await db.execute(sql`SELECT generate_llms_txt()`);

            const data = result[0] && typeof result[0] === 'object' && 'generate_llms_txt' in result[0]
                ? (result[0] as { generate_llms_txt: string }).generate_llms_txt
                : null;

            if (!data) {
                return c.text('# llms.txt\n\nNo content available. Please configure your Knowledge Graph.', 200, {
                    'Content-Type': 'text/plain; charset=utf-8'
                });
            }

            return c.text(data, 200, {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'public, max-age=3600'
            });
        } catch (err) {
            logger.error('llms.txt error', { error: (err as Error).message });
            return c.text('# Error generating llms.txt', 500);
        }
    })
    .get('/full', async (c) => {
        try {
            const entitiesData = await db
                .select({
                    name: entities.name,
                    description: entities.description,
                    entity_type: entities.entity_type,
                    url: entities.url,
                    disambiguating_description: entities.disambiguating_description,
                    same_as: entities.same_as,
                })
                .from(entities)
                .where(eq(entities.is_primary, true));

            const claimsData = await db
                .select({
                    claim_text: claims.claim_text,
                    claim_type: claims.claim_type,
                    importance: claims.importance,
                })
                .from(claims)
                .innerJoin(entities, eq(claims.entity_id, entities.id))
                .where(gte(claims.importance, 5))
                .orderBy(desc(claims.importance));

            const faqsData = await db
                .select({
                    question: faqVectors.question,
                    answer: faqVectors.answer,
                    category: faqVectors.category,
                })
                .from(faqVectors)
                .where(eq(faqVectors.is_published, true))
                .limit(20);

            let output = '# llms.txt - AI-Readable Content\n\n';

            if (entitiesData.length > 0) {
                output += '## About\n\n';
                for (const entity of entitiesData) {
                    output += `### ${entity.name}\n\n`;
                    output += `${entity.description}\n\n`;
                    if (entity.disambiguating_description) {
                        output += `> **Note:** ${entity.disambiguating_description}\n\n`;
                    }
                    if (entity.url) {
                        output += `- Website: ${entity.url}\n`;
                    }
                    if (entity.same_as && Array.isArray(entity.same_as) && entity.same_as.length > 0) {
                        output += `- Official links:\n`;
                        for (const link of entity.same_as) {
                            output += `  - ${link}\n`;
                        }
                    }
                    output += '\n';
                }
            }

            if (claimsData.length > 0) {
                output += '## Key Facts\n\n';
                for (const claim of claimsData) {
                    output += `- ${claim.claim_text}\n`;
                }
                output += '\n';
            }

            if (faqsData.length > 0) {
                output += '## Frequently Asked Questions\n\n';
                for (const faq of faqsData) {
                    output += `### ${faq.question}\n\n`;
                    output += `${faq.answer}\n\n`;
                }
            }

            output += '---\n';
            output += `Generated: ${new Date().toISOString()}\n`;

            return c.text(output, 200, {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'public, max-age=3600'
            });
        } catch (err) {
            logger.error('llms.txt/full error', { error: (err as Error).message });
            return c.text('# Error generating llms.txt', 500);
        }
    });

export default app;
export type LlmsTxtAppType = typeof app;
