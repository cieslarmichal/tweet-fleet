// import { type LoggerClient } from '../../../common/loggerClient.js';
// import { type SubscriptionRepository } from '../../../domain/repositories/subscriptionRepository/subscriptionRepository.js';
// import { type UserRepository } from '../../../domain/repositories/userRepository/userRepository.js';

// export class SendUserSubscriptionsAction {
//   public constructor(
//     private readonly userRepository: UserRepository,
//     private readonly subscriptionRepository: SubscriptionRepository,
//     private readonly logger: LoggerClient,
//   ) {}

//   public async execute(): Promise<void> {
//     let startKey: Record<string, unknown> | undefined = undefined;

//     do {
//       const { users, lastEvaluatedKey } = await this.userRepository.findAllUsers({
//         limit: 50,
//         startKey,
//       });

//       for (const user of users) {
//         const subscriptions = await this.subscriptionRepository.findSubscriptions({ userId: user.id });

//         for (const subscription of subscriptions) {
//           const twitterData = await this.twitterClient.downloadSubscriptionData(subscription);

//           this.logger.debug({
//             message: 'Subscription data fetched from Twitter.',
//             userId: user.id,
//             subscriptionId: subscription.id,
//             twitterData,
//           });
//         }
//       }

//       startKey = lastEvaluatedKey;
//     } while (startKey);
//   }
// }
