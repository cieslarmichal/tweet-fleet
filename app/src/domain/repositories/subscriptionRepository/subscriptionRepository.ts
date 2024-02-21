/* eslint-disable @typescript-eslint/naming-convention */

import { DeleteCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

import { type DynamoDbClient } from '../../../common/dynamoDbClient.js';
import { type Subscription } from '../../entities/subscription/subscription.js';

export interface CreateSubscriptionPayload {
  readonly userId: string;
  readonly twitterUsername: string;
}

export interface DeleteSubscriptionPayload {
  readonly id: string;
}

export interface FindSubscriptionsPayload {
  readonly userId: string;
}

export class SubscriptionRepository {
  private readonly tableName = 'subscriptions';

  public constructor(private readonly dynamoDbClient: DynamoDbClient) {}

  public async createSubscription(payload: CreateSubscriptionPayload): Promise<Subscription> {
    const { userId, twitterUsername } = payload;

    const id = uuidv4();

    const subscription: Subscription = {
      id,
      userId,
      twitterUsername,
    };

    const command = new PutCommand({
      TableName: this.tableName,
      Item: subscription,
    });

    await this.dynamoDbClient.send(command);

    return subscription;
  }

  public async findSubscriptions(payload: FindSubscriptionsPayload): Promise<Subscription[]> {
    const { userId } = payload;

    const command = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: '#userId = :userId',
      ExpressionAttributeNames: {
        '#userId': 'userId',
      },
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    });

    const response = await this.dynamoDbClient.send(command);

    if (!response.Items?.length) {
      return [];
    }

    return response.Items as unknown as Subscription[];
  }

  public async deleteSubscription(payload: DeleteSubscriptionPayload): Promise<void> {
    const { id } = payload;

    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: { id },
    });

    await this.dynamoDbClient.send(command);
  }
}
