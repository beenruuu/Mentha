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

    // Database (Supabase PostgreSQL via Drizzle ORM)
    DATABASE_URL: z.string().url(),

    // Redis
    REDIS_URL: z.string().default('redis://localhost:6379'),

    // JWT Authentication
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z.string().default('7d'),
    JWT_ALGORITHM: z.enum(['HS256', 'HS384', 'HS512']).default('HS256'),
    JWT_ISSUER: z.string().optional(),

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
