export const TOOL_DESCRIPTIONS = {
    generateLlmsTxt: `Generate the llms.txt content for a brand.
Use this when the user wants to see what AI-readable content would be served.
Returns: formatted Markdown optimized for LLM consumption.`,

    listProjects: `List all Mentha projects/brands being monitored.
Use this to discover available projects before running other operations.`,
} as const;

export const RESOURCE_METADATA = {
    llmsTxt: {
        title: 'AI-Readable Brand Content',
        description: 'The llms.txt content for consumption by language models',
        mimeType: 'text/plain',
    },
    entity: {
        title: 'Brand Entity',
        description: 'Knowledge Graph entity data',
        mimeType: 'application/json',
    },
} as const;
