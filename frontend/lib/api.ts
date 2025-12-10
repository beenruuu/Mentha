import axios from 'axios';
import { createClient } from '@/lib/supabase/client';

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add interceptor to include auth token if available
api.interceptors.request.use(async (config) => {
    try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.access_token) {
            config.headers.Authorization = `Bearer ${session.access_token}`;
        }
    } catch (e) {
        console.error('Error getting auth session', e);
    }
    return config;
});
