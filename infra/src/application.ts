#!/usr/bin/env node
import 'source-map-support/register.js';
import * as core from 'aws-cdk-lib';

import { type Config } from './config.js';
import { ApiStack } from './stacks/apiStack.js';
import { CacheStack } from './stacks/cacheStack.js';
import { DatabaseStack } from './stacks/databaseStack.js';
import { ProcessorStack } from './stacks/processorStack.js';
import { VpcStack } from './stacks/vpcStack.js';

const jwtSecret = process.env['JWT_SECRET'];

const sendGridApiKey = process.env['SENDGRID_API_KEY'];

const twitterApiKey = process.env['TWITTER_API_KEY'];

const twitterApiSecret = process.env['TWITTER_API_SECRET'];

const twitterAccessToken = process.env['TWITTER_ACCESS_TOKEN'];

const twitterAccessTokenSecret = process.env['TWITTER_ACCESS_TOKEN_SECRET'];

if (
  !jwtSecret ||
  !sendGridApiKey ||
  !twitterApiKey ||
  !twitterApiSecret ||
  !twitterAccessToken ||
  !twitterAccessTokenSecret
) {
  throw new Error('Missing environment variables');
}

const app = new core.App();

const env = {
  account: '484767037608',
  region: 'eu-central-1',
};

const config: Config = {
  jwtSecret,
  hashSaltRounds: '10',
  sendGridApiKey,
  twitter: {
    apiKey: twitterApiKey,
    apiSecret: twitterApiSecret,
    accessToken: twitterAccessToken,
    accessTokenSecret: twitterAccessTokenSecret,
  },
};

const vpcStack = new VpcStack(app, 'VpcStack', { env });

const databaseStack = new DatabaseStack(app, 'DatabaseStack', { env });

const cacheStack = new CacheStack(app, 'CacheStack', {
  env,
  vpc: vpcStack.vpc,
  securityGroup: vpcStack.securityGroup,
});

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
  redis: cacheStack.redis,
  securityGroup: vpcStack.securityGroup,
  vpc: vpcStack.vpc,
});
