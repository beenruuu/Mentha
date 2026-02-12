import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { profiles, projects, keywords, scanJobs, scanResults, citations } from './schema/core';
import { tenants, domains, aiFirewallRules, edgeInjectionConfig } from './schema/tenants';
import { entities, entityRelationships, claims, faqVectors, actionSchemas } from './schema/knowledge-graph';

export type Profile = InferSelectModel<typeof profiles>;
export type InsertProfile = InferInsertModel<typeof profiles>;

export type Project = InferSelectModel<typeof projects>;
export type InsertProject = InferInsertModel<typeof projects>;

export type Keyword = InferSelectModel<typeof keywords>;
export type InsertKeyword = InferInsertModel<typeof keywords>;

export type ScanJob = InferSelectModel<typeof scanJobs>;
export type InsertScanJob = InferInsertModel<typeof scanJobs>;

export type ScanResult = InferSelectModel<typeof scanResults>;
export type InsertScanResult = InferInsertModel<typeof scanResults>;

export type Citation = InferSelectModel<typeof citations>;
export type InsertCitation = InferInsertModel<typeof citations>;

export type Tenant = InferSelectModel<typeof tenants>;
export type InsertTenant = InferInsertModel<typeof tenants>;

export type Domain = InferSelectModel<typeof domains>;
export type InsertDomain = InferInsertModel<typeof domains>;

export type AiFirewallRule = InferSelectModel<typeof aiFirewallRules>;
export type InsertAiFirewallRule = InferInsertModel<typeof aiFirewallRules>;

export type EdgeInjectionConfig = InferSelectModel<typeof edgeInjectionConfig>;
export type InsertEdgeInjectionConfig = InferInsertModel<typeof edgeInjectionConfig>;

export type Entity = InferSelectModel<typeof entities>;
export type InsertEntity = InferInsertModel<typeof entities>;

export type EntityRelationship = InferSelectModel<typeof entityRelationships>;
export type InsertEntityRelationship = InferInsertModel<typeof entityRelationships>;

export type Claim = InferSelectModel<typeof claims>;
export type InsertClaim = InferInsertModel<typeof claims>;

export type FaqVector = InferSelectModel<typeof faqVectors>;
export type InsertFaqVector = InferInsertModel<typeof faqVectors>;

export type ActionSchema = InferSelectModel<typeof actionSchemas>;
export type InsertActionSchema = InferInsertModel<typeof actionSchemas>;
