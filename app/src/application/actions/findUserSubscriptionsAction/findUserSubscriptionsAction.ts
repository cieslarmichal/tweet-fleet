import { OperationNotValidError } from '../../../common/errors/operationNotValidError.js';
import { type LoggerService } from '../../../common/loggerService.js';
import { type Subscription } from '../../../domain/entities/subscription/subscription.js';
import { type SubscriptionRepository } from '../../../domain/repositories/subscriptionRepository/subscriptionRepository.js';
import { type UserRepository } from '../../../domain/repositories/userRepository/userRepository.js';

export interface FindUserSubscriptionsActionPayload {
  readonly userId: string;
}

export interface FindUserSubscriptionsActionResult {
  readonly subscriptions: Subscription[];
}

export class FindUserSubscriptionsAction {
  public constructor(
    private readonly userRepository: UserRepository,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly logger: LoggerService,
  ) {}

  public async execute(payload: FindUserSubscriptionsActionPayload): Promise<FindUserSubscriptionsActionResult> {
    const { userId } = payload;

    this.logger.debug({
      message: 'Fetching User Subscriptions...',
      userId,
    });

    const user = await this.userRepository.findUserById({ id: userId });

    if (!user) {
      throw new OperationNotValidError({
        reason: 'User does not exist.',
        id: userId,
      });
    }

    const subscriptions = await this.subscriptionRepository.findSubscriptions({ userId });

    this.logger.debug({
      message: 'User Subscriptions fetched.',
      userId,
      subscriptions,
    });

    return { subscriptions };
  }
}
