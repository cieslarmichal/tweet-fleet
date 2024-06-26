import { faker } from '@faker-js/faker';
import { beforeEach, expect, it, describe, afterEach } from 'vitest';

import { FindUserSubscriptionsAction } from './findUserSubscriptionsAction.js';
import { DynamoDbClientFactory } from '../../../common/dynamoDbClient.js';
import { LoggerServiceFactory } from '../../../common/loggerService.js';
import { SubscriptionRepository } from '../../../domain/repositories/subscriptionRepository/subscriptionRepository.js';
import { UserRepository } from '../../../domain/repositories/userRepository/userRepository.js';
import { SubscriptionTestUtils } from '../../../tests/utils/subscriptionTestUtils.js';
import { UserTestUtils } from '../../../tests/utils/userTestUtils.js';

describe('FindUserSubscriptionsAction', () => {
  let findUserSubscriptionsAction: FindUserSubscriptionsAction;

  let subscriptionTestUtils: SubscriptionTestUtils;

  let userTestUtils: UserTestUtils;

  beforeEach(async () => {
    const dynamodbClient = DynamoDbClientFactory.create({ endpoint: 'http://127.0.0.1:4566' });

    const subscriptionRepository = new SubscriptionRepository(dynamodbClient);

    const userRepository = new UserRepository(dynamodbClient);

    const logger = LoggerServiceFactory.create({ logLevel: 'debug' });

    findUserSubscriptionsAction = new FindUserSubscriptionsAction(userRepository, subscriptionRepository, logger);

    subscriptionTestUtils = new SubscriptionTestUtils(dynamodbClient);

    userTestUtils = new UserTestUtils(dynamodbClient);

    await subscriptionTestUtils.truncate();

    await userTestUtils.truncate();
  });

  afterEach(async () => {
    await subscriptionTestUtils.truncate();

    await userTestUtils.truncate();
  });

  it('fetches User Subscriptions', async () => {
    const user = await userTestUtils.createAndPersist();

    const subscription = await subscriptionTestUtils.createAndPersist({ input: { userId: user.id } });

    const { subscriptions } = await findUserSubscriptionsAction.execute({ userId: user.id });

    expect(subscriptions).toEqual([subscription]);
  });

  it('throws an error when a User does not exist', async () => {
    const userId = faker.string.uuid();

    try {
      await findUserSubscriptionsAction.execute({ userId });
    } catch (error) {
      expect(error).toBeDefined();

      return;
    }

    expect.fail();
  });
});
