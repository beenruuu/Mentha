import { fetchAPI } from '@/lib/api-client';
import type { TechnicalAEO } from '@/lib/types';

// Re-export type for backward compatibility
export type { TechnicalAEO };

// Extended interface with platform detection (specific to this feature)
export interface TechnicalAEOWithPlatform extends TechnicalAEO {
    // Platform detection
    detected_platform?: 'wordpress' | 'shopify' | 'wix' | 'squarespace' | 'webflow' | 'prestashop' | 'magento' | 'drupal' | 'joomla' | 'custom' | 'unknown';
    platform_confidence?: number;
    platform_capabilities?: {
        can_edit_html: boolean;
        can_add_plugins: boolean;
        can_add_schema: boolean;
        schema_method: string;
        difficulty_base: string;
        tutorial_url?: string;
    };
}

export const technicalAeoService = {
    getByBrandId: async (brandId: string) => {
        return fetchAPI<TechnicalAEOWithPlatform[]>(`/technical-aeo/?brand_id=${brandId}`);
    },

    getLatestByBrandId: async (brandId: string): Promise<TechnicalAEOWithPlatform | null> => {
        try {
            const results = await fetchAPI<TechnicalAEOWithPlatform[]>(`/technical-aeo/?brand_id=${brandId}`);
            if (results && results.length > 0) {
                // Sort by created_at desc and return the most recent
                return results.sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())[0];
            }
            return null;
        } catch (error) {
            console.error('Failed to fetch technical AEO data:', error);
            return null;
        }
    }
};
