import { fetchAPI } from '@/lib/api-client';
import type { Brand, CreateBrandData } from '@/lib/types';

// Re-export types for backward compatibility
export type { Brand, CreateBrandData };

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
