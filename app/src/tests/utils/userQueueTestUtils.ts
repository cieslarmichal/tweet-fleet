/* eslint-disable @typescript-eslint/naming-convention */

import { PurgeQueueCommand, ReceiveMessageCommand } from '@aws-sdk/client-sqs';

import { type SqsClient } from '../../common/sqsClient.js';

export interface UserQueueMessage {
  readonly id: string;
  readonly email: string;
}

export class UserQueueTestUtils {
  private readonly userQueueUrl = 'http://sqs.eu-central-1.localhost.localstack.cloud:4566/000000000000/users';

  public constructor(private readonly sqsClient: SqsClient) {}

  public async fetchMessages(): Promise<UserQueueMessage[]> {
    const command = new ReceiveMessageCommand({
      QueueUrl: this.userQueueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 1,
    });

    const response = await this.sqsClient.send(command);

    if (!response.Messages) {
      return [];
    }

    return response.Messages.map((message) => JSON.parse(message.Body as string) as UserQueueMessage);
  }

  public async purge(): Promise<void> {
    await this.sqsClient.send(new PurgeQueueCommand({ QueueUrl: this.userQueueUrl }));
  }
}
