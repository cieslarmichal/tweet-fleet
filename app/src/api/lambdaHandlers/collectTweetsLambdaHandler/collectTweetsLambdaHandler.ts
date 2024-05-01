import { type Handler } from 'aws-lambda';

import { SendSubscriptionTweetsMessagesAction } from '../../../application/actions/sendSubscriptionTweetsMessagesAction/sendSubscriptionTweetsMessagesAction.js';
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

const action = new SendSubscriptionTweetsMessagesAction(userRepository, sqsClient, logger, config);

export const lambda: Handler = async (): Promise<void> => {
  await action.execute();
};
