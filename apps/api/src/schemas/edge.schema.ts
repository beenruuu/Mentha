import { z } from 'zod';

export const verifyDomainSchema = z.object({
    tenant_id: z.string(),
    domain: z.string(),
});

export const checkVerificationSchema = z.object({
    domain: z.string(),
});

export type VerifyDomainInput = z.infer<typeof verifyDomainSchema>;
export type CheckVerificationInput = z.infer<typeof checkVerificationSchema>;
