import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { db, domains, aiFirewallRules } from '../infrastructure/database/index';
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

        try {
            const result = await db.execute(
                sql`SELECT * FROM resolve_tenant_from_domain(${domain})`
            );

            if (!result || result.length === 0) {
                return c.json({ error: 'Tenant not found for domain' }, 404);
            }

            return c.json({ data: result[0] });
        } catch (error) {
            logger.error('Failed to resolve tenant', { error: (error as Error).message });
            return c.json({ error: 'Failed to resolve tenant' }, 500);
        }
    })
    .get('/injection-payload', async (c) => {
        const domain = c.req.query('domain');
        const path = c.req.query('path');

        if (!domain) {
            return c.json({ error: 'domain parameter required' }, 400);
        }

        try {
            const result = await db.execute(
                sql`SELECT * FROM get_edge_injection_payload(${domain}, ${path || '/'})`
            );

            if (!result || result.length === 0) {
                return c.json({ error: 'No injection payload found' }, 404);
            }

            return c.json({ data: result[0] });
        } catch (error) {
            logger.error('Failed to get injection payload', { error: (error as Error).message });
            return c.json({ error: 'Failed to get injection payload' }, 500);
        }
    })
    .get('/firewall-rules', async (c) => {
        const tenant_id = c.req.query('tenant_id');

        if (!tenant_id) {
            return c.json({ error: 'tenant_id parameter required' }, 400);
        }

        try {
            const rules = await db
                .select()
                .from(aiFirewallRules)
                .where(
                    and(
                        eq(aiFirewallRules.tenant_id, tenant_id),
                        eq(aiFirewallRules.is_active, true)
                    )
                );

            return c.json({ data: rules });
        } catch (error) {
            logger.error('Failed to get firewall rules', { error: (error as Error).message });
            return c.json({ error: 'Failed to get firewall rules' }, 500);
        }
    })
    .post('/verify-domain', zValidator('json', VerifyDomainSchema), async (c) => {
        const { tenant_id, domain: domainName } = c.req.valid('json');

        try {
            const existing = await db
                .select({
                    id: domains.id,
                    is_verified: domains.is_verified,
                })
                .from(domains)
                .where(eq(domains.domain, domainName))
                .limit(1);

            if (existing.length > 0) {
                return c.json({
                    message: 'Domain already exists',
                    verified: existing[0]!.is_verified,
                });
            }

            const verificationToken = crypto.randomUUID();

            const result = await db
                .insert(domains)
                .values({
                    tenant_id,
                    domain: domainName,
                    verification_token: verificationToken,
                    verification_method: 'dns_txt',
                    is_verified: false,
                })
                .returning({
                    id: domains.id,
                    verification_token: domains.verification_token,
                });

            return c.json({
                message: 'Domain verification initiated',
                domain_id: result[0]!.id,
                verification_token: result[0]!.verification_token,
            });
        } catch (error) {
            logger.error('Failed to verify domain', { error: (error as Error).message });
            return c.json({ error: 'Failed to verify domain' }, 500);
        }
    })
    .post('/check-verification', zValidator('json', CheckVerificationSchema), async (c) => {
        const { domain: domainName } = c.req.valid('json');

        try {
            const domainData = await db
                .select({
                    id: domains.id,
                    verification_token: domains.verification_token,
                })
                .from(domains)
                .where(eq(domains.domain, domainName))
                .limit(1);

            if (domainData.length === 0) {
                return c.json({ error: 'Domain not found' }, 404);
            }

            const verificationToken = domainData[0]!.verification_token;
            let verified = false;

            try {
                const txtRecords = await fetch(`https://dns.google/resolve?name=_mentha-verify.${domainName}&type=TXT`)
                    .then(res => res.json() as Promise<{ Answer?: Array<{ data: string }> }>);

                if (txtRecords.Answer) {
                    verified = txtRecords.Answer.some(record =>
                        record.data.includes(verificationToken)
                    );
                }
            } catch (dnsError) {
                logger.warn('DNS verification check failed', { error: (dnsError as Error).message });
            }

            if (verified) {
                await db
                    .update(domains)
                    .set({
                        is_verified: true,
                        verified_at: new Date(),
                    })
                    .where(eq(domains.id, domainData[0]!.id));

                return c.json({
                    verified: true,
                    message: 'Domain successfully verified',
                });
            }

            return c.json({
                verified: false,
                message: 'Domain not yet verified',
                verification_token: verificationToken,
            });
        } catch (error) {
            logger.error('Failed to check verification', { error: (error as Error).message });
            return c.json({ error: 'Failed to check verification' }, 500);
        }
    });

export default app;
export type EdgeAppType = typeof app;
