import { faker } from '@faker-js/faker';

import { type Tweet } from '../../common/types/tweet.js';

export class TweetTestFactory {
  public static create(username: string, name?: string): Tweet {
    const id = faker.string.uuid();

    return {
      text: faker.lorem.paragraphs(
        faker.number.int({
          min: 1,
          max: 3,
        }),
      ),
      createdAt: faker.date.past().toISOString(),
      selfUrl: `https://twitter.com/${username}/status/${id}`,
      author: {
        name: name || faker.person.fullName(),
        username,
      },
    };
  }
}
