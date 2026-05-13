import { desc, eq } from 'drizzle-orm';

import { logger } from '../core/logger';
import { db } from '../db';
import { projects } from '../db/schema/core';
import type { InsertProject, Project } from '../db/types';
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
        logger.debug({ filters }, 'Listing projects');

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

    async analyzeDomain(domain: string): Promise<{name: string, description: string, keywords: string[], competitors: string[]}> {
        logger.info({ domain }, 'Analyzing domain for onboarding');
        
        // Dynamic import to avoid circular dependencies if any, or just use createProvider
        const { createProvider } = await import('../core/search/factory');
        const provider = createProvider('openrouter');
        
        const prompt = `Actúa como un Auditor Técnico de Dominios y Analista SEO.
        Analiza la marca asociada al dominio: ${domain}.
        Devuelve un objeto JSON estrictamente con la siguiente estructura:
        {
          "name": "Nombre de la marca",
          "description": "Breve descripción de lo que hacen (1-2 oraciones)",
          "keywords": ["keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5"],
          "competitors": ["Nombre de Competidor 1", "Nombre de Competidor 2"]
        }
        
        IMPORTANTE PARA COMPETIDORES:
        - Devuelve NOMBRES de marcas/empresas, NO URLs.
        
        IMPORTANTE PARA KEYWORDS:
        - La primera keyword DEBE SER una pregunta directa sobre la marca (ej: "¿Qué es [Nombre de Marca]?") para asegurar un resultado positivo inicial.
        - Las otras 4 deben ser preguntas estratégicas que sus clientes buscarían (AEO).`;

        const result = await provider.search(prompt);
        
        try {
            const rawContent = result.content?.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(rawContent || '{}');
            
            return {
                name: parsed.name || 'Unknown Brand',
                description: parsed.description || 'No description available',
                keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 5) : [],
                competitors: Array.isArray(parsed.competitors) ? parsed.competitors.slice(0, 3) : [],
            };
        } catch (error) {
            logger.error({ error: (error as Error).message, content: result.content }, 'Failed to parse LLM analysis');
            throw new Error('Failed to analyze domain');
        }
    }

    async getById(id: string): Promise<Project> {
        logger.debug({ id }, 'Getting project by ID');

        const data = await db.select().from(projects).where(eq(projects.id, id)).limit(1);

        if (data.length === 0) {
            throw new NotFoundException('Project not found');
        }

        return data[0]!;
    }

    async create(input: CreateProjectInput): Promise<Project> {
        logger.info(
            {
                name: input.name,
                domain: input.domain,
                userId: input.user_id,
            },
            'Creating project',
        );

        const projectData: InsertProject = {
            name: input.name,
            domain: input.domain,
            user_id: input.user_id,
            competitors: input.competitors || [],
            description: input.description,
        };

        const result = await db.insert(projects).values(projectData).returning();

        if (!result[0]) {
            throw new Error('Failed to create project');
        }

        logger.info({ projectId: result[0].id }, 'Project created successfully');
        return result[0];
    }

    async update(id: string, input: UpdateProjectInput): Promise<Project> {
        logger.info({ id, updates: Object.keys(input) }, 'Updating project');

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

        logger.info({ projectId: id }, 'Project updated successfully');
        return result[0]!;
    }

    async delete(id: string): Promise<void> {
        logger.info({ id }, 'Deleting project');

        const result = await db.delete(projects).where(eq(projects.id, id)).returning();

        if (result.length === 0) {
            throw new NotFoundException('Project not found');
        }

        logger.info({ projectId: id }, 'Project deleted successfully');
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
