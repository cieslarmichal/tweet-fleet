import { faker } from '@faker-js/faker';
import { beforeEach, expect, it, describe, vi } from 'vitest';

import { SendSubscriptionEmailAction } from './sendSubscriptionsEmailAction.js';
import { LoggerServiceFactory } from '../../../common/loggerService.js';
import { TweetTestFactory } from '../../../tests/factories/tweetTestFactory.js';
import { EmailService } from '../../services/emailService/emailService.js';

describe('SendSubscriptionEmailAction', () => {
  let emailService: EmailService;

  let sendSubscriptionEmailAction: SendSubscriptionEmailAction;

  beforeEach(() => {
    emailService = new EmailService({
      apiKey: 'fake-api',
      senderEmail: 'fake-email',
    });

    const logger = LoggerServiceFactory.create({ logLevel: 'debug' });

    sendSubscriptionEmailAction = new SendSubscriptionEmailAction(emailService, logger);
  });

  it('sends email with tweets', async () => {
    const spy = vi.spyOn(emailService, 'sendEmail').mockResolvedValue();

    const authorUsername = faker.internet.userName();

    const authorName = faker.person.fullName();

    const tweet1 = TweetTestFactory.create(authorUsername, authorName);

    const tweet2 = TweetTestFactory.create(authorUsername, authorName);

    const tweets = [tweet1, tweet2];

    const email = faker.internet.email();

    await sendSubscriptionEmailAction.execute({
      tweets,
      email,
    });

    const expectedBody = tweets
      .map(
        (tweet) => `
          <h2><a href="${tweet.selfUrl}">Tweet from ${new Date(tweet.createdAt).toLocaleString()}</a></h2>
          <p>${tweet.text}</p>
          <hr/>
        `,
      )
      .join('');

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        toEmail: email,
        subject: `Your daily tweets from ${authorName} (@${authorUsername})`,
        body: expectedBody,
      }),
    );
  });
});
