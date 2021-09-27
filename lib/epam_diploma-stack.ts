import { Function, Runtime, Code } from '@aws-cdk/aws-lambda';
import * as cdk from '@aws-cdk/core';
import { Table, AttributeType, TableProps } from '@aws-cdk/aws-dynamodb';
import fetch from 'node-fetch';
import { LambdaIntegration, RestApi } from '@aws-cdk/aws-apigateway'

// a tiny helper that will help us store a function and according resource name.
// Next it will be used to create API GW with according resource names and lambdas on backend.
class LambdaOrganizerHelper {
  constructor(public resName: string, public lFunc: Function) { }
}

export class EpamDiplomaStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // retrieve all resources from the site above.
    async function getStarWarsResourceList(url: string): Promise<string> {
      let resp = await fetch(url);
      let body = await resp.text();
      return body;
    }
    // object to store all lambda and their according resource names. will be used next to create 
    // a AWS REST API GW
    let lambdaFuncArr: LambdaOrganizerHelper[] = [];
    // retrieving all resources from remote server
    const starWarsResourceListPromise = getStarWarsResourceList('https://swapi.dev/api');
    starWarsResourceListPromise.then((body) => {
      let starWarsResourceList = JSON.parse(body);
      // running through all of them one by one
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
        let fillDdbLambdaFunction: Function = new Function(this, `${swResource}TableFill`, {
          functionName: `${swResource}TableFill`,
          runtime: Runtime.NODEJS_14_X,
          code: Code.fromAsset(`./lambda/${swResource}TableFill`),
          handler: `${swResource}TableFill/${swResource}TableFill.handler`,
          timeout: cdk.Duration.seconds(10),
          environment: {
            "starWarsResourceUrl": starWarsResourceList[swResource],
            "ddbOrigTableName": ddbTable.tableName,
            "ddbWookieeTableName": ddbWookieeTable.tableName,
          },
        });
        lambdaFuncArr.push(new LambdaOrganizerHelper(swResource, fillDdbLambdaFunction));
        ddbWookieeTable.grantReadWriteData(fillDdbLambdaFunction);
        ddbTable.grantReadWriteData(fillDdbLambdaFunction);
      }

      let swResourcesLst: string = "";

      // create a rest API GW with lambdas as background.
      const restApiFillDdbLambdaBackend = new RestApi(this, "restApiFillDdbLambdaBackend", { restApiName: "restApiFillDdbLambdaBackend" });
      // lambdaFuncArr.forEach((lambdaFunc) => { restApiFillDdbLambdaBackend.node.addDependency(lambdaFunc) });
      lambdaFuncArr.forEach((lambdaOrg: LambdaOrganizerHelper) => {
        let lambdaFuncIntegration = new LambdaIntegration(lambdaOrg.lFunc);
        let newResource = restApiFillDdbLambdaBackend.root.addResource(lambdaOrg.resName);
        newResource.addMethod("PATCH", lambdaFuncIntegration);
        swResourcesLst += `${lambdaOrg.resName};`;
      });

      // create a lambda function to launch all filling db functions one by one.
      const lambdaFunctionFillAllDDB: Function = new Function(this, 'fillAllDDB', {
        functionName: 'fillAllDDB',
        runtime: Runtime.NODEJS_14_X,
        code: Code.fromAsset('./lambda/fillAllDdb'),
        handler: 'fillAllDdb/fillAllDdb.handler',
        timeout: cdk.Duration.seconds(60),
        environment: {
          "apiUrl": restApiFillDdbLambdaBackend.url,
          "apiResourceList": swResourcesLst,
        },
      });
      lambdaFunctionFillAllDDB.node.addDependency(restApiFillDdbLambdaBackend);
      // create a new rest api gw for that function.
      const restApiFillAllDdbLambdaBackend = new RestApi(this, "restApiFillAllDdbLambdaBackend", { restApiName: "restApiFillAllDdbLambdaBackend" });
      // adding fulambdaFunctionFillAllDDB into the new restApi
      let lambdaFuncIntegration = new LambdaIntegration(lambdaFunctionFillAllDDB);
      let newResource = restApiFillAllDdbLambdaBackend.root.addResource("fillAllDdb");
      newResource.addMethod("GET", lambdaFuncIntegration);
    });
  }
}
