import { ResourceAlreadyExistsError } from '../../../common/errors/resourceAlreadyExistsError.js';
import { type LoggerClient } from '../../../common/loggerClient.js';
import { type SubscriptionRepository } from '../../../domain/repositories/subscriptionRepository/subscriptionRepository.js';

export interface CreateSubscriptionActionPayload {
  readonly userId: string;
  readonly twitterUsername: string;
}

export class CreateSubscriptionAction {
  public constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly logger: LoggerClient,
  ) {}

  public async execute(payload: CreateSubscriptionActionPayload): Promise<void> {
    const { userId, twitterUsername } = payload;

    this.logger.debug({
      message: 'Creating Subscription...',
      context: {
        userId,
        twitterUsername,
      },
    });

    const existingSubscription = await this.subscriptionRepository.findSubscription({
      userId,
      twitterUsername,
    });

    if (existingSubscription) {
      throw new ResourceAlreadyExistsError({
        name: 'Subscription',
        userId,
        twitterUsername,
      });
    }

    await this.subscriptionRepository.createSubscription({
      userId,
      twitterUsername,
    });

    this.logger.debug({
      message: 'Subscription created.',
      context: {
        userId,
        twitterUsername,
      },
    });
  }
}
