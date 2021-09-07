import * as lambda from '@aws-cdk/aws-lambda';
import * as cdk from '@aws-cdk/core';
import * as dynamo from '@aws-cdk/aws-dynamodb';
export class EpamDiplomaStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    let sharedTalbeProp: dynamo.TableProps = {
      partitionKey: {
        name: 'id',
        type: dynamo.AttributeType.STRING
      },
      readCapacity: 2,
      writeCapacity: 2,
    };
    const dynamoResourcePeople = new dynamo.Table(this, 'dynamoResourcePeople', sharedTalbeProp);
    const dynamoResourceFilms = new dynamo.Table(this, 'dynamoResourceFilms', sharedTalbeProp);
    const dynamoResourcePlanets = new dynamo.Table(this, 'dynamoResourcePlanets', sharedTalbeProp);
    const dynamoResourceSpecies = new dynamo.Table(this, 'dynamoResourceSpecies', sharedTalbeProp);
    const dynamoResourceStarships = new dynamo.Table(this, 'dynamoResourceStarships', sharedTalbeProp);
    const dynamoResourceVehicles = new dynamo.Table(this, 'dynamoResourceVehicles', sharedTalbeProp);

    const fillResourcesTables = new lambda.Function(this, 'fillResourcesTables', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'fillResourcesTables.handler',
      code: lambda.Code.fromAsset('./lambda'),
      timeout: cdk.Duration.seconds(10),
    });


  }
}
