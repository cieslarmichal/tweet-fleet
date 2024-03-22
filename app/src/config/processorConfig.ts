import { type Static, Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

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
});

const configInput = {
  logLevel: process.env['LOG_LEVEL'] ?? 'debug',
  sendGrid: {
    apiKey: process.env['SENDGRID_API_KEY'],
    senderEmail: 'michal.andrzej.cieslar@gmail.com',
  },
  usersSqsUrl: process.env['USERS_SQS_URL'],
  tweetsSqsUrl: process.env['TWEETS_SQS_URL'],
  redis: {
    host: process.env['REDIS_HOST'],
    port: process.env['REDIS_PORT'] ? parseInt(process.env['REDIS_PORT']) : 6379,
  },
};

export type ProcessorConfig = Static<typeof configSchema>;

export class ProcessorConfigFactory {
  public static create(): ProcessorConfig {
    return Value.Decode(configSchema, configInput);
  }
}
