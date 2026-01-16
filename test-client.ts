#!/usr/bin/env tsx

/**
 * MCP Client for testing the Slack Feedback MCP server
 * This uses the official MCP SDK to properly test the server
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

const SERVER_URL = 'https://slack-feedback-mcp-production.up.railway.app/sse';

async function testMCPServer() {
  console.log('🧪 Testing Slack Feedback MCP Server...\n');
  console.log(`📡 Server: ${SERVER_URL}\n`);

  // Create MCP client
  const client = new Client(
    {
      name: 'test-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  try {
    // Create SSE transport
    console.log('🔌 Connecting to MCP server...');
    const transport = new SSEClientTransport(new URL(SERVER_URL));

    // Connect to server
    await client.connect(transport);
    console.log('✅ Connected to MCP server\n');

    // List available tools
    console.log('📋 Listing available tools...');
    const toolsResponse = await client.listTools();
    console.log(`✅ Found ${toolsResponse.tools.length} tools:\n`);

    toolsResponse.tools.forEach((tool, idx) => {
      console.log(`${idx + 1}. ${tool.name}`);
      console.log(`   ${tool.description}\n`);
    });

    // Call get_stakeholder_feedback tool with "last 7 hours"
    console.log('📞 Calling get_stakeholder_feedback tool...');
    console.log('   Parameters:');
    console.log('   - time_range: "last 7 hours"');
    console.log('   - stakeholder: "all"\n');

    const result = await client.callTool({
      name: 'get_stakeholder_feedback',
      arguments: {
        time_range: 'last 7 hours',
        stakeholder: 'all'
      }
    });

    console.log('✅ Received response:\n');

    // Parse the result
    if (result.content && result.content.length > 0) {
      const content = result.content[0];
      if (content.type === 'text') {
        const data = JSON.parse(content.text);

        console.log(`📊 Summary:`);
        console.log(`   Messages found: ${data.count}`);
        console.log(`   Time range: ${data.time_range}`);
        console.log(`   Stakeholder filter: ${data.stakeholder}\n`);

        if (data.messages && data.messages.length > 0) {
          console.log(`📝 Messages:\n`);
          data.messages.forEach((msg: any, idx: number) => {
            console.log(`${idx + 1}. From: ${msg.author} (${new Date(parseFloat(msg.timestamp) * 1000).toLocaleString()})`);
            console.log(`   Text: ${msg.text.substring(0, 100)}${msg.text.length > 100 ? '...' : ''}`);
            if (msg.permalink) {
              console.log(`   Link: ${msg.permalink}`);
            }
            console.log('');
          });
        } else {
          console.log('ℹ️  No messages found in the last 7 hours');
        }

        console.log('\n✅ Full response data:');
        console.log(JSON.stringify(data, null, 2));
      }
    }

    // Close connection
    await client.close();
    console.log('\n✅ Test completed successfully');

  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  }
}

// Run the test
testMCPServer()
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
