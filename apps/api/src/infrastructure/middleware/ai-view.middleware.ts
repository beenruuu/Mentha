import { Context, MiddlewareHandler } from 'hono';
import { logger } from '../logging/index';

const AI_BOT_PATTERNS = [
    'GPTBot',
    'ChatGPT-User',
    'Google-Extended',
    'PerplexityBot',
    'ClaudeBot',
    'Claude-Web',
    'Applebot-Extended',
    'CCBot',
    'anthropic-ai',
    'cohere-ai',
    'Meta-ExternalAgent',
];

export interface AIViewVariables {
    isAIBot: boolean;
}

export function isAIBot(userAgent: string | undefined): boolean {
    if (!userAgent) return false;
    return AI_BOT_PATTERNS.some(pattern =>
        userAgent.toLowerCase().includes(pattern.toLowerCase())
    );
}

export const aiViewMiddleware: MiddlewareHandler<{ Variables: AIViewVariables }> = async (c, next) => {
    const userAgent = c.req.header('user-agent');
    const isBot = isAIBot(userAgent);

    c.set('isAIBot', isBot);

    if (isBot) {
        logger.debug('AI crawler detected', {
            userAgent: userAgent?.substring(0, 100),
            path: c.req.path,
        });
    }

    await next();
};

export function stripForAI(html: string): string {
    const clean = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
        .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
        .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
        .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '');

    return clean;
}

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
        .replace(/<[^>]+>/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

export function setAIHeaders(c: Context): void {
    c.header('X-Robots-Tag', 'index, follow, max-snippet:-1');
    c.header('Cache-Control', 'public, max-age=3600');
    c.header('Content-Type', 'text/html; charset=utf-8');
    c.header('X-Content-Optimized-For', 'AI-Crawler');
}
