/* eslint-disable @typescript-eslint/naming-convention */

import { type Static, Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

const {
  LOG_LEVEL,
  SENDGRID_API_KEY,
  USERS_SQS_URL,
  TWEETS_SQS_URL,
  REDIS_HOST,
  REDIS_PORT,
  TWITTER_API_KEY,
  TWITTER_ACCESS_TOKEN,
  TWITTER_API_SECRET,
  TWITTER_ACCESS_TOKEN_SECRET,
  HASH_SALT_ROUNDS,
  JWT_SECRET,
} = process.env;

const configSchema = Type.Object({
  logLevel: Type.String({ minLength: 1 }),
  sendGrid: Type.Object({
    apiKey: Type.String({ minLength: 1 }),
    senderEmail: Type.String({ minLength: 1 }),
  }),
  usersSqsUrl: Type.String({ minLength: 1 }),
  tweetsSqsUrl: Type.String({ minLength: 1 }),
  redis: Type.Object({
    host: Type.String({ minLength: 1 }),
    port: Type.Number({ minimum: 1 }),
  }),
  twitter: Type.Object({
    apiKey: Type.String({ minLength: 1 }),
    apiSecret: Type.String({ minLength: 1 }),
    accessToken: Type.String({ minLength: 1 }),
    accessTokenSecret: Type.String({ minLength: 1 }),
  }),
  hashSaltRounds: Type.Integer(),
  jwtSecret: Type.String({ minLength: 1 }),
  jwtExpiration: Type.Integer(),
});

const configInput = {
  logLevel: LOG_LEVEL ?? 'debug',
  sendGrid: {
    apiKey: SENDGRID_API_KEY,
    senderEmail: 'michal.andrzej.cieslar@gmail.com',
  },
  usersSqsUrl: USERS_SQS_URL,
  tweetsSqsUrl: TWEETS_SQS_URL,
  redis: {
    host: REDIS_HOST,
    port: REDIS_PORT ? parseInt(REDIS_PORT) : 6379,
  },
  twitter: {
    apiKey: TWITTER_API_KEY,
    apiSecret: TWITTER_API_SECRET,
    accessToken: TWITTER_ACCESS_TOKEN,
    accessTokenSecret: TWITTER_ACCESS_TOKEN_SECRET,
  },
  hashSaltRounds: parseInt(HASH_SALT_ROUNDS as string),
  jwtSecret: JWT_SECRET,
  jwtExpiration: 86400,
};

export type Config = Static<typeof configSchema>;

export class ConfigFactory {
  public static create(): Config {
    return Value.Decode(configSchema, configInput);
  }
}
