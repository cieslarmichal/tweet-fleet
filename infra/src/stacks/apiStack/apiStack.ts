import { Cors, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
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

    const loginUserLambda = new NodejsLambdaFunction(this, 'loginUserLambda', {
      entry: `${process.cwd()}/src/stacks/apiStack/lambdaHandlers/loginUserLambdaHandler.ts`,
      environment: lambdaEnvironment,
      timeout: core.Duration.minutes(3),
    });

    const createSubscriptionLambda = new NodejsLambdaFunction(this, 'createSubscriptionLambda', {
      entry: `${process.cwd()}/src/stacks/apiStack/lambdaHandlers/createSubsriptionLambdaHandler.ts`,
      environment: lambdaEnvironment,
      timeout: core.Duration.minutes(3),
    });

    const deleteSubscriptionLambda = new NodejsLambdaFunction(this, 'deleteSubscriptionLambda', {
      entry: `${process.cwd()}/src/stacks/apiStack/lambdaHandlers/deleteSubsriptionLambdaHandler.ts`,
      environment: lambdaEnvironment,
      timeout: core.Duration.minutes(3),
    });

    const getSubscriptionsLambda = new NodejsLambdaFunction(this, 'getSubscriptionsLambda', {
      entry: `${process.cwd()}/src/stacks/apiStack/lambdaHandlers/getSubscriptionsLambdaHandler.ts`,
      environment: lambdaEnvironment,
      timeout: core.Duration.minutes(3),
    });

    const restApi = new RestApi(this, 'RestApi', {
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
      },
    });

    const usersResource = restApi.root.addResource('users');

    const registerUserResource = usersResource.addResource('register');

    registerUserResource.addMethod('POST', new LambdaIntegration(registerUserLambda));

    const loginUserResource = usersResource.addResource('login');

    loginUserResource.addMethod('POST', new LambdaIntegration(loginUserLambda));

    const subscriptionsResource = restApi.root.addResource('subscriptions');

    subscriptionsResource.addMethod('POST', new LambdaIntegration(createSubscriptionLambda));

    subscriptionsResource.addMethod('GET', new LambdaIntegration(getSubscriptionsLambda));

    const messageResource = subscriptionsResource.addResource('{id}');

    messageResource.addMethod('DELETE', new LambdaIntegration(deleteSubscriptionLambda));
  }
}
