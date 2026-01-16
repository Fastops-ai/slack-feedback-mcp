import { WebClient } from '@slack/web-api';
import { subDays, subHours, startOfDay, startOfWeek, startOfMonth } from 'date-fns';

export interface SlackMessage {
  user: string;
  username?: string;
  text: string;
  ts: string;
  thread_ts?: string;
  channel: string;
  permalink?: string;
}

export class SlackFeedbackClient {
  private client: WebClient;
  private bryanUserId: string;
  private feedbackChannelId: string;
  private teamUserIds: string[];

  constructor(token: string, bryanUserId: string, feedbackChannelId: string, teamUserIds?: string[]) {
    this.client = new WebClient(token);
    this.bryanUserId = bryanUserId;
    this.feedbackChannelId = feedbackChannelId;
    this.teamUserIds = teamUserIds || [];
  }

  /**
   * Parse natural language time ranges into Unix timestamps
   */
  private parseTimeRange(timeRange: string): number {
    const now = new Date();
    const lowerRange = timeRange.toLowerCase().trim();

    // Handle "last X hours"
    const hoursMatch = lowerRange.match(/last (\d+) hours?/);
    if (hoursMatch) {
      return Math.floor(subHours(now, parseInt(hoursMatch[1])).getTime() / 1000);
    }

    // Handle "last X days"
    const daysMatch = lowerRange.match(/last (\d+) days?/);
    if (daysMatch) {
      return Math.floor(subDays(now, parseInt(daysMatch[1])).getTime() / 1000);
    }

    // Handle common phrases
    if (lowerRange.includes('today')) {
      return Math.floor(startOfDay(now).getTime() / 1000);
    }
    if (lowerRange.includes('week')) {
      return Math.floor(startOfWeek(now).getTime() / 1000);
    }
    if (lowerRange.includes('month')) {
      return Math.floor(startOfMonth(now).getTime() / 1000);
    }

    // Default to last 7 days
    return Math.floor(subDays(now, 7).getTime() / 1000);
  }

  /**
   * Get username from user ID
   */
  private async getUsername(userId: string): Promise<string> {
    try {
      const result = await this.client.users.info({ user: userId });
      return result.user?.real_name || result.user?.name || userId;
    } catch (error) {
      console.error('Error fetching username:', error);
      return userId;
    }
  }

  /**
   * Get feedback messages from Bryan (and others) in the feedback channel
   */
  async getStakeholderFeedback(
    timeRange: string = 'last 7 days',
    stakeholder: 'bryan' | 'all' = 'all',
    channelId?: string
  ): Promise<SlackMessage[]> {
    const oldest = this.parseTimeRange(timeRange);
    const channel = channelId || this.feedbackChannelId;

    try {
      const result = await this.client.conversations.history({
        channel: channel,
        oldest: oldest.toString(),
        limit: 1000
      });

      if (!result.messages) {
        return [];
      }

      // Filter messages based on stakeholder
      let messages = result.messages;
      if (stakeholder === 'bryan') {
        messages = messages.filter(msg => msg.user === this.bryanUserId);
      }

      // Convert to our format
      const formattedMessages: SlackMessage[] = await Promise.all(
        messages.map(async (msg) => {
          const username = msg.user ? await this.getUsername(msg.user) : 'Unknown';

          // Get permalink if possible
          let permalink: string | undefined;
          try {
            const linkResult = await this.client.chat.getPermalink({
              channel: channel,
              message_ts: msg.ts!
            });
            permalink = linkResult.permalink;
          } catch (error) {
            // Permalink fetch failed, continue without it
          }

          return {
            user: msg.user || 'unknown',
            username,
            text: msg.text || '',
            ts: msg.ts!,
            thread_ts: msg.thread_ts,
            channel: channel,
            permalink
          };
        })
      );

      return formattedMessages.sort((a, b) => parseFloat(b.ts) - parseFloat(a.ts));
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw new Error(`Failed to fetch feedback: ${error}`);
    }
  }

  /**
   * Get full thread context for a message
   */
  async getThreadContext(channelId: string, threadTs: string): Promise<SlackMessage[]> {
    try {
      const result = await this.client.conversations.replies({
        channel: channelId,
        ts: threadTs
      });

      if (!result.messages) {
        return [];
      }

      const formattedMessages: SlackMessage[] = await Promise.all(
        result.messages.map(async (msg) => {
          const username = msg.user ? await this.getUsername(msg.user) : 'Unknown';

          let permalink: string | undefined;
          try {
            const linkResult = await this.client.chat.getPermalink({
              channel: channelId,
              message_ts: msg.ts!
            });
            permalink = linkResult.permalink;
          } catch (error) {
            // Continue without permalink
          }

          return {
            user: msg.user || 'unknown',
            username,
            text: msg.text || '',
            ts: msg.ts!,
            thread_ts: msg.thread_ts,
            channel: channelId,
            permalink
          };
        })
      );

      return formattedMessages;
    } catch (error) {
      console.error('Error fetching thread:', error);
      throw new Error(`Failed to fetch thread: ${error}`);
    }
  }

  /**
   * Search for feedback by keyword
   */
  async searchFeedback(
    query: string,
    timeRange?: string
  ): Promise<SlackMessage[]> {
    try {
      // Build search query - search in the feedback channel
      let searchQuery = `in:<#${this.feedbackChannelId}> ${query}`;

      const result = await this.client.search.messages({
        query: searchQuery,
        count: 100
      });

      if (!result.messages?.matches) {
        return [];
      }

      // Filter by time range if specified
      let matches = result.messages.matches;
      if (timeRange) {
        const oldest = this.parseTimeRange(timeRange);
        matches = matches.filter(msg => parseFloat(msg.ts!) >= oldest);
      }

      // Convert to our format
      const formattedMessages: SlackMessage[] = await Promise.all(
        matches.map(async (msg) => {
          const username = msg.username || (msg.user ? await this.getUsername(msg.user) : 'Unknown');

          return {
            user: msg.user || 'unknown',
            username,
            text: msg.text || '',
            ts: msg.ts!,
            thread_ts: msg.thread_ts,
            channel: msg.channel?.id || '',
            permalink: msg.permalink
          };
        })
      );

      return formattedMessages.sort((a, b) => parseFloat(b.ts) - parseFloat(a.ts));
    } catch (error) {
      console.error('Error searching messages:', error);
      throw new Error(`Failed to search feedback: ${error}`);
    }
  }
}
