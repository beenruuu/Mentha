import { createSupabaseAdmin } from '../../infrastructure/database/index';
import { logger } from '../../infrastructure/logging/index';

export interface EntityProfile {
    brandName: string;
    industry: string;
    coreCategory: string;
    mainCompetitors: string[]; // Array of strings
    targetAudience: string;
    keyProblem: string;
    countryCode?: string; // e.g. "ES", "US"
}

export interface GeneratedProbe {
    query: string;
    intent_category: 'discovery' | 'comparison' | 'authority' | 'transactional' | 'safety';
}

/**
 * Generates "Golden Queries" (Semantic Probes) based on the entity profile.
 * Implements the "Universal Interrogation Matrix v1.0"
 */
export class KeywordGeneratorService {

    /**
     * Generate all standard probes for a brand
     */
    /**
     * Generate "Golden Queries" (Semantic Probes) using Agentic Personas.
     * Uses GPT-4o-mini to simulate different user intents localized to the target country.
     */
    public async generateProbes(profile: EntityProfile): Promise<GeneratedProbe[]> {
        const probes: GeneratedProbe[] = [];
        const { brandName, industry, coreCategory, targetAudience, keyProblem, countryCode = 'ES' } = profile;

        // Persona Definitions
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

        // Initialize OpenAI (lazily or reused)
        const openAIClient = new (await import('openai')).default({
            apiKey: process.env.OPENAI_API_KEY
        });

        // Generate for each persona in parallel
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
                const response = await openAIClient.chat.completions.create({
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
                // Handle both { queries: [...] } and raw array if model deviates
                const rawQueries: string[] = Array.isArray(parsed) ? parsed : (parsed.queries || parsed.list || []);

                return rawQueries.map(q => ({
                    query: q,
                    intent_category: persona.intent as any
                }));

            } catch (err) {
                logger.error(`Failed to generate for persona ${persona.name}`, { error: (err as Error).message });
                return []; // Fallback empty
            }
        });

        const results = await Promise.all(promises);
        results.forEach(group => probes.push(...group));

        return probes;
    }

    /**
     * Save generated probes to database
     */
    public async saveProbes(projectId: string, probes: GeneratedProbe[]) {
        const supabase = createSupabaseAdmin();
        const records = probes.map(p => ({
            project_id: projectId,
            query: p.query,
            intent_category: p.intent_category,
            intent: 'informational', // Legacy field backup
            scan_frequency: 'weekly',
            is_active: true
        }));

        const { error } = await supabase.from('keywords').insert(records);

        if (error) {
            logger.error('Failed to save generated probes', { error: error.message });
            throw new Error(`Failed to save probes: ${error.message}`);
        }

        return records.length;
    }
}
