import { type LoggerService } from '../../../common/loggerService.js';
import { type Tweet } from '../../../common/types/tweet.js';
import { type EmailService } from '../../services/emailService/emailService.js';

interface SendSubscriptionEmailActionPayload {
  readonly tweets: Tweet[];
  readonly email: string;
}

export class SendSubscriptionEmailAction {
  public constructor(
    private readonly emailService: EmailService,
    private readonly logger: LoggerService,
  ) {}

  public async execute(payload: SendSubscriptionEmailActionPayload): Promise<void> {
    const { tweets, email } = payload;

    if (!tweets[0]) {
      this.logger.debug({
        message: 'No tweets to send.',
        email,
      });

      return;
    }

    const authorName = tweets[0].author.name;

    const authorUsername = tweets[0].author.username;

    this.logger.debug({
      message: 'Sending subscription email...',
      email,
      tweetsCount: tweets.length,
      authorName,
    });

    const body = tweets
      .map((tweet) => {
        return `
        Tweet URL: ${tweet.selfUrl}
        Text: ${tweet.text}
        Date: ${new Date(tweet.createdAt).toISOString()}
        URLs: ${tweet.urls.join(', ')}
      `;
      })
      .join('\n\n');

    await this.emailService.sendEmail({
      toEmail: email,
      subject: `Your daily tweets from ${authorName} (@${authorUsername})`,
      body,
    });

    this.logger.debug({
      message: 'Subscription email sent.',
      email,
    });
  }
}
