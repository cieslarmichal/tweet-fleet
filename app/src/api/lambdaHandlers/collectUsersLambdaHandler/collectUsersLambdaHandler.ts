import { type Handler } from 'aws-lambda';

import { SendUsersMessagesAction } from '../../../application/actions/sendUsersMessagesAction/sendUsersMessagesAction.js';
import { DynamoDbClientFactory } from '../../../common/dynamoDbClient.js';
import { LoggerServiceFactory } from '../../../common/loggerService.js';
import { SqsClientFactory } from '../../../common/sqsClient.js';
import { ConfigFactory } from '../../../config/config.js';
import { UserRepository } from '../../../domain/repositories/userRepository/userRepository.js';

const dynamoDbClient = DynamoDbClientFactory.create();

const userRepository = new UserRepository(dynamoDbClient);

const sqsClient = SqsClientFactory.create();

const config = ConfigFactory.create();

const logger = LoggerServiceFactory.create({
  logLevel: config.logLevel,
});

const action = new SendUsersMessagesAction(userRepository, sqsClient, logger, config);

export const lambda: Handler = async (): Promise<void> => {
  try {
    await action.execute();
  } catch (error) {
    logger.error({
      message: 'Error while processing event.',
      error,
    });

    throw error;
  }
};
