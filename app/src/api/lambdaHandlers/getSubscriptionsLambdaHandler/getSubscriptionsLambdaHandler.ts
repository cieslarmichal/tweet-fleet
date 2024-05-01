import { Type } from '@sinclair/typebox';
import { type APIGatewayEvent, type Handler, type ProxyResult } from 'aws-lambda';

import { DeleteSubscriptionAction } from '../../../application/actions/deleteSubscriptionAction/deleteSubscriptionAction.js';
import { TokenService } from '../../../application/services/tokenService/tokenService.js';
import { DynamoDbClientFactory } from '../../../common/dynamoDbClient.js';
import { LoggerServiceFactory } from '../../../common/loggerService.js';
import { ConfigFactory } from '../../../config/config.js';
import { SubscriptionRepository } from '../../../domain/repositories/subscriptionRepository/subscriptionRepository.js';
import { AccessControlService } from '../../services/accessControlService/accessControlService.js';

const dynamoDbClient = DynamoDbClientFactory.create();

const subscriptionRepository = new SubscriptionRepository(dynamoDbClient);

const config = ConfigFactory.create();

const logger = LoggerServiceFactory.create({
  logLevel: config.logLevel,
});

const tokenService = new TokenService({ jwtSecret: config.jwtSecret });

const accessControlService = new AccessControlService(tokenService);

const action = new DeleteSubscriptionAction(subscriptionRepository, logger);

const pathParamsSchema = Type.Object({
  id: Type.String(),
});

export const lambda: Handler = async (event: APIGatewayEvent): Promise<ProxyResult> => {
  const authorizationHeader = event.headers['Authorization'];

  const { userId } = await accessControlService.verifyBearerToken({ authorizationHeader });

  await action.execute({ id });

  // const { userId } = await verifyAccessTokenQuery.verifyAccessToken({ accessToken: accessToken as string });

  // const { messages } = await findMessagesQueryImpl.findMessages({ userId: userId as string });

  return {
    statusCode: 201,
    body: JSON.stringify({}),
  };
};
