import { Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { type APIGatewayEvent, type Handler, type ProxyResult } from 'aws-lambda';

import { CreateSubscriptionAction } from '../../../application/actions/createSubscriptionAction/createSubscriptionAction.js';
import { TokenService } from '../../../application/services/tokenService/tokenService.js';
import { DynamoDbClientFactory } from '../../../common/dynamoDbClient.js';
import { ResourceAlreadyExistsError } from '../../../common/errors/resourceAlreadyExistsError.js';
import { UnauthorizedAccessError } from '../../../common/errors/unathorizedAccessError.js';
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
  try {
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
  } catch (error) {
    logger.error({
      message: 'Error while processing event.',
      error,
      event,
    });

    if (error instanceof ResourceAlreadyExistsError) {
      return {
        statusCode: 409,
        body: JSON.stringify({
          message: 'Conflict',
          reason: error.message,
        }),
      };
    }

    if (error instanceof UnauthorizedAccessError) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          message: 'Unauthorized',
          reason: error.message,
        }),
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal Server Error',
      }),
    };
  }
};
