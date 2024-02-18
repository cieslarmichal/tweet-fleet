import { beforeEach, afterEach, expect, it, describe } from 'vitest';
import { RegisterUserAction } from './registerUserAction.js';
import { UserTestUtils } from '../../../tests/utils/userTestUtils.js';
import { UserRepository } from '../../../domain/repositories/userRepository.js';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { LoggerClientFactory } from '../../../common/loggerClient.js';
import { config } from '../../../config/config.js';
import { HashService } from '../../services/hashService/hashService.js';
import { UserTestFactory } from '../../../tests/factories/userTestFactory.js';

describe('RegisterUserAction', () => {
  let registerUserAction: RegisterUserAction;
  let userTestUtils: UserTestUtils;
  let hashService: HashService;

  beforeEach(async () => {
    const dynamodbClient = new DynamoDBClient({ endpoint: 'http://127.0.0.1:4566' });

    const userRepository = new UserRepository(dynamodbClient);

    hashService = new HashService({ hashSaltRounds: config.hashSaltRounds });

    const logger = LoggerClientFactory.create({ logLevel: config.logLevel });

    registerUserAction = new RegisterUserAction(userRepository, hashService, logger);

    userTestUtils = new UserTestUtils(dynamodbClient);

    await userTestUtils.truncate();
  });

  afterEach(async () => {
    await userTestUtils.truncate();
  });

  it('creates a User', async () => {
    const { email, password } = UserTestFactory.create();

    await registerUserAction.execute({
      email,
      password,
    });

    const foundUser = await userTestUtils.findByEmail({ email });

    expect(foundUser).toBeDefined();

    const passwordMatches = await hashService.compare({
      plainData: password,
      hashedData: foundUser?.password as string,
    });

    expect(passwordMatches).toBe(true);
  });

  it('throws an error when a User with the same email already exists', async () => {
    const { email, password } = await userTestUtils.createAndPersist();

    try {
      await registerUserAction.execute({
        email,
        password,
      });
    } catch (error) {
      expect(error).toBeDefined();

      return;
    }

    expect.fail();
  });
});
