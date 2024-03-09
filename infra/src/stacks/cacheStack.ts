import * as core from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';

export class CacheStack extends core.Stack {
  public readonly cache: elasticache.CfnCacheCluster;

  public constructor(scope: core.App, id: string, props: core.StackProps) {
    super(scope, id, props);

    const securityGroup = new ec2.SecurityGroup(this, 'ElastiCacheSecurityGroup', {
      vpc: vpc as ec2.IVpc,
    });

    const subnetGroup = new elasticache.CfnSubnetGroup(this, 'ElastiCacheSubnetGroup', {
      description: 'Subnet group for ElastiCache',
      subnetIds: vpc.privateSubnets.map((subnet) => subnet.subnetId),
    });

    this.cache = new elasticache.CfnCacheCluster(this, 'MyElastiCache', {
      cacheNodeType: 'cache.t2.micro',
      engine: 'redis',
      numCacheNodes: 1,
      vpcSecurityGroupIds: [securityGroup.securityGroupId],
      cacheSubnetGroupName: subnetGroup.ref,
    });
  }
}
