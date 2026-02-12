import { sql, eq, desc } from 'drizzle-orm';
import { db } from '../db';
import { entities, claims, faqVectors } from '../db/schema/knowledge-graph';
import type { Entity, Claim, FaqVector } from '../db/types';
import { logger } from '../core/logger';

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

export class LlmsTxtService {
    async generate(): Promise<string> {
        logger.debug('Generating llms.txt');

        const result = await db.execute(sql`SELECT generate_llms_txt()`);

        const content = result[0] && typeof result[0] === 'object' && 'generate_llms_txt' in result[0]
            ? (result[0] as { generate_llms_txt: string }).generate_llms_txt
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
            db.select().from(entities).orderBy(desc(entities.is_primary), desc(entities.created_at)),
            db.select().from(claims).where(eq(claims.is_verified, true)).orderBy(desc(claims.importance)),
            db.select().from(faqVectors).where(eq(faqVectors.is_published, true)).orderBy(desc(faqVectors.view_count)),
        ]);

        logger.info('Full llms.txt data generated', {
            entities: entitiesData.length,
            claims: claimsData.length,
            faqs: faqsData.length,
        });

        return {
            entities: entitiesData,
            claims: claimsData,
            faqs: faqsData,
            generated_at: new Date().toISOString(),
        };
    }

    async generateMarkdown(entitySlug?: string): Promise<LlmsTxtContent> {
        logger.debug('Generating markdown llms.txt', { entitySlug });

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

            entitiesData = entity;
            claimsData = await db
                .select()
                .from(claims)
                .where(eq(claims.entity_id, entity[0]!.id))
                .orderBy(desc(claims.importance));

            faqsData = await db
                .select()
                .from(faqVectors)
                .where(eq(faqVectors.entity_id, entity[0]!.id))
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
}

let llmsTxtService: LlmsTxtService | null = null;

export function getLlmsTxtService(): LlmsTxtService {
    if (!llmsTxtService) {
        llmsTxtService = new LlmsTxtService();
    }
    return llmsTxtService;
}
