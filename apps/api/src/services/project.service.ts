import { eq, desc } from 'drizzle-orm';
import { db } from '../db';
import { projects } from '../db/schema/core';
import type { Project, InsertProject } from '../db/types';
import { logger } from '../core/logger';
import { NotFoundException } from '../exceptions/http';

export interface CreateProjectInput {
    name: string;
    domain: string;
    user_id: string;
    competitors?: string[];
    description?: string;
}

export interface UpdateProjectInput {
    name?: string;
    domain?: string;
    competitors?: string[];
    description?: string;
}

export interface ProjectFilters {
    userId?: string;
    tenantId?: string;
}

export class ProjectService {
    async list(filters?: ProjectFilters): Promise<Project[]> {
        logger.debug('Listing projects', { filters });

        let query = db.select().from(projects).orderBy(desc(projects.created_at));

        if (filters?.userId) {
            query = query.where(eq(projects.user_id, filters.userId)) as typeof query;
        }

        if (filters?.tenantId) {
            query = query.where(eq(projects.tenant_id, filters.tenantId)) as typeof query;
        }

        const data = await query;
        return data;
    }

    async getById(id: string): Promise<Project> {
        logger.debug('Getting project by ID', { id });

        const data = await db
            .select()
            .from(projects)
            .where(eq(projects.id, id))
            .limit(1);

        if (data.length === 0) {
            throw new NotFoundException('Project not found');
        }

        return data[0]!;
    }

    async create(input: CreateProjectInput): Promise<Project> {
        logger.info('Creating project', { name: input.name, domain: input.domain, userId: input.user_id });

        const projectData: InsertProject = {
            name: input.name,
            domain: input.domain,
            user_id: input.user_id,
            competitors: input.competitors || [],
            description: input.description,
        };

        const result = await db
            .insert(projects)
            .values(projectData)
            .returning();

        if (!result[0]) {
            throw new Error('Failed to create project');
        }

        logger.info('Project created successfully', { projectId: result[0].id });
        return result[0];
    }

    async update(id: string, input: UpdateProjectInput): Promise<Project> {
        logger.info('Updating project', { id, updates: Object.keys(input) });

        const result = await db
            .update(projects)
            .set({
                ...input,
                updated_at: new Date(),
            })
            .where(eq(projects.id, id))
            .returning();

        if (result.length === 0) {
            throw new NotFoundException('Project not found');
        }

        logger.info('Project updated successfully', { projectId: id });
        return result[0]!;
    }

    async delete(id: string): Promise<void> {
        logger.info('Deleting project', { id });

        const result = await db
            .delete(projects)
            .where(eq(projects.id, id))
            .returning();

        if (result.length === 0) {
            throw new NotFoundException('Project not found');
        }

        logger.info('Project deleted successfully', { projectId: id });
    }

    async exists(id: string): Promise<boolean> {
        const data = await db
            .select({ id: projects.id })
            .from(projects)
            .where(eq(projects.id, id))
            .limit(1);

        return data.length > 0;
    }
}

let projectService: ProjectService | null = null;

export function getProjectService(): ProjectService {
    if (!projectService) {
        projectService = new ProjectService();
    }
    return projectService;
}
