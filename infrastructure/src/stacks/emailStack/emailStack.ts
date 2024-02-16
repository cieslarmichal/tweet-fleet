import * as core from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { AppConfig } from '../../config/appConfig.js';
import { NodejsLambdaFunction } from '../../common/nodejsLambdaFunction.js';

export interface EmailStackProps extends core.StackProps {
  readonly config: AppConfig;
}

export class EmailStack extends core.Stack {
  public constructor(scope: core.App, id: string, props: EmailStackProps) {
    super(scope, id, props);

    const lambdaEnvironment = {};

    const sendEmailsLambda = new NodejsLambdaFunction(this, 'sendEmailsLambda', {
      entry: `${process.cwd()}/src/stacks/emailStack/lambdaHandlers/sendEmailsLambdaHandler.ts`,
      environment: lambdaEnvironment,
      timeout: core.Duration.minutes(15),
    });

    const eventRule = new events.Rule(this, 'scheduleRule', {
      schedule: events.Schedule.cron({ minute: '0 22 * * ? *' }),
    });

    eventRule.addTarget(new targets.LambdaFunction(sendEmailsLambda));
  }
}
