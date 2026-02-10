import { Request, Response, NextFunction } from 'express';
import { logger } from '../logging/index';

/**
 * AI Bot User-Agents to detect
 * These crawlers should receive semantic, token-efficient content
 */
const AI_BOT_PATTERNS = [
    'GPTBot',           // OpenAI
    'ChatGPT-User',     // OpenAI browsing
    'Google-Extended',  // Google AI training
    'PerplexityBot',    // Perplexity
    'ClaudeBot',        // Anthropic
    'Claude-Web',       // Anthropic browsing
    'Applebot-Extended', // Apple AI
    'CCBot',            // Common Crawl (often used for AI)
    'anthropic-ai',     // Anthropic
    'cohere-ai',        // Cohere
    'Meta-ExternalAgent', // Meta/Facebook AI
];

/**
 * Check if request comes from an AI crawler
 */
export function isAIBot(userAgent: string | undefined): boolean {
    if (!userAgent) return false;
    return AI_BOT_PATTERNS.some(pattern =>
        userAgent.toLowerCase().includes(pattern.toLowerCase())
    );
}

/**
 * Middleware to detect AI crawlers and set request context
 * Use this to conditionally serve AI-optimized content
 */
export function aiViewMiddleware(req: Request, _res: Response, next: NextFunction) {
    const userAgent = req.get('user-agent');
    const isBot = isAIBot(userAgent);

    // Attach to request for downstream use
    (req as Request & { isAIBot?: boolean }).isAIBot = isBot;

    if (isBot) {
        logger.debug('AI crawler detected', {
            userAgent: userAgent?.substring(0, 100),
            path: req.path,
        });
    }

    next();
}

/**
 * Strip non-semantic elements from HTML for AI consumption
 * Returns clean, token-efficient semantic HTML
 */
export function stripForAI(html: string): string {
    // Remove scripts, styles, navigation, footers
    const clean = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
        .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
        .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
        .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '') // Comments
        .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '');

    // Preserve only semantic content elements
    // This is a simplified version - in production, use a proper HTML parser

    return clean;
}

/**
 * Convert content to Markdown for maximum token efficiency
 */
export function htmlToMarkdown(html: string): string {
    return html
        .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
        .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
        .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
        .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
        .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
        .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
        .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
        .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
        .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
        .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
        .replace(/<[^>]+>/g, '') // Remove remaining tags
        .replace(/\n{3,}/g, '\n\n') // Normalize newlines
        .trim();
}

/**
 * Generate AI-optimized response headers
 */
export function setAIHeaders(res: Response): void {
    res.setHeader('X-Robots-Tag', 'index, follow, max-snippet:-1');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Content-Optimized-For', 'AI-Crawler');
}

/**
 * Request extension interface
 */
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            isAIBot?: boolean;
        }
    }
}
