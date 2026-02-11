import { pgTable, uuid, text, timestamp, integer, boolean, jsonb, real, index, check } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// =============================================================================
// PROFILES (synced from auth.users)
// =============================================================================
export const profiles = pgTable('profiles', {
    id: uuid('id').primaryKey(),
    email: text('email'),
    display_name: text('display_name'),
    plan: text('plan').default('free'),
    daily_quota: integer('daily_quota').default(100),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    planCheck: check('plan_check', sql`plan IN ('free', 'pro', 'enterprise')`),
}));

// =============================================================================
// PROJECTS
// =============================================================================
export const projects = pgTable('projects', {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').notNull(),
    tenant_id: uuid('tenant_id'),
    name: text('name').notNull(),
    domain: text('domain').notNull(),
    description: text('description'),
    competitors: jsonb('competitors').default([]),
    settings: jsonb('settings').default({}),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    userIdIdx: index('idx_projects_user_id').on(table.user_id),
    tenantIdIdx: index('idx_projects_tenant').on(table.tenant_id),
    nameCheck: check('name_check', sql`char_length(name) >= 3`),
}));

// =============================================================================
// KEYWORDS
// =============================================================================
export const keywords = pgTable('keywords', {
    id: uuid('id').defaultRandom().primaryKey(),
    project_id: uuid('project_id').notNull(),
    query: text('query').notNull(),
    intent: text('intent').default('informational'),
    scan_frequency: text('scan_frequency').default('weekly'),
    engines: jsonb('engines').default(['perplexity']),
    is_active: boolean('is_active').default(true),
    last_scanned_at: timestamp('last_scanned_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    projectIdIdx: index('idx_keywords_project_id').on(table.project_id),
    activeFrequencyIdx: index('idx_keywords_active_frequency').on(table.is_active, table.scan_frequency),
    queryCheck: check('query_check', sql`char_length(query) >= 2`),
    intentCheck: check('intent_check', sql`intent IN ('informational', 'transactional', 'navigational', 'commercial')`),
    frequencyCheck: check('scan_frequency_check', sql`scan_frequency IN ('daily', 'weekly', 'manual')`),
}));

// =============================================================================
// SCAN JOBS (audit log of scan attempts)
// =============================================================================
export const scanJobs = pgTable('scan_jobs', {
    id: uuid('id').defaultRandom().primaryKey(),
    keyword_id: uuid('keyword_id').notNull(),
    engine: text('engine').notNull(),
    status: text('status').default('pending'),
    priority: text('priority').default('normal'),
    error_message: text('error_message'),
    latency_ms: integer('latency_ms'),
    started_at: timestamp('started_at', { withTimezone: true }),
    completed_at: timestamp('completed_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    keywordIdIdx: index('idx_scan_jobs_keyword_id').on(table.keyword_id),
    statusIdx: index('idx_scan_jobs_status').on(table.status),
    engineCheck: check('engine_check', sql`engine IN ('perplexity', 'openai', 'gemini')`),
    statusCheck: check('status_check', sql`status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')`),
    priorityCheck: check('priority_check', sql`priority IN ('low', 'normal', 'high')`),
}));

// =============================================================================
// SCAN RESULTS (LLM responses + analysis)
// =============================================================================
export const scanResults = pgTable('scan_results', {
    id: uuid('id').defaultRandom().primaryKey(),
    job_id: uuid('job_id').notNull(),
    raw_response: text('raw_response'),
    analysis_json: jsonb('analysis_json'),
    sentiment_score: real('sentiment_score'),
    brand_visibility: boolean('brand_visibility'),
    share_of_voice_rank: integer('share_of_voice_rank'),
    recommendation_type: text('recommendation_type'),
    token_count: integer('token_count'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    jobIdIdx: index('idx_scan_results_job_id').on(table.job_id),
    sentimentCheck: check('sentiment_check', sql`sentiment_score >= -1 AND sentiment_score <= 1`),
    recommendationCheck: check('recommendation_type_check',
        sql`recommendation_type IN ('direct_recommendation', 'neutral_comparison', 'negative_mention', 'absent')`),
}));

// =============================================================================
// CITATIONS (normalized sources)
// =============================================================================
export const citations = pgTable('citations', {
    id: uuid('id').defaultRandom().primaryKey(),
    result_id: uuid('result_id').notNull(),
    url: text('url').notNull(),
    domain: text('domain'),
    title: text('title'),
    position: integer('position'),
    is_brand_domain: boolean('is_brand_domain').default(false),
    is_competitor_domain: boolean('is_competitor_domain').default(false),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    resultIdIdx: index('idx_citations_result_id').on(table.result_id),
    domainIdx: index('idx_citations_domain').on(table.domain),
}));

// =============================================================================
// RELATIONS
// =============================================================================
export const projectsRelations = relations(projects, ({ many }) => ({
    keywords: many(keywords),
}));

export const keywordsRelations = relations(keywords, ({ one, many }) => ({
    project: one(projects, {
        fields: [keywords.project_id],
        references: [projects.id],
    }),
    scanJobs: many(scanJobs),
}));

export const scanJobsRelations = relations(scanJobs, ({ one, many }) => ({
    keyword: one(keywords, {
        fields: [scanJobs.keyword_id],
        references: [keywords.id],
    }),
    scanResults: many(scanResults),
}));

export const scanResultsRelations = relations(scanResults, ({ one, many }) => ({
    scanJob: one(scanJobs, {
        fields: [scanResults.job_id],
        references: [scanJobs.id],
    }),
    citations: many(citations),
}));

export const citationsRelations = relations(citations, ({ one }) => ({
    scanResult: one(scanResults, {
        fields: [citations.result_id],
        references: [scanResults.id],
    }),
}));
