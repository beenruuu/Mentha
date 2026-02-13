/**
 * Features Service - Query feature flags from backend
 */

import { fetchAPI } from '@/lib/api-client';

export interface FeatureFlags {
    // Core
    ai_visibility: boolean;
    insights: boolean;

    // Advanced
    hallucination_detection: boolean;
    citation_tracking: boolean;
    sentiment_analysis: boolean;
    prompt_tracking: boolean;
    content_structure: boolean;

    // Optional
    eeat_analysis: boolean;
    technical_aeo: boolean;
    platform_detection: boolean;
    visual_assets: boolean;
}

export interface FeatureDescriptions {
    core: Record<string, string>;
    advanced: Record<string, string>;
    optional: Record<string, string>;
}

/**
 * Get current feature flag states from backend
 */
export async function getFeatureFlags(): Promise<FeatureFlags> {
    return fetchAPI<FeatureFlags>('/features');
}

/**
 * Get feature descriptions for settings UI
 */
export async function getFeatureDescriptions(): Promise<FeatureDescriptions> {
    return fetchAPI<FeatureDescriptions>('/features/descriptions');
}

/**
 * Check if a specific feature is enabled
 */
export async function isFeatureEnabled(featureName: keyof FeatureFlags): Promise<boolean> {
    const flags = await getFeatureFlags();
    return flags[featureName] ?? false;
}
