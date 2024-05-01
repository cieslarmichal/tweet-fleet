import { Type } from '@sinclair/typebox';
import { Value, TransformDecodeCheckError } from '@sinclair/typebox/value';
import { type APIGatewayEvent, type Handler, type ProxyResult } from 'aws-lambda';

import { DeleteSubscriptionAction } from '../../../application/actions/deleteSubscriptionAction/deleteSubscriptionAction.js';
import { TokenService } from '../../../application/services/tokenService/tokenService.js';
import { DynamoDbClientFactory } from '../../../common/dynamoDbClient.js';
import { OperationNotValidError } from '../../../common/errors/operationNotValidError.js';
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

const action = new DeleteSubscriptionAction(subscriptionRepository, logger);

const pathParamsSchema = Type.Object({
  id: Type.String(),
});

export const lambda: Handler = async (event: APIGatewayEvent): Promise<ProxyResult> => {
  try {
    const authorizationHeader = event.headers['Authorization'];

    await accessControlService.verifyBearerToken({ authorizationHeader });

    const { id } = Value.Decode(pathParamsSchema, event.pathParameters);

    await action.execute({ id });

    return {
      statusCode: 204,
      body: '',
    };
  } catch (error) {
    logger.error({
      message: 'Error while processing event.',
      error,
      event,
    });

    if (error instanceof OperationNotValidError) {
      return {
        statusCode: 422,
        body: JSON.stringify({
          name: error.name,
          message: error.message,
          context: error.context,
        }),
      };
    }

    if (error instanceof TransformDecodeCheckError) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          name: error.name,
          message: error.message,
        }),
      };
    }

    if (error instanceof UnauthorizedAccessError) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          name: error.name,
          message: error.message,
          context: error.context,
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
