import { beforeEach, expect, it, describe, afterEach } from 'vitest';

import { CreateSubscriptionAction } from './createSubscriptionAction.js';
import { DynamoDbClientFactory } from '../../../common/dynamoDbClient.js';
import { LoggerClientFactory } from '../../../common/loggerClient.js';
import { config } from '../../../config/config.js';
import { SubscriptionRepository } from '../../../domain/repositories/subscriptionRepository/subscriptionRepository.js';
import { SubscriptionTestFactory } from '../../../tests/factories/subscriptionTestFactory.js';
import { SubscriptionTestUtils } from '../../../tests/utils/subscriptionTestUtils.js';

describe('CreateSubscriptionAction', () => {
  let createSubscriptionAction: CreateSubscriptionAction;

  let subscriptionTestUtils: SubscriptionTestUtils;

  beforeEach(async () => {
    const dynamodbClient = DynamoDbClientFactory.create({ endpoint: 'http://127.0.0.1:4566' });

    const subscriptionRepository = new SubscriptionRepository(dynamodbClient);

    const logger = LoggerClientFactory.create({ logLevel: config.logLevel });

    createSubscriptionAction = new CreateSubscriptionAction(subscriptionRepository, logger);

    subscriptionTestUtils = new SubscriptionTestUtils(dynamodbClient);

    await subscriptionTestUtils.truncate();
  });

  afterEach(async () => {
    await subscriptionTestUtils.truncate();
  });

  it('creates a Subscription', async () => {
    const { userId, twitterUsername } = SubscriptionTestFactory.create();

    await createSubscriptionAction.execute({
      userId,
      twitterUsername,
    });

    const foundSubscription = await subscriptionTestUtils.find({
      userId,
      twitterUsername,
    });

    expect(foundSubscription).toBeDefined();
  });

  it('throws an error when a Subscription already exists', async () => {
    const { userId, twitterUsername } = await subscriptionTestUtils.createAndPersist();

    try {
      await createSubscriptionAction.execute({
        userId,
        twitterUsername,
      });
    } catch (error) {
      expect(error).toBeDefined();

      return;
    }

    expect.fail();
  });
});
