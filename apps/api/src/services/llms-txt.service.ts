import { desc, eq, sql } from 'drizzle-orm';
import JSZip from 'jszip';

import { logger } from '../core/logger';
import { db } from '../db';
import { claims, entities, faqVectors } from '../db/schema/knowledge-graph';
import type { Claim, Entity, FaqVector } from '../db/types';

export const AI_READABLE_ARTIFACTS = [
    'llms.txt',
    'llms-full.txt',
    'ai.txt',
    'CLAUDE.md',
    'schema.json',
    'robots-patch.txt',
    'faq-blocks.html',
    'citation-anchors.html',
    'sitemap-ai.xml',
] as const;

export type AiReadableArtifactName = (typeof AI_READABLE_ARTIFACTS)[number];

export const FRAMEWORK_ADAPTERS = [
    'next',
    'astro',
    'nuxt',
    'remix',
    'sveltekit',
    'gatsby',
    'docusaurus',
    'vitepress',
    'wordpress',
    'shopify',
    'webflow',
    'squarespace',
    '11ty',
] as const;

export type FrameworkAdapterName = (typeof FRAMEWORK_ADAPTERS)[number];

export interface AiReadableArtifact {
    name: AiReadableArtifactName;
    mimeType: string;
    content: string;
}

export interface LlmsTxtContent {
    markdown: string;
    metadata: {
        generated_at: string;
        entity_count: number;
        claim_count: number;
        faq_count: number;
    };
}

export interface LlmsTxtFullData {
    entities: Entity[];
    claims: Claim[];
    faqs: FaqVector[];
    generated_at: string;
}

export interface AiReadinessScore {
    url: string;
    overallScore: number;
    pillars: {
        answerReadiness: number;
        contentStructure: number;
        trustAuthority: number;
        technicalFoundation: number;
        aiDiscovery: number;
    };
    signals: string[];
    recommendations: string[];
}

export interface OperationalEvent {
    type:
        | 'visibility_loss'
        | 'sentiment_drop'
        | 'competitor_overtake'
        | 'citation_drop'
        | 'artifact_incomplete';
    severity: 'low' | 'medium' | 'high';
    title: string;
    evidence: string;
    action: string;
}

export interface AeoOperationalReport {
    generatedAt: string;
    score: AiReadinessScore;
    events: OperationalEvent[];
    artifacts: Array<{ name: AiReadableArtifactName; bytes: number; status: 'ready' | 'empty' }>;
    operatingRules: string[];
}

export class LlmsTxtService {
    async generate(): Promise<string> {
        logger.debug('Generating llms.txt');

        const result = await db.execute(sql`SELECT generate_llms_txt()`);
        const rows = result as unknown as Record<string, unknown>[];

        const content =
            rows[0] && typeof rows[0] === 'object' && 'generate_llms_txt' in rows[0]
                ? (rows[0] as { generate_llms_txt: string }).generate_llms_txt
                : null;

        if (!content) {
            logger.warn('No llms.txt content available');
            return '# llms.txt\n\nNo content available. Please configure your Knowledge Graph.';
        }

        logger.info('llms.txt generated successfully');
        return content;
    }

    async generateFull(): Promise<LlmsTxtFullData> {
        logger.debug('Generating full llms.txt data');

        const [entitiesData, claimsData, faqsData] = await Promise.all([
            db
                .select()
                .from(entities)
                .orderBy(desc(entities.is_primary), desc(entities.created_at)),
            db
                .select()
                .from(claims)
                .where(eq(claims.is_verified, true))
                .orderBy(desc(claims.importance)),
            db
                .select()
                .from(faqVectors)
                .where(eq(faqVectors.is_published, true))
                .orderBy(desc(faqVectors.view_count)),
        ]);

        logger.info(
            {
                entities: entitiesData.length,
                claims: claimsData.length,
                faqs: faqsData.length,
            },
            'Full llms.txt data generated',
        );

        return {
            entities: entitiesData,
            claims: claimsData,
            faqs: faqsData,
            generated_at: new Date().toISOString(),
        };
    }

