import { Redis } from 'ioredis';

export interface RedisClientConfig {
  readonly host: string;
  readonly port: number;
}

export class RedisClientFactory {
  public static create(config: RedisClientConfig): Redis {
    return new Redis({
      host: config.host,
      port: config.port,
    });
  }
}
