import { fetchAPI } from '@/lib/api-client';

export interface Brand {
  id: string;
  name: string;
  domain: string;
  industry?: string;
  description?: string;
  created_at: string;
}

export interface CreateBrandData {
  name: string;
  domain: string;
  industry?: string;
  description?: string;
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
