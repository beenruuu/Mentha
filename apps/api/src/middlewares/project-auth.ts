import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';

import { logger } from '../core/logger';
import { getProjectService } from '../services/project.service';

/**
 * Middleware to ensure the authenticated user owns the requested project.
 * It extracts the project ID from params or body, verifies ownership in DB,
 * and sets the projectId in context.
 *
 * @param projectIdField The field name in params/body containing the project ID (default: 'projectId')
 */
export const requireProjectAccess = (projectIdField = 'projectId') => {
    return createMiddleware<{ Variables: { user: any; projectId: string } }>(
        async (c, next) => {
            const user = c.get('user');

            if (!user) {
                throw new HTTPException(401, { message: 'Unauthorized' });
            }

            // Extract projectId from params first, then query, then body
            let projectId = c.req.param(projectIdField);

            if (!projectId) {
                projectId = c.req.query(projectIdField) || c.req.query('project_id');
            }

            if (!projectId) {
                try {
                    const body = await c.req.json().catch(() => ({}));
                    projectId = body[projectIdField] || body['project_id'];
                } catch {
                    // Ignore body parsing errors
                }
            }

            if (!projectId) {
                throw new HTTPException(400, { message: 'Project ID is required' });
            }

            // Verify user owns this project
            const projectService = getProjectService();

            try {
                const project = await projectService.getById(projectId);

                // Check if user owns the project
                if (project.user_id !== user.id) {
                    logger.warn(
                        {
                            userId: user.id,
                            projectId,
                            ownerId: project.user_id,
                        },
                        'User attempted unauthorized project access',
                    );
                    throw new HTTPException(403, { message: 'Access denied to this project' });
                }

                // Set projectId in context for downstream handlers
                c.set('projectId', projectId);
            } catch (error) {
                if (error instanceof HTTPException) {
                    throw error;
                }
                logger.error(
                    {
                        error: (error as Error).message,
                        projectId,
                    },
                    'Error checking project access',
                );
                throw new HTTPException(500, { message: 'Internal server error' });
            }

            await next();
        },
    );
};

/**
 * Lighter version that just extracts projectId without verifying access
 * Use when you want to validate later
 */
export const extractProjectId = (projectIdField = 'projectId') => {
    return createMiddleware<{ Variables: { projectId?: string } }>(async (c, next) => {
        let projectId = c.req.param(projectIdField);

        if (!projectId) {
            try {
                 const body = await c.req.json().catch(() => ({}));
                 projectId = body[projectIdField];
            } catch {
                 // Ignore
            }
        }

        if (projectId) {
            c.set('projectId', projectId);
        }

        await next();
    });
};