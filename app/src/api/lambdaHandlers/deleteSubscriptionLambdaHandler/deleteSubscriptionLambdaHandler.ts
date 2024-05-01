import { Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
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

  await accessControlService.verifyBearerToken({ authorizationHeader });

  const { id } = Value.Decode(pathParamsSchema, event.pathParameters);

  await action.execute({ id });

  return {
    statusCode: 204,
    body: '',
  };
};
