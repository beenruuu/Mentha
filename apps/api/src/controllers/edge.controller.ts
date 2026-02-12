import type { Context } from 'hono';

import { logger } from '../core/logger';
import { BadRequestException, handleHttpException } from '../exceptions/http';
import { getDomainService } from '../services/domain.service';

const domainService = getDomainService();

export class EdgeController {
    static async resolveTenant(c: Context) {
        const domain = c.req.query('domain');

        if (!domain) {
            throw new BadRequestException('domain parameter required');
        }

        try {
            const tenantData = await domainService.resolveTenantFromDomain(domain);
            return c.json({ data: tenantData });
        } catch (error) {
            logger.error('Failed to resolve tenant', { error: (error as Error).message });
            return handleHttpException(c, error);
        }
    }

    static async getInjectionPayload(c: Context) {
        const domain = c.req.query('domain');
        const path = c.req.query('path');

        if (!domain) {
            throw new BadRequestException('domain parameter required');
        }

        try {
            const payload = await domainService.getInjectionPayload(domain, path || '/');
            return c.json({ data: payload });
        } catch (error) {
            logger.error('Failed to get injection payload', { error: (error as Error).message });
            return handleHttpException(c, error);
        }
    }

    static async getFirewallRules(c: Context) {
        const tenant_id = c.req.query('tenant_id');

        if (!tenant_id) {
            throw new BadRequestException('tenant_id parameter required');
        }

        try {
            const rules = await domainService.getFirewallRules(tenant_id);
            return c.json({ data: rules });
        } catch (error) {
            logger.error('Failed to get firewall rules', { error: (error as Error).message });
            return handleHttpException(c, error);
        }
    }

    static async verifyDomain(c: Context) {
        const body = await c.req.json();
        const { tenant_id, domain: domainName } = body;

        try {
            const verificationToken = crypto.randomUUID();

            const domain = await domainService.create({
                tenant_id,
                domain: domainName,
                verification_token: verificationToken,
                verification_method: 'dns_txt',
                is_verified: false,
            });

            return c.json({
                message: 'Domain verification initiated',
                domain_id: domain.id,
                verification_token: domain.verification_token,
            });
        } catch (error) {
            logger.error('Failed to verify domain', { error: (error as Error).message });
            return handleHttpException(c, error);
        }
    }

    static async checkVerification(c: Context) {
        const body = await c.req.json();
        const { domain: domainName } = body;

        try {
            const status = await domainService.checkVerification(domainName);

            if (status.is_verified) {
                return c.json({
                    verified: true,
                    message: 'Domain successfully verified',
                    verified_at: status.verified_at,
                });
            }

            return c.json({
                verified: false,
                message: 'Domain not yet verified',
            });
        } catch (error) {
            logger.error('Failed to check verification', { error: (error as Error).message });
            return handleHttpException(c, error);
        }
    }
}
