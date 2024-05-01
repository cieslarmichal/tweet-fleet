import { Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { type Handler, type SQSEvent } from 'aws-lambda';

import { SendSubscriptionEmailAction } from '../../../application/actions/sendSubscriptionEmailAction/sendSubscriptionsEmailAction.js';
import { EmailService } from '../../../application/services/emailService/emailService.js';
import { LoggerServiceFactory } from '../../../common/loggerService.js';
import { ConfigFactory } from '../../../config/config.js';

const config = ConfigFactory.create();

const logger = LoggerServiceFactory.create({
  logLevel: config.logLevel,
});

const emailService = new EmailService({
  apiKey: config.sendGrid.apiKey,
  senderEmail: config.sendGrid.senderEmail,
});

const eventBodySchema = Type.Object({
  email: Type.String(),
  tweets: Type.Array(
    Type.Object({
      id: Type.String(),
      text: Type.String(),
      createdAt: Type.String(),
      urls: Type.Array(Type.String()),
      selfUrl: Type.String(),
      author: Type.Object({
        id: Type.String(),
        name: Type.String(),
        username: Type.String(),
        profileImageUrl: Type.String(),
      }),
    }),
  ),
});

const action = new SendSubscriptionEmailAction(emailService, logger);

export const lambda: Handler = async (event: SQSEvent): Promise<void> => {
  const eventActions = event.Records.map(async (record) => {
    const eventBody = JSON.parse(record.body).detail;

    const { email, tweets } = Value.Decode(eventBodySchema, eventBody);

    await action.execute({
      email,
      tweets,
    });
  });

  await Promise.all(eventActions);
};
