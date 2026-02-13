interface ApiErrorResponse {
    error: string;
    message?: string;
    details?: Record<string, unknown>;
}

/**
 * Handles API response and extracts data
 * Throws error if response is not ok
 */
export async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;

        try {
            const errorData = (await response.json()) as ApiErrorResponse;
            errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
            // Si no se puede parsear el error, usar el mensaje por defecto
        }

        throw new Error(errorMessage);
    }

    return response.json() as Promise<T>;
}

/**
 * Extracts data field from API response
 */
export function extractData<T>(response: { data: T }): T {
    return response.data;
}

/**
 * Helper to handle common API call pattern
 * Automatically handles response validation and data extraction
 */
export async function apiCall<T>(request: Promise<Response>): Promise<T> {
    const response = await request;
    const json = await handleResponse<{ data: T }>(response);
    return extractData(json);
}
