import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

import { logger } from '../core/logger';
import { handleHttpException, UnauthorizedException } from '../exceptions/http';
import { generateToken } from '../middlewares/auth';
import { getProfileService } from '../services/profile.service';

const profileService = getProfileService();

export class AuthController {
    static async login(c: Context) {
        try {
            const body = await c.req.json();
            const { email, password } = body;

            const profile = await profileService.validateCredentials(email, password);
            if (!profile) {
                throw new UnauthorizedException('Invalid credentials');
            }

            const token = await generateToken({
                id: profile.id,
                email: profile.email || undefined,
                role: profile.role || undefined,
            });

            logger.info('User logged in', { email: profile.email });

            return c.json({
                token,
                user: {
                    id: profile.id,
                    email: profile.email,
                    role: profile.role,
                    display_name: profile.display_name,
                    plan: profile.plan,
                },
            });
        } catch (error) {
            logger.error('Login failed', { error: (error as Error).message });
            return handleHttpException(c, error);
        }
    }

    static async register(c: Context) {
        try {
            const body = await c.req.json();
            const { email, password, name } = body;

            const profile = await profileService.create({
                email,
                password,
                display_name: name,
            });

            const token = await generateToken({
                id: profile.id,
                email: profile.email || undefined,
                role: profile.role || undefined,
            });

            logger.info('User registered', { email: profile.email });

            return c.json(
                {
                    token,
                    user: {
                        id: profile.id,
                        email: profile.email,
                        role: profile.role,
                        display_name: profile.display_name,
                        plan: profile.plan,
                    },
                },
                201,
            );
        } catch (error) {
            logger.error('Registration failed', { error: (error as Error).message });
            return handleHttpException(c, error);
        }
    }

    static async me(c: Context) {
        try {
            const user = c.get('user');

            if (!user) {
                throw new HTTPException(401, { message: 'Unauthorized' });
            }

            const profile = await profileService.findById(user.id);

            return c.json({
                user: {
                    id: profile.id,
                    email: profile.email,
                    display_name: profile.display_name,
                    role: profile.role,
                    plan: profile.plan,
                    daily_quota: profile.daily_quota,
                    created_at: profile.created_at,
                },
            });
        } catch (error) {
            logger.error('Failed to get user profile', { error: (error as Error).message });
            return handleHttpException(c, error);
        }
    }
}
