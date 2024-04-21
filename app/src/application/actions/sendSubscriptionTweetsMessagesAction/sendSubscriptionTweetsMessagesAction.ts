/* eslint-disable @typescript-eslint/naming-convention */

import { SendMessageCommand } from '@aws-sdk/client-sqs';

import { type LoggerService } from '../../../common/loggerService.js';
import { type RedisClient } from '../../../common/redisClient.js';
import { type SqsClient } from '../../../common/sqsClient.js';
import { type Tweet } from '../../../common/types/tweet.js';
import { type ProcessorConfig } from '../../../config/processorConfig.js';
import { type SubscriptionRepository } from '../../../domain/repositories/subscriptionRepository/subscriptionRepository.js';
import { type TwitterService } from '../../services/twitterService/twitterService.js';

interface SendSubscriptionTweetsMessagesActionPayload {
  readonly userId: string;
  readonly email: string;
}

export class SendSubscriptionTweetsMessagesAction {
  public constructor(
    private readonly subsriptionRepository: SubscriptionRepository,
    private readonly sqsClient: SqsClient,
    private readonly redisClient: RedisClient,
    private readonly twitterService: TwitterService,
    private readonly logger: LoggerService,
    private readonly config: ProcessorConfig,
  ) {}

  public async execute(payload: SendSubscriptionTweetsMessagesActionPayload): Promise<void> {
    const { userId, email } = payload;

    this.logger.debug({
      message: `Fetching User's subscription Twitter accounts...`,
      userId,
      email,
    });

    const subscriptions = await this.subsriptionRepository.findSubscriptions({ userId });

    const twitterSubscriptionAccounts = subscriptions.map((subscription) => subscription.twitterUsername);

    this.logger.debug({
      message: `User's subscription Twitter accounts fetched.`,
      accounts: twitterSubscriptionAccounts,
      userId,
    });

    await Promise.all(
      twitterSubscriptionAccounts.map(async (twitterAccount) => {
        const cachedTweets = await this.redisClient.get(twitterAccount);

        let tweets: Tweet[] = [];

        if (cachedTweets) {
          this.logger.debug({
            message: 'Found cached tweets.',
            userId,
            twitterAccount,
          });

          tweets = JSON.parse(cachedTweets) as Tweet[];
        } else {
          this.logger.debug({
            message: 'Fetching tweets from Twitter API.',
            userId,
            twitterAccount,
          });

          tweets = await this.twitterService.fetchFakeTweetsFromLast24Hours({ username: twitterAccount });

          this.logger.debug({
            message: 'Tweets fetched from Twitter API.',
            userId,
            twitterAccount,
            count: tweets.length,
          });

          await this.redisClient.set(twitterAccount, JSON.stringify(tweets));
        }

        const command = new SendMessageCommand({
          QueueUrl: this.config.tweetsSqsUrl,
          MessageBody: JSON.stringify({
            tweets,
            email,
          }),
        });

        await this.sqsClient.send(command);
      }),
    ),
      this.logger.debug({
        message: `User's subscription tweets messages sent.`,
        userId,
        email,
        count: twitterSubscriptionAccounts.length,
      });
  }
}
