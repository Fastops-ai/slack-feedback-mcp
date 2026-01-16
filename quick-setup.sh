#!/bin/bash

# Quick setup script for Slack Feedback MCP Server
# For Ahmed, Joel, Wilson, and the team

set -e

echo "🚀 Slack Feedback MCP Server - Quick Setup"
echo "=========================================="
echo ""

# Check if Claude Code is installed
if ! command -v claude &> /dev/null; then
    echo "❌ Claude Code not found. Please install Claude Code first."
    echo "   Visit: https://claude.ai/download"
    exit 1
fi

echo "✅ Claude Code found"
echo ""

# Ask setup preference
echo "Choose setup option:"
echo "  1) Project-based (only works in this directory)"
echo "  2) Global (works everywhere)"
echo ""
read -p "Enter choice (1 or 2): " choice

if [ "$choice" = "1" ]; then
    echo ""
    echo "📝 Setting up project-based MCP configuration..."

    # Check if .mcp.json already exists in parent directory
    if [ -f "../.mcp.json" ]; then
        echo "✅ .mcp.json already exists in parent directory"
        cat ../.mcp.json
    else
        echo "Creating .mcp.json in parent directory..."
        cat > ../.mcp.json << 'EOF'
{
  "mcpServers": {
    "slack-feedback": {
      "type": "sse",
      "url": "https://slack-feedback-mcp-production.up.railway.app/sse"
    }
  }
}
EOF
        echo "✅ Created ../.mcp.json"
    fi

    echo ""
    echo "✅ Setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Start Claude Code in the parent directory: cd .. && claude"
    echo "2. When prompted, approve the 'slack-feedback' MCP server"
    echo "3. Test it: 'Pull feedback from the last 7 hours'"

elif [ "$choice" = "2" ]; then
    echo ""
    echo "📝 Setting up global MCP configuration..."

    # Create .claude directory if it doesn't exist
    mkdir -p ~/.claude

    # Check if mcp.json already exists
    if [ -f ~/.claude/mcp.json ]; then
        echo "⚠️  ~/.claude/mcp.json already exists"
        echo ""
        cat ~/.claude/mcp.json
        echo ""
        read -p "Add slack-feedback to existing config? (y/n): " confirm

        if [ "$confirm" = "y" ]; then
            # Backup existing config
            cp ~/.claude/mcp.json ~/.claude/mcp.json.backup
            echo "✅ Backed up to ~/.claude/mcp.json.backup"

            # Add slack-feedback using jq if available
            if command -v jq &> /dev/null; then
                jq '.mcpServers["slack-feedback"] = {"type": "sse", "url": "https://slack-feedback-mcp-production.up.railway.app/sse"}' \
                    ~/.claude/mcp.json > ~/.claude/mcp.json.tmp
                mv ~/.claude/mcp.json.tmp ~/.claude/mcp.json
                echo "✅ Added slack-feedback to config"
            else
                echo "⚠️  jq not found. Please manually add this to ~/.claude/mcp.json:"
                echo ""
                echo '  "slack-feedback": {'
                echo '    "type": "sse",'
                echo '    "url": "https://slack-feedback-mcp-production.up.railway.app/sse"'
                echo '  }'
            fi
        fi
    else
        echo "Creating ~/.claude/mcp.json..."
        cat > ~/.claude/mcp.json << 'EOF'
{
  "mcpServers": {
    "slack-feedback": {
      "type": "sse",
      "url": "https://slack-feedback-mcp-production.up.railway.app/sse"
    }
  }
}
EOF
        echo "✅ Created ~/.claude/mcp.json"
    fi

    echo ""
    echo "✅ Setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Restart Claude Code if it's running"
    echo "2. Start Claude Code in any directory: claude"
    echo "3. Test it: 'Pull feedback from the last 7 hours'"

else
    echo "❌ Invalid choice. Please run again and select 1 or 2."
    exit 1
fi

echo ""
echo "📚 For more info, see TEAM_SETUP.md"
echo ""
echo "🧪 Test the server directly:"
echo "curl -s https://slack-feedback-mcp-production.up.railway.app/health | jq '.'"
echo ""
