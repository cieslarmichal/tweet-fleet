import { type Static, Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

const configSchema = Type.Object({
  logLevel: Type.String({ minLength: 1 }),
  hashSaltRounds: Type.Integer(),
  jwtSecret: Type.String({ minLength: 1 }),
  jwtExpiration: Type.Integer(),
  sendGrid: Type.Object({
    apiKey: Type.String({ minLength: 1 }),
    senderEmail: Type.String({ minLength: 1 }),
  }),
  usersSqsUrl: Type.String({ minLength: 1 }),
  tweetsSqsUrl: Type.String({ minLength: 1 }),
});

const configInput = {
  logLevel: process.env['LOG_LEVEL'] ?? 'debug',
  hashSaltRounds: parseInt(process.env['HASH_SALT_ROUNDS'] as string),
  jwtSecret: process.env['JWT_SECRET'],
  jwtExpiration: process.env['JWT_EXPIRATION'] ? parseInt(process.env['JWT_EXPIRATION'] as string) : 86400,
  sendGrid: {
    apiKey: process.env['SENDGRID_API_KEY'],
    senderEmail: 'michal.andrzej.cieslar@gmail.com',
  },
  usersSqsUrl: process.env['USERS_SQS_URL'],
  tweetsSqsUrl: process.env['TWEETS_SQS_URL'],
};

export const config = Value.Decode(configSchema, configInput);

export type Config = Static<typeof configSchema>;
