# Slack Feedback MCP Server

MCP server for collecting product feedback from Bryan and others in the StartupOS Slack workspace.

## What It Does

This MCP server provides three tools for Claude Code:

1. **get_stakeholder_feedback** - Pull messages from Bryan (and others) with flexible date filtering
2. **get_thread_context** - Retrieve full conversation threads
3. **search_feedback** - Search feedback by keywords

## Setup Instructions

### Step 1: Create the Slack Channel

1. In your StartupOS Slack workspace, create a new channel: `#bryan-product-feedback`
2. Invite Bryan to the channel
3. Get the channel ID:
   - Right-click the channel name
   - Select "View channel details"
   - Scroll to the bottom and copy the Channel ID (starts with C...)

### Step 2: Get Bryan's User ID

1. Click on Bryan's profile in Slack
2. Click "More" → "Copy member ID"
3. Save this ID (starts with U...)

### Step 3: Create the Slack App

1. Go to https://api.slack.com/apps
2. Click "Create New App" → "From scratch"
3. Name: "Feedback Collector MCP"
4. Workspace: StartupOS
5. Click "Create App"

### Step 4: Configure Bot Permissions

1. In your app settings, go to "OAuth & Permissions"
2. Scroll to "Scopes" → "Bot Token Scopes"
3. Add these scopes:
   - `channels:history` - Read messages in public channels
   - `channels:read` - View basic channel info
   - `groups:history` - Read messages in private channels
   - `groups:read` - View basic private channel info
   - `users:read` - Get user info
   - `search:read` - Search messages

### Step 5: Install to Workspace

1. Scroll to the top of "OAuth & Permissions"
2. Click "Install to Workspace"
3. Click "Allow"
4. Copy the "Bot User OAuth Token" (starts with `xoxb-`)

### Step 6: Add Bot to Channel

1. Go to the `#bryan-product-feedback` channel in Slack
2. Type: `/invite @Feedback Collector MCP`
3. Press Enter

### Step 7: Deploy to Railway

#### Option A: Deploy from GitHub (Recommended)

1. Push this code to a GitHub repository
2. Go to https://railway.app and sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway will auto-detect the Node.js project

#### Option B: Deploy via CLI

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### Step 8: Set Environment Variables in Railway

In your Railway project dashboard:

1. Go to the "Variables" tab
2. Add these variables:
   - `SLACK_BOT_TOKEN` = your xoxb- token from Step 5
   - `SLACK_BRYAN_USER_ID` = Bryan's user ID from Step 2
   - `FEEDBACK_CHANNEL_ID` = channel ID from Step 1
   - `PORT` = 3000

3. Save and redeploy if needed

### Step 9: Get Your Railway URL

After deployment, Railway assigns you a public URL like:
```
https://slack-feedback-mcp-production-xxxx.up.railway.app
```

Copy this URL.

### Step 10: Configure Claude Code

Add to your Claude Code MCP settings file:

**Location**: `~/.claude/settings.json` or project `.mcp.json`

```json
{
  "mcpServers": {
    "slack-feedback": {
      "type": "sse",
      "url": "https://YOUR-RAILWAY-URL.up.railway.app/sse"
    }
  }
}
```

Replace `YOUR-RAILWAY-URL` with your actual Railway URL.

## Testing

Restart Claude Code and try:

- "Pull feedback from Bryan from the last 48 hours"
- "Search for feedback mentioning 'authentication'"
- "Get the full thread for this message" (when you have a thread_ts)

## Available Tools

### get_stakeholder_feedback

Pull messages from the feedback channel with date filtering.

**Parameters:**
- `time_range` (optional): "last 48 hours", "last 7 days", "today", "this week", etc.
- `stakeholder` (optional): "bryan" or "all" (default: "all")
- `channel_id` (optional): Specific channel to search

**Example:**
```
Pull Bryan's feedback from the last 2 days
```

### get_thread_context

Get full conversation thread including all replies.

**Parameters:**
- `channel_id` (required): Channel ID
- `thread_ts` (required): Parent message timestamp

**Example:**
```
Get the full thread for message ts: 1234567890.123456 in channel C0XXXXXXXXX
```

### search_feedback

Search Bryan's messages by keyword.

**Parameters:**
- `query` (required): Search keywords
- `time_range` (optional): Time range filter

**Example:**
```
Search Bryan's feedback for "login flow" from the last month
```

## Local Development

1. Copy `.env.example` to `.env`
2. Fill in your values
3. Run:

```bash
npm run dev
```

Server runs on `http://localhost:3000`

## Security Notes

- Never commit `.env` or tokens to git
- Slack bot token only has read permissions
- Railway environment variables are encrypted at rest

## Troubleshooting

**"Channel not found" error:**
- Make sure you invited the bot to the channel (`/invite @Feedback Collector MCP`)
- Verify the channel ID is correct

**"Not authorized" error:**
- Check that all required scopes are added in the Slack app settings
- Reinstall the app to workspace after adding scopes

**No messages returned:**
- Verify Bryan's user ID is correct
- Check that there are actually messages in the time range
- Try a longer time range like "last 30 days"

## Future Enhancements

The codebase is structured to support Claude-powered summarization and categorization of feedback. To enable this:

1. Add `ANTHROPIC_API_KEY` environment variable
2. Uncomment summarization logic in the tools
3. Add `@anthropic-ai/sdk` dependency

For now, raw messages are returned for maximum flexibility.
