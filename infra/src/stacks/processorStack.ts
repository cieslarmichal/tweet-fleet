import * as core from 'aws-cdk-lib';
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
}

export class ProcessorStack extends core.Stack {
  public constructor(scope: core.App, id: string, props: ProcessorStackProps) {
    super(scope, id, props);

    const { config, subscriptionsTable, usersTable, redis } = props;

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
    };

    const collectUsersLambda = new NodejsLambda(this, 'collectUsersLambda', {
      entry: `${process.cwd()}/../app/src/api/lambdaHandlers/collectUsersLambdaHandler/collectUsersLambdaHandler.ts`,
      environment: lambdaEnvironment,
    });

    const eventRule = new events.Rule(this, 'scheduleRule', {
      schedule: events.Schedule.cron({ minute: '0 22 * * ? *' }),
    });

    eventRule.addTarget(new targets.LambdaFunction(collectUsersLambda));

    usersTable.grantReadData(collectUsersLambda);

    usersQueue.grantSendMessages(collectUsersLambda);

    const collectTweetsLambda = new NodejsLambda(this, 'collectTweetsLambda', {
      entry: `${process.cwd()}/../app/src/api/lambdaHandlers/collectTweetsLambdaHandler/collectTweetsLambdaHandler.ts`,
      environment: lambdaEnvironment,
    });

    subscriptionsTable.grantReadData(collectTweetsLambda);

    collectTweetsLambda.addEventSource(
      new SqsEventSource(usersQueue, {
        batchSize: 1,
      }),
    );

    const sendAggregatedTweetsLambda = new NodejsLambda(this, 'sendAggregatedTweetsLambda', {
      entry: `${process.cwd()}/../app/src/api/lambdaHandlers/sendAggregatedTweetsLambdaHandler/sendAggregatedTweetsLambdaHandler.ts`,
      environment: lambdaEnvironment,
    });

    sendAggregatedTweetsLambda.addEventSource(
      new SqsEventSource(tweetsQueue, {
        batchSize: 1,
      }),
    );
  }
}