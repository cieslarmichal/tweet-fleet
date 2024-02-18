import {
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb';
import { User } from '../../domain/entities/user.js';
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

  public constructor(private readonly dynamoDbClient: DynamoDBClient) {}

  public async truncate(): Promise<void> {
    await this.dynamoDbClient.send(new DeleteItemCommand({ TableName: this.tableName, Key: {} }));
  }

  public async createAndPersist(payload: CreateAndPersistPayload = {}): Promise<User> {
    const { input } = payload;

    const user = UserTestFactory.create(input);

    const command = new PutItemCommand({
      TableName: this.tableName,
      Item: {
        id: { S: user.id },
        email: { S: user.email },
        password: { S: user.password },
      },
    });

    await this.dynamoDbClient.send(command);

    return user;
  }

  public async findById(payload: FindByIdPayload): Promise<User | undefined> {
    const { id } = payload;

    const command = new GetItemCommand({
      TableName: this.tableName,
      Key: {
        id: { S: id },
      },
    });

    const response = await this.dynamoDbClient.send(command);

    if (!response.Item) {
      return undefined;
    }

    return response.Item as unknown as User;
  }

  public async findUserByEmail(payload: FindByEmailPayload): Promise<User | undefined> {
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
