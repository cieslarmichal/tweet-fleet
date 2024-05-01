/* eslint-disable @typescript-eslint/naming-convention */

import { PurgeQueueCommand, ReceiveMessageCommand } from '@aws-sdk/client-sqs';

import { type SqsClient } from '../../common/sqsClient.js';
import { type Tweet } from '../../common/types/tweet.js';

export interface TweetQueueMessage {
  readonly tweets: Tweet[];
  readonly email: string;
}

export class TweetQueueTestUtils {
  private readonly tweetQueueUrl = 'http://sqs.eu-central-1.localhost.localstack.cloud:4566/000000000000/tweets';

  public constructor(private readonly sqsClient: SqsClient) {}

  public async fetchMessages(): Promise<TweetQueueMessage[]> {
    const command = new ReceiveMessageCommand({
      QueueUrl: this.tweetQueueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 1,
    });

    const response = await this.sqsClient.send(command);

    if (!response.Messages) {
      return [];
    }

    return response.Messages.map((message) => JSON.parse(message.Body as string) as TweetQueueMessage);
  }

  public async purge(): Promise<void> {
    await this.sqsClient.send(new PurgeQueueCommand({ QueueUrl: this.tweetQueueUrl }));
  }
}
