import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * Environment configuration schema with validation
 */
const envSchema = z.object({
    // Server
    PORT: z.string().default('3000').transform(Number),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    // Supabase
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    SUPABASE_JWT_SECRET: z.string().min(1),

    // Redis
    REDIS_URL: z.string().default('redis://localhost:6379'),

    // LLM Providers
    PERPLEXITY_API_KEY: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    GOOGLE_AI_KEY: z.string().optional(),

    // Rate Limiting
    DEFAULT_DAILY_QUOTA: z.string().default('100').transform(Number),

    // Cache
    CACHE_TTL_HOURS: z.string().default('24').transform(Number),
});

/**
 * Validated environment configuration
 * Throws detailed error if validation fails
 */
function validateEnv() {
    const result = envSchema.safeParse(process.env);

    if (!result.success) {
        const formatted = result.error.format();
        console.error('❌ Invalid environment configuration:');
        console.error(JSON.stringify(formatted, null, 2));
        throw new Error('Environment validation failed');
    }

    return result.data;
}

export const env = validateEnv();

export type Env = z.infer<typeof envSchema>;