    async generateMarkdown(entitySlug?: string): Promise<LlmsTxtContent> {
        logger.debug({ entitySlug }, 'Generating markdown llms.txt');

        let entitiesData: Entity[];
        let claimsData: Claim[];
        let faqsData: FaqVector[];

        if (entitySlug) {
            const entity = await db
                .select()
                .from(entities)
                .where(eq(entities.slug, entitySlug))
                .limit(1);

            if (entity.length === 0) {
                throw new Error('Entity not found');
            }

            const selectedEntity = entity[0];
            if (!selectedEntity) {
                throw new Error('Entity not found');
            }

            entitiesData = entity;
            claimsData = await db
                .select()
                .from(claims)
                .where(eq(claims.entity_id, selectedEntity.id))
                .orderBy(desc(claims.importance));

            faqsData = await db
                .select()
                .from(faqVectors)
                .where(eq(faqVectors.entity_id, selectedEntity.id))
                .orderBy(desc(faqVectors.view_count));
        } else {
            const fullData = await this.generateFull();
            entitiesData = fullData.entities;
            claimsData = fullData.claims;
            faqsData = fullData.faqs;
        }

        const lines: string[] = ['# llms.txt', ''];

        for (const entity of entitiesData) {
            lines.push(`## ${entity.name}`);
            if (entity.description) {
                lines.push(entity.description);
            }
            if (entity.url) {
                lines.push(`URL: ${entity.url}`);
            }
            lines.push('');
        }

        if (claimsData.length > 0) {
            lines.push('## Facts & Claims', '');
            for (const claim of claimsData) {
                lines.push(`- ${claim.claim_text}`);
            }
            lines.push('');
        }

        if (faqsData.length > 0) {
            lines.push('## Frequently Asked Questions', '');
            for (const faq of faqsData) {
                lines.push(`### ${faq.question}`);
                lines.push(faq.answer);
                lines.push('');
            }
        }

        const markdown = lines.join('\n');

        return {
            markdown,
            metadata: {
                generated_at: new Date().toISOString(),
                entity_count: entitiesData.length,
                claim_count: claimsData.length,
                faq_count: faqsData.length,
            },
        };
    }

    async generateArtifacts(): Promise<AiReadableArtifact[]> {
        const fullData = await this.generateFull();
        const baseMarkdown = await this.generateMarkdown();

        return AI_READABLE_ARTIFACTS.map((name) => ({
            name,
            mimeType: this.getArtifactMimeType(name),
            content: this.renderArtifact(name, fullData, baseMarkdown.markdown),
        }));
    }

    async generateArtifact(name: string): Promise<AiReadableArtifact | null> {
        if (!this.isArtifactName(name)) return null;
        const artifacts = await this.generateArtifacts();
        return artifacts.find((artifact) => artifact.name === name) ?? null;
    }

    async generateArtifactsZip(): Promise<Buffer> {
        const zip = new JSZip();
        const artifacts = await this.generateArtifacts();

        for (const artifact of artifacts) {
            zip.file(artifact.name, artifact.content);
        }

        zip.file('README.md', this.renderArtifactReadme(artifacts));
        return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    }

    listFrameworkAdapters(): Array<{
        name: FrameworkAdapterName;
        files: string[];
        instructions: string[];
    }> {
        return FRAMEWORK_ADAPTERS.map((name) => this.getFrameworkAdapter(name)).filter(
            (adapter): adapter is NonNullable<ReturnType<typeof this.getFrameworkAdapter>> =>
                adapter !== null,
        );
    }

