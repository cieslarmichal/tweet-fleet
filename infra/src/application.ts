#!/usr/bin/env node
import 'source-map-support/register.js';
import * as core from 'aws-cdk-lib';

import { Config } from './config.js';
import { EmailStack } from './stacks/emailStack.js';
import { EnvKey } from './envKey.js';
import { ApiStack } from './stacks/apiStack.js';

const awsRegion = process.env[EnvKey.awsRegion] || process.env[EnvKey.awsDefaultRegion];
const awsAccount = process.env[EnvKey.awsAccountId];

const jwtSecret = process.env[EnvKey.jwtSecret];
const jwtExpiresIn = process.env[EnvKey.jwtExpiresIn];
const hashSaltRounds = process.env[EnvKey.hashSaltRounds];

console.log({
  awsRegion,
  awsAccount,
  jwtSecret,
  jwtExpiresIn,
  hashSaltRounds,
});

if (!awsRegion || !awsAccount || !jwtSecret || !jwtExpiresIn || !hashSaltRounds) {
  throw new Error('Missing environment variables');
}

const app = new core.App();

const env = {
  account: awsAccount,
  region: awsRegion,
};

const config: Config = {
  jwtSecret,
  jwtExpiresIn,
  hashSaltRounds,
};

new EmailStack(app, 'MessagesProcessing', { env });

new ApiStack(app, 'RestApi', { env, config });
