import { Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { type APIGatewayEvent, type Handler, type ProxyResult } from 'aws-lambda';

import { CreateSubscriptionAction } from '../../../application/actions/createSubscriptionAction/createSubscriptionAction.js';
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

const action = new CreateSubscriptionAction(subscriptionRepository, logger);

const bodySchema = Type.Object({
  userId: Type.String(),
  twitterUsername: Type.String(),
});

export const lambda: Handler = async (event: APIGatewayEvent): Promise<ProxyResult> => {
  const authorizationHeader = event.headers['Authorization'];

  await accessControlService.verifyBearerToken({ authorizationHeader });

  const body = JSON.parse(event.body as string);

  const { userId, twitterUsername } = Value.Decode(bodySchema, body);

  await action.execute({
    userId,
    twitterUsername,
  });

  return {
    statusCode: 201,
    body: '',
  };
};
