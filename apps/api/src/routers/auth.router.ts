import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { AuthController } from '../controllers/auth.controller';
import { loginSchema, registerSchema } from '../schemas/auth.schema';
import { requireAuth, attachUser } from '../middlewares/auth';
import { createAuthRateLimiter } from '../core/rate-limit';

const router = new Hono()
    .post('/login', createAuthRateLimiter(5), zValidator('json', loginSchema), AuthController.login)
    .post('/register', createAuthRateLimiter(3), zValidator('json', registerSchema), AuthController.register)
    .get('/me', requireAuth, attachUser, AuthController.me);

export default router;
