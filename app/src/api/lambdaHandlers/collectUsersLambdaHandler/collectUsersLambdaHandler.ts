import { type Handler } from 'aws-lambda';

import { SendUsersMessagesAction } from '../../../application/actions/sendUsersMessagesAction/sendUsersMessagesAction.js';
import { DynamoDbClientFactory } from '../../../common/dynamoDbClient.js';
import { LoggerServiceFactory } from '../../../common/loggerService.js';
import { SqsClientFactory } from '../../../common/sqsClient.js';
import { ProcessorConfigFactory } from '../../../config/processorConfig.js';
import { UserRepository } from '../../../domain/repositories/userRepository/userRepository.js';

const dynamoDbClient = DynamoDbClientFactory.create();

const userRepository = new UserRepository(dynamoDbClient);

const sqsClient = SqsClientFactory.create();

const config = ProcessorConfigFactory.create();

const loggerClient = LoggerServiceFactory.create({
  logLevel: config.logLevel,
});

const action = new SendUsersMessagesAction(userRepository, sqsClient, loggerClient, config);

export const lambda: Handler = async (): Promise<void> => {
  await action.execute();
};
