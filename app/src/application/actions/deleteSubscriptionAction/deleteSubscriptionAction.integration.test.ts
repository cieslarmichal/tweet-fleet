import { faker } from '@faker-js/faker';
import { beforeEach, expect, it, describe, afterEach } from 'vitest';

import { DeleteSubscriptionAction } from './deleteSubscriptionAction.js';
import { DynamoDbClientFactory } from '../../../common/dynamoDbClient.js';
import { LoggerClientFactory } from '../../../common/loggerClient.js';
import { SubscriptionRepository } from '../../../domain/repositories/subscriptionRepository/subscriptionRepository.js';
import { SubscriptionTestUtils } from '../../../tests/utils/subscriptionTestUtils.js';

describe('DeleteSubscriptionAction', () => {
  let deleteSubscriptionAction: DeleteSubscriptionAction;

  let subscriptionTestUtils: SubscriptionTestUtils;

  beforeEach(async () => {
    const dynamodbClient = DynamoDbClientFactory.create({ endpoint: 'http://127.0.0.1:4566' });

    const subscriptionRepository = new SubscriptionRepository(dynamodbClient);

    const logger = LoggerClientFactory.create({ logLevel: 'debug' });

    deleteSubscriptionAction = new DeleteSubscriptionAction(subscriptionRepository, logger);

    subscriptionTestUtils = new SubscriptionTestUtils(dynamodbClient);

    await subscriptionTestUtils.truncate();
  });

  afterEach(async () => {
    await subscriptionTestUtils.truncate();
  });

  it('creates a Subscription', async () => {
    const { id } = await subscriptionTestUtils.createAndPersist();

    await deleteSubscriptionAction.execute({ id });

    const foundSubscription = await subscriptionTestUtils.findById({ id });

    expect(foundSubscription).toBeUndefined();
  });

  it('throws an error when a Subscription does not exist', async () => {
    const id = faker.string.uuid();

    try {
      await deleteSubscriptionAction.execute({ id });
    } catch (error) {
      expect(error).toBeDefined();

      return;
    }

    expect.fail();
  });
});