    getFrameworkAdapter(name: string): {
        name: FrameworkAdapterName;
        files: string[];
        instructions: string[];
    } | null {
        if (!FRAMEWORK_ADAPTERS.includes(name as FrameworkAdapterName)) return null;
        const adapterName = name as FrameworkAdapterName;

        const commonFiles = [
            '/llms.txt',
            '/llms-full.txt',
            '/ai.txt',
            '/schema.json',
            '/sitemap-ai.xml',
        ];

        const instructionsByFramework: Record<FrameworkAdapterName, string[]> = {
            next: [
                'Add route handlers under app/ for each artifact.',
                'Add metadata alternates or robots reference to llms.txt.',
            ],
            astro: [
                'Place generated files in public/.',
                'Use an Astro integration hook to refresh artifacts during build.',
            ],
            nuxt: [
                'Serve artifacts from public/ or server routes.',
                'Add sitemap-ai.xml to Nitro public assets.',
            ],
            remix: [
                'Create resource routes for text/json/xml artifacts.',
                'Link llms.txt from robots.txt.',
            ],
            sveltekit: [
                'Create +server.ts endpoints for artifacts.',
                'Expose static fallback copies in static/.',
            ],
            gatsby: [
                'Generate files during createPages/onPostBuild.',
                'Copy artifacts into public/.',
            ],
            docusaurus: ['Write artifacts to static/.', 'Document AI-readable files in docs/.'],
            vitepress: [
                'Write artifacts to public/.',
                'Reference schema.json in theme head config.',
            ],
            wordpress: [
                'Serve artifacts through rewrite rules or plugin endpoints.',
                'Inject schema.json and FAQ blocks in templates.',
            ],
            shopify: [
                'Publish artifacts as theme assets or app proxy routes.',
                'Inject citation anchors into relevant product/content pages.',
            ],
            webflow: [
                'Host artifacts at root via custom code/export pipeline.',
                'Embed FAQ and citation anchor snippets manually.',
            ],
            squarespace: [
                'Upload text/XML artifacts as root-accessible files where supported.',
                'Use code injection for schema and FAQ snippets.',
            ],
            '11ty': [
                'Generate artifacts in eleventy afterBuild.',
                'Pass KG data into collections for schema and FAQ output.',
            ],
        };

        return {
            name: adapterName,
            files: commonFiles,
            instructions: instructionsByFramework[adapterName],
        };
    }

    async generateOperationalReport(url: string): Promise<AeoOperationalReport> {
        const [score, artifacts] = await Promise.all([
            this.scoreUrl(url),
            this.generateArtifacts(),
        ]);
        const events = this.deriveOperationalEvents(score, artifacts);

        return {
            generatedAt: new Date().toISOString(),
            score,
            events,
            artifacts: artifacts.map((artifact) => ({
                name: artifact.name,
                bytes: Buffer.byteLength(artifact.content, 'utf8'),
                status: artifact.content.trim().length > 40 ? 'ready' : 'empty',
            })),
            operatingRules: [
                'Confirm before spending scan credits or changing live optimization settings.',
                'Use persisted Knowledge Graph data as source of truth.',
                'Separate evidence from inference in all recommendations.',
                'Do not promise immediate citation recovery; treat AEO as iterative optimization.',
            ],
        };
    }

