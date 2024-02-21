import { faker } from '@faker-js/faker';
import { beforeEach, expect, it, describe } from 'vitest';

import { SubscriptionRepository } from './subscriptionRepository.js';
import { DynamoDbClientFactory } from '../../../common/dynamoDbClient.js';
import { SubscriptionTestFactory } from '../../../tests/factories/subscriptionTestFactory.js';
import { SubscriptionTestUtils } from '../../../tests/utils/subscriptionTestUtils.js';

describe('SubscriptionRepository', () => {
  let subscriptionRepository: SubscriptionRepository;

  let subscriptionTestUtils: SubscriptionTestUtils;

  beforeEach(async () => {
    const dynamodbClient = DynamoDbClientFactory.create({ endpoint: 'http://127.0.0.1:4566' });

    subscriptionRepository = new SubscriptionRepository(dynamodbClient);

    subscriptionTestUtils = new SubscriptionTestUtils(dynamodbClient);
  });

  describe('Create', () => {
    it('creates a Subscription', async () => {
      const { twitterUsername, userId } = SubscriptionTestFactory.create();

      const subscription = await subscriptionRepository.createSubscription({
        twitterUsername,
        userId,
      });

      const foundSubscription = await subscriptionTestUtils.findById({ id: subscription.id });

      expect(foundSubscription?.userId).toEqual(userId);

      expect(foundSubscription?.twitterUsername).toEqual(twitterUsername);
    });
  });

  describe('Find', () => {
    it('find Subscriptions', async () => {
      const userId = faker.string.uuid();

      const subscription = await subscriptionTestUtils.createAndPersist({ input: { userId } });

      const foundSubscriptions = await subscriptionRepository.findSubscriptions({ userId });

      expect(foundSubscriptions.length).toEqual(1);

      expect(foundSubscriptions[0]).toEqual(subscription);
    });
  });
});
