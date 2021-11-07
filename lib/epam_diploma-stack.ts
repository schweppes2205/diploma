import { Function, Runtime, Code } from '@aws-cdk/aws-lambda';
import * as cdk from '@aws-cdk/core';
import { Table, AttributeType, TableProps } from '@aws-cdk/aws-dynamodb';
import fetch from 'node-fetch';
import { LambdaIntegration, RestApi } from '@aws-cdk/aws-apigateway'

// a tiny helper that will help us store a function and according resource name.
// Next it will be used to create API GW with according resource names and lambdas on backend.
class LambdaOrganizerHelper {
  constructor(public resName: string, public lFunc: Function, public restMethod: string) { }
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
    // an AWS REST API GW
    let lambdaFuncArr = [] as LambdaOrganizerHelper[];
    // retrieving all resources from remote server
    const starWarsResourceListPromise = getStarWarsResourceList('https://swapi.dev/api');
    starWarsResourceListPromise.then((body) => {

      // creating a universal record getter for REST API purposes
      const getRecordLambda: Function = new Function(this, "getRecord", {
        functionName: "getRecordLambda",
        runtime: Runtime.NODEJS_14_X,
        code: Code.fromAsset('./lambda/getRecord'),
        handler: 'getRecord/getRecord.handler',
        timeout: cdk.Duration.seconds(10),
      });

      // create a universal put method for a new record creation to any db.
      const putRecordLambda: Function = new Function(this, "putRecord", {
        functionName: "putRecordLambda",
        runtime: Runtime.NODEJS_14_X,
        code: Code.fromAsset('./lambda/putRecord'),
        handler: 'putRecord/putRecord.handler',
        timeout: cdk.Duration.seconds(10),
      });

      let starWarsResourceList = JSON.parse(body);
      // running through all of them one by one
      for (let swResource in starWarsResourceList) {
        // shared table properties
        let ddbTableSharedProp = {
          readCapacity: 2,
          writeCapacity: 2,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }

        // init a new databases. all have the same params, 
        // so there is no need to separately init them
        let ddbTable = new Table(this, `dynamodbResource${swResource.toUpperCase()}`, {
          partitionKey: {
            name: 'name',
            type: AttributeType.STRING,
          },
          tableName: swResource,
          ...ddbTableSharedProp,
        });

        // init a new databases for wookiee translation. all have the same params, 
        // so there is no need to separately init them
        /* Removing wookiee support because of unexpected issues during each record retrieve.
        let ddbWookieeTable = new Table(this, `dynamodbResourceWookiee${swResource.toUpperCase()}`, {
          partitionKey: {
            name: 'id',
            type: AttributeType.STRING,
          },
          tableName: `w_${swResource}`,
          ...ddbTableSharedProp,
        });
        */

        // init a new lambda function to fill entire database
        let fillDdbLambdaFunction: Function = new Function(this, `${swResource}TableFill`, {
          functionName: `${swResource}TableFill`,
          runtime: Runtime.NODEJS_14_X,
          code: Code.fromAsset(`./lambda/${swResource}TableFill`),
          handler: `${swResource}TableFill/${swResource}TableFill.handler`,
          timeout: cdk.Duration.seconds(30),
          environment: {
            "starWarsResourceUrl": starWarsResourceList[swResource],
            "ddbOrigTableName": ddbTable.tableName,
            // "ddbWookieeTableName": ddbWookieeTable.tableName,
          },
        });

        // placing that function to array organizer
        lambdaFuncArr.push(new LambdaOrganizerHelper(swResource, fillDdbLambdaFunction, 'GET'));

        // providing the lambdas the write only access.
        ddbTable.grantWriteData(fillDdbLambdaFunction);
        // ddbWookieeTable.grantWriteData(fillDdbLambdaFunction);
        ddbTable.grantReadData(getRecordLambda);
        // ddbWookieeTable.grantReadData(getRecordLambda);
        ddbTable.grantWriteData(putRecordLambda);
        // ddbWookieeTable.grantWriteData(putRecordLambda);
      }

      // create a rest API GW with lambdas as background.
      const restApiFillDdbLambdaBackend = new RestApi(this, "restApiFillDdbLambdaBackend", {
        restApiName: "restApiFillDdbLambdaBackend"
      });

      // adding all lambdas to REST API GW
      lambdaFuncArr.forEach((lambdaOrg: LambdaOrganizerHelper) => {
        let lambdaFuncIntegration = new LambdaIntegration(lambdaOrg.lFunc);
        let newResource = restApiFillDdbLambdaBackend.root.addResource(lambdaOrg.resName);
        newResource.addMethod(lambdaOrg.restMethod, lambdaFuncIntegration);
      });
      // adding get and put methods separately
      let lambdaFuncIntegration = new LambdaIntegration(getRecordLambda);
      let newResource = restApiFillDdbLambdaBackend.root.addResource("anyResource");
      newResource.addMethod("GET", lambdaFuncIntegration);
      lambdaFuncIntegration = new LambdaIntegration(putRecordLambda);
      newResource.addMethod("PUT", lambdaFuncIntegration);
    });
  }
}