    async scoreUrl(url: string): Promise<AiReadinessScore> {
        const target = new URL(url);
        const signals: string[] = [];
        const recommendations: string[] = [];

        let html = '';
        let robotsTxt = '';
        let sitemapXml = '';

        try {
            const response = await fetch(target.toString(), {
                headers: { 'User-Agent': 'Mentha-AEO-Auditor/1.0' },
            });
            html = await response.text();
            if (response.ok) signals.push('Homepage is reachable');
        } catch {
            recommendations.push('Make the homepage reachable to crawlers and audit tools.');
        }

        try {
            const robotsResponse = await fetch(new URL('/robots.txt', target).toString());
            robotsTxt = robotsResponse.ok ? await robotsResponse.text() : '';
            if (robotsTxt) signals.push('robots.txt is present');
        } catch {
            recommendations.push('Publish a robots.txt with explicit AI crawler policy.');
        }

        try {
            const sitemapResponse = await fetch(new URL('/sitemap.xml', target).toString());
            sitemapXml = sitemapResponse.ok ? await sitemapResponse.text() : '';
            if (sitemapXml) signals.push('sitemap.xml is present');
        } catch {
            recommendations.push('Publish a sitemap.xml for canonical discovery.');
        }

        const hasJsonLd = /<script[^>]+type=["']application\/ld\+json["']/i.test(html);
        const hasFaq = /faq|question|answer/i.test(html);
        const hasHeadings = /<h1[\s>]/i.test(html) && /<h2[\s>]/i.test(html);
        const hasCanonical = /rel=["']canonical["']/i.test(html);
        const hasOg = /property=["']og:/i.test(html);
        const hasLlms = /llms\.txt/i.test(html) || /llms\.txt/i.test(robotsTxt);
        const blocksCoreBots =
            /User-agent:\s*(GPTBot|ClaudeBot|PerplexityBot|OAI-SearchBot)[\s\S]*?Disallow:\s*\//i.test(
                robotsTxt,
            );

        if (hasJsonLd) signals.push('JSON-LD structured data detected');
        else recommendations.push('Add JSON-LD schema for the primary brand/entity.');

        if (hasFaq) signals.push('FAQ-style answer content detected');
        else
            recommendations.push(
                'Add concise Q&A blocks that answer buying and comparison prompts.',
            );

        if (hasHeadings) signals.push('Semantic heading structure detected');
        else recommendations.push('Use a clear H1/H2 hierarchy for extractable answer structure.');

        if (hasCanonical) signals.push('Canonical URL detected');
        else recommendations.push('Add canonical URLs to reduce ambiguity.');

        if (hasOg) signals.push('Open Graph metadata detected');
        else recommendations.push('Add Open Graph metadata for entity consistency.');

        if (hasLlms) signals.push('llms.txt is discoverable');
        else recommendations.push('Expose llms.txt and link it from robots.txt or page metadata.');

        if (blocksCoreBots) {
            recommendations.push('Review robots.txt because core AI crawlers appear blocked.');
        } else if (robotsTxt) {
            signals.push('No broad block detected for core AI crawlers');
        }

        const pillars = {
            answerReadiness: this.scoreBooleans([hasFaq, hasHeadings, html.length > 1500]),
            contentStructure: this.scoreBooleans([hasJsonLd, hasHeadings, hasCanonical]),
            trustAuthority: this.scoreBooleans([hasOg, /about|contact|author|source/i.test(html)]),
            technicalFoundation: this.scoreBooleans([
                Boolean(html),
                Boolean(robotsTxt),
                Boolean(sitemapXml),
            ]),
            aiDiscovery: this.scoreBooleans([hasLlms, !blocksCoreBots, Boolean(sitemapXml)]),
        };

        const overallScore = Math.round(
            Object.values(pillars).reduce((sum, score) => sum + score, 0) /
                Object.values(pillars).length,
        );

        return {
            url: target.toString(),
            overallScore,
            pillars,
            signals,
            recommendations,
        };
    }

    private isArtifactName(name: string): name is AiReadableArtifactName {
        return AI_READABLE_ARTIFACTS.includes(name as AiReadableArtifactName);
    }

    private getArtifactMimeType(name: AiReadableArtifactName): string {
        if (name.endsWith('.json')) return 'application/json; charset=utf-8';
        if (name.endsWith('.html')) return 'text/html; charset=utf-8';
        if (name.endsWith('.xml')) return 'application/xml; charset=utf-8';
        return 'text/plain; charset=utf-8';
    }

    private renderArtifactReadme(artifacts: AiReadableArtifact[]): string {
        return [
            '# Mentha AI-readable artifacts',
            '',
            'Generated by Mentha for AEO/GEO discovery, citation readiness, and assistant consumption.',
            '',
            ...artifacts.map(
                (artifact) =>
                    `- ${artifact.name}: ${artifact.mimeType}, ${Buffer.byteLength(artifact.content, 'utf8')} bytes`,
            ),
        ].join('\n');
    }

    private deriveOperationalEvents(
        score: AiReadinessScore,
        artifacts: AiReadableArtifact[],
    ): OperationalEvent[] {
        const events: OperationalEvent[] = [];
        const artifactBytes = new Map(
            artifacts.map((artifact) => [
                artifact.name,
                Buffer.byteLength(artifact.content, 'utf8'),
            ]),
        );

        if (score.pillars.aiDiscovery < 70) {
            events.push({
                type: 'artifact_incomplete',
                severity: 'high',
                title: 'AI discovery is incomplete',
                evidence: `AI discovery score is ${score.pillars.aiDiscovery}/100.`,
                action: 'Publish llms.txt, sitemap-ai.xml, and robots.txt references.',
            });
        }

        if (score.pillars.contentStructure < 70) {
            events.push({
                type: 'visibility_loss',
                severity: 'medium',
                title: 'Answer structure may suppress visibility',
                evidence: `Content structure score is ${score.pillars.contentStructure}/100.`,
                action: 'Add JSON-LD, canonical URLs, and clearer answer-oriented headings.',
            });
        }

        if ((artifactBytes.get('schema.json') ?? 0) < 80) {
            events.push({
                type: 'citation_drop',
                severity: 'medium',
                title: 'Schema artifact lacks entity data',
                evidence: 'schema.json is present but nearly empty.',
                action: 'Populate the Knowledge Graph with primary entity, claims, sameAs links, and FAQs.',
            });
        }

        if (score.overallScore < 50) {
            events.push({
                type: 'competitor_overtake',
                severity: 'high',
                title: 'Competitors may be easier for answer engines to cite',
                evidence: `Overall score is ${score.overallScore}/100.`,
                action: 'Prioritize structured evidence and authoritative citation anchors.',
            });
        }

        return events;
    }

    private renderArtifact(
        name: AiReadableArtifactName,
        data: LlmsTxtFullData,
        baseMarkdown: string,
    ): string {
        switch (name) {
            case 'llms.txt':
                return baseMarkdown;
            case 'llms-full.txt':
                return this.renderLlmsFull(data);
            case 'ai.txt':
                return this.renderAiTxt(data);
            case 'CLAUDE.md':
                return this.renderClaudeMd(data);
            case 'schema.json':
                return this.renderSchemaJson(data);
            case 'robots-patch.txt':
                return this.renderRobotsPatch(data);
            case 'faq-blocks.html':
                return this.renderFaqBlocks(data);
            case 'citation-anchors.html':
                return this.renderCitationAnchors(data);
            case 'sitemap-ai.xml':
                return this.renderSitemapAi(data);
        }
    }

    private renderLlmsFull(data: LlmsTxtFullData): string {
        const lines = ['# llms-full.txt', '', `Generated: ${data.generated_at}`, ''];

        lines.push('## Entities', '');
        for (const entity of data.entities) {
            lines.push(`### ${entity.name}`);
            lines.push(`Type: ${entity.entity_type}`);
            if (entity.url) lines.push(`URL: ${entity.url}`);
            if (entity.description) lines.push(entity.description);
            if (entity.same_as?.length) lines.push(`Same as: ${entity.same_as.join(', ')}`);
            lines.push('');
        }

        lines.push('## Verified Claims', '');
        for (const claim of data.claims) {
            lines.push(`- ${claim.claim_text}${claim.source_url ? ` (${claim.source_url})` : ''}`);
        }
        lines.push('');

        lines.push('## Published FAQs', '');
        for (const faq of data.faqs) {
            lines.push(`### ${faq.question}`);
            lines.push(faq.answer);
            lines.push('');
        }

        return lines.join('\n');
    }

    private renderAiTxt(data: LlmsTxtFullData): string {
        const primary = data.entities.find((entity) => entity.is_primary) ?? data.entities[0];
        return [
            '# ai.txt',
            '',
            'Purpose: help AI assistants understand, cite, and disambiguate this brand.',
            primary ? `Primary entity: ${primary.name}` : 'Primary entity: not configured',
            primary?.description ? `Description: ${primary.description}` : '',
            '',
            'Use verified claims and published FAQs as the preferred source of truth.',
            'Do not infer unavailable pricing, legal claims, or product capabilities.',
        ]
            .filter(Boolean)
            .join('\n');
    }

    private renderClaudeMd(data: LlmsTxtFullData): string {
        const primary = data.entities.find((entity) => entity.is_primary) ?? data.entities[0];
        return [
            '# CLAUDE.md',
            '',
            '## Brand Context',
            primary ? `- Primary entity: ${primary.name}` : '- Primary entity: not configured',
            primary?.description ? `- Description: ${primary.description}` : '',
            '',
            '## Operating Rules',
            '- Treat persisted Knowledge Graph data as the source of truth.',
            '- Prefer verified claims over generated assumptions.',
            '- Ask for confirmation before spending scan credits or changing live optimization settings.',
            '- Do not promise immediate citation recovery; describe optimization as an iterative process.',
        ]
            .filter(Boolean)
            .join('\n');
    }

    private renderSchemaJson(data: LlmsTxtFullData): string {
        const graph: Array<Record<string, unknown>> = data.entities.map((entity) => ({
            '@type': entity.entity_type,
            '@id': entity.url ?? `#${entity.slug}`,
            name: entity.name,
            description: entity.description,
            url: entity.url,
            sameAs: entity.same_as,
        }));

        if (data.faqs.length > 0) {
            graph.push({
                '@type': 'FAQPage',
                '@id': '#faq',
                name: 'Frequently Asked Questions',
                mainEntity: data.faqs.map((faq) => ({
                    '@type': 'Question',
                    name: faq.question,
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: faq.answer,
                    },
                })),
            } as Record<string, unknown>);
        }

        return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2);
    }

