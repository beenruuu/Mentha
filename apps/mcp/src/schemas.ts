import { z } from 'zod';

export const generateLlmsTxtSchema = z.object({});

export const listProjectsSchema = z.object({});

export const geoAuditSchema = z.object({
    url: z.string().url().describe('URL del sitio a auditar'),
    brandName: z.string().describe('Nombre de la marca'),
});

export const citabilitySchema = z.object({
    content: z.string().describe('Contenido a analizar'),
    brandName: z.string().describe('Nombre de la marca'),
});

export const brandMentionsSchema = z.object({
    brandName: z.string().describe('Nombre de la marca a escanear'),
});

export const crawlerAnalysisSchema = z.object({
    robotsTxt: z.string().describe('Contenido del robots.txt'),
    domain: z.string().describe('Dominio del sitio'),
});
