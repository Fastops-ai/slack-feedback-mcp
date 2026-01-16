import { SlackFeedbackClient } from './slack-client.js';

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

/**
 * MCP Tool Definitions
 */
export const tools: ToolDefinition[] = [
  {
    name: 'get_stakeholder_feedback',
    description: 'Pull product feedback messages from Bryan and others in the feedback channel. Supports flexible date filtering like "last 48 hours", "last 7 days", "today", "this week".',
    inputSchema: {
      type: 'object',
      properties: {
        time_range: {
          type: 'string',
          description: 'Natural language time range (e.g., "last 48 hours", "last 7 days", "today", "this week"). Defaults to "last 7 days".',
          default: 'last 7 days'
        },
        stakeholder: {
          type: 'string',
          enum: ['bryan', 'all'],
          description: 'Filter by stakeholder. "bryan" for only Bryan\'s messages, "all" for everyone in the channel. Defaults to "all".',
          default: 'all'
        },
        channel_id: {
          type: 'string',
          description: 'Optional: Specific channel ID to search. If not provided, uses the default feedback channel.'
        }
      }
    }
  },
  {
    name: 'get_thread_context',
    description: 'Given a message timestamp, retrieve the full conversation thread including all replies. Useful for understanding the context around a specific piece of feedback.',
    inputSchema: {
      type: 'object',
      properties: {
        channel_id: {
          type: 'string',
          description: 'The channel ID containing the thread'
        },
        thread_ts: {
          type: 'string',
          description: 'The timestamp of the parent message (from the ts or thread_ts field of a message)'
        }
      },
      required: ['channel_id', 'thread_ts']
    }
  },
  {
    name: 'search_feedback',
    description: 'Search Bryan\'s feedback messages by keyword. Returns matching messages with optional time range filtering.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search keywords or phrase to find in feedback messages'
        },
        time_range: {
          type: 'string',
          description: 'Optional: Natural language time range to filter results (e.g., "last 48 hours", "last 30 days")'
        }
      },
      required: ['query']
    }
  }
];

/**
 * Execute MCP tool calls
 */
export async function executeTool(
  toolName: string,
  args: any,
  slackClient: SlackFeedbackClient
): Promise<any> {
  switch (toolName) {
    case 'get_stakeholder_feedback': {
      const messages = await slackClient.getStakeholderFeedback(
        args.time_range || 'last 7 days',
        args.stakeholder || 'all',
        args.channel_id
      );

      return {
        messages: messages.map(msg => ({
          author: msg.username,
          user_id: msg.user,
          timestamp: msg.ts,
          text: msg.text,
          thread_ts: msg.thread_ts,
          channel: msg.channel,
          permalink: msg.permalink,
          is_thread_parent: msg.thread_ts === msg.ts
        })),
        count: messages.length,
        time_range: args.time_range || 'last 7 days',
        stakeholder: args.stakeholder || 'all'
      };
    }

    case 'get_thread_context': {
      const thread = await slackClient.getThreadContext(
        args.channel_id,
        args.thread_ts
      );

      return {
        thread: thread.map(msg => ({
          author: msg.username,
          user_id: msg.user,
          timestamp: msg.ts,
          text: msg.text,
          permalink: msg.permalink
        })),
        message_count: thread.length,
        parent_ts: args.thread_ts
      };
    }

    case 'search_feedback': {
      const results = await slackClient.searchFeedback(
        args.query,
        args.time_range
      );

      return {
        results: results.map(msg => ({
          author: msg.username,
          user_id: msg.user,
          timestamp: msg.ts,
          text: msg.text,
          thread_ts: msg.thread_ts,
          channel: msg.channel,
          permalink: msg.permalink
        })),
        count: results.length,
        query: args.query,
        time_range: args.time_range
      };
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
