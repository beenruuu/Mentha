import TurndownService from 'turndown';

let turndownService: TurndownService | null = null;

function getTurndown(): TurndownService {
    if (!turndownService) {
        turndownService = new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced',
            emDelimiter: '*',
            bulletListMarker: '-',
            linkStyle: 'inlined',
        });

        turndownService.remove('script');
        turndownService.remove('style');
        turndownService.remove('svg' as unknown as TurndownService.Filter);
        turndownService.remove('nav');
        turndownService.remove('footer');
        turndownService.remove('header');

        turndownService.addRule('citationLinks', {
            filter: (node) => {
                if (node.nodeType === 1) {
                    const el = node as HTMLElement;
                    return el.tagName === 'SUP' || el.classList.contains('citation');
                }
                return false;
            },
            replacement: (content) => {
                const match = content.match(/(\d+)/);
                return match ? `[${match[1]}]` : '';
            },
        });

        turndownService.addRule('stripButton', {
            filter: (node) => {
                if (node.nodeType === 1) {
                    return (node as HTMLElement).tagName === 'BUTTON';
                }
                return false;
            },
            replacement: () => '',
        });
    }
    return turndownService;
}

export function extractAssistantMarkdown(html: string): string {
    if (!html.trim()) return '';

    try {
        const markdown = getTurndown().turndown(html);
        return markdown.replace(/\n{3,}/g, '\n\n').trim();
    } catch {
        return html.replace(/<[^>]*>/g, '').trim();
    }
}
