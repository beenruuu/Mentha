import type { Context } from 'hono';

import { logger } from '../core/logger';
import { handleHttpException } from '../exceptions/http';
import { getProjectService } from '../services/project.service';

const projectService = getProjectService();

export const ProjectController = {
    list: async (c: Context) => {
        try {
            const user = c.get('user');
            const data = await projectService.list({ userId: user?.id });
            return c.json({
                data,
                pagination: { total: data.length, page: 1, limit: 20 },
            });
        } catch (error) {
            logger.error('Failed to list projects', {
                error: (error as Error).message,
            });
            return handleHttpException(c, error);
        }
    },

    create: async (c: Context) => {
        const body = await c.req.json();
        const { name, domain, competitors, description } = body;
        const user = c.get('user');

        try {
            const project = await projectService.create({
                name,
                domain,
                competitors,
                description,
                user_id: user.id,
            });

            return c.json({ data: project }, 201);
        } catch (error) {
            logger.error('Failed to create project', {
                error: (error as Error).message,
            });
            return handleHttpException(c, error);
        }
    },

    getById: async (c: Context) => {
        const id = c.req.param('id');

        try {
            const project = await projectService.getById(id);
            return c.json({ data: project });
        } catch (error) {
            logger.error('Failed to get project', {
                error: (error as Error).message,
            });
            return handleHttpException(c, error);
        }
    },

    update: async (c: Context) => {
        const id = c.req.param('id');
        const updates = await c.req.json();

        try {
            const project = await projectService.update(id, updates);
            return c.json({ data: project });
        } catch (error) {
            logger.error('Failed to update project', {
                error: (error as Error).message,
            });
            return handleHttpException(c, error);
        }
    },

    delete: async (c: Context) => {
        const id = c.req.param('id');

        try {
            await projectService.delete(id);
            return c.body(null, 204);
        } catch (error) {
            logger.error('Failed to delete project', {
                error: (error as Error).message,
            });
            return handleHttpException(c, error);
        }
    },
} as const;
