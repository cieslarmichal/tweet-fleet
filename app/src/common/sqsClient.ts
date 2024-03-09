import { SQSClient } from '@aws-sdk/client-sqs';

export interface SqsClientConfig {
  readonly endpoint?: string;
}

export type SqsClient = SQSClient;

export class SqsClientFactory {
  public static create(config: SqsClientConfig): SqsClient {
    return new SQSClient({ ...config });
  }
}
