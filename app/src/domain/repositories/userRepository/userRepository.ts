/* eslint-disable @typescript-eslint/naming-convention */

import { GetCommand, PutCommand, ScanCommand, type ScanCommandInput } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

import { type DynamoDbClient } from '../../../common/dynamoDbClient.js';
import { type User } from '../../entities/user/user.js';

export interface CreateUserPayload {
  readonly email: string;
  readonly password: string;
}

export interface FindUserByIdPayload {
  readonly id: string;
}

export interface FindUserByEmailPayload {
  readonly email: string;
}

export interface FindAllUsersPayload {
  readonly limit: number;
  readonly startKey?: Record<string, unknown> | unknown;
}

export interface FindAllUsersResult {
  readonly users: User[];
  readonly lastEvaluatedKey: Record<string, unknown> | undefined;
}

export class UserRepository {
  private readonly tableName = 'users';

  public constructor(private readonly dynamoDbClient: DynamoDbClient) {}

  public async createUser(payload: CreateUserPayload): Promise<void> {
    const { email, password } = payload;

    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        id: uuidv4(),
        email,
        password,
      },
    });

    await this.dynamoDbClient.send(command);
  }

  public async findUserById(payload: FindUserByIdPayload): Promise<User | undefined> {
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

  public async findUserByEmail(payload: FindUserByEmailPayload): Promise<User | undefined> {
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

  public async findAllUsers(payload: FindAllUsersPayload): Promise<FindAllUsersResult> {
    const { limit, startKey } = payload;

    const commandInput: ScanCommandInput = {
      TableName: this.tableName,
      Limit: limit,
    };

    if (startKey) {
      commandInput.ExclusiveStartKey = startKey;
    }

    const command = new ScanCommand(commandInput);

    const response = await this.dynamoDbClient.send(command);

    return {
      users: response.Items as User[],
      lastEvaluatedKey: response.LastEvaluatedKey,
    };
  }
}
