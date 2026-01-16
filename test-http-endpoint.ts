#!/usr/bin/env tsx

/**
 * Test the MCP server by adding a simple HTTP testing endpoint
 * This bypasses SSE complexity and directly tests the tools
 */

import express, { Request, Response } from 'express';
import { SlackFeedbackClient } from './src/slack-client.js';
import { executeTool } from './src/tools.js';

const app = express();
app.use(express.json());

// Environment variables
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_BRYAN_USER_ID = process.env.SLACK_BRYAN_USER_ID;
const FEEDBACK_CHANNEL_ID = process.env.FEEDBACK_CHANNEL_ID;
const TEAM_USER_IDS = process.env.TEAM_USER_IDS;
const PORT = process.env.PORT || 3001;

if (!SLACK_BOT_TOKEN || !SLACK_BRYAN_USER_ID || !FEEDBACK_CHANNEL_ID) {
  throw new Error('Missing required environment variables');
}

const teamUserIds = TEAM_USER_IDS ? TEAM_USER_IDS.split(',').map(id => id.trim()) : [];

const slackClient = new SlackFeedbackClient(
  SLACK_BOT_TOKEN,
  SLACK_BRYAN_USER_ID,
  FEEDBACK_CHANNEL_ID,
  teamUserIds
);

// Simple HTTP endpoint for testing
app.post('/test-tool', async (req: Request, res: Response) => {
  try {
    const { tool, args } = req.body;

    if (!tool) {
      return res.status(400).json({ error: 'tool name is required' });
    }

    console.log(`Testing tool: ${tool}`);
    console.log(`Args:`, args);

    const result = await executeTool(tool, args || {}, slackClient);

    res.json({
      success: true,
      tool,
      args,
      result
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
      tool: req.body.tool
    });
  }
});

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`\nTest with:`);
  console.log(`curl -X POST http://localhost:${PORT}/test-tool \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"tool": "get_stakeholder_feedback", "args": {"time_range": "last 7 hours", "stakeholder": "all"}}'`);
});
