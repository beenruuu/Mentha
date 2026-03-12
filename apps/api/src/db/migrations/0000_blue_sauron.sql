CREATE TABLE "citations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"result_id" uuid NOT NULL,
	"url" text NOT NULL,
	"domain" text,
	"title" text,
	"position" integer,
	"is_brand_domain" boolean DEFAULT false,
	"is_competitor_domain" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "keywords" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"query" text NOT NULL,
	"intent" text DEFAULT 'informational',
	"scan_frequency" text DEFAULT 'weekly',
	"engines" jsonb DEFAULT '["perplexity"]'::jsonb,
	"is_active" boolean DEFAULT true,
	"last_scanned_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "query_check" CHECK (char_length(query) >= 2),
	CONSTRAINT "intent_check" CHECK (intent IN ('informational', 'transactional', 'navigational', 'commercial')),
	CONSTRAINT "scan_frequency_check" CHECK (scan_frequency IN ('daily', 'weekly', 'manual'))
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text,
	"display_name" text,
	"plan" text DEFAULT 'free',
	"daily_quota" integer DEFAULT 100,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "plan_check" CHECK (plan IN ('free', 'pro', 'enterprise'))
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tenant_id" uuid,
	"name" text NOT NULL,
	"domain" text NOT NULL,
	"description" text,
	"competitors" jsonb DEFAULT '[]'::jsonb,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "name_check" CHECK (char_length(name) >= 3)
);
--> statement-breakpoint
CREATE TABLE "scan_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"keyword_id" uuid NOT NULL,
	"engine" text NOT NULL,
	"status" text DEFAULT 'pending',
	"priority" text DEFAULT 'normal',
	"error_message" text,
	"latency_ms" integer,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "engine_check" CHECK (engine IN ('perplexity', 'openai', 'gemini')),
	CONSTRAINT "status_check" CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
	CONSTRAINT "priority_check" CHECK (priority IN ('low', 'normal', 'high'))
);
--> statement-breakpoint
CREATE TABLE "scan_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"raw_response" text,
	"analysis_json" jsonb,
	"sentiment_score" real,
	"brand_visibility" boolean,
	"share_of_voice_rank" integer,
	"recommendation_type" text,
	"token_count" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "sentiment_check" CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
	CONSTRAINT "recommendation_type_check" CHECK (recommendation_type IN ('direct_recommendation', 'neutral_comparison', 'negative_mention', 'absent'))
);
--> statement-breakpoint
CREATE TABLE "action_schemas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"action_type" text NOT NULL,
	"target_url_template" text NOT NULL,
	"input_parameters" jsonb DEFAULT '[]'::jsonb,
	"description" text,
	"properties" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "action_type_check" CHECK (action_type IN ('SearchAction', 'OrderAction', 'ReserveAction', 'SubscribeAction', 'RegisterAction', 'TradeAction'))
);
--> statement-breakpoint
CREATE TABLE "claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"tenant_id" uuid,
	"claim_text" text NOT NULL,
	"claim_type" text NOT NULL,
	"is_verified" boolean DEFAULT true,
	"source_url" text,
	"verification_date" date,
	"value" text,
	"unit" text,
	"importance" integer DEFAULT 5,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "claim_type_check" CHECK (claim_type IN ('fact', 'feature', 'comparison', 'statistic', 'testimonial')),
	CONSTRAINT "importance_check" CHECK (importance BETWEEN 1 AND 10)
);
--> statement-breakpoint
CREATE TABLE "entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"entity_type" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"url" text,
	"image_url" text,
	"alternate_names" text[] DEFAULT '{}',
	"disambiguating_description" text,
	"same_as" text[] DEFAULT '{}',
	"software_version" text,
	"operating_system" text,
	"programming_language" text,
	"application_category" text,
	"license" text,
	"founding_date" date,
	"number_of_employees" text,
	"area_served" text[],
	"properties" jsonb DEFAULT '{}'::jsonb,
	"is_primary" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "entities_slug_unique" UNIQUE("slug"),
	CONSTRAINT "entity_type_check" CHECK (entity_type IN ('Organization', 'Product', 'SoftwareApplication', 'Person', 'Service', 'WebSite', 'Article'))
);
--> statement-breakpoint
CREATE TABLE "entity_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_id" uuid NOT NULL,
	"predicate" text NOT NULL,
	"object_id" uuid,
	"object_external" text,
	"description" text,
	"weight" real DEFAULT 1,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "valid_object_check" CHECK ((object_id IS NOT NULL AND object_external IS NULL) OR (object_id IS NULL AND object_external IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "faq_vectors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"category" text,
	"entity_id" uuid,
	"source" text,
	"view_count" integer DEFAULT 0,
	"helpfulness_score" real,
	"is_published" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_firewall_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"bot_name" text NOT NULL,
	"user_agent_pattern" text NOT NULL,
	"action" text NOT NULL,
	"bot_purpose" text DEFAULT 'unknown',
	"rate_limit_rpm" integer,
	"priority" integer DEFAULT 100,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "action_check" CHECK (action IN ('allow', 'block', 'rate_limit', 'serve_llms_txt')),
	CONSTRAINT "bot_purpose_check" CHECK (bot_purpose IN ('training', 'search', 'preview', 'unknown'))
);
--> statement-breakpoint
CREATE TABLE "domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"domain" text NOT NULL,
	"is_primary" boolean DEFAULT false,
	"verification_token" text NOT NULL,
	"verification_method" text DEFAULT 'dns_txt',
	"is_verified" boolean DEFAULT false,
	"verified_at" timestamp with time zone,
	"edge_enabled" boolean DEFAULT false,
	"cloudflare_zone_id" text,
	"indexnow_key" text,
	"ssl_status" text DEFAULT 'pending',
	"proxy_mode" text DEFAULT 'off',
	"platform_type" text DEFAULT 'unknown',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "domains_domain_unique" UNIQUE("domain"),
	CONSTRAINT "verification_method_check" CHECK (verification_method IN ('dns_txt', 'meta_tag', 'file')),
	CONSTRAINT "ssl_status_check" CHECK (ssl_status IN ('pending', 'active', 'error')),
	CONSTRAINT "proxy_mode_check" CHECK (proxy_mode IN ('off', 'dns_only', 'proxied')),
	CONSTRAINT "platform_type_check" CHECK (platform_type IN ('wordpress', 'wix', 'squarespace', 'shopify', 'webflow', 'custom', 'unknown'))
);
--> statement-breakpoint
CREATE TABLE "edge_injection_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"url_pattern" text DEFAULT '/*' NOT NULL,
	"inject_jsonld" boolean DEFAULT true,
	"inject_meta_tags" boolean DEFAULT true,
	"inject_llms_txt_link" boolean DEFAULT true,
	"entity_id" uuid,
	"cache_ttl_seconds" integer DEFAULT 3600,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"plan" text DEFAULT 'free' NOT NULL,
	"features" jsonb DEFAULT '{"geo":false,"indexnow":false,"edge_injection":false,"ai_firewall":false}'::jsonb,
	"max_domains" integer DEFAULT 1,
	"max_entities" integer DEFAULT 10,
	"max_scans_per_month" integer DEFAULT 100,
	"api_key" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug"),
	CONSTRAINT "tenants_api_key_unique" UNIQUE("api_key"),
	CONSTRAINT "plan_check" CHECK (plan IN ('free', 'starter', 'pro', 'enterprise'))
);
--> statement-breakpoint
CREATE INDEX "idx_citations_result_id" ON "citations" USING btree ("result_id");--> statement-breakpoint
CREATE INDEX "idx_citations_domain" ON "citations" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "idx_keywords_project_id" ON "keywords" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_keywords_active_frequency" ON "keywords" USING btree ("is_active","scan_frequency");--> statement-breakpoint
CREATE INDEX "idx_projects_user_id" ON "projects" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_projects_tenant" ON "projects" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_scan_jobs_keyword_id" ON "scan_jobs" USING btree ("keyword_id");--> statement-breakpoint
CREATE INDEX "idx_scan_jobs_status" ON "scan_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_scan_results_job_id" ON "scan_results" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_actions_entity" ON "action_schemas" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "idx_claims_entity" ON "claims" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "idx_claims_type" ON "claims" USING btree ("claim_type");--> statement-breakpoint
CREATE INDEX "idx_claims_tenant" ON "claims" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_entities_slug" ON "entities" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_entities_type" ON "entities" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "idx_entities_tenant" ON "entities" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_relationships_subject" ON "entity_relationships" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "idx_relationships_predicate" ON "entity_relationships" USING btree ("predicate");--> statement-breakpoint
CREATE INDEX "idx_faq_category" ON "faq_vectors" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_faq_entity" ON "faq_vectors" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "idx_faqs_tenant" ON "faq_vectors" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_firewall_tenant" ON "ai_firewall_rules" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_domains_tenant" ON "domains" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_domains_domain" ON "domains" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "idx_domains_verified" ON "domains" USING btree ("is_verified");--> statement-breakpoint
CREATE INDEX "idx_injection_domain" ON "edge_injection_config" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "idx_tenants_slug" ON "tenants" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_tenants_api_key" ON "tenants" USING btree ("api_key");