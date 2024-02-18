import { DynamoDBClient, GetItemCommand, PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { User } from '../entities/user.js';
import { v4 as uuidv4 } from 'uuid';

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

export class UserRepository {
  private readonly tableName = 'users';

  public constructor(private readonly dynamoDbClient: DynamoDBClient) {}

  public async createUser(payload: CreateUserPayload): Promise<void> {
    const { email, password } = payload;

    const command = new PutItemCommand({
      TableName: this.tableName,
      Item: {
        id: { S: uuidv4() },
        email: { S: email },
        password: { S: password },
      },
    });

    await this.dynamoDbClient.send(command);
  }

  public async findUserById(payload: FindUserByIdPayload): Promise<User | undefined> {
    const { id } = payload;

    const command = new GetItemCommand({
      TableName: this.tableName,
      Key: {
        id: { N: id },
      },
    });

    const response = await this.dynamoDbClient.send(command);

    if (!response.Item) {
      return undefined;
    }

    return response.Item as unknown as User;
  }

  public async findUserByEmail(payload: FindUserByEmailPayload): Promise<User | undefined> {
    const { email } = payload;

    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: '#email = :input',
      ExpressionAttributeNames: {
        '#email': 'email',
      },
      ExpressionAttributeValues: {
        ':input': { S: email },
      },
    });

    const response = await this.dynamoDbClient.send(command);

    if (!response.Items || response.Items.length === 0) {
      return undefined;
    }

    return response.Items[0] as unknown as User;
  }
}
