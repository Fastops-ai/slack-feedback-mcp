# Slack Feedback MCP - Team Setup Guide

## Quick Start for Ahmed, Joel & Wilson

This MCP server lets you pull Bryan's product feedback directly in Claude Code conversations.

## Setup (5 minutes)

### Option 1: Project-Based Setup (Recommended)

The easiest way is to work from a project that already has the `.mcp.json` file:

1. **Clone/Navigate to the project directory**:
   ```bash
   cd "/path/to/Slack App for CC"
   ```

2. **Verify `.mcp.json` exists**:
   ```bash
   cat .mcp.json
   ```

   You should see:
   ```json
   {
     "mcpServers": {
       "slack-feedback": {
         "type": "sse",
         "url": "https://slack-feedback-mcp-production.up.railway.app/sse"
       }
     }
   }
   ```

3. **Enable the server in Claude Code**:
   - Start Claude Code in this directory
   - When prompted to enable MCP servers from `.mcp.json`, approve `slack-feedback`
   - The server will now be available in all conversations in this directory

### Option 2: Global Setup

To use the MCP server in ANY directory:

1. **Edit your global Claude Code settings**:
   ```bash
   code ~/.claude/mcp.json
   # or
   nano ~/.claude/mcp.json
   ```

2. **Add this configuration**:
   ```json
   {
     "mcpServers": {
       "slack-feedback": {
         "type": "sse",
         "url": "https://slack-feedback-mcp-production.up.railway.app/sse"
       }
     }
   }
   ```

3. **Restart Claude Code**

## Usage Examples

Once configured, use natural language in any Claude Code conversation:

```
Pull Bryan's feedback from the last 48 hours
```

```
Search feedback for "authentication" from the last week
```

```
Show me all feedback from today
```

```
Get feedback from the last 7 days and summarize the key themes
```

## Available Commands

The MCP server provides three tools that Claude can use automatically:

### 1. Get Stakeholder Feedback
- **What it does**: Pulls messages from the #bryan-product-feedback channel
- **Time ranges**: "last 7 hours", "last 48 hours", "last 7 days", "this week", "today"
- **Filters**: "bryan" for only Bryan's messages, or "all" for everyone

### 2. Search Feedback
- **What it does**: Searches feedback messages by keyword
- **Example**: "Find feedback mentioning 'login flow'"

### 3. Get Thread Context
- **What it does**: Retrieves full conversation threads
- **Use**: When you want to see all replies to a specific message

## Testing the Setup

After setup, test it with:

```
Pull feedback from the last 7 hours
```

You should see Claude automatically use the `slack-feedback` MCP server and return recent messages from the #bryan-product-feedback channel.

## Troubleshooting

### "MCP server not found"
- Make sure you approved the server when prompted
- Check that `.mcp.json` exists in your project directory OR `~/.claude/mcp.json` for global setup
- Restart Claude Code

### "No messages returned"
- The time range might not have any messages
- Try a longer time range like "last 7 days"
- Verify the server is running: https://slack-feedback-mcp-production.up.railway.app/health

### "Connection error"
- Check your internet connection
- Verify Railway server is up: https://slack-feedback-mcp-production.up.railway.app/health
- Contact Nick if the server is down

## Direct API Testing (Optional)

You can also test the server directly without Claude Code:

```bash
curl -X POST https://slack-feedback-mcp-production.up.railway.app/test-tool \
  -H "Content-Type: application/json" \
  -d '{"tool":"get_stakeholder_feedback","args":{"time_range":"last 7 hours","stakeholder":"all"}}' | jq '.result'
```

## Server Details

- **Server URL**: https://slack-feedback-mcp-production.up.railway.app
- **Health Check**: https://slack-feedback-mcp-production.up.railway.app/health
- **Repository**: [github.com/Fastops-ai/slack-feedback-mcp](https://github.com/Fastops-ai/slack-feedback-mcp)
- **Slack Channel**: #bryan-product-feedback

## Benefits

- **Faster spec/plan/build cycles**: Pull Bryan's notes directly into Claude Code
- **Context-aware development**: Claude can reference recent feedback when writing code
- **No context switching**: Stay in your development flow
- **Always up-to-date**: Live connection to Slack, no manual copying

## Questions?

Contact Nick if you run into any issues or need help with setup.
