/* eslint-disable @typescript-eslint/naming-convention */

import { SendMessageCommand } from '@aws-sdk/client-sqs';

import { type LoggerClient } from '../../../common/loggerClient.js';
import { type SqsClient } from '../../../common/sqsClient.js';
import { type ProcessorConfig } from '../../../config/processorConfig.js';
import { type UserRepository } from '../../../domain/repositories/userRepository/userRepository.js';

export class SendUsersMessagesAction {
  public constructor(
    private readonly userRepository: UserRepository,
    private readonly sqsClient: SqsClient,
    private readonly logger: LoggerClient,
    private readonly config: ProcessorConfig,
  ) {}

  public async execute(): Promise<void> {
    this.logger.debug({
      message: 'Sending Users messages...',
    });

    let startKey: Record<string, unknown> | undefined = undefined;

    do {
      const { users, lastEvaluatedKey } = await this.userRepository.findAllUsers({
        limit: 10,
        startKey,
      });

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
      );

      startKey = lastEvaluatedKey;
    } while (startKey);

    this.logger.debug({ message: 'Users messages sent.' });
  }
}
