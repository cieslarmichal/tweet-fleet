#!/usr/bin/env node
import 'source-map-support/register.js';
import * as core from 'aws-cdk-lib';

import { Config } from './config.js';
import { EmailStack } from './stacks/emailStack.js';
import { ApiStack } from './stacks/apiStack.js';

const jwtSecret = process.env['JWT_SECRET'];
const hashSaltRounds = process.env['HASH_SALT_ROUNDS'];

if (!jwtSecret || !hashSaltRounds) {
  throw new Error('Missing environment variables');
}

const app = new core.App();

const env = {
  account: '484767037608',
  region: 'eu-central-1',
};

const config: Config = {
  jwtSecret,
  hashSaltRounds,
};

new EmailStack(app, 'EmailStack', { env });

new ApiStack(app, 'ApiStack', { env, config });
