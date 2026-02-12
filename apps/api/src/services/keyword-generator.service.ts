import { keywords } from '@/db/schema/core';
import { db } from '../db';
import { logger } from '../core/logger';
import OpenAI from 'openai';

export interface EntityProfile {
    brandName: string;
    industry: string;
    coreCategory: string;
    mainCompetitors: string[];
    targetAudience: string;
    keyProblem: string;
    countryCode?: string;
}

export interface GeneratedProbe {
    query: string;
    intent_category: 'discovery' | 'comparison' | 'authority' | 'transactional' | 'safety';
}

export class KeywordGeneratorService {
    private client: OpenAI;

    constructor() {
        this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    async generateProbes(profile: EntityProfile): Promise<GeneratedProbe[]> {
        const probes: GeneratedProbe[] = [];
        const { brandName, industry, coreCategory, targetAudience, keyProblem, countryCode = 'ES' } = profile;

        const personas = [
            {
                name: "The Bargain Hunter",
                intent: "transactional",
                focus: "price sensitivity, discounts, deals, cheapest options",
                count: 3
            },
            {
                name: "The Quality Seeker",
                intent: "comparison",
                focus: "durability, warranty, reviews, premium vs budget",
                count: 3
            },
            {
                name: "The Local Shopper",
                intent: "transactional",
                focus: "near me, open now, parking, physical store location",
                count: 3
            },
            {
                name: "The Skeptic",
                intent: "safety",
                focus: "is it a scam, legit, returns policy, customer complaints",
                count: 3
            },
            {
                name: "The Category Explorer",
                intent: "discovery",
                focus: `best ${coreCategory}, top rated ${industry}`,
                count: 3
            }
        ];

        const promises = personas.map(async (persona) => {
            const systemPrompt = `You are a Search Query Generator simulating a specific user persona.
Your goal is to generate ${persona.count} natural search queries that this persona would type into Google.

CONTEXT:
- Brand: ${brandName}
- Industry: ${industry}
- Category: ${coreCategory}
- Target Audience: ${targetAudience}
- Location/Language Context: ${countryCode} (Generate in the NATIVE language of this country)

PERSONA: ${persona.name}
FOCUS: ${persona.focus}

OUTPUT FORMAT:
Return strictly a JSON array of strings. Example: ["query 1", "query 2"]`;

            try {
                const response = await this.client.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: `Generate ${persona.count} queries for ${brandName} regarding ${keyProblem}.` }
                    ],
                    response_format: { type: "json_object" },
                    temperature: 0.7
                });

                const content = response.choices[0]?.message?.content || '{"queries": []}';
                const parsed = JSON.parse(content);
                const rawQueries: string[] = Array.isArray(parsed) ? parsed : (parsed.queries || parsed.list || []);

                return rawQueries.map(q => ({
                    query: q,
                    intent_category: persona.intent as GeneratedProbe['intent_category']
                }));

            } catch (err) {
                logger.error(`Failed to generate for persona ${persona.name}`, { error: (err as Error).message });
                return [];
            }
        });

        const results = await Promise.all(promises);
        results.forEach(group => probes.push(...group));

        return probes;
    }

    async saveProbes(projectId: string, probes: GeneratedProbe[]): Promise<number> {
        const records = probes.map(p => ({
            project_id: projectId,
            query: p.query,
            intent: 'informational' as const,
            scan_frequency: 'weekly' as const,
            is_active: true
        }));

        try {
            await db.insert(keywords).values(records);
            return records.length;
        } catch (error) {
            logger.error('Failed to save generated probes', { error: (error as Error).message });
            throw new Error(`Failed to save probes: ${(error as Error).message}`);
        }
    }
}
