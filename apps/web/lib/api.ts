// Detect API URL: Priority to ENV, then current window origin (replacing 3000 with 4000), then localhost
const getApiBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;

    if (typeof window !== 'undefined') {
        // If we are in a codespace or similar, the URL usually changes the port in the subdomain
        const origin = window.location.origin;
        if (origin.includes('-3000')) {
            return origin.replace('-3000', '-4000') + '/api/v1';
        }
    }

    return 'http://localhost:4000/api/v1';
};

export const API_BASE_URL = getApiBaseUrl();

export async function fetchFromApi(endpoint: string, options: RequestInit = {}) {
    // Enforce credentials include to send BetterAuth session cookies
    if (!options.credentials) {
        options.credentials = 'include';
    }

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || `API error: ${res.status}`);
    }

    return res.json();
}
