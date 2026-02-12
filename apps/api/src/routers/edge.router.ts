import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { EdgeController } from '../controllers/edge.controller';
import { verifyDomainSchema, checkVerificationSchema } from '../schemas/edge.schema';

const router = new Hono()
    .get('/resolve-tenant', EdgeController.resolveTenant)
    .get('/injection-payload', EdgeController.getInjectionPayload)
    .get('/firewall-rules', EdgeController.getFirewallRules)
    .post('/verify-domain', zValidator('json', verifyDomainSchema), EdgeController.verifyDomain)
    .post('/check-verification', zValidator('json', checkVerificationSchema), EdgeController.checkVerification);

export default router;
