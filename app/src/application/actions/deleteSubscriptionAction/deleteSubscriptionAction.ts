import { OperationNotValidError } from '../../../common/errors/operationNotValidError.js';
import { type LoggerService } from '../../../common/loggerService.js';
import { type SubscriptionRepository } from '../../../domain/repositories/subscriptionRepository/subscriptionRepository.js';

export interface DeleteSubscriptionActionPayload {
  readonly id: string;
}

export class DeleteSubscriptionAction {
  public constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly logger: LoggerService,
  ) {}

  public async execute(payload: DeleteSubscriptionActionPayload): Promise<void> {
    const { id } = payload;

    this.logger.debug({
      message: 'Deleting Subscription...',
      id,
    });

    const existingSubscription = await this.subscriptionRepository.findSubscriptionById({ id });

    if (!existingSubscription) {
      throw new OperationNotValidError({
        reason: 'Subscription does not exist.',
        id,
      });
    }

    await this.subscriptionRepository.deleteSubscription({ id });

    this.logger.debug({
      message: 'Subscription deleted.',
      id,
    });
  }
}
