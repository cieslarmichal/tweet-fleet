import * as core from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, type NodejsFunctionProps, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import { type Construct } from 'constructs';

export class NodejsLambda extends NodejsFunction {
  public constructor(scope: Construct, id: string, props: NodejsFunctionProps) {
    super(scope, id, {
      handler: 'lambda',
      bundling: {
        minify: true,
        target: 'node20',
        format: OutputFormat.ESM,
        banner: "import { createRequire } from 'module';const require = createRequire(import.meta.url);",
      },
      architecture: lambda.Architecture.X86_64,
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 3008,
      tracing: lambda.Tracing.ACTIVE,
      awsSdkConnectionReuse: true,
      timeout: core.Duration.minutes(5),
      logRetention: logs.RetentionDays.THREE_DAYS,
      ...props,
    });
  }
}
