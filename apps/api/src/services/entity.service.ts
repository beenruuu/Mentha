import { and, desc, eq } from 'drizzle-orm';

import { logger } from '../core/logger';
import { db } from '../db';
import { claims, entities, faqVectors } from '../db/schema/knowledge-graph';
import type {
    Claim,
    Entity,
    FaqVector,
    InsertClaim,
    InsertEntity,
    InsertFaqVector,
} from '../db/types';
import { NotFoundException } from '../exceptions/http';

export interface EntityFilters {
    tenantId?: string;
    entityType?: string;
    isPrimary?: boolean;
}

export class EntityService {
    async list(): Promise<
        Array<{
            id: string;
            entity_type: string | null;
            name: string;
            slug: string;
            description: string | null;
            url: string | null;
            is_primary: boolean | null;
            created_at: Date | null;
        }>
    > {
        logger.debug('Listing entities');

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

        return data;
    }

    async listEntities(filters?: EntityFilters): Promise<Entity[]> {
        logger.debug('Listing entities', { filters });

        let query = db
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
            .orderBy(desc(entities.created_at));

        if (filters?.tenantId) {
            query = query.where(eq(entities.tenant_id, filters.tenantId)) as typeof query;
        }

        if (filters?.entityType) {
            query = query.where(eq(entities.entity_type, filters.entityType)) as typeof query;
        }

        if (filters?.isPrimary !== undefined) {
            query = query.where(eq(entities.is_primary, filters.isPrimary)) as typeof query;
        }

        const data = await query;
        return data as Entity[];
    }

    async getBySlug(slug: string): Promise<Entity> {
        logger.debug('Getting entity by slug', { slug });

        const data = await db.select().from(entities).where(eq(entities.slug, slug)).limit(1);

        if (data.length === 0) {
            throw new NotFoundException('Entity not found');
        }

        return data[0]!;
    }

    async create(data: InsertEntity): Promise<Entity> {
        logger.info('Creating entity', { name: data.name, type: data.entity_type });

        const result = await db.insert(entities).values(data).returning();

        if (!result[0]) {
            throw new Error('Failed to create entity');
        }

        logger.info('Entity created successfully', {
            entityId: result[0].id,
            slug: result[0].slug,
        });
        return result[0];
    }

    async update(slug: string, data: Partial<InsertEntity>): Promise<Entity> {
        logger.info('Updating entity', { slug, updates: Object.keys(data) });

        const result = await db
            .update(entities)
            .set({
                ...data,
                updated_at: new Date(),
            })
            .where(eq(entities.slug, slug))
            .returning();

        if (result.length === 0) {
            throw new NotFoundException('Entity not found');
        }

        logger.info('Entity updated successfully', { slug });
        return result[0]!;
    }

    async delete(slug: string): Promise<void> {
        logger.info('Deleting entity', { slug });

        const result = await db.delete(entities).where(eq(entities.slug, slug)).returning();

        if (result.length === 0) {
            throw new NotFoundException('Entity not found');
        }

        logger.info('Entity deleted successfully', { slug });
    }

    async generateJsonLd(slug: string): Promise<object> {
        logger.debug('Generating JSON-LD for entity', { slug });

        const entity = await this.getBySlug(slug);

        const jsonLd = {
            '@context': 'https://schema.org',
            '@type': entity.entity_type,
            name: entity.name,
            description: entity.description,
            url: entity.url,
            image: entity.image_url,
            alternateName: entity.alternate_names,
            disambiguatingDescription: entity.disambiguating_description,
            sameAs: entity.same_as,
        };

        if (entity.entity_type === 'SoftwareApplication') {
            Object.assign(jsonLd, {
                softwareVersion: entity.software_version,
                operatingSystem: entity.operating_system,
                programmingLanguage: entity.programming_language,
                applicationCategory: entity.application_category,
                license: entity.license,
            });
        }

        if (entity.entity_type === 'Organization') {
            Object.assign(jsonLd, {
                foundingDate: entity.founding_date,
                numberOfEmployees: entity.number_of_employees,
                areaServed: entity.area_served,
            });
        }

        return jsonLd;
    }

    async getClaimsByEntity(entityId: string): Promise<
        Array<{
            id: string;
            claim_text: string;
            claim_type: string | null;
            importance: number | null;
            source_url: string | null;
            is_verified: boolean | null;
        }>
    > {
        logger.debug('Getting claims by entity', { entityId });

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
            .where(eq(claims.entity_id, entityId))
            .orderBy(desc(claims.importance));

        return data;
    }

    async getFaqsByEntity(entityId: string): Promise<
        Array<{
            question: string;
            answer: string;
            category: string | null;
        }>
    > {
        logger.debug('Getting FAQs by entity', { entityId });

        const data = await db
            .select({
                question: faqVectors.question,
                answer: faqVectors.answer,
                category: faqVectors.category,
            })
            .from(faqVectors)
            .where(eq(faqVectors.entity_id, entityId))
            .orderBy(desc(faqVectors.view_count));

        return data;
    }

    async listClaims(entitySlug: string): Promise<Claim[]> {
        logger.debug('Listing claims for entity', { entitySlug });

        const entity = await this.getBySlug(entitySlug);

        const data = await db
            .select()
            .from(claims)
            .where(eq(claims.entity_id, entity.id))
            .orderBy(desc(claims.importance), desc(claims.created_at));

        return data;
    }

    async addClaim(entitySlug: string, claimData: Omit<InsertClaim, 'entity_id'>): Promise<Claim> {
        logger.info('Adding claim to entity', { entitySlug, claimType: claimData.claim_type });

        const entity = await this.getBySlug(entitySlug);

        const result = await db
            .insert(claims)
            .values({
                ...claimData,
                entity_id: entity.id,
            })
            .returning();

        if (!result[0]) {
            throw new Error('Failed to create claim');
        }

        logger.info('Claim created successfully', { claimId: result[0].id });
        return result[0];
    }

    async listFaqs(entitySlug: string): Promise<FaqVector[]> {
        logger.debug('Listing FAQs for entity', { entitySlug });

        const entity = await this.getBySlug(entitySlug);

        const data = await db
            .select()
            .from(faqVectors)
            .where(eq(faqVectors.entity_id, entity.id))
            .orderBy(desc(faqVectors.view_count), desc(faqVectors.created_at));

        return data;
    }

    async addFaq(
        entitySlug: string,
        faqData: Omit<InsertFaqVector, 'entity_id'>,
    ): Promise<FaqVector> {
        logger.info('Adding FAQ to entity', { entitySlug, question: faqData.question });

        const entity = await this.getBySlug(entitySlug);

        const result = await db
            .insert(faqVectors)
            .values({
                ...faqData,
                entity_id: entity.id,
            })
            .returning();

        if (!result[0]) {
            throw new Error('Failed to create FAQ');
        }

        logger.info('FAQ created successfully', { faqId: result[0].id });
        return result[0];
    }

    async getPrimaryEntity(tenantId?: string): Promise<Entity | null> {
        logger.debug('Getting primary entity', { tenantId });

        const conditions = tenantId
            ? and(eq(entities.is_primary, true), eq(entities.tenant_id, tenantId))
            : eq(entities.is_primary, true);

        const data = await db.select().from(entities).where(conditions).limit(1);

        return data.length > 0 ? data[0]! : null;
    }
}

let entityService: EntityService | null = null;

export function getEntityService(): EntityService {
    if (!entityService) {
        entityService = new EntityService();
    }
    return entityService;
}
