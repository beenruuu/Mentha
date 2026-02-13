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
    async resolveTenantFromDomain(domain: string): Promise<TenantData> {
        logger.debug('Resolving tenant from domain', { domain });

        const result = await db.execute(sql`SELECT * FROM resolve_tenant_from_domain(${domain})`);

        if (!result || result.length === 0) {
            throw new NotFoundException('Tenant not found for domain');
        }

        return result[0] as unknown as TenantData;
    }

    async getInjectionPayload(domain: string, path?: string): Promise<InjectionPayload> {
        logger.debug('Getting injection payload', { domain, path });

        const result = await db.execute(
            sql`SELECT * FROM get_injection_payload(${domain}, ${path || '/*'})`,
        );

        if (!result || result.length === 0) {
            throw new NotFoundException('No injection payload found');
        }

        return result[0] as unknown as InjectionPayload;
    }

    async getFirewallRules(tenantId: string): Promise<AiFirewallRule[]> {
        logger.debug('Getting firewall rules', { tenantId });

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
        logger.info('Verifying domain', { tenantId, domain });

        const domainData = await db
            .select()
            .from(domains)
            .where(and(eq(domains.tenant_id, tenantId), eq(domains.domain, domain)))
            .limit(1);

        if (domainData.length === 0) {
            throw new NotFoundException('Domain not found');
        }

        const domainRecord = domainData[0]!;
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

            logger.info('Domain verified successfully', { domain, method });
        }

        return {
            success: verified,
            method: method || 'unknown',
            verified,
            message: verified ? 'Domain verified successfully' : 'Verification failed',
        };
    }

    async checkVerification(domain: string): Promise<VerificationStatus> {
        logger.debug('Checking verification status', { domain });

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

        return domainData[0]!;
    }

    async create(data: InsertDomain): Promise<Domain> {
        logger.info('Creating domain', { domain: data.domain, tenantId: data.tenant_id });

        const result = await db.insert(domains).values(data).returning();

        if (!result[0]) {
            throw new Error('Failed to create domain');
        }

        logger.info('Domain created successfully', { domainId: result[0].id });
        return result[0];
    }

    async delete(domainId: string): Promise<void> {
        logger.info('Deleting domain', { domainId });

        const result = await db.delete(domains).where(eq(domains.id, domainId)).returning();

        if (result.length === 0) {
            throw new NotFoundException('Domain not found');
        }

        logger.info('Domain deleted successfully', { domainId });
    }

    private async verifyDnsTxt(domain: string, token: string): Promise<boolean> {
        try {
            const txtRecord = `mentha-verification=${token}`;
            logger.debug('Checking DNS TXT record', { domain, expectedRecord: txtRecord });
            return false;
        } catch (error) {
            logger.error('DNS verification failed', { error: (error as Error).message });
            return false;
        }
    }

    private async verifyMetaTag(domain: string, token: string): Promise<boolean> {
        try {
            const response = await fetch(`https://${domain}`);
            const html = await response.text();
            const metaTag = `<meta name="mentha-verification" content="${token}">`;
            return html.includes(metaTag);
        } catch (error) {
            logger.error('Meta tag verification failed', { error: (error as Error).message });
            return false;
        }
    }

    private async verifyFile(domain: string, token: string): Promise<boolean> {
        try {
            const response = await fetch(`https://${domain}/mentha-verification.txt`);
            const content = await response.text();
            return content.trim() === token;
        } catch (error) {
            logger.error('File verification failed', { error: (error as Error).message });
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
