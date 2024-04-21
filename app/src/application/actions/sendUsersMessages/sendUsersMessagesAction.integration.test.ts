import { beforeEach, expect, it, describe, afterEach } from 'vitest';

import { SendUsersMessagesAction } from './sendUsersMessagesAction.js';
import { DynamoDbClientFactory } from '../../../common/dynamoDbClient.js';
import { LoggerServiceFactory } from '../../../common/loggerService.js';
import { SqsClientFactory } from '../../../common/sqsClient.js';
import { ProcessorConfigFactory } from '../../../config/processorConfig.js';
import { UserRepository } from '../../../domain/repositories/userRepository/userRepository.js';
import { UserQueueTestUtils } from '../../../tests/utils/userQueueTestUtils.js';
import { UserTestUtils } from '../../../tests/utils/userTestUtils.js';

describe('SendUsersMessagesAction', () => {
  let sendUsersMessagesAction: SendUsersMessagesAction;

  let userTestUtils: UserTestUtils;

  let userQueueTestUtils: UserQueueTestUtils;

  beforeEach(async () => {
    const dynamodbClient = DynamoDbClientFactory.create({ endpoint: 'http://127.0.0.1:4566' });

    const sqsClient = SqsClientFactory.create({ endpoint: 'http://127.0.0.1:4566' });

    const userRepository = new UserRepository(dynamodbClient);

    const config = ProcessorConfigFactory.create();

    const logger = LoggerServiceFactory.create({ logLevel: config.logLevel });

    sendUsersMessagesAction = new SendUsersMessagesAction(userRepository, sqsClient, logger, config);

    userTestUtils = new UserTestUtils(dynamodbClient);

    userQueueTestUtils = new UserQueueTestUtils(sqsClient);

    await userTestUtils.truncate();

    await userQueueTestUtils.purge();
  });

  afterEach(async () => {
    await userTestUtils.truncate();

    await userQueueTestUtils.purge();
  });

  it('sends User messages', async () => {
    const user1 = await userTestUtils.createAndPersist();

    const user2 = await userTestUtils.createAndPersist();

    await sendUsersMessagesAction.execute();

    const messages = await userQueueTestUtils.fetchMessages();

    expect(messages).toHaveLength(2);

    expect(
      messages.some(
        (message) =>
          JSON.stringify(message) ===
          JSON.stringify({
            id: user1.id,
            email: user1.email,
          }),
      ),
    ).toBe(true);

    expect(
      messages.some(
        (message) =>
          JSON.stringify(message) ===
          JSON.stringify({
            id: user2.id,
            email: user2.email,
          }),
      ),
    ).toBe(true);
  });
});
