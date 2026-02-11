import { Hono } from 'hono';
import { createSupabaseAdmin } from '../infrastructure/database/index';
import { logger } from '../infrastructure/logging/index';

const app = new Hono()
    .get('/entities', async (c) => {
        const supabase = createSupabaseAdmin();

        const { data, error } = await supabase
            .from('entities')
            .select('id, entity_type, name, slug, description, url, is_primary, created_at')
            .order('is_primary', { ascending: false });

        if (error) {
            logger.error('Failed to list entities', { error: error.message });
            return c.json({ error: 'Failed to list entities' }, 500);
        }

        return c.json({ data: data || [] });
    })
    .get('/entities/:slug/jsonld', async (c) => {
        const slug = c.req.param('slug');
        const supabase = createSupabaseAdmin();

        const { data, error } = await supabase.rpc('generate_entity_jsonld', {
            entity_slug: slug
        });

        if (error) {
            logger.error('Failed to generate JSON-LD', { slug, error: error.message });
            return c.json({ error: 'Failed to generate JSON-LD' }, 500);
        }

        if (!data) {
            return c.json({ error: 'Entity not found' }, 404);
        }

        return c.json(data, 200, {
            'Content-Type': 'application/ld+json'
        });
    })
    .get('/entities/:slug/claims', async (c) => {
        const slug = c.req.param('slug');
        const supabase = createSupabaseAdmin();

        const { data: entity } = await supabase
            .from('entities')
            .select('id')
            .eq('slug', slug)
            .single();

        if (!entity) {
            return c.json({ error: 'Entity not found' }, 404);
        }

        const { data, error } = await supabase
            .from('claims')
            .select('id, claim_text, claim_type, importance, source_url, is_verified')
            .eq('entity_id', entity.id)
            .order('importance', { ascending: false });

        if (error) {
            return c.json({ error: 'Failed to get claims' }, 500);
        }

        return c.json({ data: data || [] });
    })
    .get('/entities/:slug/faqs', async (c) => {
        const slug = c.req.param('slug');
        const format = c.req.query('format');
        const supabase = createSupabaseAdmin();

        const { data: entity } = await supabase
            .from('entities')
            .select('id, name')
            .eq('slug', slug)
            .single();

        if (!entity) {
            return c.json({ error: 'Entity not found' }, 404);
        }

        const { data, error } = await supabase
            .from('faq_vectors')
            .select('question, answer, category')
            .eq('entity_id', entity.id)
            .eq('is_published', true)
            .order('view_count', { ascending: false });

        if (error) {
            return c.json({ error: 'Failed to get FAQs' }, 500);
        }

        if (format === 'jsonld') {
            const faqJsonLd = {
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                'name': `Preguntas frecuentes sobre ${entity.name}`,
                'mainEntity': (data || []).map(faq => ({
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

        return c.json({ data: data || [] });
    });

export default app;
export type KnowledgeGraphAppType = typeof app;
