import * as lambda from '@aws-cdk/aws-lambda'
import * as cdk from '@aws-cdk/core';

export class EpamDiplomaStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const fn = new lambda.Function(this, 'MyFunction', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('./lambda'),
    });
  }
}
