import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as Tools from "./tools";
import * as Resources from "./resources";
import { RESOURCE_METADATA, TOOL_DESCRIPTIONS } from "./constants";
import { addBrandClaimSchema, analyzeBrandVisibilitySchema, createBrandEntitySchema, generateLlmsTxtSchema, getShareOfModelSchema, listProjectsSchema } from "./schemas";

const server = new McpServer({
    name: 'mentha',
    version: '1.0.0',
});

server.registerTool(
    'analyze_brand_visibility',
    {
        description: TOOL_DESCRIPTIONS.analyzeBrandVisibility,
        inputSchema: analyzeBrandVisibilitySchema,
    },
    Tools.analyzeBrandVisibility
);

server.registerTool(
    'get_share_of_model',
    {
        description: TOOL_DESCRIPTIONS.getShareOfModel,
        inputSchema: getShareOfModelSchema,
    },
    Tools.getShareOfModel
);

server.registerTool(
    'create_brand_entity',
    {
        description: TOOL_DESCRIPTIONS.createBrandEntity,
        inputSchema: createBrandEntitySchema,
    },
    Tools.createBrandEntity
);

server.registerTool(
    'add_brand_claim',
    {
        description: TOOL_DESCRIPTIONS.addBrandClaim,
        inputSchema: addBrandClaimSchema,
    },
    Tools.addBrandClaim
);

server.registerTool(
    'generate_llms_txt',
    {
        description: TOOL_DESCRIPTIONS.generateLlmsTxt,
        inputSchema: generateLlmsTxtSchema,
    },
    Tools.generateLlmsTxt
);

server.registerTool(
    'list_projects',
    {
        description: TOOL_DESCRIPTIONS.listProjects,
        inputSchema: listProjectsSchema,
    },
    Tools.listProjects
);

server.registerResource(
    'llms-txt',
    'mentha://llms.txt',
    RESOURCE_METADATA.llmsTxt,
    Resources.readLlmsTxt
);

server.registerResource(
    'entity',
    'mentha://entity/{slug}',
    RESOURCE_METADATA.entity,
    Resources.readEntity
);

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Mentha MCP Server running on stdio');
}

main().catch(console.error);
