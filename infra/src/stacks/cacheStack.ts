import * as core from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';

export interface CacheStackProps extends core.StackProps {
  readonly vpc: ec2.Vpc;
  readonly securityGroup: ec2.SecurityGroup;
}

export class CacheStack extends core.Stack {
  public readonly redis: elasticache.CfnCacheCluster;

  public constructor(scope: core.App, id: string, props: CacheStackProps) {
    super(scope, id, props);

    const { vpc, securityGroup } = props;

    securityGroup.addIngressRule(ec2.Peer.ipv4('10.0.0.0/16'), ec2.Port.tcp(6379));

    const subnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'Subnet group for Redis',
      subnetIds: vpc.privateSubnets.map((subnet) => subnet.subnetId),
    });

    this.redis = new elasticache.CfnCacheCluster(this, 'Redis', {
      cacheNodeType: 'cache.t2.micro',
      engine: 'redis',
      numCacheNodes: 1,
      vpcSecurityGroupIds: [securityGroup.securityGroupId],
      cacheSubnetGroupName: subnetGroup.ref,
    });
  }
}
