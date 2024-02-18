import { beforeEach, expect, it, describe } from 'vitest';
import { UserRepository } from './userRepository.js';
import { UserTestFactory } from '../../tests/factories/userTestFactory.js';
import { UserTestUtils } from '../../tests/utils/userTestUtils.js';
import { DynamoDbClientFactory } from '../../common/dynamoDbClient.js';

describe('UserRepository', () => {
  let userRepository: UserRepository;
  let userTestUtils: UserTestUtils;

  beforeEach(async () => {
    const dynamodbClient = DynamoDbClientFactory.create({ endpoint: 'http://127.0.0.1:4566' });

    userRepository = new UserRepository(dynamodbClient);

    userTestUtils = new UserTestUtils(dynamodbClient);
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

      const foundUser = await userRepository.findUserById({ id: user.id });

      expect(foundUser).toBeDefined();
    });

    it('returns undefined if a User with given id does not exist', async () => {
      const { id } = UserTestFactory.create();

      const foundUser = await userRepository.findUserById({ id });

      expect(foundUser).toBeUndefined();
    });
  });
});
