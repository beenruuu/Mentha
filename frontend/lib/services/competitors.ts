import { fetchAPI } from '@/lib/api-client';

export interface Competitor {
  id: string;
  name: string;
  domain: string;
  brand_id?: string;
  similarity_score?: number;
  visibility_score?: number;
  favicon?: string;
  tracked: boolean;
  source?: string; // onboarding, discovered, manual
  metrics_breakdown?: Record<string, number>;
  created_at: string;
  updated_at: string;
  score?: number;
  trend?: 'up' | 'down' | 'stable';
}

export interface CreateCompetitorData {
  name: string;
  domain: string;
  brand_id?: string;
  similarity_score?: number;
  tracked?: boolean;
  source?: string;
}

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
