import { Router, Request, Response } from 'express';
import { createSupabaseAdmin } from '../infrastructure/database/index';
import { logger } from '../infrastructure/logging/index';

const router = Router();

/**
 * Edge Worker API endpoints
 * These are called by Cloudflare Workers to resolve tenants and get injection payloads
 */

/**
 * GET /api/v1/edge/resolve-tenant
 * Resolves tenant configuration from domain
 * Called by Edge Worker on every request
 */
router.get('/resolve-tenant', async (req: Request, res: Response) => {
    const { domain } = req.query;

    if (!domain || typeof domain !== 'string') {
        res.status(400).json({ error: 'domain parameter required' });
        return;
    }

    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase.rpc('resolve_tenant_from_domain', {
        p_domain: domain,
    });

    if (error || !data || data.length === 0) {
        res.status(404).json({ error: 'Domain not found or not verified' });
        return;
    }

    res.json({ data: data[0] });
});

/**
 * GET /api/v1/edge/injection-payload
 * Gets the full JSON-LD and llms.txt payload for a URL
 * Called by Edge Worker to inject into HTML
 */
router.get('/injection-payload', async (req: Request, res: Response) => {
    const { domain, path } = req.query;

    if (!domain || typeof domain !== 'string') {
        res.status(400).json({ error: 'domain parameter required' });
        return;
    }

    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase.rpc('get_edge_injection_payload', {
        p_domain: domain,
        p_path: (path as string) || '/',
    });

    if (error) {
        logger.error('Failed to get injection payload', { error: error.message });
        res.status(500).json({ error: 'Failed to get injection payload' });
        return;
    }

    res.json({ data });
});

/**
 * GET /api/v1/edge/firewall-rules
 * Gets AI firewall rules for a tenant
 */
router.get('/firewall-rules', async (req: Request, res: Response) => {
    const { tenant_id } = req.query;

    if (!tenant_id || typeof tenant_id !== 'string') {
        res.status(400).json({ error: 'tenant_id parameter required' });
        return;
    }

    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase
        .from('ai_firewall_rules')
        .select('bot_name, user_agent_pattern, action, priority')
        .eq('tenant_id', tenant_id)
        .eq('is_active', true)
        .order('priority', { ascending: true });

    if (error) {
        res.status(500).json({ error: 'Failed to get firewall rules' });
        return;
    }

    res.json({ data: data ?? [] });
});

/**
 * POST /api/v1/edge/verify-domain
 * Initiates domain verification (DNS challenge)
 */
router.post('/verify-domain', async (req: Request, res: Response) => {
    const { tenant_id, domain } = req.body;

    if (!tenant_id || !domain) {
        res.status(400).json({ error: 'tenant_id and domain required' });
        return;
    }

    const supabase = createSupabaseAdmin();

    // Check if domain already exists
    const { data: existing } = await supabase
        .from('domains')
        .select('id, is_verified')
        .eq('domain', domain)
        .single();

    if (existing) {
        res.status(409).json({ error: 'Domain already registered' });
        return;
    }

    // Create domain with verification token
    const { data, error } = await supabase
        .from('domains')
        .insert({
            tenant_id,
            domain,
            verification_method: 'dns_txt',
        })
        .select('verification_token')
        .single();

    if (error) {
        res.status(500).json({ error: 'Failed to create domain' });
        return;
    }

    res.status(201).json({
        message: 'Domain created. Add DNS TXT record to verify.',
        instructions: {
            record_type: 'TXT',
            record_name: `_mentha-challenge.${domain}`,
            record_value: data.verification_token,
        },
    });
});

/**
 * POST /api/v1/edge/check-verification
 * Checks if DNS verification is complete
 */
router.post('/check-verification', async (req: Request, res: Response) => {
    const { domain } = req.body;

    if (!domain) {
        res.status(400).json({ error: 'domain required' });
        return;
    }

    const supabase = createSupabaseAdmin();

    // Get expected token
    const { data: domainData } = await supabase
        .from('domains')
        .select('id, verification_token')
        .eq('domain', domain)
        .single();

    if (!domainData) {
        res.status(404).json({ error: 'Domain not found' });
        return;
    }

    // Check DNS (using public DoH resolver)
    try {
        const dnsResponse = await fetch(
            `https://cloudflare-dns.com/dns-query?name=_mentha-challenge.${domain}&type=TXT`,
            { headers: { Accept: 'application/dns-json' } }
        );

        const dnsData = (await dnsResponse.json()) as { Answer?: Array<{ data: string }> };
        const txtRecords = dnsData.Answer?.map((a) => a.data.replace(/"/g, '')) ?? [];

        if (txtRecords.includes(domainData.verification_token)) {
            // Mark as verified
            await supabase
                .from('domains')
                .update({ is_verified: true, verified_at: new Date().toISOString() })
                .eq('id', domainData.id);

            res.json({ verified: true, message: 'Domain verified successfully!' });
        } else {
            res.json({
                verified: false,
                message: 'DNS record not found. Please wait for DNS propagation (up to 24h).',
            });
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to check DNS' });
    }
});

export { router as edgeRouter };
