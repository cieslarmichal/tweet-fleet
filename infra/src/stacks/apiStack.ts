import * as core from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

import { NodejsLambda } from './common/nodejsLambda.js';
import { type Config } from '../config.js';

export interface ApiStackProps extends core.StackProps {
  readonly config: Config;
  readonly usersTable: core.aws_dynamodb.Table;
  readonly subscriptionsTable: core.aws_dynamodb.Table;
}

export class ApiStack extends core.Stack {
  public constructor(scope: core.App, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { config, usersTable, subscriptionsTable } = props;

    const lambdaEnvironment = {
      // add dummy values for common config validation
      ['SENDGRID_API_KEY']: 'dummy',
      ['USERS_SQS_URL']: 'dummy',
      ['TWEETS_SQS_URL']: 'dummy',
      ['REDIS_HOST']: 'dummy',
      ['REDIS_PORT']: '6379',
      ['TWITTER_API_KEY']: 'dummy',
      ['TWITTER_API_SECRET']: 'dummy',
      ['TWITTER_ACCESS_TOKEN']: 'dummy',
      ['TWITTER_ACCESS_TOKEN_SECRET']: 'dummy',
      ['JWT_SECRET']: config.jwtSecret,
      ['HASH_SALT_ROUNDS']: config.hashSaltRounds,
    };

    const registerUserLambda = new NodejsLambda(this, 'RegisterUserLambda', {
      entry: `${process.cwd()}/../app/src/api/lambdaHandlers/registerUserLambdaHandler/registerUserLambdaHandler.ts`,
      environment: lambdaEnvironment,
    });

    usersTable.grantReadWriteData(registerUserLambda);

    const loginUserLambda = new NodejsLambda(this, 'LoginUserLambda', {
      entry: `${process.cwd()}/../app/src/api/lambdaHandlers/loginUserLambdaHandler/loginUserLambdaHandler.ts`,
      environment: lambdaEnvironment,
    });

    usersTable.grantReadWriteData(loginUserLambda);

    const createSubscriptionLambda = new NodejsLambda(this, 'CreateSubscriptionLambda', {
      entry: `${process.cwd()}/../app/src/api/lambdaHandlers/createSubscriptionLambdaHandler/createSubscriptionLambdaHandler.ts`,
      environment: lambdaEnvironment,
    });

    usersTable.grantReadData(createSubscriptionLambda);

    subscriptionsTable.grantReadWriteData(createSubscriptionLambda);

    const deleteSubscriptionLambda = new NodejsLambda(this, 'DeleteSubscriptionLambda', {
      entry: `${process.cwd()}/../app/src/api/lambdaHandlers/deleteSubscriptionLambdaHandler/deleteSubscriptionLambdaHandler.ts`,
      environment: lambdaEnvironment,
    });

    usersTable.grantReadData(deleteSubscriptionLambda);

    subscriptionsTable.grantReadWriteData(deleteSubscriptionLambda);

    const getSubscriptionsLambda = new NodejsLambda(this, 'GetSubscriptionsLambda', {
      entry: `${process.cwd()}/../app/src/api/lambdaHandlers/getSubscriptionsLambdaHandler/getSubscriptionsLambdaHandler.ts`,
      environment: lambdaEnvironment,
    });

    usersTable.grantReadData(getSubscriptionsLambda);

    subscriptionsTable.grantReadWriteData(getSubscriptionsLambda);

    const restApi = new apigateway.RestApi(this, 'Api', {
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const usersResource = restApi.root.addResource('users');

    const registerUserResource = usersResource.addResource('register');

    registerUserResource.addMethod('POST', new apigateway.LambdaIntegration(registerUserLambda));

    const loginUserResource = usersResource.addResource('login');

    loginUserResource.addMethod('POST', new apigateway.LambdaIntegration(loginUserLambda));

    const subscriptionsResource = restApi.root.addResource('subscriptions');

    subscriptionsResource.addMethod('POST', new apigateway.LambdaIntegration(createSubscriptionLambda));

    subscriptionsResource.addMethod('GET', new apigateway.LambdaIntegration(getSubscriptionsLambda));

    const messageResource = subscriptionsResource.addResource('{id}');

    messageResource.addMethod('DELETE', new apigateway.LambdaIntegration(deleteSubscriptionLambda));
  }
}
