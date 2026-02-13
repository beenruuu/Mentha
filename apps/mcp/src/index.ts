import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { RESOURCE_METADATA, TOOL_DESCRIPTIONS } from './constants';
import * as Resources from './resources';
import { generateLlmsTxtSchema, listProjectsSchema } from './schemas';
import * as Tools from './tools';

const server = new McpServer({
    name: 'mentha',
    version: '1.0.0',
});

server.registerTool(
    'generate_llms_txt',
    {
        description: TOOL_DESCRIPTIONS.generateLlmsTxt,
        inputSchema: generateLlmsTxtSchema,
    },
    Tools.generateLlmsTxt,
);

server.registerTool(
    'list_projects',
    {
        description: TOOL_DESCRIPTIONS.listProjects,
        inputSchema: listProjectsSchema,
    },
    Tools.listProjects,
);

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
