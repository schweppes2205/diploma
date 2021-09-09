import { Function, Runtime, Code } from '@aws-cdk/aws-lambda';
import * as cdk from '@aws-cdk/core';
import { Table, AttributeType } from '@aws-cdk/aws-dynamodb';
import { booleanToCloudFormation } from '@aws-cdk/core';
import fetch from 'node-fetch';


export class EpamDiplomaStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    async function getStarWarsResourceList(url: string): Promise<string> {
      let resp = await fetch(url);
      let body = await resp.text();
      return body;
    }

    const starWarsResourceListPromise = getStarWarsResourceList('https://swapi.dev/api');
    starWarsResourceListPromise.then((body) => {
      let starWarsResourceList = JSON.parse(body);
      for (let swResource in starWarsResourceList) {
        // init a new databases. all have the same params, so there is no need to separately init them
        let ddbTable = new Table(this, `dynamodbResource${swResource.toUpperCase()}`, {
          partitionKey: {
            name: 'id',
            type: AttributeType.STRING,
          },
          sortKey: {
            name: 'name',
            type: AttributeType.STRING,
          },
          readCapacity: 2,
          writeCapacity: 2,
          tableName: swResource,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
        // init a new databases for wookiee translation. all have the same params, so there is no need to separately init them
        let ddbWookieeTable = new Table(this, `dynamodbResourceWookiee${swResource.toUpperCase()}`, {
          partitionKey: {
            name: 'id',
            type: AttributeType.STRING,
          },
          sortKey: {
            name: 'origId',
            type: AttributeType.STRING,
          },
          readCapacity: 2,
          writeCapacity: 2,
          tableName: `w_${swResource}`,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
        // init a new function
        let lambdaFunction: Function = new Function(this, `${swResource}TableFill`, {
          functionName: `${swResource}TableFill`,
          runtime: Runtime.NODEJS_14_X,
          handler: `${swResource}TableFill.handler`,
          code: Code.fromAsset('./lambda'),
          timeout: cdk.Duration.seconds(10),
          environment: {
            "starWarsResourceUrl": starWarsResourceList[swResource],
            "ddbOrigTableName": ddbTable.tableName,
            "ddbWookieeTableName": ddbWookieeTable.tableName,
          },
        });
        ddbWookieeTable.grantReadWriteData(lambdaFunction);
        ddbTable.grantReadWriteData(lambdaFunction);
      }
    });
  }
}
