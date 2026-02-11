import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createSupabaseAdmin } from '../infrastructure/database/index';
import { logger } from '../infrastructure/logging/index';

const VerifyDomainSchema = z.object({
    tenant_id: z.string(),
    domain: z.string(),
});

const CheckVerificationSchema = z.object({
    domain: z.string(),
});

const app = new Hono()
    .get('/resolve-tenant', async (c) => {
        const domain = c.req.query('domain');

        if (!domain) {
            return c.json({ error: 'domain parameter required' }, 400);
        }

        const supabase = createSupabaseAdmin();

        const { data, error } = await supabase.rpc('resolve_tenant_from_domain', {
            p_domain: domain,
        });

        if (error || !data || data.length === 0) {
            return c.json({ error: 'Domain not found or not verified' }, 404);
        }

        return c.json({ data: data[0] });
    })
    .get('/injection-payload', async (c) => {
        const domain = c.req.query('domain');
        const path = c.req.query('path');

        if (!domain) {
            return c.json({ error: 'domain parameter required' }, 400);
        }

        const supabase = createSupabaseAdmin();

        const { data, error } = await supabase.rpc('get_edge_injection_payload', {
            p_domain: domain,
            p_path: path || '/',
        });

        if (error) {
            logger.error('Failed to get injection payload', { error: error.message });
            return c.json({ error: 'Failed to get injection payload' }, 500);
        }

        return c.json({ data });
    })
    .get('/firewall-rules', async (c) => {
        const tenant_id = c.req.query('tenant_id');

        if (!tenant_id) {
            return c.json({ error: 'tenant_id parameter required' }, 400);
        }

        const supabase = createSupabaseAdmin();

        const { data, error } = await supabase
            .from('ai_firewall_rules')
            .select('bot_name, user_agent_pattern, action, priority')
            .eq('tenant_id', tenant_id)
            .eq('is_active', true)
            .order('priority', { ascending: true });

        if (error) {
            return c.json({ error: 'Failed to get firewall rules' }, 500);
        }

        return c.json({ data: data || [] });
    })
    .post('/verify-domain', zValidator('json', VerifyDomainSchema), async (c) => {
        const { tenant_id, domain } = c.req.valid('json');
        const supabase = createSupabaseAdmin();

        const { data: existing } = await supabase
            .from('domains')
            .select('id, is_verified')
            .eq('domain', domain)
            .single();

        if (existing) {
            return c.json({ error: 'Domain already registered' }, 409);
        }

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
            return c.json({ error: 'Failed to create domain' }, 500);
        }

        return c.json({
            message: 'Domain created. Add DNS TXT record to verify.',
            instructions: {
                record_type: 'TXT',
                record_name: `_mentha-challenge.${domain}`,
                record_value: data.verification_token,
            },
        }, 201);
    })
    .post('/check-verification', zValidator('json', CheckVerificationSchema), async (c) => {
        const { domain } = c.req.valid('json');
        const supabase = createSupabaseAdmin();

        const { data: domainData } = await supabase
            .from('domains')
            .select('id, verification_token')
            .eq('domain', domain)
            .single();

        if (!domainData) {
            return c.json({ error: 'Domain not found' }, 404);
        }

        try {
            const dnsResponse = await fetch(
                `https://cloudflare-dns.com/dns-query?name=_mentha-challenge.${domain}&type=TXT`,
                { headers: { Accept: 'application/dns-json' } }
            );

            const dnsData = (await dnsResponse.json()) as { Answer?: Array<{ data: string }> };
            const txtRecords = dnsData.Answer?.map((a) => a.data.replace(/"/g, '')) || [];

            if (txtRecords.includes(domainData.verification_token)) {
                await supabase
                    .from('domains')
                    .update({ is_verified: true, verified_at: new Date().toISOString() })
                    .eq('id', domainData.id);

                return c.json({ verified: true, message: 'Domain verified successfully!' });
            }

            return c.json({
                verified: false,
                message: 'DNS record not found. Please wait for DNS propagation (up to 24h).',
            });
        } catch {
            return c.json({ error: 'Failed to check DNS' }, 500);
        }
    });

export default app;
export type EdgeAppType = typeof app;
