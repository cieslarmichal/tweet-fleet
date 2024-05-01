import { Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { type APIGatewayEvent, type Handler, type ProxyResult } from 'aws-lambda';

import { LoginUserAction } from '../../../application/actions/loginUserAction/loginUserAction.js';
import { HashService } from '../../../application/services/hashService/hashService.js';
import { TokenService } from '../../../application/services/tokenService/tokenService.js';
import { DynamoDbClientFactory } from '../../../common/dynamoDbClient.js';
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

const tokenService = new TokenService({ jwtSecret: config.jwtSecret });

const action = new LoginUserAction(userRepository, hashService, tokenService, logger, config);

const bodySchema = Type.Object({
  email: Type.String(),
  password: Type.String(),
});

export const lambda: Handler = async (event: APIGatewayEvent): Promise<ProxyResult> => {
  const body = JSON.parse(event.body as string);

  const { email, password } = Value.Decode(bodySchema, body);

  const { accessToken, expiresIn } = await action.execute({
    email,
    password,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      accessToken,
      expiresIn,
    }),
  };
};
