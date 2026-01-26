// Shared Types for Mentha Platform

export interface Project {
    id: string;
    name: string;
    domain: string;
    description?: string;
    competitors: string[];
    created_at: string;
}

export interface Keyword {
    id: string;
    project_id: string;
    keyword: string;
    category?: string;
    created_at: string;
}

export interface VisibilityScore {
    score: number; // 0-100
    trend: 'up' | 'down' | 'stable';
    change: number;
}
