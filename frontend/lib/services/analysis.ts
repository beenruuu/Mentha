import { fetchAPI } from '@/lib/api-client';

export interface Analysis {
  id: string;
  brand_id?: string;
  analysis_type: string;
  input_data: any;
  results?: any;
  score?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  ai_model?: string;
  error_message?: string;
  created_at: string;
  completed_at?: string;
  avg_position?: number;
  inclusion_rate?: number;
}

export interface CreateAnalysisData {
  brand_id?: string;
  analysis_type: string;
  input_data: {
    domain?: string;
    content?: string;
    [key: string]: any;
  };
  ai_model?: string;
}

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
