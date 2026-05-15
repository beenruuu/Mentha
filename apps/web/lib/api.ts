// Detect API URL: Priority to ENV, then current window origin (replacing 3000 with 4000), then localhost
const getApiBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;

    if (typeof window !== 'undefined') {
        // If we are in a codespace or similar, the URL usually changes the port in the subdomain
        const origin = window.location.origin;
        if (origin.includes('-3000')) {
            return `${origin.replace('-3000', '-4000')}/api/v1`;
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

    try {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!res.ok) {
            let errorMessage = `API error: ${res.status}`;

            try {
                const errorData = await res.json();
                errorMessage =
                    errorData.message || errorData.error || errorData.detail || errorMessage;
            } catch {
                // If JSON parsing fails, try to get text response
                try {
                    const text = await res.text();
                    if (text) {
                        errorMessage = text;
                    }
                } catch {
                    // If that fails too, use default message
                }
            }

            console.error(`[API Error] ${endpoint}:`, errorMessage, { status: res.status });
            throw new Error(errorMessage);
        }

        try {
            return await res.json();
        } catch (parseError) {
            console.error(
                `[API Parse Error] ${endpoint}: Failed to parse JSON response`,
                parseError,
            );
            throw new Error('Invalid response format from API');
        }
    } catch (fetchError) {
        if (fetchError instanceof Error) {
            console.error(`[API Fetch Error] ${endpoint}:`, fetchError.message);
            throw fetchError;
        }
        console.error(`[API Fetch Error] ${endpoint}:`, 'Unknown error occurred');
        throw new Error('Network error or API request failed');
    }
}
