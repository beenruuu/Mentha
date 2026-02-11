import axios, { AxiosInstance, AxiosError } from 'axios';
import config from '../config/index';
import type {
    Project,
    Keyword,
    ScanResult,
    Entity,
    Claim,
    ShareOfModelMetrics,
    SentimentTrend,
    TopCitation,
    ApiResponse,
    ApiError,
} from '../types/index';

class ApiClient {
    private client: AxiosInstance;

    constructor(baseURL?: string) {
        this.client = axios.create({
            baseURL: baseURL || config.apiBaseUrl,
            timeout: config.defaultTimeout,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.client.interceptors.response.use(
            (response) => response,
            (error: AxiosError<ApiError>) => {
                if (error.response) {
                    const apiError = error.response.data;
                    throw new Error(apiError.message || apiError.error || 'API request failed');
                } else if (error.request) {
                    throw new Error('No response from server. Is the API running?');
                } else {
                    throw new Error(error.message || 'Request failed');
                }
            }
        );
    }

    projects = {
        list: async (): Promise<Project[]> => {
            const response = await this.client.get<ApiResponse<Project[]>>('/api/v1/projects');
            return response.data.data;
        },

        create: async (data: {
            name: string;
            domain: string;
            competitors?: string[];
            description?: string;
        }): Promise<Project> => {
            const response = await this.client.post<ApiResponse<Project>>('/api/v1/projects', data);
            return response.data.data;
        },

        get: async (id: string): Promise<Project> => {
            const response = await this.client.get<ApiResponse<Project>>(`/api/v1/projects/${id}`);
            return response.data.data;
        },

        update: async (
            id: string,
            data: Partial<{
                name: string;
                domain: string;
                competitors: string[];
                description: string;
            }>
        ): Promise<Project> => {
            const response = await this.client.patch<ApiResponse<Project>>(
                `/api/v1/projects/${id}`,
                data
            );
            return response.data.data;
        },

        delete: async (id: string): Promise<void> => {
            await this.client.delete(`/api/v1/projects/${id}`);
        },
    };

    keywords = {
        list: async (projectId?: string): Promise<Keyword[]> => {
            const params = projectId ? { project_id: projectId } : {};
            const response = await this.client.get<ApiResponse<Keyword[]>>('/api/v1/keywords', {
                params,
            });
            return response.data.data;
        },

        create: async (data: {
            project_id: string;
            query: string;
            intent?: 'informational' | 'transactional' | 'navigational' | 'commercial';
            scan_frequency?: 'daily' | 'weekly' | 'manual';
            engines?: string[];
        }): Promise<Keyword> => {
            const response = await this.client.post<ApiResponse<Keyword>>('/api/v1/keywords', data);
            return response.data.data;
        },

        delete: async (id: string): Promise<void> => {
            await this.client.delete(`/api/v1/keywords/${id}`);
        },
    };

    scans = {
        list: async (projectId: string, limit: number = 20): Promise<ScanResult[]> => {
            const response = await this.client.get<ApiResponse<ScanResult[]>>('/api/v1/scans', {
                params: { project_id: projectId, limit },
            });
            return response.data.data;
        },

        get: async (id: string): Promise<ScanResult> => {
            const response = await this.client.get<ApiResponse<ScanResult>>(`/api/v1/scans/${id}`);
            return response.data.data;
        },
    };

    knowledgeGraph = {
        entities: async (): Promise<Entity[]> => {
            const response = await this.client.get<ApiResponse<Entity[]>>('/api/v1/kg/entities');
            return response.data.data;
        },

        entity: async (id: string): Promise<Entity> => {
            const response = await this.client.get<ApiResponse<Entity>>(
                `/api/v1/kg/entities/${id}`
            );
            return response.data.data;
        },

        claims: async (entityId: string): Promise<Claim[]> => {
            const response = await this.client.get<ApiResponse<Claim[]>>(
                `/api/v1/kg/entities/${entityId}/claims`
            );
            return response.data.data;
        },
    };

    dashboard = {
        shareOfModel: async (projectId: string): Promise<ShareOfModelMetrics> => {
            const response = await this.client.get<ApiResponse<ShareOfModelMetrics>>(
                '/api/v1/dashboard/share-of-model',
                { params: { project_id: projectId } }
            );
            return response.data.data;
        },

        sentimentTrends: async (projectId: string): Promise<SentimentTrend[]> => {
            const response = await this.client.get<ApiResponse<SentimentTrend[]>>(
                '/api/v1/dashboard/sentiment-trends',
                { params: { project_id: projectId } }
            );
            return response.data.data;
        },

        topCitations: async (projectId: string, limit: number = 10): Promise<TopCitation[]> => {
            const response = await this.client.get<ApiResponse<TopCitation[]>>(
                '/api/v1/dashboard/top-citations',
                { params: { project_id: projectId, limit } }
            );
            return response.data.data;
        },
    };

    health = {
        check: async (): Promise<{ status: string; timestamp: string }> => {
            const response = await this.client.get<{ status: string; timestamp: string }>(
                '/health'
            );
            return response.data;
        },
    };
}

export default new ApiClient();
