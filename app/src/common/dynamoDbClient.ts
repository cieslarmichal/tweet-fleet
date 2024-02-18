import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export interface DynamoDbClientConfig {
  readonly endpoint?: string;
}

export type DynamoDbClient = DynamoDBDocumentClient;

export class DynamoDbClientFactory {
  public static create(config: DynamoDbClientConfig): DynamoDbClient {
    const dynamoDbClient = new DynamoDBClient({ ...config });

    const marshallOptions = {
      convertEmptyValues: false,
      removeUndefinedValues: true,
      convertClassInstanceToMap: true,
    };

    const unmarshallOptions = {
      wrapNumbers: false,
    };

    const translateConfig = { marshallOptions, unmarshallOptions };

    return DynamoDBDocumentClient.from(dynamoDbClient, translateConfig);
  }
}
