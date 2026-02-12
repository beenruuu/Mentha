import { getEvaluationService } from '../../api/src/domain/evaluation';
import { createSupabaseAdmin } from '../../api/src/infrastructure/database';
import { createProvider } from '../../api/src/infrastructure/search';

export const analyzeBrandVisibility = async ({
    brand_name,
    query,
    engine = 'openai',
    competitors = [],
}: {
    brand_name: string;
    query: string;
    engine?: 'openai' | 'perplexity' | 'gemini';
    competitors?: string[];
}) => {
    const provider = createProvider(engine);
    const result = await provider.search(query);

    const evaluator = getEvaluationService();
    const evaluation = await evaluator.evaluate({
        rawResponse: result.content,
        brandName: brand_name,
        competitors,
        query,
    });

    return {
        content: [
            {
                type: 'text' as const,
                text: JSON.stringify(
                    {
                        brand: brand_name,
                        query,
                        engine,
                        visibility: evaluation.brand_visibility,
                        sentiment_score: evaluation.sentiment_score,
                        recommendation_type: evaluation.recommendation_type,
                        share_of_voice_rank: evaluation.share_of_voice_rank,
                        competitor_mentions: evaluation.competitor_mentions,
                        key_phrases: evaluation.key_phrases,
                        reasoning: evaluation.reasoning,
                        raw_response_preview: result.content.substring(0, 500),
                        citations: result.citations.slice(0, 5),
                    },
                    null,
                    2,
                ),
            },
        ],
    };
};

export const getShareOfModel = async ({
    project_id,
    days = 30,
}: {
    project_id: string;
    days?: number;
}) => {
    const supabase = createSupabaseAdmin();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: results } = await supabase
        .from('scan_results')
        .select('brand_visibility, sentiment_score, recommendation_type, scan_jobs!inner(engine)')
        .gte('created_at', startDate.toISOString());

    const total = results?.length ?? 0;
    const visible = results?.filter((r) => r.brand_visibility).length ?? 0;
    const visibilityRate = total > 0 ? Math.round((visible / total) * 100) : 0;

    return {
        content: [
            {
                type: 'text' as const,
                text: JSON.stringify(
                    {
                        project_id,
                        period_days: days,
                        total_scans: total,
                        visible_count: visible,
                        visibility_rate: `${visibilityRate}%`,
                    },
                    null,
                    2,
                ),
            },
        ],
    };
};

export const createBrandEntity = async ({
    name: entityName,
    description,
    url,
    disambiguating_description,
    same_as = [],
}: {
    name: string;
    description: string;
    url?: string;
    disambiguating_description?: string;
    same_as?: string[];
}) => {
    const supabase = createSupabaseAdmin();
    const slug = entityName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

    const { error } = await supabase
        .from('entities')
        .upsert(
            {
                entity_type: 'Organization',
                name: entityName,
                slug,
                description,
                url,
                disambiguating_description,
                same_as,
                is_primary: true,
            },
            { onConflict: 'slug' },
        )
        .select()
        .single();

    if (error) throw error;

    return {
        content: [
            {
                type: 'text' as const,
                text: `✅ Entity "${entityName}" created/updated with slug "${slug}".\n\nNext steps:\n1. Add claims with add_brand_claim\n2. Generate llms.txt to preview AI-readable content`,
            },
        ],
    };
};

export const addBrandClaim = async ({
    entity_slug,
    claim,
    claim_type = 'fact',
    importance = 7,
}: {
    entity_slug: string;
    claim: string;
    claim_type?: string;
    importance?: number;
}) => {
    const supabase = createSupabaseAdmin();

    const { data: entity } = await supabase
        .from('entities')
        .select('id')
        .eq('slug', entity_slug)
        .single();

    if (!entity) {
        return {
            content: [{ type: 'text' as const, text: `❌ Entity "${entity_slug}" not found` }],
        };
    }

    const { error } = await supabase.from('claims').insert({
        entity_id: entity.id,
        claim_text: claim,
        claim_type,
        importance,
    });

    if (error) throw error;

    return {
        content: [{ type: 'text' as const, text: `✅ Claim added: "${claim}"` }],
    };
};

export const generateLlmsTxt = async () => {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase.rpc('generate_llms_txt');
    if (error) throw error;
    return { content: [{ type: 'text' as const, text: data ?? 'No content configured' }] };
};

export const listProjects = async () => {
    const supabase = createSupabaseAdmin();
    const { data } = await supabase.from('projects').select('id, name, domain');
    return {
        content: [
            {
                type: 'text' as const,
                text: JSON.stringify(data ?? [], null, 2),
            },
        ],
    };
};
