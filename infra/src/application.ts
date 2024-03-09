#!/usr/bin/env node
import 'source-map-support/register.js';
import * as core from 'aws-cdk-lib';

import { type Config } from './config.js';
import { ApiStack } from './stacks/apiStack.js';
import { DatabaseStack } from './stacks/databaseStack.js';
import { ProcessorStack } from './stacks/processorStack.js';

const jwtSecret = process.env['JWT_SECRET'];

const hashSaltRounds = process.env['HASH_SALT_ROUNDS'];

const sendGridApiKey = process.env['SENDGRID_API_KEY'];

if (!jwtSecret || !hashSaltRounds || !sendGridApiKey) {
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
  sendGridApiKey,
};

const databaseStack = new DatabaseStack(app, 'DatabaseStack', { env });

new ApiStack(app, 'ApiStack', {
  env,
  config,
  subscriptionsTable: databaseStack.subscriptionsTable,
  usersTable: databaseStack.usersTable,
});

new ProcessorStack(app, 'ProcessorStack', {
  env,
  config,
  subscriptionsTable: databaseStack.subscriptionsTable,
  usersTable: databaseStack.usersTable,
});
