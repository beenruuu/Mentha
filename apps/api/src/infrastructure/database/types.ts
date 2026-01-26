/**
 * Database type definitions for Supabase
 * These types are based on the schema defined in migrations
 */

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    email: string | null;
                    display_name: string | null;
                    plan: 'free' | 'pro' | 'enterprise';
                    daily_quota: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    email?: string | null;
                    display_name?: string | null;
                    plan?: 'free' | 'pro' | 'enterprise';
                    daily_quota?: number;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    email?: string | null;
                    display_name?: string | null;
                    plan?: 'free' | 'pro' | 'enterprise';
                    daily_quota?: number;
                    updated_at?: string;
                };
            };
            projects: {
                Row: {
                    id: string;
                    user_id: string;
                    name: string;
                    domain: string;
                    description: string | null;
                    competitors: Json;
                    settings: Json;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    name: string;
                    domain: string;
                    description?: string | null;
                    competitors?: Json;
                    settings?: Json;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    name?: string;
                    domain?: string;
                    description?: string | null;
                    competitors?: Json;
                    settings?: Json;
                    updated_at?: string;
                };
            };
            keywords: {
                Row: {
                    id: string;
                    project_id: string;
                    query: string;
                    intent: 'informational' | 'transactional' | 'navigational' | 'commercial';
                    scan_frequency: 'daily' | 'weekly' | 'manual';
                    engines: Json;
                    is_active: boolean;
                    last_scanned_at: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    project_id: string;
                    query: string;
                    intent?: 'informational' | 'transactional' | 'navigational' | 'commercial';
                    scan_frequency?: 'daily' | 'weekly' | 'manual';
                    engines?: Json;
                    is_active?: boolean;
                    last_scanned_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    query?: string;
                    intent?: 'informational' | 'transactional' | 'navigational' | 'commercial';
                    scan_frequency?: 'daily' | 'weekly' | 'manual';
                    engines?: Json;
                    is_active?: boolean;
                    last_scanned_at?: string | null;
                    updated_at?: string;
                };
            };
            scan_jobs: {
                Row: {
                    id: string;
                    keyword_id: string;
                    engine: 'perplexity' | 'openai' | 'gemini';
                    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
                    priority: 'low' | 'normal' | 'high';
                    error_message: string | null;
                    latency_ms: number | null;
                    started_at: string | null;
                    completed_at: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    keyword_id: string;
                    engine: 'perplexity' | 'openai' | 'gemini';
                    status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
                    priority?: 'low' | 'normal' | 'high';
                    error_message?: string | null;
                    latency_ms?: number | null;
                    started_at?: string | null;
                    completed_at?: string | null;
                    created_at?: string;
                };
                Update: {
                    status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
                    error_message?: string | null;
                    latency_ms?: number | null;
                    started_at?: string | null;
                    completed_at?: string | null;
                };
            };
            scan_results: {
                Row: {
                    id: string;
                    job_id: string;
                    raw_response: string | null;
                    analysis_json: Json | null;
                    sentiment_score: number | null;
                    brand_visibility: boolean | null;
                    share_of_voice_rank: number | null;
                    recommendation_type: 'direct_recommendation' | 'neutral_comparison' | 'negative_mention' | 'absent' | null;
                    token_count: number | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    job_id: string;
                    raw_response?: string | null;
                    analysis_json?: Json | null;
                    sentiment_score?: number | null;
                    brand_visibility?: boolean | null;
                    share_of_voice_rank?: number | null;
                    recommendation_type?: 'direct_recommendation' | 'neutral_comparison' | 'negative_mention' | 'absent' | null;
                    token_count?: number | null;
                    created_at?: string;
                };
                Update: {
                    raw_response?: string | null;
                    analysis_json?: Json | null;
                    sentiment_score?: number | null;
                    brand_visibility?: boolean | null;
                    share_of_voice_rank?: number | null;
                    recommendation_type?: 'direct_recommendation' | 'neutral_comparison' | 'negative_mention' | 'absent' | null;
                    token_count?: number | null;
                };
            };
            citations: {
                Row: {
                    id: string;
                    result_id: string;
                    url: string;
                    domain: string | null;
                    title: string | null;
                    position: number | null;
                    is_brand_domain: boolean;
                    is_competitor_domain: boolean;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    result_id: string;
                    url: string;
                    domain?: string | null;
                    title?: string | null;
                    position?: number | null;
                    is_brand_domain?: boolean;
                    is_competitor_domain?: boolean;
                    created_at?: string;
                };
                Update: {
                    url?: string;
                    title?: string | null;
                    position?: number | null;
                    is_brand_domain?: boolean;
                    is_competitor_domain?: boolean;
                };
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];
export type Keyword = Database['public']['Tables']['keywords']['Row'];
export type ScanJob = Database['public']['Tables']['scan_jobs']['Row'];
export type ScanResult = Database['public']['Tables']['scan_results']['Row'];
export type Citation = Database['public']['Tables']['citations']['Row'];

export type NewProject = Database['public']['Tables']['projects']['Insert'];
export type NewKeyword = Database['public']['Tables']['keywords']['Insert'];
export type NewScanJob = Database['public']['Tables']['scan_jobs']['Insert'];
export type NewScanResult = Database['public']['Tables']['scan_results']['Insert'];
export type NewCitation = Database['public']['Tables']['citations']['Insert'];
