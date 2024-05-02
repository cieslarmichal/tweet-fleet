/* eslint-disable @typescript-eslint/naming-convention */

import { faker } from '@faker-js/faker';
import { type StatusesUserTimeline, type TwitterClient } from 'twitter-api-client';

import { type Tweet } from '../../../common/types/tweet.js';
import { TweetTestFactory } from '../../../tests/factories/tweetTestFactory.js';

export interface FetchTweetsFromLast24HoursPayload {
  readonly username: string;
}

export class TwitterService {
  public constructor(private readonly twitterClient: TwitterClient) {}

  public async fetchFakeTweetsFromLast24Hours(payload: FetchTweetsFromLast24HoursPayload): Promise<Tweet[]> {
    const { username } = payload;

    return Array.from(
      {
        length: faker.number.int({
          min: 1,
          max: 10,
        }),
      },
      (): Tweet => TweetTestFactory.create(username),
    );
  }

  public async fetchTweetsFromLast24Hours(payload: FetchTweetsFromLast24HoursPayload): Promise<Tweet[]> {
    const { username } = payload;

    const oneDayAgo = new Date();

    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const tweets = await this.twitterClient.tweets.statusesUserTimeline({
      screen_name: username,
      count: 200, // Fetch up to 200 tweets, which is the maximum allowed by the API
    });

    const recentTweets = tweets.filter((tweet) => {
      const tweetDate = new Date(tweet.created_at);

      return tweetDate > oneDayAgo;
    });

    return recentTweets.map(this.mapToTweet);
  }

  private mapToTweet(status: StatusesUserTimeline): Tweet {
    return {
      text: status.full_text || status.text,
      createdAt: status.created_at,
      selfUrl: `https://twitter.com/${status.user.screen_name}/status/${status.id_str}`,
      author: {
        name: status.user.name,
        username: status.user.screen_name,
      },
    };
  }
}
