import { Redis } from 'ioredis';

export interface RedisClientConfig {
  readonly host: string;
  readonly port: number;
}

export type RedisClient = Redis;

export class RedisClientFactory {
  public static create(config: RedisClientConfig): RedisClient {
    return new Redis({
      host: config.host,
      port: config.port,
    });
  }
}
