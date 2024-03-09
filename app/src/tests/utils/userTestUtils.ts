/* eslint-disable @typescript-eslint/naming-convention */

import { DeleteCommand, GetCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

import { type DynamoDbClient } from '../../common/dynamoDbClient.js';
import { type User } from '../../domain/entities/user/user.js';
import { UserTestFactory } from '../factories/userTestFactory.js';

interface CreateAndPersistPayload {
  input?: Partial<User>;
}

interface FindByIdPayload {
  id: string;
}

interface FindByEmailPayload {
  email: string;
}

export class UserTestUtils {
  private readonly tableName = 'users';

  public constructor(private readonly dynamoDbClient: DynamoDbClient) {}

  public async createAndPersist(payload: CreateAndPersistPayload = {}): Promise<User> {
    const { input } = payload;

    const user = UserTestFactory.create(input);

    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        id: user.id,
        email: user.email,
        password: user.password,
      },
    });

    await this.dynamoDbClient.send(command);

    return user;
  }

  public async findById(payload: FindByIdPayload): Promise<User | undefined> {
    const { id } = payload;

    const command = new GetCommand({
      TableName: this.tableName,
      Key: { id },
    });

    const response = await this.dynamoDbClient.send(command);

    if (!response.Item) {
      return undefined;
    }

    return response.Item as unknown as User;
  }

  public async findByEmail(payload: FindByEmailPayload): Promise<User | undefined> {
    const { email } = payload;

    const command = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: '#email = :email',
      ExpressionAttributeNames: {
        '#email': 'email',
      },
      ExpressionAttributeValues: {
        ':email': email,
      },
    });

    const response = await this.dynamoDbClient.send(command);

    if (!response.Items || !response.Items.length) {
      return undefined;
    }

    return response.Items[0] as unknown as User;
  }

  public async truncate(): Promise<void> {
    const scanCommand = new ScanCommand({
      TableName: this.tableName,
    });

    const data = await this.dynamoDbClient.send(scanCommand);

    if (!data.Items) {
      return;
    }

    for (const item of data.Items) {
      const deleteCommand = new DeleteCommand({
        TableName: this.tableName,
        Key: {
          id: item['id'],
        },
      });

      await this.dynamoDbClient.send(deleteCommand);
    }
  }
}
