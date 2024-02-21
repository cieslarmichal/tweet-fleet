/* eslint-disable @typescript-eslint/naming-convention */

import fetch from 'node-fetch';

export interface EmailServiceConfig {
  readonly apiKey: string;
  readonly senderEmail: string;
}

export interface SendEmailPayload {
  readonly toEmail: string;
  readonly subject: string;
  readonly body: string;
}

export class EmailService {
  public constructor(private readonly config: EmailServiceConfig) {}

  public async sendEmail(payload: SendEmailPayload): Promise<void> {
    const { toEmail, subject, body } = payload;

    const { apiKey, senderEmail } = this.config;

    const url = 'https://api.sendgrid.com/v3/mail/send';

    const requestBody = {
      personalizations: [
        {
          to: [
            {
              email: toEmail,
            },
          ],
        },
      ],
      from: {
        email: senderEmail,
      },
      subject,
      content: [
        {
          type: 'text/html',
          value: body,
        },
      ],
    };

    const headers = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };

    await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });
  }
}
