export type UiCaptureProvider = 'chatgpt' | 'gemini' | 'perplexity' | 'claude' | 'ai-overview';

export interface UiCaptureRequest {
    provider: UiCaptureProvider;
    prompt: string;
    userId?: string;
    targetUrl?: string;
    location?: string;
    language?: string;
    screenshotPath?: string;
}

export interface UiCaptureSource {
    url: string;
    title?: string;
    domain?: string;
    position?: number;
}

export interface UiCaptureResult {
    provider: UiCaptureProvider;
    prompt: string;
    url: string;
    title: string;
    status: 'success' | 'partial' | 'blocked' | 'auth_required' | 'captcha_required';
    failureReason?: string;
    responseMarkdown: string;
    sources: UiCaptureSource[];
    screenshotPath?: string;
    capturedAt: string;
    latencyMs: number;
}
