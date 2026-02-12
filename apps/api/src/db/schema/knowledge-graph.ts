import { pgTable, uuid, text, timestamp, jsonb, real, integer, boolean, date, index, check } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// =============================================================================
// ENTITIES: Core objects (Organizations, Products, People, Software)
// =============================================================================
export const entities = pgTable('entities', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenant_id: uuid('tenant_id'),
    entity_type: text('entity_type').notNull(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    url: text('url'),
    image_url: text('image_url'),
    alternate_names: text('alternate_names').array().default([]),
    disambiguating_description: text('disambiguating_description'),
    same_as: text('same_as').array().default([]),
    software_version: text('software_version'),
    operating_system: text('operating_system'),
    programming_language: text('programming_language'),
    application_category: text('application_category'),
    license: text('license'),
    founding_date: date('founding_date'),
    number_of_employees: text('number_of_employees'),
    area_served: text('area_served').array(),
    properties: jsonb('properties').default({}),
    is_primary: boolean('is_primary').default(false),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    slugIdx: index('idx_entities_slug').on(table.slug),
    typeIdx: index('idx_entities_type').on(table.entity_type),
    tenantIdx: index('idx_entities_tenant').on(table.tenant_id),
    entityTypeCheck: check('entity_type_check',
        sql`entity_type IN ('Organization', 'Product', 'SoftwareApplication', 'Person', 'Service', 'WebSite', 'Article')`),
}));

// =============================================================================
// ENTITY RELATIONSHIPS: Semantic graph edges
// =============================================================================
export const entityRelationships = pgTable('entity_relationships', {
    id: uuid('id').defaultRandom().primaryKey(),
    subject_id: uuid('subject_id').notNull(),
    predicate: text('predicate').notNull(),
    object_id: uuid('object_id'),
    object_external: text('object_external'),
    description: text('description'),
    weight: real('weight').default(1.0),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    subjectIdx: index('idx_relationships_subject').on(table.subject_id),
    predicateIdx: index('idx_relationships_predicate').on(table.predicate),
    validObjectCheck: check('valid_object_check',
        sql`(object_id IS NOT NULL AND object_external IS NULL) OR (object_id IS NULL AND object_external IS NOT NULL)`),
}));

// =============================================================================
// CLAIMS: Factual assertions about entities
// =============================================================================
export const claims = pgTable('claims', {
    id: uuid('id').defaultRandom().primaryKey(),
    entity_id: uuid('entity_id').notNull(),
    tenant_id: uuid('tenant_id'),
    claim_text: text('claim_text').notNull(),
    claim_type: text('claim_type').notNull(),
    is_verified: boolean('is_verified').default(true),
    source_url: text('source_url'),
    verification_date: date('verification_date'),
    value: text('value'),
    unit: text('unit'),
    importance: integer('importance').default(5),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    entityIdx: index('idx_claims_entity').on(table.entity_id),
    typeIdx: index('idx_claims_type').on(table.claim_type),
    tenantIdx: index('idx_claims_tenant').on(table.tenant_id),
    claimTypeCheck: check('claim_type_check',
        sql`claim_type IN ('fact', 'feature', 'comparison', 'statistic', 'testimonial')`),
    importanceCheck: check('importance_check', sql`importance BETWEEN 1 AND 10`),
}));

// =============================================================================
// FAQ VECTORS: Embeddings for RAG simulation
// =============================================================================
export const faqVectors = pgTable('faq_vectors', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenant_id: uuid('tenant_id'),
    question: text('question').notNull(),
    answer: text('answer').notNull(),
    category: text('category'),
    entity_id: uuid('entity_id'),
    source: text('source'),
    view_count: integer('view_count').default(0),
    helpfulness_score: real('helpfulness_score'),
    is_published: boolean('is_published').default(true),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    categoryIdx: index('idx_faq_category').on(table.category),
    entityIdx: index('idx_faq_entity').on(table.entity_id),
    tenantIdx: index('idx_faqs_tenant').on(table.tenant_id),
}));

// =============================================================================
// ACTION SCHEMAS: SearchAction, OrderAction, etc.
// =============================================================================
export const actionSchemas = pgTable('action_schemas', {
    id: uuid('id').defaultRandom().primaryKey(),
    entity_id: uuid('entity_id').notNull(),
    action_type: text('action_type').notNull(),
    target_url_template: text('target_url_template').notNull(),
    input_parameters: jsonb('input_parameters').default([]),
    description: text('description'),
    properties: jsonb('properties').default({}),
    is_active: boolean('is_active').default(true),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    entityIdx: index('idx_actions_entity').on(table.entity_id),
    actionTypeCheck: check('action_type_check',
        sql`action_type IN ('SearchAction', 'OrderAction', 'ReserveAction', 'SubscribeAction', 'RegisterAction', 'TradeAction')`),
}));

// =============================================================================
// RELATIONS
// =============================================================================
export const entitiesRelations = relations(entities, ({ many }) => ({
    relationships: many(entityRelationships),
    claims: many(claims),
    faqVectors: many(faqVectors),
    actionSchemas: many(actionSchemas),
}));

export const entityRelationshipsRelations = relations(entityRelationships, ({ one }) => ({
    subject: one(entities, {
        fields: [entityRelationships.subject_id],
        references: [entities.id],
    }),
    object: one(entities, {
        fields: [entityRelationships.object_id],
        references: [entities.id],
    }),
}));

export const claimsRelations = relations(claims, ({ one }) => ({
    entity: one(entities, {
        fields: [claims.entity_id],
        references: [entities.id],
    }),
}));

export const faqVectorsRelations = relations(faqVectors, ({ one }) => ({
    entity: one(entities, {
        fields: [faqVectors.entity_id],
        references: [entities.id],
    }),
}));

export const actionSchemasRelations = relations(actionSchemas, ({ one }) => ({
    entity: one(entities, {
        fields: [actionSchemas.entity_id],
        references: [entities.id],
    }),
}));
