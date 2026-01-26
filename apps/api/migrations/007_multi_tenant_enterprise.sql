-- Mentha Backend - Enterprise Multi-Tenant Architecture
-- Full tenant isolation with RLS, domain verification, and edge configuration

-- =============================================================================
-- TENANTS: Core tenant/organization table
-- Each tenant represents a company (MGI, Grupo Dissan) using Mentha
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identity
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    
    -- Billing/Plan
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
    
    -- Features enabled
    features JSONB DEFAULT '{"geo": false, "indexnow": false, "edge_injection": false, "ai_firewall": false}'::jsonb,
    
    -- Limits
    max_domains INTEGER DEFAULT 1,
    max_entities INTEGER DEFAULT 10,
    max_scans_per_month INTEGER DEFAULT 100,
    
    -- API access
    api_key TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenants_slug ON public.tenants(slug);
CREATE INDEX idx_tenants_api_key ON public.tenants(api_key);

-- =============================================================================
-- DOMAINS: Verified domains for each tenant
-- A tenant can have multiple domains (www.mgi.com, tienda.mgi.com)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    -- Domain identity
    domain TEXT NOT NULL, -- e.g., "www.mgi.com"
    is_primary BOOLEAN DEFAULT false,
    
    -- Verification
    verification_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
    verification_method TEXT CHECK (verification_method IN ('dns_txt', 'meta_tag', 'file')) DEFAULT 'dns_txt',
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    
    -- Edge configuration
    edge_enabled BOOLEAN DEFAULT false,
    cloudflare_zone_id TEXT,
    indexnow_key TEXT DEFAULT encode(gen_random_bytes(16), 'hex'),
    
    -- SSL/Proxy status
    ssl_status TEXT CHECK (ssl_status IN ('pending', 'active', 'error')) DEFAULT 'pending',
    proxy_mode TEXT CHECK (proxy_mode IN ('off', 'dns_only', 'proxied')) DEFAULT 'off',
    
    -- Integration type (helps with setup instructions)
    platform_type TEXT CHECK (platform_type IN (
        'wordpress', 'wix', 'squarespace', 'shopify', 
        'webflow', 'custom', 'unknown'
    )) DEFAULT 'unknown',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(domain)
);

CREATE INDEX idx_domains_tenant ON public.domains(tenant_id);
CREATE INDEX idx_domains_domain ON public.domains(domain);
CREATE INDEX idx_domains_verified ON public.domains(is_verified) WHERE is_verified = true;

-- =============================================================================
-- AI FIREWALL RULES: Per-tenant bot control configuration
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.ai_firewall_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    -- Bot identification
    bot_name TEXT NOT NULL, -- 'GPTBot', 'ClaudeBot', 'PerplexityBot', etc.
    user_agent_pattern TEXT NOT NULL, -- Regex pattern to match
    
    -- Action
    action TEXT NOT NULL CHECK (action IN ('allow', 'block', 'rate_limit', 'serve_llms_txt')),
    
    -- Purpose classification
    bot_purpose TEXT CHECK (bot_purpose IN ('training', 'search', 'preview', 'unknown')) DEFAULT 'unknown',
    
    -- Optional rate limiting
    rate_limit_rpm INTEGER, -- Requests per minute
    
    -- Priority (lower = higher priority)
    priority INTEGER DEFAULT 100,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_firewall_tenant ON public.ai_firewall_rules(tenant_id);

-- Default AI firewall rules (applied to all tenants)
INSERT INTO public.ai_firewall_rules (tenant_id, bot_name, user_agent_pattern, action, bot_purpose, priority)
SELECT 
    t.id,
    bot.name,
    bot.pattern,
    bot.action,
    bot.purpose,
    bot.priority
