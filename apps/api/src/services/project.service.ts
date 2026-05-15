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

    async analyzeDomain(
        domain: string,
    ): Promise<{ name: string; description: string; keywords: string[]; competitors: string[] }> {
        logger.info({ domain }, 'Analyzing domain for onboarding');

        const hostname = new URL(domain).hostname.replace(/^www\./, '');
        const hostBrandName = hostname.split('.')[0] || hostname;

        // Try Camoufox scrape first — ask Perplexity about the brand
        try {
            const { runCamoufoxUiCapture } = await import('../core/ui-capture/camoufox-provider');
            const capture = await runCamoufoxUiCapture({
                provider: 'perplexity',
                prompt: `What is ${hostname}? Tell me about this company, what they do, their main competitors, and what people search for related to them.`,
            });

            if (capture.status === 'success' && capture.responseMarkdown) {
                const text = capture.responseMarkdown;
                const sourceDomains = capture.sources
                    .map((s) => s.domain)
                    .filter((d): d is string => Boolean(d));

                const name = extractBrandName(text, hostname);
                const description = extractDescription(text);
                const keywords = extractKeywords(text, name, hostname);
                const competitors = extractCompetitors(text, sourceDomains, name);

                return { name, description, keywords, competitors };
            }
        } catch (error) {
            logger.warn(
                { error: (error as Error).message },
                'Camoufox domain analysis failed, using heuristics',
            );
        }

        // Fallback: heuristic from domain name
        const formattedName = hostBrandName
            .split(/[-_]/)
            .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');

        return {
            name: formattedName,
            description: `Brand analysis for ${formattedName}. Configure additional details in project settings.`,
            keywords: [
                `What is ${formattedName}?`,
                `${formattedName} pricing and features`,
                `${formattedName} reviews and alternatives`,
                `Best alternatives to ${formattedName}`,
                `${formattedName} customer experience`,
            ],
            competitors: [],
        };
    }

    async getById(id: string): Promise<Project> {
        logger.debug({ id }, 'Getting project by ID');

        const data = await db.select().from(projects).where(eq(projects.id, id)).limit(1);

        if (data.length === 0) {
            throw new NotFoundException('Project not found');
        }

        const project = data[0];
        if (!project) {
            throw new NotFoundException('Project not found');
        }
        return project;
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

        const project = result[0];
        if (!project) {
            throw new NotFoundException('Project not found');
        }

        logger.info({ projectId: id }, 'Project updated successfully');
        return project;
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

// ---------------------------------------------------------------------------
// Heuristic extraction helpers for Camoufox-scraped content
// ---------------------------------------------------------------------------

function extractBrandName(text: string, domain: string): string {
    const lines = text.split('\n').filter(Boolean);
    for (const line of lines) {
        const clean = line
            .replace(/^#+\s*/, '')
            .replace(/[*_]/g, '')
            .trim();
        if (clean.length > 1 && clean.length < 100 && !clean.startsWith('http')) {
            const words = clean.split(/\s+/);
            if (words.length >= 2 && words.length <= 8) return clean;
        }
    }
    return domain.split('.')[0] || domain;
}

function extractDescription(text: string): string {
    const paragraphs = text.split('\n\n').filter(Boolean);
    for (const p of paragraphs) {
        const clean = p
            .replace(/^#+\s*/, '')
            .replace(/[*_]/g, '')
            .trim();
        if (clean.length > 40 && clean.length < 500) return clean;
    }
    return `${text.slice(0, 200)}...`;
}

function extractKeywords(text: string, name: string, domain: string): string[] {
    const keywords: string[] = [];
    const brand = name || domain.split('.')[0] || '';

    keywords.push(`What is ${brand}?`);

    const sourcePatterns = [
        /alternatives?\s+to\s+([\w\s]+)/gi,
        /([\w\s]+)\s+vs\.?\s+/gi,
        /competitors?\s+(?:include|are|:)?\s+([\w\s,]+)/gi,
        /(?:pricing|price|cost|features|review)/gi,
    ];

    const seen = new Set<string>();
    for (const pattern of sourcePatterns) {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
            const phrase = match[0]?.trim().toLowerCase();
            if (phrase && phrase.length > 3 && !seen.has(phrase)) {
                seen.add(phrase);
                const kw = `${phrase} ${brand}`;
                if (keywords.length < 5) keywords.push(kw);
            }
        }
    }

    const defaults = [
        `${brand} pricing and features`,
        `Best alternatives to ${brand}`,
        `${brand} reviews and customer experience`,
    ];

    while (keywords.length < 5) {
        keywords.push(defaults[keywords.length - 1] || `${brand} related searches`);
    }

    return keywords.slice(0, 5);
}

function extractCompetitors(text: string, sourceDomains: string[], brandName: string): string[] {
    const competitors: string[] = [];
    const seen = new Set<string>();

    const brandLower = brandName.toLowerCase();

    for (const domain of sourceDomains) {
        if (domain.includes(brandLower.replace(/\s+/g, ''))) continue;
        const name = domain.replace(/^www\./, '').split('.')[0];
        if (name && name.length > 2 && !seen.has(name)) {
            seen.add(name);
            const formatted = name.charAt(0).toUpperCase() + name.slice(1);
            competitors.push(formatted);
        }
    }

    const competitorPatterns = [
        /competitors?\s+(?:include|are|:)?\s+([A-Z][\w\s,]+)/gi,
        /(?:unlike|compared to|vs\.?)\s+([A-Z][\w\s]+)/gi,
        /alternatives?\s+(?:to|include|:)?\s+([A-Z][\w\s,]+)/gi,
    ];

    for (const pattern of competitorPatterns) {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
            const names = (match[1] || match[0])
                .split(/[,;]/)
                .map((n) => n.trim().replace(/\.$/, ''))
                .filter((n) => n.length > 1 && n.length < 30 && !n.includes(brandLower));
            for (const n of names) {
                if (!seen.has(n.toLowerCase())) {
                    seen.add(n.toLowerCase());
                    competitors.push(n);
                }
            }
        }
    }

    return [...new Set(competitors)].slice(0, 3);
}
