import { type APIGatewayEvent, type Handler, type ProxyResult } from 'aws-lambda';

import { FindUserSubscriptionsAction } from '../../../application/actions/findUserSubscriptionsAction/findUserSubscriptionsAction.js';
import { TokenService } from '../../../application/services/tokenService/tokenService.js';
import { DynamoDbClientFactory } from '../../../common/dynamoDbClient.js';
import { LoggerServiceFactory } from '../../../common/loggerService.js';
import { ConfigFactory } from '../../../config/config.js';
import { SubscriptionRepository } from '../../../domain/repositories/subscriptionRepository/subscriptionRepository.js';
import { UserRepository } from '../../../domain/repositories/userRepository/userRepository.js';
import { AccessControlService } from '../../services/accessControlService/accessControlService.js';

const dynamoDbClient = DynamoDbClientFactory.create();

const userRepository = new UserRepository(dynamoDbClient);

const subscriptionRepository = new SubscriptionRepository(dynamoDbClient);

const config = ConfigFactory.create();

const logger = LoggerServiceFactory.create({
  logLevel: config.logLevel,
});

const tokenService = new TokenService({ jwtSecret: config.jwtSecret });

const accessControlService = new AccessControlService(tokenService);

const action = new FindUserSubscriptionsAction(userRepository, subscriptionRepository, logger);

export const lambda: Handler = async (event: APIGatewayEvent): Promise<ProxyResult> => {
  const authorizationHeader = event.headers['Authorization'];

  const { userId } = await accessControlService.verifyBearerToken({ authorizationHeader });

  const { subscriptions } = await action.execute({ userId });

  return {
    statusCode: 200,
    body: JSON.stringify({ data: subscriptions }),
  };
};
