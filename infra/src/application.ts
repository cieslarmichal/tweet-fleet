#!/usr/bin/env node
import 'source-map-support/register.js';
import * as core from 'aws-cdk-lib';

import { AppConfig } from './config/appConfig.js';
import { EmailStack } from './stacks/emailStack/emailStack.js';
import { EnvKey } from './config/envKey.js';
import { ApiStack } from './stacks/apiStack/apiStack.js';

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

if (
  !awsRegion ||
  !awsAccount ||
  !jwtSecret ||
  !jwtExpiresIn ||
  !hashSaltRounds ||
) {
  throw new Error('Missing environment variables');
}

const app = new core.App();

const env = {
  account: awsAccount,
  region: awsRegion,
};


const appConfig: AppConfig = {
  jwtSecret,
  jwtExpiresIn,
  hashSaltRounds,
};

new EmailStack(app, 'MessagesProcessing', { env, appConfig });

new ApiStack(app, 'RestApi', { env, appConfig });
