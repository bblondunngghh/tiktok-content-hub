import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { initDatabase } from './db/database.js';
import { logger } from './utils/logger.js';

import * as getAccountOverview from './tools/get-account-overview.js';
import * as getVideoAnalytics from './tools/get-video-analytics.js';
import * as getTopPerformingContent from './tools/get-top-performing-content.js';
import * as getPostingInsights from './tools/get-posting-insights.js';

const tools = [
  getAccountOverview,
  getVideoAnalytics,
  getTopPerformingContent,
  getPostingInsights,
];

const server = new Server(
  {
    name: 'tiktok-analytics',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools.map(t => t.definition),
  };
});

// Execute tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: unknown;

    switch (name) {
      case 'get-account-overview': {
        const input = getAccountOverview.schema.parse(args || {});
        result = await getAccountOverview.execute(input);
        break;
      }
      case 'get-video-analytics': {
        const input = getVideoAnalytics.schema.parse(args || {});
        result = await getVideoAnalytics.execute(input);
        break;
      }
      case 'get-top-performing-content': {
        const input = getTopPerformingContent.schema.parse(args || {});
        result = await getTopPerformingContent.execute(input);
        break;
      }
      case 'get-posting-insights': {
        const input = getPostingInsights.schema.parse(args || {});
        result = await getPostingInsights.execute(input);
        break;
      }
      default:
        return {
          content: [{ type: 'text' as const, text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Tool ${name} failed:`, message);
    return {
      content: [{ type: 'text' as const, text: `Error: ${message}` }],
      isError: true,
    };
  }
});

async function main() {
  logger.info('Starting TikTok Analytics MCP Server...');

  // Initialize database
  initDatabase();

  // Connect via stdio
  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info('MCP Server connected and ready');
}

main().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
