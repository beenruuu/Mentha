export const TOOL_DESCRIPTIONS = {
    generateLlmsTxt: `Generate the llms.txt content for a brand.
Use this when the user wants to see what AI-readable content would be served.
Returns: formatted Markdown optimized for LLM consumption.`,

    listProjects: `List all Mentha projects/brands being monitored.
Use this to discover available projects before running other operations.`,

    geoAudit: `Full GEO (Generative Engine Optimization) audit for a URL.
Analyzes how well a brand is optimized for AI search engines:
ChatGPT, Perplexity, Gemini, and Claude.
Returns: scores per platform, citability analysis, recommendations.`,

    analyzeCitability: `Analyze content citability for AI engines.
Scores how likely content is to be cited by AI assistants
based on clarity, factual density, structure, and brand entity.`,

    scanBrandMentions: `Scan brand mentions across AI platforms.
Checks how a brand is mentioned in ChatGPT, Perplexity,
Gemini, and Claude responses.`,

    analyzeCrawlers: `Analyze AI crawler access via robots.txt.
Checks which AI crawlers (GPTBot, ClaudeBot, PerplexityBot, etc.)
are allowed or blocked for a domain.`,
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
