import { Hono } from 'hono';
import { createSupabaseAdmin } from '../infrastructure/database/index';
import { logger } from '../infrastructure/logging/index';

const app = new Hono()
    .get('/', async (c) => {
        const supabase = createSupabaseAdmin();

        try {
            const { data, error } = await supabase.rpc('generate_llms_txt');

            if (error) {
                logger.error('Failed to generate llms.txt', { error: error.message });
                return c.text('# llms.txt\n\nNo content available. Please configure your Knowledge Graph.', 200, {
                    'Content-Type': 'text/plain; charset=utf-8'
                });
            }

            return c.text(data || '# llms.txt\n\nNo content configured.', 200, {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'public, max-age=3600'
            });
        } catch (err) {
            logger.error('llms.txt error', { error: (err as Error).message });
            return c.text('# Error generating llms.txt', 500);
        }
    })
    .get('/full', async (c) => {
        const supabase = createSupabaseAdmin();

        try {
            const { data: entities } = await supabase
                .from('entities')
                .select('name, description, entity_type, url, disambiguating_description, same_as')
                .eq('is_primary', true);

            const { data: claims } = await supabase
                .from('claims')
                .select('claim_text, claim_type, importance, entities!inner(is_primary)')
                .gte('importance', 5)
                .order('importance', { ascending: false });

            const { data: faqs } = await supabase
                .from('faq_vectors')
                .select('question, answer, category')
                .eq('is_published', true)
                .limit(20);

            let output = '# llms.txt - AI-Readable Content\n\n';

            if (entities && entities.length > 0) {
                output += '## About\n\n';
                for (const entity of entities) {
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

            if (claims && claims.length > 0) {
                output += '## Key Facts\n\n';
                for (const claim of claims) {
                    output += `- ${claim.claim_text}\n`;
                }
                output += '\n';
            }

            if (faqs && faqs.length > 0) {
                output += '## Frequently Asked Questions\n\n';
                for (const faq of faqs) {
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
