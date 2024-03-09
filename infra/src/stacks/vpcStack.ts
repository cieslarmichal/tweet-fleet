import * as core from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class VpcStack extends core.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly securityGroup: ec2.SecurityGroup;

  public constructor(scope: core.App, id: string, props: core.StackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, 'MainVpc', { maxAzs: 1 });

    this.securityGroup = new ec2.SecurityGroup(this, 'MainSecurityGroup', {
      vpc: this.vpc as ec2.IVpc,
    });

    this.securityGroup.addEgressRule(ec2.Peer.anyIpv4(), ec2.Port.allTraffic());
  }
}
