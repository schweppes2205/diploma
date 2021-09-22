import { Function, Runtime, Code } from '@aws-cdk/aws-lambda';
import * as cdk from '@aws-cdk/core';
import { Table, AttributeType, TableProps } from '@aws-cdk/aws-dynamodb';
import fetch from 'node-fetch';
import { LambdaIntegration, RestApi } from '@aws-cdk/aws-apigateway'


export class EpamDiplomaStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    async function getStarWarsResourceList(url: string): Promise<string> {
      let resp = await fetch(url);
      let body = await resp.text();
      return body;
    }
    let lambdaFuncArr: Function[] = [];
    const starWarsResourceListPromise = getStarWarsResourceList('https://swapi.dev/api');
    starWarsResourceListPromise.then((body) => {
      let starWarsResourceList = JSON.parse(body);
      for (let swResource in starWarsResourceList) {
        let ddbTableSharedProp = {
          readCapacity: 2,
          writeCapacity: 2,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }
        // init a new databases. all have the same params, so there is no need to separately init them
        let ddbTable = new Table(this, `dynamodbResource${swResource.toUpperCase()}`, {
          partitionKey: {
            name: 'name',
            type: AttributeType.STRING,
          },
          tableName: swResource,
          ...ddbTableSharedProp,
        });
        // init a new databases for wookiee translation. all have the same params, so there is no need to separately init them
        let ddbWookieeTable = new Table(this, `dynamodbResourceWookiee${swResource.toUpperCase()}`, {
          partitionKey: {
            name: 'id',
            type: AttributeType.STRING,
          },
          tableName: `w_${swResource}`,
          ...ddbTableSharedProp,
        });
        // init a new function
        let lambdaFunction: Function = new Function(this, `${swResource}TableFill`, {
          functionName: `${swResource}TableFill`,
          runtime: Runtime.NODEJS_14_X,
          handler: `${swResource}TableFill/${swResource}TableFill.handler`,
          code: Code.fromAsset(`./lambda/${swResource}TableFill`),
          timeout: cdk.Duration.seconds(10),
          environment: {
            "starWarsResourceUrl": starWarsResourceList[swResource],
            "ddbOrigTableName": ddbTable.tableName,
            "ddbWookieeTableName": ddbWookieeTable.tableName,
          },
        });
        lambdaFuncArr.push(lambdaFunction);
        ddbWookieeTable.grantReadWriteData(lambdaFunction);
        ddbTable.grantReadWriteData(lambdaFunction);
      }
      const restApiLambdaBackend = new RestApi(this, "restApiLambdaBackend", { restApiName: "restApiLambdaBackend" });
      lambdaFuncArr.forEach((lambdaFunc) => {
        let lambdaFuncIntegr = new LambdaIntegration(lambdaFunc);
        let newResource = restApiLambdaBackend.root.addResource(lambdaFunc.functionName);
        newResource.addMethod("GET", lambdaFuncIntegr);
      })
    });
  }
}
