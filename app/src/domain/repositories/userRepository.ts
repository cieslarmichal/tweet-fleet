import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { User } from '../entities/user.js';
import { v4 as uuidv4 } from 'uuid';

export interface CreateUserPayload {
  readonly email: string;
  readonly password: string;
}

export interface FindUserPayload {
  readonly id: string;
}

export class UserRepository {
  private readonly dynamoDbClient = new DynamoDBClient({});
  private readonly tableName = 'users';

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

  public async findUser(payload: FindUserPayload): Promise<User | undefined> {
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
}
