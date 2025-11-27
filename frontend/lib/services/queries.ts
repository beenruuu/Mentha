import { fetchAPI } from '@/lib/api-client';

export interface Query {
    id: string;
    brand_id: string;
    user_id?: string;
    analysis_id?: string;
    title: string;
    question: string;
    answer?: string;
    category: string;
    priority: 'high' | 'medium' | 'low';
    frequency: string;
    estimated_volume?: number;
    ai_models?: string[];
    tracked?: boolean;
    created_at: string;
    updated_at?: string;
}

export const queriesService = {
    getAll: async (brandId: string) => {
        return fetchAPI<Query[]>(`/queries/?brand_id=${brandId}`);
    },

    getById: async (id: string) => {
        return fetchAPI<Query>(`/queries/${id}`);
    }
};
