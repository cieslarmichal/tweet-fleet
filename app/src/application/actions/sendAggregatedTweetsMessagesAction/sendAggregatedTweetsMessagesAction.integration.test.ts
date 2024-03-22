import { beforeEach, expect, it, describe, afterEach } from 'vitest';

import { SendAggregatedTweetsMessagesAction } from './sendAggregatedTweetsMessagesAction.js';
import { DynamoDbClientFactory } from '../../../common/dynamoDbClient.js';
import { LoggerClientFactory } from '../../../common/loggerClient.js';
import { SqsClientFactory } from '../../../common/sqsClient.js';
import { ProcessorConfigFactory } from '../../../config/processorConfig.js';
import { SubscriptionRepository } from '../../../domain/repositories/subscriptionRepository/subscriptionRepository.js';
import { SubscriptionTestUtils } from '../../../tests/utils/subscriptionTestUtils.js';
import { UserQueueTestUtils } from '../../../tests/utils/userQueueTestUtils.js';

describe('SendAggregatedTweetsMessagesAction', () => {
  let sendAggregatedTweetsMessagesAction: SendAggregatedTweetsMessagesAction;

  let subscriptionTestUtils: SubscriptionTestUtils;

  let userQueueTestUtils: UserQueueTestUtils;

  beforeEach(async () => {
    const dynamodbClient = DynamoDbClientFactory.create({ endpoint: 'http://127.0.0.1:4566' });

    const sqsClient = SqsClientFactory.create({ endpoint: 'http://127.0.0.1:4566' });

    const subscriptionRepository = new SubscriptionRepository(dynamodbClient);

    const config = ProcessorConfigFactory.create();

    const logger = LoggerClientFactory.create({ logLevel: config.logLevel });

    sendAggregatedTweetsMessagesAction = new SendAggregatedTweetsMessagesAction(
      subscriptionRepository,
      sqsClient,
      logger,
      config,
    );

    subscriptionTestUtils = new SubscriptionTestUtils(dynamodbClient);

    userQueueTestUtils = new UserQueueTestUtils(sqsClient);

    await subscriptionTestUtils.truncate();

    await userQueueTestUtils.purge();
  });

  afterEach(async () => {
    await subscriptionTestUtils.truncate();

    await userQueueTestUtils.purge();
  });

  it('sends User messages', async () => {
    const user1 = await subscriptionTestUtils.createAndPersist();

    const user2 = await subscriptionTestUtils.createAndPersist();

    await sendAggregatedTweetsMessagesAction.execute();

    const messages = await userQueueTestUtils.fetchMessages();

    expect(messages).toEqual([
      {
        id: user1.id,
        email: user1.email,
      },
      {
        id: user2.id,
        email: user2.email,
      },
    ]);
  });
});
