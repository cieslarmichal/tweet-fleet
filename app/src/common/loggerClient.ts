import { pino, Logger } from 'pino';

export type LoggerClient = Logger;

export interface LoggerConfig {
  readonly logLevel: string;
}

export class LoggerClientFactory {
  public static create(config: LoggerConfig): LoggerClient {
    return pino({
      name: 'Logger',
      level: config.logLevel,
    });
  }
}
