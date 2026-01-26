import { Router, Request, Response } from 'express';
import { createSupabaseAdmin } from '../infrastructure/database/index.js';
import { logger } from '../infrastructure/logging/index.js';

const router = Router();

/**
 * GET /api/v1/kg/entities
 * List all entities in the Knowledge Graph
 */
router.get('/entities', async (_req: Request, res: Response) => {
    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase
        .from('entities')
        .select('id, entity_type, name, slug, description, url, is_primary, created_at')
        .order('is_primary', { ascending: false });

    if (error) {
        logger.error('Failed to list entities', { error: error.message });
        res.status(500).json({ error: 'Failed to list entities' });
        return;
    }

    res.json({ data: data ?? [] });
});

/**
 * GET /api/v1/kg/entities/:slug/jsonld
 * Get Schema.org JSON-LD for a specific entity
 * This can be embedded in <script type="application/ld+json">
 */
router.get('/entities/:slug/jsonld', async (req: Request, res: Response) => {
    const { slug } = req.params;
    const supabase = createSupabaseAdmin();

    // Call the PostgreSQL function
    const { data, error } = await supabase.rpc('generate_entity_jsonld', {
        entity_slug: slug
    });

    if (error) {
        logger.error('Failed to generate JSON-LD', { slug, error: error.message });
        res.status(500).json({ error: 'Failed to generate JSON-LD' });
        return;
    }

    if (!data) {
        res.status(404).json({ error: 'Entity not found' });
        return;
    }

    // Set content type for JSON-LD
    res.setHeader('Content-Type', 'application/ld+json');
    res.json(data);
});

/**
 * GET /api/v1/kg/entities/:slug/claims
 * Get all claims for an entity
 */
router.get('/entities/:slug/claims', async (req: Request, res: Response) => {
    const { slug } = req.params;
    const supabase = createSupabaseAdmin();

    // First get entity ID
    const { data: entity } = await supabase
        .from('entities')
        .select('id')
        .eq('slug', slug)
        .single();

    if (!entity) {
        res.status(404).json({ error: 'Entity not found' });
        return;
    }

    const { data, error } = await supabase
        .from('claims')
        .select('id, claim_text, claim_type, importance, source_url, is_verified')
        .eq('entity_id', entity.id)
        .order('importance', { ascending: false });

    if (error) {
        res.status(500).json({ error: 'Failed to get claims' });
        return;
    }

    res.json({ data: data ?? [] });
});

/**
 * GET /api/v1/kg/entities/:slug/faqs
 * Get FAQs for an entity (Schema.org FAQPage format)
 */
router.get('/entities/:slug/faqs', async (req: Request, res: Response) => {
    const { slug } = req.params;
    const { format } = req.query;
    const supabase = createSupabaseAdmin();

    // First get entity ID
    const { data: entity } = await supabase
        .from('entities')
        .select('id, name')
        .eq('slug', slug)
        .single();

    if (!entity) {
        res.status(404).json({ error: 'Entity not found' });
        return;
    }

    const { data, error } = await supabase
        .from('faq_vectors')
        .select('question, answer, category')
        .eq('entity_id', entity.id)
        .eq('is_published', true)
        .order('view_count', { ascending: false });

    if (error) {
        res.status(500).json({ error: 'Failed to get FAQs' });
        return;
    }

    // Return as JSON-LD FAQPage if requested
    if (format === 'jsonld') {
        const faqJsonLd = {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            'name': `Preguntas frecuentes sobre ${entity.name}`,
            'mainEntity': (data ?? []).map(faq => ({
                '@type': 'Question',
                'name': faq.question,
                'acceptedAnswer': {
                    '@type': 'Answer',
                    'text': faq.answer,
                },
            })),
        };

        res.setHeader('Content-Type', 'application/ld+json');
        res.json(faqJsonLd);
        return;
    }

    res.json({ data: data ?? [] });
});

export { router as knowledgeGraphRouter };
