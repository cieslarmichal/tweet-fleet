import { beforeEach, afterEach, expect, it, describe } from 'vitest';
import { UserRepository } from './userRepository.js';
import { UserTestFactory } from '../../tests/factories/userTestFactory.js';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { UserTestUtils } from '../../tests/utils/userTestUtils.js';

describe('UserRepository', () => {
  let userRepository: UserRepository;
  let userTestUtils: UserTestUtils;

  beforeEach(async () => {
    const dynamodbClient = new DynamoDBClient({ endpoint: 'http://127.0.0.1:4566' });

    userRepository = new UserRepository(dynamodbClient);

    userTestUtils = new UserTestUtils(dynamodbClient);

    await userTestUtils.truncate();
  });

  afterEach(async () => {
    await userTestUtils.truncate();
  });

  describe('Create', () => {
    it('creates a User', async () => {
      const { email, password } = UserTestFactory.create();

      await userRepository.createUser({
        email,
        password,
      });

      const foundUser = await userTestUtils.findByEmail({ email });

      expect(foundUser?.email).toEqual(email);

      expect(foundUser?.password).toEqual(password);
    });
  });

  describe('Find', () => {
    it('finds a User by id', async () => {
      const user = await userTestUtils.createAndPersist();

      const foundUser = await userRepository.findUser({ id: user.id });

      expect(foundUser).toBeDefined();
    });

    it('returns undefined if a User with given id does not exist', async () => {
      const { id } = UserTestFactory.create();

      const foundUser = await userRepository.findUser({ id });

      expect(foundUser).toBeUndefined();
    });
  });
});
