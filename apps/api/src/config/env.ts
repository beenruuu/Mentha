import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * Environment configuration schema with validation
 */
const envSchema = z.object({
    // Server
    PORT: z.string().default('4000').transform(Number),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    MENTHA_QA_MODE: z
        .string()
        .optional()
        .default('false')
        .transform((value) => value === 'true'),
    MENTHA_DEPLOYMENT_MODE: z.enum(['local', 'hosted']).default('local'),
    MENTHA_SCAN_EXECUTION_MODE: z.enum(['browser', 'api', 'hybrid']).default('browser'),
    MENTHA_BROWSER_CONCURRENCY: z.string().default('1').transform(Number),
    MENTHA_INITIAL_REPORT_DELAY_HOURS: z.string().default('24').transform(Number),
    MENTHA_UI_CAPTURE_ENABLED: z
        .string()
        .optional()
        .default('true')
        .transform((value) => value === 'true'),
    MENTHA_UI_CAPTURE_PROVIDER: z.enum(['playwright', 'camoufox']).default('camoufox'),
    MENTHA_UI_CAPTURE_HEADLESS: z
        .string()
        .optional()
        .default('true')
        .transform((value) => value !== 'false'),
    MENTHA_UI_CAPTURE_PYTHON: z.string().default('python'),
    MENTHA_UI_CAPTURE_STORAGE_DIR: z.string().default('.mentha/ui-capture/sessions'),
    MENTHA_UI_CAPTURE_PROXY_SERVER: z.string().optional(),
    MENTHA_UI_CAPTURE_PROXY_USERNAME: z.string().optional(),
    MENTHA_UI_CAPTURE_PROXY_PASSWORD: z.string().optional(),

    // Database (Supabase PostgreSQL via Drizzle ORM or PGlite)
    DATABASE_URL: z.string().url().optional(),

    // Redis
    REDIS_URL: z.string().default('redis://localhost:6379'),

    // Authentication (Better Auth)
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.string().url().default('http://localhost:4000'),

    // LLM Providers (only OpenRouter - no direct OpenAI)
    OPENROUTER_API_KEY: z.string().optional(),

    // Camoufox anti-detection browser
    CAMOUFOX_HEADLESS_MODE: z.enum(['headless', 'headful', 'virtual']).default('virtual'),
    CAMOUFOX_BLOCK_IMAGES: z
        .string()
        .optional()
        .default('false')
        .transform((v) => v === 'true'),
    CAMOUFOX_BLOCK_WEBRTC: z
        .string()
        .optional()
        .default('false')
        .transform((v) => v === 'true'),
    CAMOUFOX_BLOCK_WEBGL: z
        .string()
        .optional()
        .default('false')
        .transform((v) => v === 'true'),
    CAMOUFOX_DISABLE_COOP: z
        .string()
        .optional()
        .default('false')
        .transform((v) => v === 'true'),
    CAMOUFOX_GEOIP: z
        .string()
        .optional()
        .default('true')
        .transform((v) => v === 'true'),
    CAMOUFOX_ENABLE_CACHE: z
        .string()
        .optional()
        .default('false')
        .transform((v) => v === 'true'),
    CAMOUFOX_DEBUG: z
        .string()
        .optional()
        .default('false')
        .transform((v) => v === 'true'),
    CAMOUFOX_LOCALE: z.string().optional().default('en-US'),
    CAMOUFOX_FINGERPRINT_PRESET: z.string().optional().default('true'),
    CAMOUFOX_FF_VERSION: z
        .string()
        .optional()
        .transform((v) => (v ? Number.parseInt(v, 10) : undefined)),
    CAMOUFOX_BROWSER: z.string().optional(),
    CAMOUFOX_EXECUTABLE_PATH: z.string().optional(),

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
