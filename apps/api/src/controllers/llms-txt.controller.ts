import { Router, Request, Response } from 'express';
import { createSupabaseAdmin } from '../infrastructure/database/index';
import { logger } from '../infrastructure/logging/index';

const router = Router();

/**
 * GET /llms.txt
 * Serves machine-readable content optimized for LLM consumption
 * This is the new standard for AI-friendly content (like robots.txt for AI)
 */
router.get('/', async (_req: Request, res: Response) => {
    const supabase = createSupabaseAdmin();

    try {
        // Call the PostgreSQL function to generate llms.txt
        const { data, error } = await supabase.rpc('generate_llms_txt');

        if (error) {
            logger.error('Failed to generate llms.txt', { error: error.message });
            // Fallback to basic content
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.send('# llms.txt\n\nNo content available. Please configure your Knowledge Graph.');
            return;
        }

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache 1 hour
        res.send(data ?? '# llms.txt\n\nNo content configured.');

    } catch (err) {
        logger.error('llms.txt error', { error: (err as Error).message });
        res.status(500).send('# Error generating llms.txt');
    }
});

/**
 * GET /llms.txt/full
 * Extended version with all entities, claims, and FAQs
 */
router.get('/full', async (_req: Request, res: Response) => {
    const supabase = createSupabaseAdmin();

    try {
        // Get all entities
        const { data: entities } = await supabase
            .from('entities')
            .select('name, description, entity_type, url, disambiguating_description, same_as')
            .eq('is_primary', true);

        // Get all claims for primary entities
        const { data: claims } = await supabase
            .from('claims')
            .select('claim_text, claim_type, importance, entities!inner(is_primary)')
            .gte('importance', 5)
            .order('importance', { ascending: false });

        // Get all FAQs
        const { data: faqs } = await supabase
            .from('faq_vectors')
            .select('question, answer, category')
            .eq('is_published', true)
            .limit(20);

        // Build comprehensive llms.txt
        let output = '# llms.txt - AI-Readable Content\n\n';

        // Entities section
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

        // Claims section
        if (claims && claims.length > 0) {
            output += '## Key Facts\n\n';
            for (const claim of claims) {
                output += `- ${claim.claim_text}\n`;
            }
            output += '\n';
        }

        // FAQ section
        if (faqs && faqs.length > 0) {
            output += '## Frequently Asked Questions\n\n';
            for (const faq of faqs) {
                output += `### ${faq.question}\n\n`;
                output += `${faq.answer}\n\n`;
            }
        }

        // Footer
        output += '---\n';
        output += `Generated: ${new Date().toISOString()}\n`;

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.send(output);

    } catch (err) {
        logger.error('llms.txt/full error', { error: (err as Error).message });
        res.status(500).send('# Error generating llms.txt');
    }
});

export { router as llmsTxtRouter };
