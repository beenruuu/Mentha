#!/usr/bin/env node
/**
 * Mentha MCP Server
 * Exposes Mentha tools to AI Agents via Model Context Protocol
 * 
 * This allows AI assistants (Claude, ChatGPT) to directly use Mentha's
 * capabilities as native "tools" rather than requiring web scraping.
 * 
 * Usage: npx ts-node src/mcp-server.ts
 * Or configure in Claude Desktop's MCP settings
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ListResourcesRequestSchema,
    ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createSupabaseAdmin } from './infrastructure/database/index.js';
import { createProvider } from './infrastructure/search/index.js';
import { getEvaluationService } from './domain/evaluation/index.js';

// Initialize MCP Server
const server = new Server(
    {
        name: 'mentha-intelligence',
        version: '1.0.0',
    },
    {
        capabilities: {
            tools: {},
            resources: {},
        },
    }
);

// =============================================================================
// TOOLS - Actions the AI can perform
// =============================================================================

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'analyze_brand_visibility',
                description: `Analyze how a brand appears in AI-generated responses. 
Use this when the user wants to know if their brand is mentioned by ChatGPT, Perplexity, or other AI assistants when users ask relevant questions.
Returns: visibility status, sentiment score, recommendation type, and competitor comparison.`,
                inputSchema: {
                    type: 'object',
                    properties: {
                        brand_name: {
                            type: 'string',
                            description: 'The brand name to analyze (e.g., "Mentha CLI")',
                        },
                        query: {
                            type: 'string',
                            description: 'The search query to test (e.g., "best AEO tools")',
                        },
                        engine: {
                            type: 'string',
                            enum: ['openai', 'perplexity', 'gemini'],
                            description: 'Which AI engine to query. Default: openai',
                        },
                        competitors: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'List of competitor brand names to track',
                        },
                    },
                    required: ['brand_name', 'query'],
                },
            },
            {
                name: 'get_share_of_model',
                description: `Get the "Share of Model" metrics for a brand over time.
Use this when the user wants to see their brand's visibility trends across AI platforms.
Returns: visibility rate, sentiment trends, and comparison by engine.`,
                inputSchema: {
                    type: 'object',
                    properties: {
                        project_id: {
                            type: 'string',
                            description: 'The Mentha project UUID to analyze',
                        },
                        days: {
                            type: 'number',
                            description: 'Number of days to analyze. Default: 30',
                        },
                    },
                    required: ['project_id'],
                },
            },
            {
                name: 'create_brand_entity',
                description: `Create or update a brand entity in the Knowledge Graph.
Use this when the user wants to define their brand for AEO optimization.
This creates structured data that can be served via JSON-LD and llms.txt.`,
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: 'Brand or organization name',
                        },
                        description: {
                            type: 'string',
                            description: 'Detailed description of the brand (2-3 sentences)',
                        },
                        url: {
                            type: 'string',
                            description: 'Official website URL',
                        },
                        disambiguating_description: {
                            type: 'string',
                            description: 'What the brand is NOT (to prevent AI confusion)',
                        },
                        same_as: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Official links: GitHub, LinkedIn, Twitter, Wikipedia',
                        },
                    },
                    required: ['name', 'description'],
                },
            },
            {
                name: 'add_brand_claim',
                description: `Add a verified claim/fact about a brand.
Use this when the user wants to establish factual statements about their brand.
Claims are used in JSON-LD and llms.txt to train AI understanding.`,
                inputSchema: {
                    type: 'object',
                    properties: {
                        entity_slug: {
                            type: 'string',
                            description: 'The slug of the entity (e.g., "mentha-cli")',
                        },
                        claim: {
                            type: 'string',
                            description: 'The factual claim (e.g., "Mentha CLI is open source")',
                        },
                        claim_type: {
                            type: 'string',
                            enum: ['fact', 'feature', 'comparison', 'statistic', 'testimonial'],
                            description: 'Type of claim',
                        },
                        importance: {
                            type: 'number',
                            description: 'Priority 1-10 (10 = most important)',
                        },
                    },
                    required: ['entity_slug', 'claim'],
                },
            },
            {
                name: 'generate_llms_txt',
                description: `Generate the llms.txt content for a brand.
Use this when the user wants to see what AI-readable content would be served.
Returns: formatted Markdown optimized for LLM consumption.`,
                inputSchema: {
                    type: 'object',
                    properties: {},
                    required: [],
                },
            },
            {
                name: 'list_projects',
                description: `List all Mentha projects/brands being monitored.
Use this to discover available projects before running other operations.`,
                inputSchema: {
                    type: 'object',
                    properties: {},
                    required: [],
                },
            },
        ],
    };
});

// Tool execution handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const supabase = createSupabaseAdmin();

    try {
        switch (name) {
            case 'analyze_brand_visibility': {
                const { brand_name, query, engine = 'openai', competitors = [] } = args as {
                    brand_name: string;
                    query: string;
                    engine?: 'openai' | 'perplexity' | 'gemini';
                    competitors?: string[];
                };

                // Query the LLM
                const provider = createProvider(engine);
                const result = await provider.search(query);

                // Evaluate with LLM-as-a-Judge
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
                            type: 'text',
                            text: JSON.stringify({
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
                            }, null, 2),
                        },
                    ],
                };
            }

            case 'get_share_of_model': {
                const { project_id, days = 30 } = args as { project_id: string; days?: number };

                const startDate = new Date();
                startDate.setDate(startDate.getDate() - days);

                const { data: results } = await supabase
                    .from('scan_results')
                    .select('brand_visibility, sentiment_score, recommendation_type, scan_jobs!inner(engine)')
                    .gte('created_at', startDate.toISOString());

                const total = results?.length ?? 0;
                const visible = results?.filter(r => r.brand_visibility).length ?? 0;
                const visibilityRate = total > 0 ? Math.round((visible / total) * 100) : 0;

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                project_id,
                                period_days: days,
                                total_scans: total,
                                visible_count: visible,
                                visibility_rate: `${visibilityRate}%`,
                            }, null, 2),
                        },
                    ],
                };
            }

            case 'create_brand_entity': {
                const { name: entityName, description, url, disambiguating_description, same_as = [] } = args as {
                    name: string;
                    description: string;
                    url?: string;
                    disambiguating_description?: string;
                    same_as?: string[];
                };

                const slug = entityName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

                const { data, error } = await supabase
                    .from('entities')
                    .upsert({
                        entity_type: 'Organization',
                        name: entityName,
                        slug,
                        description,
                        url,
                        disambiguating_description,
                        same_as,
                        is_primary: true,
                    }, { onConflict: 'slug' })
                    .select()
                    .single();

                if (error) throw error;

                return {
                    content: [
                        {
                            type: 'text',
                            text: `✅ Entity "${entityName}" created/updated with slug "${slug}".\n\nNext steps:\n1. Add claims with add_brand_claim\n2. Generate llms.txt to preview AI-readable content`,
                        },
                    ],
                };
            }

            case 'add_brand_claim': {
                const { entity_slug, claim, claim_type = 'fact', importance = 7 } = args as {
                    entity_slug: string;
                    claim: string;
                    claim_type?: string;
                    importance?: number;
                };

                // Find entity
                const { data: entity } = await supabase
                    .from('entities')
                    .select('id')
                    .eq('slug', entity_slug)
                    .single();

                if (!entity) {
                    return { content: [{ type: 'text', text: `❌ Entity "${entity_slug}" not found` }] };
                }

                const { error } = await supabase.from('claims').insert({
                    entity_id: entity.id,
                    claim_text: claim,
                    claim_type,
                    importance,
                });

                if (error) throw error;

                return {
                    content: [{ type: 'text', text: `✅ Claim added: "${claim}"` }],
                };
            }

            case 'generate_llms_txt': {
                const { data, error } = await supabase.rpc('generate_llms_txt');
                if (error) throw error;
                return { content: [{ type: 'text', text: data ?? 'No content configured' }] };
            }

            case 'list_projects': {
                const { data } = await supabase.from('projects').select('id, name, domain');
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data ?? [], null, 2),
                        },
                    ],
                };
            }

            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error) {
        return {
            content: [{ type: 'text', text: `Error: ${(error as Error).message}` }],
            isError: true,
        };
    }
});

// =============================================================================
// RESOURCES - Data the AI can read
// =============================================================================

server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const supabase = createSupabaseAdmin();
    const { data: entities } = await supabase.from('entities').select('slug, name');

    return {
        resources: [
            {
                uri: 'mentha://llms.txt',
                name: 'AI-Readable Brand Content',
                description: 'The llms.txt content for consumption by language models',
                mimeType: 'text/plain',
            },
            ...(entities ?? []).map(e => ({
                uri: `mentha://entity/${e.slug}`,
                name: e.name,
                description: `Knowledge Graph entity: ${e.name}`,
                mimeType: 'application/json',
            })),
        ],
    };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    const supabase = createSupabaseAdmin();

    if (uri === 'mentha://llms.txt') {
        const { data } = await supabase.rpc('generate_llms_txt');
        return { contents: [{ uri, mimeType: 'text/plain', text: data ?? '' }] };
    }

    if (uri.startsWith('mentha://entity/')) {
        const slug = uri.replace('mentha://entity/', '');
        const { data } = await supabase.rpc('generate_entity_jsonld', { entity_slug: slug });
        return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(data, null, 2) }] };
    }

    throw new Error(`Unknown resource: ${uri}`);
});

// =============================================================================
// START SERVER
// =============================================================================

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Mentha MCP Server running on stdio');
}

main().catch(console.error);
