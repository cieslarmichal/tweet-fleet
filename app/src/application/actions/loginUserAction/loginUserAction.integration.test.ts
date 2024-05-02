import { beforeEach, expect, it, describe, afterEach } from 'vitest';

import { LoginUserAction } from './loginUserAction.js';
import { DynamoDbClientFactory } from '../../../common/dynamoDbClient.js';
import { OperationNotValidError } from '../../../common/errors/operationNotValidError.js';
import { LoggerServiceFactory } from '../../../common/loggerService.js';
import { type Config, ConfigFactory } from '../../../config/config.js';
import { UserRepository } from '../../../domain/repositories/userRepository/userRepository.js';
import { UserTestFactory } from '../../../tests/factories/userTestFactory.js';
import { UserTestUtils } from '../../../tests/utils/userTestUtils.js';
import { HashService } from '../../services/hashService/hashService.js';
import { TokenService } from '../../services/tokenService/tokenService.js';

describe('LoginUserAction', () => {
  let loginUserAction: LoginUserAction;

  let userTestUtils: UserTestUtils;

  let hashService: HashService;

  let tokenService: TokenService;

  let config: Config;

  beforeEach(async () => {
    const dynamodbClient = DynamoDbClientFactory.create({ endpoint: 'http://127.0.0.1:4566' });

    const userRepository = new UserRepository(dynamodbClient);

    config = ConfigFactory.create();

    hashService = new HashService({ hashSaltRounds: config.hashSaltRounds });

    const logger = LoggerServiceFactory.create({ logLevel: config.logLevel });

    tokenService = new TokenService({ jwtSecret: config.jwtSecret });

    loginUserAction = new LoginUserAction(userRepository, hashService, tokenService, logger, config);

    userTestUtils = new UserTestUtils(dynamodbClient);

    await userTestUtils.truncate();
  });

  afterEach(async () => {
    await userTestUtils.truncate();
  });

  it('returns tokens', async () => {
    const user = UserTestFactory.create();

    const hashedPassword = await hashService.hash({ plainData: user.password });

    await userTestUtils.createAndPersist({
      input: {
        id: user.id,
        email: user.email,
        password: hashedPassword,
      },
    });

    const { accessToken, expiresIn } = await loginUserAction.execute({
      email: user.email,
      password: user.password,
    });

    const accessTokenPayload = tokenService.verifyToken({ token: accessToken });

    expect(accessTokenPayload['userId']).toBe(user.id);

    expect(expiresIn).toBe(config.jwtExpiration);
  });

  it('throws an error if a User with given email does not exist', async () => {
    const { email, password } = UserTestFactory.create();

    try {
      await loginUserAction.execute({
        email,
        password,
      });
    } catch (error) {
      expect(error instanceof OperationNotValidError).toBe(true);

      return;
    }

    expect.fail();
  });

  it(`throws an error if User's password does not match stored password`, async () => {
    const { email } = await userTestUtils.createAndPersist();

    const { password: invalidPassword } = UserTestFactory.create();

    try {
      await loginUserAction.execute({
        email,
        password: invalidPassword,
      });
    } catch (error) {
      expect(error instanceof OperationNotValidError).toBe(true);

      return;
    }

    expect.fail();
  });
});
