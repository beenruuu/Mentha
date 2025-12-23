import { fetchAPI } from '@/lib/api-client';

export interface Brand {
  id: string;
  name: string;
  domain: string;
  logo_url?: string;
  description?: string;
  industry?: string;
  ai_providers?: string[];
  services?: string[];
  created_at: string;
  // Geographic scope fields
  business_scope?: 'local' | 'regional' | 'national' | 'international';
  city?: string;
  location?: string;
}

export interface CreateBrandData {
  name: string;
  domain: string;
  industry?: string;
  description?: string;
  ai_providers?: string[];
  services?: string[];
  discovery_prompts?: string[];
  // Geographic scope fields
  business_scope?: 'local' | 'regional' | 'national' | 'international';
  city?: string;
  location?: string;
}

export const brandsService = {
  getAll: async () => {
    return fetchAPI<Brand[]>('/brands/');
  },

  getById: async (id: string) => {
    return fetchAPI<Brand>(`/brands/${id}`);
  },

  create: async (data: CreateBrandData) => {
    return fetchAPI<Brand>('/brands/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<CreateBrandData>) => {
    return fetchAPI<Brand>(`/brands/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return fetchAPI<void>(`/brands/${id}`, {
      method: 'DELETE',
    });
  },
};
