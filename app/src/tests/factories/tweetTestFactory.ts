import { faker } from '@faker-js/faker';

import { type Tweet } from '../../common/types/tweet.js';

export class TweetTestFactory {
  public static create(username: string): Tweet {
    const id = faker.string.uuid();

    return {
      id,
      text: faker.lorem.sentence(),
      createdAt: faker.date.past().toISOString(),
      urls: [faker.internet.url()],
      selfUrl: `https://twitter.com/${username}/status/${id}`,
      author: {
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        username,
        profileImageUrl: faker.image.avatar(),
      },
    };
  }
}
