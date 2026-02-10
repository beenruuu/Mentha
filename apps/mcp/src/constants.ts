export const TOOL_DESCRIPTIONS = {
    analyzeBrandVisibility: `Analyze how a brand appears in AI-generated responses.
Use this when the user wants to know if their brand is mentioned by ChatGPT, Perplexity, or other AI assistants when users ask relevant questions.
Returns: visibility status, sentiment score, recommendation type, and competitor comparison.`,

    getShareOfModel: `Get the "Share of Model" metrics for a brand over time.
Use this when the user wants to see their brand's visibility trends across AI platforms.
Returns: visibility rate, sentiment trends, and comparison by engine.`,

    createBrandEntity: `Create or update a brand entity in the Knowledge Graph.
Use this when the user wants to define their brand for AEO optimization.
This creates structured data that can be served via JSON-LD and llms.txt.`,

    addBrandClaim: `Add a verified claim/fact about a brand.
Use this when the user wants to establish factual statements about their brand.
Claims are used in JSON-LD and llms.txt to train AI understanding.`,

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
