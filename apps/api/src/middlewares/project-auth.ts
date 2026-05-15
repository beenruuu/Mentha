import { and, eq } from 'drizzle-orm';
import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';

import { logger } from '../core/logger';
import { db } from '../db';
import { keywords, projects, scanJobs, scanResults, scanRuns } from '../db/schema/core';
import { HttpException } from '../exceptions/http';
import { getProjectService } from '../services/project.service';
import type { UserPayload } from './auth';

/**
 * Middleware to ensure the authenticated user owns the requested project.
 * It extracts the project ID from params or body, verifies ownership in DB,
 * and sets the projectId in context.
 *
 * @param projectIdField The field name in params/body containing the project ID (default: 'projectId')
 */
export const requireProjectAccess = (projectIdField = 'projectId') => {
    return createMiddleware<{ Variables: { user: UserPayload; projectId: string } }>(
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
                    projectId = body[projectIdField] || body.project_id;
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
                if (error instanceof HTTPException || error instanceof HttpException) {
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
            projectId = c.req.query(projectIdField) || c.req.query('project_id');
        }

        if (!projectId) {
            try {
                const body = await c.req.json().catch(() => ({}));
                projectId = body[projectIdField] || body.project_id;
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

export const requireKeywordAccess = (keywordIdField = 'id') => {
    return createMiddleware<{
        Variables: { user: UserPayload; keywordId: string; projectId: string };
    }>(async (c, next) => {
        const user = c.get('user');
        if (!user) {
            throw new HTTPException(401, { message: 'Unauthorized' });
        }

        const keywordId = c.req.param(keywordIdField);
        if (!keywordId) {
            throw new HTTPException(400, { message: 'Keyword ID is required' });
        }

        const [row] = await db
            .select({ projectId: keywords.project_id, ownerId: projects.user_id })
            .from(keywords)
            .innerJoin(projects, eq(keywords.project_id, projects.id))
            .where(eq(keywords.id, keywordId))
            .limit(1);

        if (!row) {
            throw new HTTPException(404, { message: 'Keyword not found' });
        }

        if (row.ownerId !== user.id) {
            logger.warn(
                { userId: user.id, keywordId },
                'User attempted unauthorized keyword access',
            );
            throw new HTTPException(403, { message: 'Access denied to this keyword' });
        }

        c.set('keywordId', keywordId);
        c.set('projectId', row.projectId);
        await next();
    });
};

export const requireScanAccess = (scanIdField = 'id') => {
    return createMiddleware<{
        Variables: { user: UserPayload; scanId: string; projectId: string };
    }>(async (c, next) => {
        const user = c.get('user');
        if (!user) {
            throw new HTTPException(401, { message: 'Unauthorized' });
        }

        const scanId = c.req.param(scanIdField);
        if (!scanId) {
            throw new HTTPException(400, { message: 'Scan ID is required' });
        }

        const [runRow] = await db
            .select({ projectId: scanRuns.project_id, ownerId: projects.user_id })
            .from(scanRuns)
            .innerJoin(projects, eq(scanRuns.project_id, projects.id))
            .where(and(eq(scanRuns.id, scanId), eq(projects.user_id, user.id)))
            .limit(1);

        if (runRow) {
            c.set('scanId', scanId);
            c.set('projectId', runRow.projectId);
            await next();
            return;
        }

        const [resultRow] = await db
            .select({ projectId: keywords.project_id, ownerId: projects.user_id })
            .from(scanResults)
            .innerJoin(scanJobs, eq(scanResults.job_id, scanJobs.id))
            .innerJoin(keywords, eq(scanJobs.keyword_id, keywords.id))
            .innerJoin(projects, eq(keywords.project_id, projects.id))
            .where(and(eq(scanResults.id, scanId), eq(projects.user_id, user.id)))
            .limit(1);

        if (!resultRow) {
            throw new HTTPException(404, { message: 'Scan run/result not found' });
        }

        c.set('scanId', scanId);
        c.set('projectId', resultRow.projectId);
        await next();
    });
};
