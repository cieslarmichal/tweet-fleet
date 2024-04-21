/* eslint-disable @typescript-eslint/naming-convention */

import { faker } from '@faker-js/faker';
import { type StatusesUserTimeline, type TwitterClient } from 'twitter-api-client';

import { type Tweet } from './tweet.js';

export interface FetchTweetsFromLast24HoursPayload {
  readonly username: string;
}

export class TokenService {
  public constructor(private readonly twitterClient: TwitterClient) {}

  public async fetchFakeTweetsFromLast24Hours(payload: FetchTweetsFromLast24HoursPayload): Promise<Tweet[]> {
    const { username } = payload;

    return Array.from({ length: 10 }, (): Tweet => {
      const id = faker.string.uuid();

      return {
        id,
        text: faker.lorem.sentence(),
        createdAt: faker.date.past().toISOString(),
        urls: [faker.internet.url()],
        selfUrl: `https://twitter.com/${username}/status/${id}`,
        author: {
          id: faker.string.uuid(),
          name: faker.person.fullName(),
          username,
          profileImageUrl: faker.image.avatar(),
        },
      };
    });
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
      id: status.id_str,
      text: status.full_text || status.text,
      createdAt: status.created_at,
      urls: status.entities.urls.map((url) => url.expanded_url),
      selfUrl: `https://twitter.com/${status.user.screen_name}/status/${status.id_str}`,
      author: {
        id: status.user.id_str,
        name: status.user.name,
        username: status.user.screen_name,
        profileImageUrl: status.user.profile_image_url_https,
      },
    };
  }
}
