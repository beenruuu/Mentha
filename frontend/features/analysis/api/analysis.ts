import { fetchAPI } from '@/lib/api-client';
import type { Analysis, CreateAnalysisData } from '@/lib/types';

// Re-export types for backward compatibility
export type { Analysis, CreateAnalysisData };

export const analysisService = {
  getAll: async (brandId?: string) => {
    const query = brandId ? `?brand_id=${brandId}` : '';
    return fetchAPI<Analysis[]>(`/analysis/${query}`);
  },

  getById: async (id: string) => {
    return fetchAPI<Analysis>(`/analysis/${id}`);
  },

  create: async (data: CreateAnalysisData) => {
    return fetchAPI<Analysis>('/analysis/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
