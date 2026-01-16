# Share This With the Team

## Quick Summary for Ahmed, Joel, and Wilson

Hey team! I set up an MCP server that lets you pull Bryan's product feedback directly in Claude Code. No more context switching to Slack - just ask Claude to pull the latest feedback and it'll show up in your conversation.

## What You Get

- Pull Bryan's feedback with natural language: "Get feedback from the last 2 days"
- Search feedback by keyword: "Find feedback about authentication"
- See full thread context for any message
- All while staying in your Claude Code workflow

## Setup (Takes 2 minutes)

### Super Quick Way

1. **Clone the repo** (if you haven't):
   ```bash
   git clone https://github.com/Fastops-ai/slack-feedback-mcp.git
   cd slack-feedback-mcp
   ```

2. **Run the setup script**:
   ```bash
   ./quick-setup.sh
   ```

3. **Choose option 2** (Global setup) so it works everywhere

4. **Restart Claude Code**

5. **Test it**:
   ```
   Pull feedback from the last 7 hours
   ```

### Manual Setup (If you prefer)

Add this to `~/.claude/mcp.json`:

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

Restart Claude Code and you're good to go.

## Example Usage

Once set up, just talk to Claude normally:

```
Pull Bryan's feedback from the last 48 hours
```

Claude will automatically fetch it from Slack and show you the messages.

```
Search feedback for "dark mode" from the last week
```

Gets all messages mentioning "dark mode" from the past week.

```
Show me today's feedback and summarize the key requests
```

Gets today's feedback and Claude will summarize it for you.

## Why This Is Useful

- **Faster spec/plan/build**: Claude can reference Bryan's actual feedback when planning features
- **No context switching**: Stay in your dev environment
- **Always current**: Live connection to #bryan-product-feedback channel
- **Natural language**: Just ask Claude what you need

## Server Info

- **Status**: https://slack-feedback-mcp-production.up.railway.app/health
- **Repo**: https://github.com/Fastops-ai/slack-feedback-mcp
- **Slack Channel**: #bryan-product-feedback

## Questions?

Ping Nick if something doesn't work or you need help.

---

**More details**: See [TEAM_SETUP.md](./TEAM_SETUP.md) for complete documentation and troubleshooting.
