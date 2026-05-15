import { and, eq, sql } from 'drizzle-orm';

import { logger } from '../core/logger';
import { db } from '../db';
import { aiFirewallRules, domains } from '../db/schema/tenants';
import type { AiFirewallRule, Domain, InsertDomain } from '../db/types';
import { NotFoundException } from '../exceptions/http';

export interface TenantData {
    tenant_id: string;
    tenant_name: string;
    domain: string;
    is_verified: boolean;
}

export interface InjectionPayload {
    domain: string;
    tenant_id: string;
    jsonld?: object;
    meta_tags?: object;
    llms_txt_url?: string;
}

export interface VerificationResult {
    success: boolean;
    method: string;
    verified: boolean;
    message: string;
}

export interface VerificationStatus {
    domain: string;
    is_verified: boolean | null;
    verification_method: string | null;
    verified_at: Date | null;
}

export class DomainService {
    private validateDomain(domain: string): string {
        if (!domain || typeof domain !== 'string' || domain.length === 0) {
            throw new Error('Invalid domain: empty or non-string');
        }
        if (domain.length > 255) {
            throw new Error('Invalid domain: exceeds max length');
        }
        if (!/^[a-zA-Z0-9.-]+$/.test(domain)) {
            throw new Error('Invalid domain: contains invalid characters');
        }
        return domain;
    }

