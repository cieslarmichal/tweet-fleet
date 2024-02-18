import { faker } from '@faker-js/faker';
import { User } from '../../domain/entities/user.js';

export class UserTestFactory {
  public static create(input: Partial<User> = {}): User {
    return {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      ...input,
    };
  }
}