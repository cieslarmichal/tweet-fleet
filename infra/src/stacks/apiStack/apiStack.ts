import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as core from 'aws-cdk-lib';
import { AppConfig } from '../../config/appConfig.js';
import { EnvKey } from '../../config/envKey.js';
import { NodejsLambdaFunction } from '../../common/nodejsLambdaFunction.js';

export interface ApiStackProps extends core.StackProps {
  readonly config: AppConfig;
}

export class ApiStack extends core.Stack {
  public constructor(scope: core.App, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { config } = props;

    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      tableName: 'users',
      removalPolicy: core.RemovalPolicy.DESTROY,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    const subscriptionsTable = new dynamodb.Table(this, 'SubscriptionsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      tableName: 'subscriptions',
      removalPolicy: core.RemovalPolicy.DESTROY,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    const lambdaEnvironment = {
      [EnvKey.jwtSecret]: config.jwtSecret,
      [EnvKey.jwtExpiresIn]: config.jwtExpiresIn,
      [EnvKey.hashSaltRounds]: config.hashSaltRounds,
    };

    const registerUserLambda = new NodejsLambdaFunction(this, 'registerUserLambda', {
      entry: `${process.cwd()}/src/stacks/apiStack/lambdaHandlers/registerUserLambdaHandler.ts`,
      environment: lambdaEnvironment,
      timeout: core.Duration.minutes(3),
    });

    usersTable.grantReadWriteData(registerUserLambda);

    const loginUserLambda = new NodejsLambdaFunction(this, 'loginUserLambda', {
      entry: `${process.cwd()}/src/stacks/apiStack/lambdaHandlers/loginUserLambdaHandler.ts`,
      environment: lambdaEnvironment,
      timeout: core.Duration.minutes(3),
    });

    usersTable.grantReadWriteData(loginUserLambda);

    const createSubscriptionLambda = new NodejsLambdaFunction(this, 'createSubscriptionLambda', {
      entry: `${process.cwd()}/src/stacks/apiStack/lambdaHandlers/createSubscriptionLambdaHandler.ts`,
      environment: lambdaEnvironment,
      timeout: core.Duration.minutes(3),
    });

    usersTable.grantReadData(createSubscriptionLambda);
    subscriptionsTable.grantReadWriteData(createSubscriptionLambda);

    const deleteSubscriptionLambda = new NodejsLambdaFunction(this, 'deleteSubscriptionLambda', {
      entry: `${process.cwd()}/src/stacks/apiStack/lambdaHandlers/deleteSubscriptionLambdaHandler.ts`,
      environment: lambdaEnvironment,
      timeout: core.Duration.minutes(3),
    });

    usersTable.grantReadData(deleteSubscriptionLambda);
    subscriptionsTable.grantReadWriteData(deleteSubscriptionLambda);

    const getSubscriptionsLambda = new NodejsLambdaFunction(this, 'getSubscriptionsLambda', {
      entry: `${process.cwd()}/src/stacks/apiStack/lambdaHandlers/getSubscriptionsLambdaHandler.ts`,
      environment: lambdaEnvironment,
      timeout: core.Duration.minutes(3),
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
