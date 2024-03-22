import { TwitterClient } from 'twitter-api-client';

export interface TwitterClientConfig {
  readonly apiKey: string;
  readonly apiSecret: string;
  readonly accessToken: string;
  readonly accessTokenSecret: string;
}

export class TwitterClientFactory {
  public static create(config: TwitterClientConfig): TwitterClient {
    return new TwitterClient({
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      accessToken: config.accessToken,
      accessTokenSecret: config.accessTokenSecret,
    });
  }
}
