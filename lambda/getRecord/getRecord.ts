import * as AWS from 'aws-sdk';
import { RestApiResponse } from "./helper/restApiResponse";
class QueryParamHelper {
    constructor(public resource: string, public name: string, public wookiee: boolean) { }
}

export const handler = async (event: any) => {
    console.log(JSON.stringify(event));
    // all user parameters came from the API Request
    const restQueryParams: QueryParamHelper = event.queryStringParameters;

    const ddbAgent = new AWS.DynamoDB.DocumentClient();

    var ddbQueryParams = {
        TableName: restQueryParams.resource,
        Key: {
            name: restQueryParams.name
        }
    };
    var originalResponce = await ddbAgent.get(ddbQueryParams).promise();
    return new RestApiResponse("200", JSON.stringify(originalResponce));
}