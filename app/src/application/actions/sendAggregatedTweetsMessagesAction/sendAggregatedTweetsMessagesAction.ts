/* eslint-disable @typescript-eslint/naming-convention */

import { SendMessageCommand } from '@aws-sdk/client-sqs';

import { type LoggerService } from '../../../common/loggerService.js';
import { type RedisClient } from '../../../common/redisClient.js';
import { type SqsClient } from '../../../common/sqsClient.js';
import { type ProcessorConfig } from '../../../config/processorConfig.js';
import { type SubscriptionRepository } from '../../../domain/repositories/subscriptionRepository/subscriptionRepository.js';

interface SendAggregatedTweetsMessagesActionPayload {
  readonly userId: string;
  readonly email: string;
}

export class SendAggregatedTweetsMessagesAction {
  public constructor(
    private readonly subsriptionRepository: SubscriptionRepository,
    private readonly sqsClient: SqsClient,
    private readonly redisClient: RedisClient,
    private readonly logger: LoggerService,
    private readonly config: ProcessorConfig,
  ) {}

  public async execute(payload: SendAggregatedTweetsMessagesActionPayload): Promise<void> {
    const { userId } = payload;

    this.logger.debug({
      message: `Fetching User's subscription Twitter accounts...`,
      userId,
    });

    const subscriptions = await this.subsriptionRepository.findSubscriptions({ userId });

    const twitterSubscriptionAccounts = subscriptions.map((subscription) => subscription.twitterUsername);

    this.logger.debug({
      message: `User's subscription Twitter accounts fetched.`,
      tweeterSubscriptionAccounts: twitterSubscriptionAccounts,
      userId,
    });

    // TODO: check if their tweets are in cache

    // if not in cache, fetch tweets from Twitter API

    // aggregate tweets

    // send aggregated tweets to sqs

    await Promise.all(
      twitterSubscriptionAccounts.map(async (twitterAccount) => {
        const cachedTweets = await this.redisClient.get(twitterAccount);

        const command = new SendMessageCommand({
          QueueUrl: this.config.tweetsSqsUrl,
          MessageBody: JSON.stringify({}),
        });

        await this.sqsClient.send(command);
      }),
    ),
      this.logger.debug({ message: 'Users messages sent.' });
  }
}
