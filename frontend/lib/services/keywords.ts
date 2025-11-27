import { fetchAPI } from '@/lib/api-client';

export type TrendDirection = 'rising' | 'stable' | 'falling';
export type DataSource = 'google_trends' | 'serpapi' | 'estimated' | 'llm_estimated' | 'manual';

export interface Keyword {
  id: string;
  keyword: string;
  brand_id?: string;
  search_volume?: number;
  difficulty?: number;
  ai_visibility_score?: number;
  position?: number;
  trend?: 'up' | 'down' | 'neutral';
  mentions?: {
    chatgpt?: boolean;
    claude?: boolean;
    perplexity?: boolean;
    gemini?: boolean;
  };
  tracked: boolean;
  // New real metrics fields
  trend_score?: number;
  trend_direction?: TrendDirection;
  data_source?: DataSource;
  created_at: string;
  updated_at: string;
}

export interface CreateKeywordData {
  keyword: string;
  brand_id?: string;
  tracked?: boolean;
}

export const keywordsService = {
  getAll: async (brandId?: string) => {
    const query = brandId ? `?brand_id=${brandId}` : '';
    return fetchAPI<Keyword[]>(`/keywords/${query}`);
  },

  getById: async (id: string) => {
    return fetchAPI<Keyword>(`/keywords/${id}`);
  },

  create: async (data: CreateKeywordData) => {
    return fetchAPI<Keyword>('/keywords/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return fetchAPI<void>(`/keywords/${id}`, {
      method: 'DELETE',
    });
  },
};