    private validatePath(path: string): string {
        if (!path || typeof path !== 'string') {
            return '/*';
        }
        if (path.length > 1000) {
            throw new Error('Invalid path: exceeds max length');
        }
        if (!/^[a-zA-Z0-9._\-/*]+$/.test(path)) {
            throw new Error('Invalid path: contains invalid characters');
        }
        return path;
    }

    async resolveTenantFromDomain(domain: string): Promise<TenantData> {
        const validatedDomain = this.validateDomain(domain);
        logger.debug({ domain: validatedDomain }, 'Resolving tenant from domain');

        try {
            const result = await db.execute(
                sql`SELECT * FROM resolve_tenant_from_domain(${validatedDomain})`,
            );
            const rows = result as unknown as Record<string, unknown>[];
            if (!rows || rows.length === 0) {
                throw new NotFoundException('Tenant not found for domain');
            }
            return rows[0] as unknown as TenantData;
        } catch (error) {
            logger.error(
                { domain: validatedDomain, error: (error as Error).message },
                'Failed to resolve tenant',
            );
            throw error;
        }
    }

    async getInjectionPayload(domain: string, path?: string): Promise<InjectionPayload> {
        const validatedDomain = this.validateDomain(domain);
        const validatedPath = this.validatePath(path || '/*');
        logger.debug({ domain: validatedDomain, path: validatedPath }, 'Getting injection payload');

        try {
            const result = await db.execute(
                sql`SELECT * FROM get_injection_payload(${validatedDomain}, ${validatedPath})`,
            );
            const rows = result as unknown as Record<string, unknown>[];
            if (!rows || rows.length === 0) {
                throw new NotFoundException('No injection payload found');
            }
            return rows[0] as unknown as InjectionPayload;
        } catch (error) {
            logger.error(
                { domain: validatedDomain, path: validatedPath, error: (error as Error).message },
                'Failed to get injection payload',
            );
            throw error;
        }
    }

    async getFirewallRules(tenantId: string): Promise<AiFirewallRule[]> {
        logger.debug({ tenantId }, 'Getting firewall rules');

        const rules = await db
            .select()
            .from(aiFirewallRules)
            .where(
                and(eq(aiFirewallRules.tenant_id, tenantId), eq(aiFirewallRules.is_active, true)),
            )
            .orderBy(aiFirewallRules.priority);

        return rules;
    }

    async verifyDomain(tenantId: string, domain: string): Promise<VerificationResult> {
        logger.info({ tenantId, domain }, 'Verifying domain');

        const domainData = await db
            .select()
            .from(domains)
            .where(and(eq(domains.tenant_id, tenantId), eq(domains.domain, domain)))
            .limit(1);

        if (domainData.length === 0) {
            throw new NotFoundException('Domain not found');
        }

        const domainRecord = domainData[0];
        if (!domainRecord) {
            throw new NotFoundException('Domain not found');
        }
        const verificationToken = domainRecord.verification_token;
        const method = domainRecord.verification_method;

        let verified = false;

        if (method === 'dns_txt') {
            verified = await this.verifyDnsTxt(domain, verificationToken);
        } else if (method === 'meta_tag') {
            verified = await this.verifyMetaTag(domain, verificationToken);
        } else if (method === 'file') {
            verified = await this.verifyFile(domain, verificationToken);
        }

        if (verified) {
            await db
                .update(domains)
                .set({
                    is_verified: true,
                    verified_at: new Date(),
                    updated_at: new Date(),
                })
                .where(eq(domains.id, domainRecord.id));

            logger.info({ domain, method }, 'Domain verified successfully');
        }

        return {
            success: verified,
            method: method || 'unknown',
            verified,
            message: verified ? 'Domain verified successfully' : 'Verification failed',
        };
    }

    async checkVerification(domain: string): Promise<VerificationStatus> {
        logger.debug({ domain }, 'Checking verification status');

        const domainData = await db
            .select({
                domain: domains.domain,
                is_verified: domains.is_verified,
                verification_method: domains.verification_method,
                verified_at: domains.verified_at,
            })
            .from(domains)
            .where(eq(domains.domain, domain))
            .limit(1);

        if (domainData.length === 0) {
            throw new NotFoundException('Domain not found');
        }

        const domainRecord = domainData[0];
        if (!domainRecord) {
            throw new NotFoundException('Domain not found');
        }
        return domainRecord;
    }

    async create(data: InsertDomain): Promise<Domain> {
        logger.info({ domain: data.domain, tenantId: data.tenant_id }, 'Creating domain');

        const result = await db.insert(domains).values(data).returning();

        if (!result[0]) {
            throw new Error('Failed to create domain');
        }

        logger.info({ domainId: result[0].id }, 'Domain created successfully');
        return result[0];
    }

    async delete(domainId: string): Promise<void> {
        logger.info({ domainId }, 'Deleting domain');

        const result = await db.delete(domains).where(eq(domains.id, domainId)).returning();

        if (result.length === 0) {
            throw new NotFoundException('Domain not found');
        }

        logger.info({ domainId }, 'Domain deleted successfully');
    }

    private async verifyDnsTxt(domain: string, token: string): Promise<boolean> {
        try {
            const txtRecord = `mentha-verification=${token}`;
            logger.debug({ domain, expectedRecord: txtRecord }, 'Checking DNS TXT record');

            const dns = await import('node:dns');
            const resolver = new dns.Resolver();

            return new Promise((resolve) => {
                resolver.resolveTxt(domain, (err, records) => {
                    if (err) {
                        logger.warn({ domain, error: err.message }, 'DNS lookup failed');
                        resolve(false);
                        return;
                    }

                    const txtRecords = records.flat().join('');
                    const verified = txtRecords.includes(`mentha-verification=${token}`);

                    if (verified) {
                        logger.info({ domain }, 'DNS TXT verification successful');
                    } else {
                        logger.debug(
                            { domain, expectedRecord: txtRecord },
                            'DNS TXT record not found',
                        );
                    }

                    resolve(verified);
                });
            });
        } catch (error) {
            logger.error({ domain, error: (error as Error).message }, 'DNS verification failed');
            return false;
        }
    }

    private async verifyMetaTag(domain: string, token: string): Promise<boolean> {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

            try {
                const response = await fetch(`https://${domain}`, {
                    signal: controller.signal,
                    headers: { 'User-Agent': 'Mentha-Verifier/1.0' },
                });

                if (!response.ok) {
                    logger.warn({ domain, status: response.status }, 'HTTP request failed');
                    return false;
                }

                const html = await response.text();
                const metaTag = `<meta name="mentha-verification" content="${token}">`;
                const verified = html.includes(metaTag);

                if (verified) {
                    logger.info({ domain }, 'Meta tag verification successful');
                }

                return verified;
            } finally {
                clearTimeout(timeout);
            }
        } catch (error) {
            if ((error as Error).name === 'AbortError') {
                logger.warn({ domain }, 'Meta tag verification timeout');
            } else {
                logger.error(
                    { domain, error: (error as Error).message },
                    'Meta tag verification failed',
                );
            }
            return false;
        }
    }

    private async verifyFile(domain: string, token: string): Promise<boolean> {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

            try {
                const response = await fetch(`https://${domain}/mentha-verification.txt`, {
                    signal: controller.signal,
                    headers: { 'User-Agent': 'Mentha-Verifier/1.0' },
                });

                if (!response.ok) {
                    logger.warn({ domain, status: response.status }, 'HTTP request failed');
                    return false;
                }

                const content = await response.text();
                const verified = content.trim() === token;

                if (verified) {
                    logger.info({ domain }, 'File verification successful');
                }

                return verified;
            } finally {
                clearTimeout(timeout);
            }
        } catch (error) {
            if ((error as Error).name === 'AbortError') {
                logger.warn({ domain }, 'File verification timeout');
            } else {
                logger.error(
                    { domain, error: (error as Error).message },
                    'File verification failed',
                );
            }
            return false;
        }
    }
}

let domainService: DomainService | null = null;

export function getDomainService(): DomainService {
    if (!domainService) {
        domainService = new DomainService();
    }
    return domainService;
}
