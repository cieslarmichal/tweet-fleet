/* eslint-disable @typescript-eslint/naming-convention */

import { DeleteCommand, GetCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

import { type DynamoDbClient } from '../../common/dynamoDbClient.js';
import { type Subscription } from '../../domain/entities/subscription/subscription.js';
import { SubscriptionTestFactory } from '../factories/subscriptionTestFactory.js';

interface CreateAndPersistPayload {
  input?: Partial<Subscription>;
}

interface FindByIdPayload {
  id: string;
}

interface FindPayload {
  twitterUsername: string;
  userId: string;
}

export class SubscriptionTestUtils {
  private readonly tableName = 'subscriptions';

  public constructor(private readonly dynamoDbClient: DynamoDbClient) {}

  public async createAndPersist(payload: CreateAndPersistPayload = {}): Promise<Subscription> {
    const { input } = payload;

    const subscription = SubscriptionTestFactory.create(input);

    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        id: subscription.id,
        userId: subscription.userId,
        twitterUsername: subscription.twitterUsername,
      },
    });

    await this.dynamoDbClient.send(command);

    return subscription;
  }

  public async findById(payload: FindByIdPayload): Promise<Subscription | undefined> {
    const { id } = payload;

    const command = new GetCommand({
      TableName: this.tableName,
      Key: { id },
    });

    const response = await this.dynamoDbClient.send(command);

    if (!response.Item) {
      return undefined;
    }

    return response.Item as unknown as Subscription;
  }

  public async find(payload: FindPayload): Promise<Subscription | undefined> {
    const { userId, twitterUsername } = payload;

    const command = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: '#userId = :userId AND #twitterUsername = :twitterUsername',
      ExpressionAttributeNames: {
        '#userId': 'userId',
        '#twitterUsername': 'twitterUsername',
      },
      ExpressionAttributeValues: {
        ':userId': userId,
        ':twitterUsername': twitterUsername,
      },
    });

    const response = await this.dynamoDbClient.send(command);

    if (!response.Items?.length) {
      return undefined;
    }

    return response.Items[0] as unknown as Subscription;
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
