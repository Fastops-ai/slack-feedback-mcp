import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import express, { Request, Response } from 'express';
import { SlackFeedbackClient } from './slack-client.js';
import { tools, executeTool } from './tools.js';

// Environment variables
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_BRYAN_USER_ID = process.env.SLACK_BRYAN_USER_ID;
const FEEDBACK_CHANNEL_ID = process.env.FEEDBACK_CHANNEL_ID;
const TEAM_USER_IDS = process.env.TEAM_USER_IDS; // Optional: comma-separated list
const PORT = process.env.PORT || 3000;

// Validate environment variables
if (!SLACK_BOT_TOKEN) {
  throw new Error('SLACK_BOT_TOKEN environment variable is required');
}
if (!SLACK_BRYAN_USER_ID) {
  throw new Error('SLACK_BRYAN_USER_ID environment variable is required');
}
if (!FEEDBACK_CHANNEL_ID) {
  throw new Error('FEEDBACK_CHANNEL_ID environment variable is required');
}

// Parse team user IDs if provided
const teamUserIds = TEAM_USER_IDS ? TEAM_USER_IDS.split(',').map(id => id.trim()) : [];

// Initialize Slack client
const slackClient = new SlackFeedbackClient(
  SLACK_BOT_TOKEN,
  SLACK_BRYAN_USER_ID,
  FEEDBACK_CHANNEL_ID,
  teamUserIds
);

// Create Express app
const app = express();

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// SSE endpoint for MCP
app.get('/sse', async (req: Request, res: Response) => {
  console.log('New SSE connection established');

  // Create a new MCP server instance for this connection
  const server = new Server(
    {
      name: 'slack-feedback-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tool handlers
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      const result = await executeTool(name, args || {}, slackClient);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: errorMessage }, null, 2),
          },
        ],
        isError: true,
      };
    }
  });

  // Create SSE transport
  const transport = new SSEServerTransport('/sse', res);
  await server.connect(transport);

  // Handle client disconnect
  req.on('close', () => {
    console.log('SSE connection closed');
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`MCP Server running on port ${PORT}`);
  console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`\nEnvironment:`);
  console.log(`- Feedback Channel ID: ${FEEDBACK_CHANNEL_ID}`);
  console.log(`- Bryan User ID: ${SLACK_BRYAN_USER_ID}`);
});
