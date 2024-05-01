import * as core from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import type * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import * as sqs from 'aws-cdk-lib/aws-sqs';

import { NodejsLambda } from './common/nodejsLambda.js';
import { type Config } from '../config.js';

export interface ProcessorStackProps extends core.StackProps {
  readonly config: Config;
  readonly usersTable: core.aws_dynamodb.Table;
  readonly subscriptionsTable: core.aws_dynamodb.Table;
  readonly redis: elasticache.CfnCacheCluster;
  readonly vpc: ec2.Vpc;
  readonly securityGroup: ec2.SecurityGroup;
}

export class ProcessorStack extends core.Stack {
  public constructor(scope: core.App, id: string, props: ProcessorStackProps) {
    super(scope, id, props);

    const { config, subscriptionsTable, usersTable, vpc, securityGroup, redis } = props;

    const usersQueue = new sqs.Queue(this, 'UsersQueue', {
      queueName: 'users',
      visibilityTimeout: core.Duration.seconds(30),
    });

    const tweetsQueue = new sqs.Queue(this, 'TweetsQueue', {
      queueName: 'tweets',
      visibilityTimeout: core.Duration.seconds(30),
    });

    const lambdaEnvironment = {
      ['SENDGRID_API_KEY']: config.sendGridApiKey,
      ['USERS_SQS_URL']: config.sendGridApiKey,
      ['TWEETS_SQS_URL']: config.sendGridApiKey,
      ['REDIS_HOST']: redis.attrRedisEndpointAddress,
      ['REDIS_PORT']: redis.attrRedisEndpointPort,
      ['TWITTER_API_KEY']: config.twitter.apiKey,
      ['TWITTER_API_SECRET']: config.twitter.apiSecret,
      ['TWITTER_ACCESS_TOKEN']: config.twitter.accessToken,
      ['TWITTER_ACCESS_TOKEN_SECRET']: config.twitter.accessTokenSecret,
      ['JWT_SECRET']: config.jwtSecret,
      ['HASH_SALT_ROUNDS']: config.hashSaltRounds,
    };

    const collectUsersLambda = new NodejsLambda(this, 'CollectUsersLambda', {
      entry: `${process.cwd()}/../app/src/api/lambdaHandlers/collectUsersLambdaHandler/collectUsersLambdaHandler.ts`,
      environment: lambdaEnvironment,
    });

    const eventRule = new events.Rule(this, 'scheduleRule', {
      // schedule: events.Schedule.cron({ minute: '0 22 * * ? *' }),
      schedule: events.Schedule.cron({ minute: '*/5 * * * ? *' }),
    });

    eventRule.addTarget(new targets.LambdaFunction(collectUsersLambda));

    usersTable.grantReadData(collectUsersLambda);

    usersQueue.grantSendMessages(collectUsersLambda);

    const collectTweetsLambda = new NodejsLambda(this, 'CollectTweetsLambda', {
      entry: `${process.cwd()}/../app/src/api/lambdaHandlers/collectTweetsLambdaHandler/collectTweetsLambdaHandler.ts`,
      environment: lambdaEnvironment,
      vpc: vpc as ec2.IVpc,
      securityGroups: [securityGroup],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    subscriptionsTable.grantReadData(collectTweetsLambda);

    collectTweetsLambda.addEventSource(
      new SqsEventSource(usersQueue, {
        batchSize: 1,
      }),
    );

    const sendAggregatedTweetsEmailLambda = new NodejsLambda(this, 'SendAggregatedTweetsEmailLambda', {
      entry: `${process.cwd()}/../app/src/api/lambdaHandlers/sendEmailsLambdaHandler/sendEmailsLambdaHandler.ts`,
      environment: lambdaEnvironment,
    });

    sendAggregatedTweetsEmailLambda.addEventSource(
      new SqsEventSource(tweetsQueue, {
        batchSize: 1,
      }),
    );
  }
}
