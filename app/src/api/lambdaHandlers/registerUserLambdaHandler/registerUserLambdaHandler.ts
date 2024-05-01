import { Type } from '@sinclair/typebox';
import { Value, TransformDecodeCheckError } from '@sinclair/typebox/value';
import { type APIGatewayEvent, type Handler, type ProxyResult } from 'aws-lambda';

import { RegisterUserAction } from '../../../application/actions/registerUserAction/registerUserAction.js';
import { HashService } from '../../../application/services/hashService/hashService.js';
import { DynamoDbClientFactory } from '../../../common/dynamoDbClient.js';
import { ResourceAlreadyExistsError } from '../../../common/errors/resourceAlreadyExistsError.js';
import { LoggerServiceFactory } from '../../../common/loggerService.js';
import { ConfigFactory } from '../../../config/config.js';
import { UserRepository } from '../../../domain/repositories/userRepository/userRepository.js';

const dynamoDbClient = DynamoDbClientFactory.create();

const userRepository = new UserRepository(dynamoDbClient);

const config = ConfigFactory.create();

const logger = LoggerServiceFactory.create({
  logLevel: config.logLevel,
});

const hashService = new HashService({ hashSaltRounds: config.hashSaltRounds });

const action = new RegisterUserAction(userRepository, hashService, logger);

const bodySchema = Type.Object({
  email: Type.String(),
  password: Type.String(),
});

export const lambda: Handler = async (event: APIGatewayEvent): Promise<ProxyResult> => {
  try {
    const body = JSON.parse(event.body as string);

    const { email, password } = Value.Decode(bodySchema, body);

    await action.execute({
      email,
      password,
    });

    return {
      statusCode: 200,
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

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal Server Error',
      }),
    };
  }
};
