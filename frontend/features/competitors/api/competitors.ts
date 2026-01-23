import { fetchAPI } from '@/lib/api-client';
import type { Competitor, CreateCompetitorData } from '@/lib/types';

// Re-export types for backward compatibility
export type { Competitor, CreateCompetitorData };

export const competitorsService = {
  getAll: async (brandId?: string) => {
    const query = brandId ? `?brand_id=${brandId}` : '';
    return fetchAPI<Competitor[]>(`/competitors/${query}`);
  },

  getById: async (id: string) => {
    return fetchAPI<Competitor>(`/competitors/${id}`);
  },

  create: async (data: CreateCompetitorData) => {
    return fetchAPI<Competitor>('/competitors/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return fetchAPI<void>(`/competitors/${id}`, {
      method: 'DELETE',
    });
  },
};
