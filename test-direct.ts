#!/usr/bin/env tsx

/**
 * Direct test of the Slack client without MCP
 * This tests the underlying Slack API functionality
 */

import { SlackFeedbackClient } from './src/slack-client.js';
import { executeTool } from './src/tools.js';

// Get environment variables from Railway (you'll need to set these locally to test)
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_BRYAN_USER_ID = process.env.SLACK_BRYAN_USER_ID;
const FEEDBACK_CHANNEL_ID = process.env.FEEDBACK_CHANNEL_ID;
const TEAM_USER_IDS = process.env.TEAM_USER_IDS;

if (!SLACK_BOT_TOKEN || !SLACK_BRYAN_USER_ID || !FEEDBACK_CHANNEL_ID) {
  console.error('❌ Missing required environment variables:');
  console.error('   SLACK_BOT_TOKEN, SLACK_BRYAN_USER_ID, FEEDBACK_CHANNEL_ID');
  console.error('\n💡 These should be set in your Railway deployment.');
  console.error('   For local testing, create a .env file from .env.example\n');
  process.exit(1);
}

async function testDirectly() {
  console.log('🧪 Testing Slack Feedback Client Directly...\n');

  const teamUserIds = TEAM_USER_IDS ? TEAM_USER_IDS.split(',').map(id => id.trim()) : [];

  // Initialize Slack client
  const slackClient = new SlackFeedbackClient(
    SLACK_BOT_TOKEN,
    SLACK_BRYAN_USER_ID,
    FEEDBACK_CHANNEL_ID,
    teamUserIds
  );

  try {
    console.log('📞 Calling get_stakeholder_feedback...');
    console.log('   Time range: last 7 hours');
    console.log('   Stakeholder: all\n');

    const result = await executeTool(
      'get_stakeholder_feedback',
      {
        time_range: 'last 7 hours',
        stakeholder: 'all'
      },
      slackClient
    );

    console.log(`✅ Success!\n`);
    console.log(`📊 Summary:`);
    console.log(`   Messages found: ${result.count}`);
    console.log(`   Time range: ${result.time_range}`);
    console.log(`   Stakeholder: ${result.stakeholder}\n`);

    if (result.messages && result.messages.length > 0) {
      console.log(`📝 Messages:\n`);
      result.messages.forEach((msg: any, idx: number) => {
        console.log(`${idx + 1}. From: ${msg.author} (${new Date(parseFloat(msg.timestamp) * 1000).toLocaleString()})`);
        console.log(`   Text: ${msg.text.substring(0, 150)}${msg.text.length > 150 ? '...' : ''}`);
        if (msg.permalink) {
          console.log(`   Link: ${msg.permalink}`);
        }
        console.log('');
      });

      console.log('\n📄 Full JSON Response:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('ℹ️  No messages found in the last 7 hours');
      console.log('\n💡 Try a longer time range like "last 24 hours" or "last 7 days"');
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      if ('data' in error) {
        console.error('   Details:', JSON.stringify((error as any).data, null, 2));
      }
    }
    throw error;
  }
}

// Run the test
testDirectly()
  .then(() => {
    console.log('\n✅ Test completed successfully');
  })
  .catch((error) => {
    console.error('\n❌ Test failed');
    process.exit(1);
  });
