import { createClient } from '@/lib/supabase/client';
import { isDemoModeActive } from '@/lib/demo-context';
import { handleDemoRequest } from '@/lib/demo-api-handler';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

export async function fetchAPI<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  // Check if we're in demo mode - return mock data
  if (isDemoModeActive()) {
    // Simulate network delay for realism
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    return handleDemoRequest(endpoint, options) as T;
  }

  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const controller = new AbortController();
  // Increased timeout to 90s because competitor discovery and analysis can be slow
  const timeoutId = setTimeout(() => controller.abort(), 90000);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = typeof errorData.detail === 'string' 
        ? errorData.detail 
        : (typeof errorData.detail === 'object' ? JSON.stringify(errorData.detail) : null);
        
      throw new Error(errorMessage || `API Error: ${response.statusText}`);
    }

    return response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }

    // Normalize network / fetch errors to a friendly, localised message
    const isNetworkError =
      error instanceof TypeError ||
      String(error?.message).toLowerCase().includes('failed to fetch') ||
      String(error?.code).toLowerCase().includes('econnrefused') ||
      String(error?.message).toLowerCase().includes('networkerror');

    if (isNetworkError) {
      throw new Error('No se pudo conectar con el backend. Comprueba que el servidor esté levantado.');
    }

    throw error;
  }
}

