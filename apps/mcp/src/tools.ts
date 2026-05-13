import OpenAI from 'openai';
import { z } from 'zod';

import { menthaClient } from './client';

const openrouter = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY || '',
    baseURL: 'https://openrouter.ai/api/v1',
});

// ─── Herramientas existentes ────────────────────────────────────────

export const generateLlmsTxt = async () => {
    const response = await menthaClient['llms.txt'].$get();
    if (!response.ok) throw new Error('Failed to generate llms.txt');
    return { content: [{ type: 'text' as const, text: await response.text() }] };
};

export const listProjects = async () => {
    const response = await menthaClient.api.v1.projects.$get();
    if (!response.ok) throw new Error('Failed to list projects');
    return {
        content: [{ type: 'text' as const, text: JSON.stringify(await response.json(), null, 2) }],
    };
};

// ─── Herramientas GEO/AEO ──────────────────────────────────────────

/**
 * Auditoría GEO completa: analiza optimización para motores AI
 */
export const geoAudit = async (args: { url: string; brandName: string }) => {
    const response = await openrouter.chat.completions.create({
        model: 'openai/gpt-4o',
        messages: [
            {
                role: 'system',
                content:
                    'Eres un experto en GEO (Generative Engine Optimization). Analiza URLs y devuelve JSON válido.',
            },
            {
                role: 'user',
                content: `Analiza ${args.url} para la marca "${args.brandName}".
Evalúa qué tan preparada está para aparecer en ChatGPT, Perplexity, Gemini y Claude.

Devuelve SOLO JSON:
{
  "brandName": "${args.brandName}",
  "url": "${args.url}",
  "overallScore": <0-100>,
  "platformReadiness": {
    "chatGPT": <0-100>,
    "perplexity": <0-100>,
    "gemini": <0-100>,
    "claude": <0-100>
  },
  "strengths": ["fortaleza 1", "fortaleza 2"],
  "weaknesses": ["debilidad 1", "debilidad 2"],
  "recommendations": [
    {"priority": "high|cri|med", "action": "descripción"},
    {"priority": "high|cri|med", "action": "descripción"}
  ]
}`,
            },
        ],
        temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content || '{}';
    return { content: [{ type: 'text' as const, text: content }] };
};

/**
 * Analizar citabilidad de contenido para AI
 */
export const analyzeCitability = async (args: { content: string; brandName: string }) => {
    const response = await openrouter.chat.completions.create({
        model: 'openai/gpt-4o',
        messages: [
            {
                role: 'system',
                content:
                    'Eres un experto en citabilidad para motores de IA. Responde solo con JSON.',
            },
            {
                role: 'user',
                content: `Analiza este contenido para la marca "${args.brandName}":

${args.content}

Puntúa 0-100: claridad, densidad de datos, estructura, definición de entidad.
Devuelve SOLO JSON:
{
  "overall": <0-100>,
  "breakdown": {
    "contentClarity": <0-100>,
    "factualDensity": <0-100>,
    "structuredData": <0-100>,
    "brandEntity": <0-100>
  },
  "recommendations": ["recomendación 1"]
}`,
            },
        ],
        temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content || '{}';
    return { content: [{ type: 'text' as const, text: content }] };
};

/**
 * Analizar crawlers AI en robots.txt
 */
export const analyzeCrawlers = async (args: { robotsTxt: string; domain: string }) => {
    const aiCrawlers = [
        'GPTBot',
        'ClaudeBot',
        'Claude-Web',
        'PerplexityBot',
        'Google-Extended',
        'CCBot',
        'anthropic-ai',
        'OAI-SearchBot',
        'cohere-ai',
    ];

    const allowed: string[] = [];
    const blocked: string[] = [];

    for (const crawler of aiCrawlers) {
        const regex = new RegExp(`User-agent:\\s*${crawler}[\\s\\S]*?(?=User-agent:|$)`, 'i');
        const match = args.robotsTxt.match(regex);

        if (match) {
            if (match[0].includes('Disallow:')) {
                blocked.push(crawler);
            } else {
                allowed.push(crawler);
            }
        } else {
            allowed.push(crawler); // sin regla = permitido
        }
    }

    return {
        content: [
            {
                type: 'text' as const,
                text: JSON.stringify(
                    {
                        domain: args.domain,
                        totalCrawlersChecked: aiCrawlers.length,
                        allowed,
                        blocked,
                        blockedCount: blocked.length,
                        recommendations:
                            blocked.length > 0
                                ? [
                                      `${blocked.length} crawlers AI bloqueados. Revisa si es intencional.`,
                                  ]
                                : ['Todos los crawlers AI están permitidos.'],
                    },
                    null,
                    2,
                ),
            },
        ],
    };
};

/**
 * Escanear menciones de marca en plataformas AI
 */
export const scanBrandMentions = async (args: { brandName: string }) => {
    const response = await openrouter.chat.completions.create({
        model: 'perplexity/sonar-pro',
        messages: [
            {
                role: 'user',
                content: `¿Qué información hay sobre "${args.brandName}"? Dame una respuesta detallada incluyendo productos, reputación y dónde se menciona.`,
            },
        ],
    });

    const content = response.choices[0]?.message?.content || '';
    const mentionCount = (
        content.toLowerCase().match(new RegExp(args.brandName.toLowerCase(), 'g')) || []
    ).length;

    return {
        content: [
            {
                type: 'text' as const,
                text: JSON.stringify(
                    {
                        brand: args.brandName,
                        mentionCount,
                        sentiment: content.includes('excelente')
                            ? 'positive'
                            : content.includes('mal') || content.includes('caro')
                              ? 'negative'
                              : 'neutral',
                        platform: 'perplexity',
                        response: content.substring(0, 2000),
                    },
                    null,
                    2,
                ),
            },
        ],
    };
};