FROM public.tenants t
CROSS JOIN (VALUES
    ('GPTBot', 'GPTBot', 'block', 'training', 10),
    ('ChatGPT-User', 'ChatGPT-User', 'allow', 'search', 20),
    ('OAI-SearchBot', 'OAI-SearchBot', 'allow', 'search', 20),
    ('ClaudeBot', 'ClaudeBot', 'block', 'training', 10),
    ('Claude-Web', 'Claude-Web', 'allow', 'search', 20),
    ('PerplexityBot', 'PerplexityBot', 'allow', 'search', 20),
    ('Google-Extended', 'Google-Extended', 'block', 'training', 10),
    ('Googlebot', 'Googlebot', 'allow', 'search', 5),
    ('Bingbot', 'bingbot', 'allow', 'search', 5)
) AS bot(name, pattern, action, purpose, priority)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- EDGE INJECTION CONFIG: What to inject per domain
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.edge_injection_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
    
    -- Injection targets (URL patterns)
    url_pattern TEXT NOT NULL DEFAULT '/*', -- Glob pattern
    
    -- What to inject
    inject_jsonld BOOLEAN DEFAULT true,
    inject_meta_tags BOOLEAN DEFAULT true,
    inject_llms_txt_link BOOLEAN DEFAULT true, -- Adds <link rel="alternate" type="text/markdown">
    
    -- Entity to use for this URL pattern
    entity_id UUID REFERENCES public.entities(id) ON DELETE SET NULL,
    
    -- Cache settings
    cache_ttl_seconds INTEGER DEFAULT 3600,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_injection_domain ON public.edge_injection_config(domain_id);

-- =============================================================================
-- ACTION SCHEMAS: SearchAction, OrderAction, ReserveAction
-- Schema.org actions for AI agents to execute
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.action_schemas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
    
    -- Action type
    action_type TEXT NOT NULL CHECK (action_type IN (
        'SearchAction', 'OrderAction', 'ReserveAction', 
        'SubscribeAction', 'RegisterAction', 'TradeAction'
    )),
    
    -- Target URL template
    target_url_template TEXT NOT NULL, -- e.g., "https://mgi.com/search?q={query}"
    
    -- Input parameters (JSON array of parameter definitions)
    -- [{"name": "query", "required": true, "description": "Search term"}]
    input_parameters JSONB DEFAULT '[]'::jsonb,
    
    -- Human-readable description
    description TEXT,
    
    -- Action-specific properties
    properties JSONB DEFAULT '{}'::jsonb,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_actions_entity ON public.action_schemas(entity_id);

-- =============================================================================
-- ADD tenant_id TO EXISTING TABLES
-- =============================================================================

-- Projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
CREATE INDEX IF NOT EXISTS idx_projects_tenant ON public.projects(tenant_id);

-- Entities
ALTER TABLE public.entities ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
CREATE INDEX IF NOT EXISTS idx_entities_tenant ON public.entities(tenant_id);

-- Authors
ALTER TABLE public.authors ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
CREATE INDEX IF NOT EXISTS idx_authors_tenant ON public.authors(tenant_id);

-- Content Clusters
ALTER TABLE public.content_clusters ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
CREATE INDEX IF NOT EXISTS idx_clusters_tenant ON public.content_clusters(tenant_id);

-- Claims
ALTER TABLE public.claims ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
CREATE INDEX IF NOT EXISTS idx_claims_tenant ON public.claims(tenant_id);

-- FAQ Vectors
ALTER TABLE public.faq_vectors ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
CREATE INDEX IF NOT EXISTS idx_faqs_tenant ON public.faq_vectors(tenant_id);

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Helper function to get current tenant
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant', true), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- RLS for tenants (users can only see their own tenant)
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON public.tenants
    USING (id = current_tenant_id());

-- RLS for domains
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY domain_isolation ON public.domains
    USING (tenant_id = current_tenant_id());

-- RLS for projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS project_isolation ON public.projects;
CREATE POLICY project_isolation ON public.projects
    USING (tenant_id = current_tenant_id() OR tenant_id IS NULL);

