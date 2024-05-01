import { faker } from '@faker-js/faker';
import { beforeEach, expect, it, describe, afterEach } from 'vitest';

import { SendSubscriptionTweetsMessagesAction } from './sendSubscriptionTweetsMessagesAction.js';
import { DynamoDbClientFactory } from '../../../common/dynamoDbClient.js';
import { LoggerServiceFactory } from '../../../common/loggerService.js';
import { type RedisClient, RedisClientFactory } from '../../../common/redisClient.js';
import { SqsClientFactory } from '../../../common/sqsClient.js';
import { TwitterClientFactory } from '../../../common/twitterClient.js';
import { ConfigFactory } from '../../../config/config.js';
import { SubscriptionRepository } from '../../../domain/repositories/subscriptionRepository/subscriptionRepository.js';
import { TweetTestFactory } from '../../../tests/factories/tweetTestFactory.js';
import { SubscriptionTestUtils } from '../../../tests/utils/subscriptionTestUtils.js';
import { TweetQueueTestUtils } from '../../../tests/utils/tweetQueueTestUtils.js';
import { TwitterService } from '../../services/twitterService/twitterService.js';

describe('SendSubscriptionTweetsMessagesAction', () => {
  let sendSubscriptionTweetsMessagesAction: SendSubscriptionTweetsMessagesAction;

  let redisClient: RedisClient;

  let subscriptionTestUtils: SubscriptionTestUtils;

  let tweetQueueTestUtils: TweetQueueTestUtils;

  beforeEach(async () => {
    const dynamodbClient = DynamoDbClientFactory.create({ endpoint: 'http://127.0.0.1:4566' });

    const sqsClient = SqsClientFactory.create({ endpoint: 'http://127.0.0.1:4566' });

    const subscriptionRepository = new SubscriptionRepository(dynamodbClient);

    const config = ConfigFactory.create();

    const logger = LoggerServiceFactory.create({ logLevel: config.logLevel });

    redisClient = new RedisClientFactory(logger).create({
      host: 'localhost',
      port: 6379,
    });

    const twitterClient = TwitterClientFactory.create({
      apiKey: 'apiKey',
      apiSecret: 'apiSecret',
      accessToken: 'accessToken',
      accessTokenSecret: 'accessTokenSecret',
    });

    const twitterService = new TwitterService(twitterClient);

    sendSubscriptionTweetsMessagesAction = new SendSubscriptionTweetsMessagesAction(
      subscriptionRepository,
      sqsClient,
      redisClient,
      twitterService,
      logger,
      config,
    );

    subscriptionTestUtils = new SubscriptionTestUtils(dynamodbClient);

    tweetQueueTestUtils = new TweetQueueTestUtils(sqsClient);

    await subscriptionTestUtils.truncate();

    await tweetQueueTestUtils.purge();
  });

  afterEach(async () => {
    await subscriptionTestUtils.truncate();

    await tweetQueueTestUtils.purge();
  });

  it('sends User subscription tweets messages', async () => {
    const userId = faker.string.uuid();

    const email = faker.internet.email();

    const subscription1 = await subscriptionTestUtils.createAndPersist({
      input: { userId },
    });

    const subscription2 = await subscriptionTestUtils.createAndPersist({
      input: { userId },
    });

    const subscription3 = await subscriptionTestUtils.createAndPersist({
      input: { userId },
    });

    const tweet1 = TweetTestFactory.create(subscription1.twitterUsername);

    const tweet2 = TweetTestFactory.create(subscription1.twitterUsername);

    const subscription1Tweets = [tweet1, tweet2];

    await redisClient.set(subscription1.twitterUsername, JSON.stringify(subscription1Tweets));

    const tweet3 = TweetTestFactory.create(subscription3.twitterUsername);

    const subscription3Tweets = [tweet3];

    await redisClient.set(subscription3.twitterUsername, JSON.stringify(subscription3Tweets));

    await sendSubscriptionTweetsMessagesAction.execute({
      userId,
      email,
    });

    const savedTweetsInCached = await redisClient.get(subscription2.twitterUsername);

    expect(savedTweetsInCached).not.toBeNull();

    const messages = await tweetQueueTestUtils.fetchMessages();

    expect(messages).toHaveLength(3);

    expect(messages.every((message) => message.email === email)).toBe(true);

    expect(messages.some((message) => JSON.stringify(message.tweets) === JSON.stringify(subscription1Tweets))).toBe(
      true,
    );

    expect(messages.some((message) => JSON.stringify(message.tweets) === JSON.stringify(subscription3Tweets))).toBe(
      true,
    );
  });
});
