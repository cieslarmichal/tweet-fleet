import * as core from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';

export interface CacheStackProps extends core.StackProps {
  readonly vpc: ec2.Vpc;
}

export class CacheStack extends core.Stack {
  public readonly redis: elasticache.CfnCacheCluster;

  public constructor(scope: core.App, id: string, props: CacheStackProps) {
    super(scope, id, props);

    const { vpc } = props;

    const securityGroup = new ec2.SecurityGroup(this, 'ElastiCacheSecurityGroup', {
      vpc: vpc as ec2.IVpc,
    });

    const subnetGroup = new elasticache.CfnSubnetGroup(this, 'ElastiCacheSubnetGroup', {
      description: 'Subnet group for ElastiCache',
      subnetIds: vpc.privateSubnets.map((subnet) => subnet.subnetId),
    });

    this.redis = new elasticache.CfnCacheCluster(this, 'MyElastiCache', {
      cacheNodeType: 'cache.t2.micro',
      engine: 'redis',
      numCacheNodes: 1,
      vpcSecurityGroupIds: [securityGroup.securityGroupId],
      cacheSubnetGroupName: subnetGroup.ref,
    });
  }
}