-- RLS for entities
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY entity_isolation ON public.entities
    USING (tenant_id = current_tenant_id() OR tenant_id IS NULL);

-- RLS for claims
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY claim_isolation ON public.claims
    USING (tenant_id = current_tenant_id() OR tenant_id IS NULL);

-- RLS for firewall rules
ALTER TABLE public.ai_firewall_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY firewall_isolation ON public.ai_firewall_rules
    USING (tenant_id = current_tenant_id());

-- =============================================================================
-- FUNCTIONS FOR TENANT CONTEXT
-- =============================================================================

-- Set current tenant (call this at the start of each request)
CREATE OR REPLACE FUNCTION set_current_tenant(p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_tenant', p_tenant_id::TEXT, false);
END;
$$ LANGUAGE plpgsql;

-- Resolve tenant from domain (for edge workers)
CREATE OR REPLACE FUNCTION resolve_tenant_from_domain(p_domain TEXT)
RETURNS TABLE(
    tenant_id UUID,
    tenant_slug TEXT,
    plan TEXT,
    features JSONB,
    domain_id UUID,
    indexnow_key TEXT,
    edge_enabled BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id AS tenant_id,
        t.slug AS tenant_slug,
        t.plan,
        t.features,
        d.id AS domain_id,
        d.indexnow_key,
        d.edge_enabled
    FROM public.domains d
    JOIN public.tenants t ON d.tenant_id = t.id
    WHERE d.domain = p_domain 
      AND d.is_verified = true;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get full injection payload for a domain (used by edge workers)
CREATE OR REPLACE FUNCTION get_edge_injection_payload(p_domain TEXT, p_path TEXT)
RETURNS JSONB AS $$
DECLARE
    v_tenant_id UUID;
    v_domain_id UUID;
    v_entity_id UUID;
    v_jsonld JSONB;
    v_llms_txt TEXT;
BEGIN
    -- Resolve domain
    SELECT d.tenant_id, d.id INTO v_tenant_id, v_domain_id
    FROM public.domains d
    WHERE d.domain = p_domain AND d.is_verified = true;
    
    IF v_tenant_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Domain not found or not verified');
    END IF;
    
    -- Find matching injection config
    SELECT eic.entity_id INTO v_entity_id
    FROM public.edge_injection_config eic
    WHERE eic.domain_id = v_domain_id 
      AND eic.is_active = true
      AND p_path LIKE REPLACE(REPLACE(eic.url_pattern, '*', '%'), '?', '_')
    ORDER BY LENGTH(eic.url_pattern) DESC
    LIMIT 1;
    
    -- Get JSON-LD for entity (or primary entity if not specified)
    IF v_entity_id IS NULL THEN
        SELECT id INTO v_entity_id
        FROM public.entities
        WHERE tenant_id = v_tenant_id AND is_primary = true
        LIMIT 1;
    END IF;
    
    IF v_entity_id IS NOT NULL THEN
        SELECT generate_entity_jsonld(e.slug) INTO v_jsonld
        FROM public.entities e WHERE e.id = v_entity_id;
    END IF;
    
    -- Get llms.txt
    SELECT generate_llms_txt() INTO v_llms_txt;
    
    RETURN jsonb_build_object(
        'tenant_id', v_tenant_id,
        'domain_id', v_domain_id,
        'jsonld', v_jsonld,
        'llms_txt', v_llms_txt
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- TRIGGER: Auto-update timestamps
-- =============================================================================
DROP TRIGGER IF EXISTS trigger_tenants_updated ON public.tenants;
CREATE TRIGGER trigger_tenants_updated
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_content_timestamp();

DROP TRIGGER IF EXISTS trigger_domains_updated ON public.domains;
CREATE TRIGGER trigger_domains_updated
    BEFORE UPDATE ON public.domains
    FOR EACH ROW
    EXECUTE FUNCTION update_content_timestamp();
