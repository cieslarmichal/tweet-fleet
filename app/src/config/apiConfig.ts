/* eslint-disable @typescript-eslint/naming-convention */

import { type Static, Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

const { LOG_LEVEL, HASH_SALT_ROUNDS, JWT_SECRET, JWT_EXPIRATION } = process.env;

const configSchema = Type.Object({
  logLevel: Type.String({ minLength: 1 }),
  hashSaltRounds: Type.Integer(),
  jwtSecret: Type.String({ minLength: 1 }),
  jwtExpiration: Type.Integer(),
});

const configInput = {
  logLevel: LOG_LEVEL ?? 'debug',
  hashSaltRounds: parseInt(HASH_SALT_ROUNDS as string),
  jwtSecret: JWT_SECRET,
  jwtExpiration: JWT_EXPIRATION ? parseInt(JWT_EXPIRATION) : 86400,
};

export type ApiConfig = Static<typeof configSchema>;

export class ApiConfigFactory {
  public static create(): ApiConfig {
    return Value.Decode(configSchema, configInput);
  }
}
