import { faker } from '@faker-js/faker';

import { type Subscription } from '../../domain/entities/subscription/subscription.js';

export class SubscriptionTestFactory {
  public static create(input: Partial<Subscription> = {}): Subscription {
    return {
      id: faker.string.uuid(),
      userId: faker.string.uuid(),
      twitterUsername: faker.internet.userName(),
      ...input,
    };
  }
}