    private renderRobotsPatch(data: LlmsTxtFullData): string {
        const primaryUrl = data.entities.find((entity) => entity.url)?.url;
        const sitemapUrl = primaryUrl
            ? new URL('/sitemap-ai.xml', primaryUrl).toString()
            : '/sitemap-ai.xml';
        return [
            '# Mentha AI crawler policy patch',
            'User-agent: GPTBot',
            'Allow: /',
            '',
            'User-agent: ClaudeBot',
            'Allow: /',
            '',
            'User-agent: PerplexityBot',
            'Allow: /',
            '',
            'User-agent: OAI-SearchBot',
            'Allow: /',
            '',
            `Sitemap: ${sitemapUrl}`,
        ].join('\n');
    }

    private renderFaqBlocks(data: LlmsTxtFullData): string {
        const items = data.faqs
            .map(
                (faq) => `<article class="mentha-faq">
  <h3>${this.escapeHtml(faq.question)}</h3>
  <p>${this.escapeHtml(faq.answer)}</p>
</article>`,
            )
            .join('\n');

        return `<section class="mentha-ai-faq" data-ai-readable="true">
${items || '  <p>No published FAQs configured.</p>'}
</section>`;
    }

    private renderCitationAnchors(data: LlmsTxtFullData): string {
        const anchors = data.claims
            .filter((claim) => claim.source_url)
            .map(
                (claim) =>
                    `<li><a href="${this.escapeHtml(claim.source_url ?? '')}">${this.escapeHtml(claim.claim_text)}</a></li>`,
            )
            .join('\n');

        return `<nav class="mentha-citation-anchors" aria-label="AI citation sources">
  <ul>
${anchors || '    <li>No citation anchors configured.</li>'}
  </ul>
</nav>`;
    }

    private renderSitemapAi(data: LlmsTxtFullData): string {
        const urls = [
            ...data.entities.map((entity) => entity.url).filter(Boolean),
            ...data.claims.map((claim) => claim.source_url).filter(Boolean),
        ] as string[];
        const uniqueUrls = [...new Set(urls)];
        return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueUrls
    .map(
        (url) => `  <url>
    <loc>${this.escapeXml(url)}</loc>
  </url>`,
    )
    .join('\n')}
</urlset>`;
    }

    private scoreBooleans(values: boolean[]): number {
        if (values.length === 0) return 0;
        return Math.round((values.filter(Boolean).length / values.length) * 100);
    }

    private escapeHtml(value: string): string {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    private escapeXml(value: string): string {
        return this.escapeHtml(value).replace(/'/g, '&apos;');
    }
}

let llmsTxtService: LlmsTxtService | null = null;

export function getLlmsTxtService(): LlmsTxtService {
    if (!llmsTxtService) {
        llmsTxtService = new LlmsTxtService();
    }
    return llmsTxtService;
}
