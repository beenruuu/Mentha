import { z } from 'zod';

export const createProjectSchema = z.object({
    name: z.string().min(3, 'Project name must be at least 3 characters'),
    domain: z.string().url('Domain must be a valid URL'),
    competitors: z.array(z.string().url()).max(5, 'Maximum 5 competitors allowed').default([]),
    description: z.string().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const projectIdSchema = z.object({
    id: z.string().uuid('Invalid project ID'),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectIdInput = z.infer<typeof projectIdSchema>;
