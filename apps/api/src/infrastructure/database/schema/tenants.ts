import { pgTable, uuid, text, timestamp, jsonb, integer, boolean, index, check, unique } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { entities } from './knowledge-graph';

// =============================================================================
// TENANTS: Core tenant/organization table
// =============================================================================
export const tenants = pgTable('tenants', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    plan: text('plan').notNull().default('free'),
    features: jsonb('features').default({ geo: false, indexnow: false, edge_injection: false, ai_firewall: false }),
    max_domains: integer('max_domains').default(1),
    max_entities: integer('max_entities').default(10),
    max_scans_per_month: integer('max_scans_per_month').default(100),
    api_key: text('api_key').unique(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    slugIdx: index('idx_tenants_slug').on(table.slug),
    apiKeyIdx: index('idx_tenants_api_key').on(table.api_key),
    planCheck: check('plan_check', sql`plan IN ('free', 'starter', 'pro', 'enterprise')`),
}));

// =============================================================================
// DOMAINS: Verified domains for each tenant
// =============================================================================
export const domains = pgTable('domains', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenant_id: uuid('tenant_id').notNull(),
    domain: text('domain').notNull().unique(),
    is_primary: boolean('is_primary').default(false),
    verification_token: text('verification_token').notNull(),
    verification_method: text('verification_method').default('dns_txt'),
    is_verified: boolean('is_verified').default(false),
    verified_at: timestamp('verified_at', { withTimezone: true }),
    edge_enabled: boolean('edge_enabled').default(false),
    cloudflare_zone_id: text('cloudflare_zone_id'),
    indexnow_key: text('indexnow_key'),
    ssl_status: text('ssl_status').default('pending'),
    proxy_mode: text('proxy_mode').default('off'),
    platform_type: text('platform_type').default('unknown'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    tenantIdx: index('idx_domains_tenant').on(table.tenant_id),
    domainIdx: index('idx_domains_domain').on(table.domain),
    verifiedIdx: index('idx_domains_verified').on(table.is_verified),
    verificationMethodCheck: check('verification_method_check', sql`verification_method IN ('dns_txt', 'meta_tag', 'file')`),
    sslStatusCheck: check('ssl_status_check', sql`ssl_status IN ('pending', 'active', 'error')`),
    proxyModeCheck: check('proxy_mode_check', sql`proxy_mode IN ('off', 'dns_only', 'proxied')`),
    platformTypeCheck: check('platform_type_check',
        sql`platform_type IN ('wordpress', 'wix', 'squarespace', 'shopify', 'webflow', 'custom', 'unknown')`),
}));

// =============================================================================
// AI FIREWALL RULES: Per-tenant bot control configuration
// =============================================================================
export const aiFirewallRules = pgTable('ai_firewall_rules', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenant_id: uuid('tenant_id').notNull(),
    bot_name: text('bot_name').notNull(),
    user_agent_pattern: text('user_agent_pattern').notNull(),
    action: text('action').notNull(),
    bot_purpose: text('bot_purpose').default('unknown'),
    rate_limit_rpm: integer('rate_limit_rpm'),
    priority: integer('priority').default(100),
    is_active: boolean('is_active').default(true),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    tenantIdx: index('idx_firewall_tenant').on(table.tenant_id),
    actionCheck: check('action_check', sql`action IN ('allow', 'block', 'rate_limit', 'serve_llms_txt')`),
    purposeCheck: check('bot_purpose_check', sql`bot_purpose IN ('training', 'search', 'preview', 'unknown')`),
}));

// =============================================================================
// EDGE INJECTION CONFIG: What to inject per domain
// =============================================================================
export const edgeInjectionConfig = pgTable('edge_injection_config', {
    id: uuid('id').defaultRandom().primaryKey(),
    domain_id: uuid('domain_id').notNull(),
    url_pattern: text('url_pattern').notNull().default('/*'),
    inject_jsonld: boolean('inject_jsonld').default(true),
    inject_meta_tags: boolean('inject_meta_tags').default(true),
    inject_llms_txt_link: boolean('inject_llms_txt_link').default(true),
    entity_id: uuid('entity_id'),
    cache_ttl_seconds: integer('cache_ttl_seconds').default(3600),
    is_active: boolean('is_active').default(true),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    domainIdx: index('idx_injection_domain').on(table.domain_id),
}));

// =============================================================================
// RELATIONS
// =============================================================================
export const tenantsRelations = relations(tenants, ({ many }) => ({
    domains: many(domains),
    aiFirewallRules: many(aiFirewallRules),
}));

export const domainsRelations = relations(domains, ({ one, many }) => ({
    tenant: one(tenants, {
        fields: [domains.tenant_id],
        references: [tenants.id],
    }),
    edgeInjectionConfigs: many(edgeInjectionConfig),
}));

export const aiFirewallRulesRelations = relations(aiFirewallRules, ({ one }) => ({
    tenant: one(tenants, {
        fields: [aiFirewallRules.tenant_id],
        references: [tenants.id],
    }),
}));

export const edgeInjectionConfigRelations = relations(edgeInjectionConfig, ({ one }) => ({
    domain: one(domains, {
        fields: [edgeInjectionConfig.domain_id],
        references: [domains.id],
    }),
    entity: one(entities, {
        fields: [edgeInjectionConfig.entity_id],
        references: [entities.id],
    }),
}));
