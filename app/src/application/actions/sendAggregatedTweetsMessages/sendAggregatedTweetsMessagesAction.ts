/* eslint-disable @typescript-eslint/naming-convention */

import { SendMessageCommand } from '@aws-sdk/client-sqs';

import { type LoggerClient } from '../../../common/loggerClient.js';
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
    private readonly logger: LoggerClient,
    private readonly config: ProcessorConfig,
  ) {}

  public async execute(payload: SendAggregatedTweetsMessagesActionPayload): Promise<void> {
    const { userId } = payload;

    this.logger.debug({
      message: `Fetching User's subscription Twitter accounts...`,
      userId,
    });

    const subscriptions = await this.subsriptionRepository.findSubscriptions({ userId });

    const tweeterSubscriptionAccounts = subscriptions.map((subscription) => subscription.twitterUsername);

    this.logger.debug({
      message: `User's subscription Twitter accounts fetched.`,
      tweeterSubscriptionAccounts,
      userId,
    });

    // TODO: check if their tweets are in cache

    // if not in cache, fetch tweets from Twitter API

    // aggregate tweets

    // send aggregated tweets to sqs

    await Promise.all(
      users.map(async (user) => {
        const command = new SendMessageCommand({
          QueueUrl: this.config.usersSqsUrl,
          MessageBody: JSON.stringify({
            id: user.id,
            email: user.email,
          }),
        });

        await this.sqsClient.send(command);
      }),
    ),
      this.logger.debug({ message: 'Users messages sent.' });
  }
}
