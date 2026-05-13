import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import dotenv from 'dotenv';

dotenv.config();

import { RESOURCE_METADATA, TOOL_DESCRIPTIONS } from './constants';
import * as Resources from './resources';
import {
    brandMentionsSchema,
    citabilitySchema,
    crawlerAnalysisSchema,
    generateLlmsTxtSchema,
    geoAuditSchema,
    listProjectsSchema,
} from './schemas';
import {
    analyzeCitability,
    analyzeCrawlers,
    generateLlmsTxt,
    geoAudit,
    listProjects,
    scanBrandMentions,
} from './tools';

const server = new McpServer({
    name: 'mentha',
    version: '1.0.0',
});

// ─── Tools existentes ───────────────────────────────────────────────
server.registerTool(
    'generate_llms_txt',
    {
        description: TOOL_DESCRIPTIONS.generateLlmsTxt,
        inputSchema: generateLlmsTxtSchema,
    },
    generateLlmsTxt,
);

server.registerTool(
    'list_projects',
    {
        description: TOOL_DESCRIPTIONS.listProjects,
        inputSchema: listProjectsSchema,
    },
    listProjects,
);

// ─── Nuevas GEO/AEO Tools ──────────────────────────────────────────
server.registerTool(
    'geo_audit',
    {
        description: TOOL_DESCRIPTIONS.geoAudit,
        inputSchema: geoAuditSchema,
    },
    geoAudit,
);

server.registerTool(
    'analyze_citability',
    {
        description: TOOL_DESCRIPTIONS.analyzeCitability,
        inputSchema: citabilitySchema,
    },
    analyzeCitability,
);

server.registerTool(
    'scan_brand_mentions',
    {
        description: TOOL_DESCRIPTIONS.scanBrandMentions,
        inputSchema: brandMentionsSchema,
    },
    scanBrandMentions,
);

server.registerTool(
    'analyze_crawlers',
    {
        description: TOOL_DESCRIPTIONS.analyzeCrawlers,
        inputSchema: crawlerAnalysisSchema,
    },
    analyzeCrawlers,
);

// ─── Resources ──────────────────────────────────────────────────────
server.registerResource(
    'llms-txt',
    'mentha://llms.txt',
    RESOURCE_METADATA.llmsTxt,
    Resources.readLlmsTxt,
);
server.registerResource(
    'entity',
    'mentha://entity/{slug}',
    RESOURCE_METADATA.entity,
    Resources.readEntity,
);

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Mentha MCP Server running on stdio');
}

main().catch(console.error);
