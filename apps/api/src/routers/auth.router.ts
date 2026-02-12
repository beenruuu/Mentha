import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { AuthController } from '../controllers/auth.controller';
import { createAuthRateLimiter } from '../core/rate-limit';
import { attachUser, requireAuth } from '../middlewares/auth';
import { loginSchema, registerSchema } from '../schemas/auth.schema';

const router = new Hono()
    .post('/login', createAuthRateLimiter(5), zValidator('json', loginSchema), AuthController.login)
    .post(
        '/register',
        createAuthRateLimiter(3),
        zValidator('json', registerSchema),
        AuthController.register,
    )
    .get('/me', requireAuth, attachUser, AuthController.me);

export default router;
