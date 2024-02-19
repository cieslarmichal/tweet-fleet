import * as core from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { NodejsLambda } from './common/nodejsLambda.js';

export class EmailStack extends core.Stack {
  public constructor(scope: core.App, id: string, props: core.StackProps) {
    super(scope, id, props);

    const lambdaEnvironment = {};

    const sendEmailsLambda = new NodejsLambda(this, 'sendEmailsLambda', {
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
