import { Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { type Handler, type SQSEvent } from 'aws-lambda';

import { SendSubscriptionTweetsMessagesAction } from '../../../application/actions/sendSubscriptionTweetsMessagesAction/sendSubscriptionTweetsMessagesAction.js';
import { TwitterService } from '../../../application/services/twitterService/twitterService.js';
import { DynamoDbClientFactory } from '../../../common/dynamoDbClient.js';
import { LoggerServiceFactory } from '../../../common/loggerService.js';
import { RedisClientFactory } from '../../../common/redisClient.js';
import { SqsClientFactory } from '../../../common/sqsClient.js';
import { TwitterClientFactory } from '../../../common/twitterClient.js';
import { ConfigFactory } from '../../../config/config.js';
import { SubscriptionRepository } from '../../../domain/repositories/subscriptionRepository/subscriptionRepository.js';

const dynamoDbClient = DynamoDbClientFactory.create();

const subscriptionRepository = new SubscriptionRepository(dynamoDbClient);

const sqsClient = SqsClientFactory.create();

const config = ConfigFactory.create();

const logger = LoggerServiceFactory.create({
  logLevel: config.logLevel,
});

const redis = new RedisClientFactory(logger).create({
  host: config.redis.host,
  port: config.redis.port,
});

const twitterClient = TwitterClientFactory.create({
  accessToken: config.twitter.accessToken,
  accessTokenSecret: config.twitter.accessTokenSecret,
  apiKey: config.twitter.apiKey,
  apiSecret: config.twitter.apiSecret,
});

const twitterService = new TwitterService(twitterClient);

const action = new SendSubscriptionTweetsMessagesAction(
  subscriptionRepository,
  sqsClient,
  redis,
  twitterService,
  logger,
  config,
);

const eventBodySchema = Type.Object({
  id: Type.String(),
  email: Type.String(),
});

export const lambda: Handler = async (event: SQSEvent): Promise<void> => {
  const eventActions = event.Records.map(async (record) => {
    try {
      const eventBody = JSON.parse(record.body);

      const { id: userId, email } = Value.Decode(eventBodySchema, eventBody);

      await action.execute({
        email,
        userId,
      });
    } catch (error) {
      logger.error({
        message: 'Error while processing event.',
        error,
        event,
      });

      throw error;
    }
  });

  await Promise.all(eventActions);
};
