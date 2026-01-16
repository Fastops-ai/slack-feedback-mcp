#!/usr/bin/env node

/**
 * Test script for the Slack Feedback MCP server
 * This simulates an MCP client calling the server
 */

const SERVER_URL = 'https://slack-feedback-mcp-production.up.railway.app/sse';

async function testMCPServer() {
  console.log('🧪 Testing Slack Feedback MCP Server...\n');

  // Test parameters
  const toolName = 'get_stakeholder_feedback';
  const args = {
    time_range: 'last 7 hours',
    stakeholder: 'all'
  };

  console.log('📋 Test Configuration:');
  console.log(`   Tool: ${toolName}`);
  console.log(`   Time Range: ${args.time_range}`);
  console.log(`   Stakeholder: ${args.stakeholder}`);
  console.log(`   Server: ${SERVER_URL}\n`);

  try {
    // Create EventSource connection (SSE)
    const EventSource = (await import('eventsource')).default;

    return new Promise((resolve, reject) => {
      const eventSource = new EventSource(SERVER_URL);
      let receivedEndpoint = false;

      eventSource.onopen = () => {
        console.log('✅ SSE connection established\n');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.jsonrpc === '2.0') {
            // This is an MCP message
            if (data.method === 'endpoint') {
              receivedEndpoint = true;
              console.log('📡 Received endpoint message from server');

              // Now send our tool call request
              const request = {
                jsonrpc: '2.0',
                id: 1,
                method: 'tools/call',
                params: {
                  name: toolName,
                  arguments: args
                }
              };

              console.log('\n📤 Sending tool call request...');
              // Note: With SSE, we can't send back through the EventSource
              // This is a limitation - we need to use the SDK properly
              console.log('⚠️  Note: Direct SSE testing is limited. Use MCP SDK client for full functionality.');
              eventSource.close();
              resolve({ status: 'connection_successful', note: 'Use MCP SDK for full testing' });
            } else if (data.result) {
              console.log('\n✅ Received result:');
              console.log(JSON.stringify(data.result, null, 2));
              eventSource.close();
              resolve(data.result);
            }
          }
        } catch (err) {
          console.error('Error parsing message:', err);
        }
      };

      eventSource.onerror = (error) => {
        console.error('❌ SSE Error:', error);
        eventSource.close();
        reject(error);
      };

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!receivedEndpoint) {
          console.error('⏱️  Timeout: No response from server');
          eventSource.close();
          reject(new Error('Timeout'));
        }
      }, 10000);
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

// Run the test
testMCPServer()
  .then((result) => {
    console.log('\n✅ Test completed successfully');
    if (result.messages) {
      console.log(`\n📊 Found ${result.count} messages`);
    }
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });
